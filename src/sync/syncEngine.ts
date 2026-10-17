import dayjs, { type Dayjs } from 'dayjs';
import { dashboardApi, reportsApi } from '../api/endpoints';
import type { FilterDropdowns, Paged } from '../api/types';
import type { ReportAccess } from '../constants/modules';
import { getDb } from '../db/database';
import { ExtraKeyLog, splitRow, type Scalar } from '../db/rows';
import { stagingName, TABLES, type TableDef, type TableKey } from '../db/schema';

export class SyncCancelled extends Error {
  constructor() {
    super('Download cancelled');
    this.name = 'SyncCancelled';
  }
}

export interface SyncProgress {
  step: string;
  loaded: number;
  total?: number;
  /** Which of `stepCount` steps is running (1-based). */
  stepIndex: number;
  stepCount: number;
}

export interface SyncRequest {
  orgId: number;
  userId: number;
  access: ReportAccess;
  /** Sales download period; ignored when the user has no sales views. */
  salesFrom: Dayjs;
  salesTo: Dayjs;
  trigger: 'first' | 'auto' | 'manual';
  isCancelled: () => boolean;
  onProgress: (p: SyncProgress) => void;
}

/** Rows per report request. The web uses 300 (closing) to 10,000 (sales). */
const PAGE = 1000;
/** Sales are requested a week at a time, like the web's 3-day batches, to keep each query small. */
const SALES_CHUNK_DAYS = 7;

/** Which tables a user's report access needs. Dashboard is always downloaded. */
export function datasetsFor(access: ReportAccess): TableKey[] {
  const sets: TableKey[] = ['dashboard'];
  if (access.sales.length || access.stock.length) sets.push('filterOption');
  if (access.sales.includes('all')) sets.push('sales');
  if (access.sales.includes('mapped') || access.sales.includes('analytics')) sets.push('mappedSales');
  if (access.stock.includes('all')) sets.push('closing');
  if (access.stock.includes('mapped') || access.stock.includes('analytics')) sets.push('mappedClosing');
  return sets;
}

/** Splits [from, to] into consecutive ranges of at most `days` days. */
export function dateChunks(from: Dayjs, to: Dayjs, days = SALES_CHUNK_DAYS): Array<{ from: string; to: string }> {
  const out: Array<{ from: string; to: string }> = [];
  let start = from.startOf('day');
  const end = to.startOf('day');
  while (!start.isAfter(end, 'day')) {
    const chunkEnd = start.add(days - 1, 'day');
    const actual = chunkEnd.isAfter(end, 'day') ? end : chunkEnd;
    out.push({ from: start.format('YYYY-MM-DD'), to: actual.format('YYYY-MM-DD') });
    start = actual.add(1, 'day');
  }
  return out;
}

/** Filter-option lists from /filters/dropdowns, flattened to (kind, value, label, code). */
export function filterOptionRows(d: FilterDropdowns & Record<string, unknown>) {
  const rows: Array<{ kind: string; row: Record<string, unknown> }> = [];
  for (const [kind, list] of Object.entries(d)) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        const { id, name, guid, delname, delcode, itemdesc, itemcode, ...rest } = o;
        rows.push({
          kind,
          row: {
            value: id ?? name,
            label: name ?? delname ?? itemdesc ?? id,
            code: guid ?? delcode ?? itemcode ?? null,
            ...rest,
          },
        });
      } else {
        rows.push({ kind, row: { value: item, label: item, code: null } });
      }
    }
  }
  return rows;
}

const KNOWN_FILTER_KINDS = new Set(['companies', 'dealers', 'hoStockitems', 'stockgroups', 'stockcategories', 'states', 'regions', 'divisions']);

const q = (id: string) => `"${id}"`;

/**
 * Downloads every dataset the user can see for one organization and replaces
 * the local copy in one transaction. Until that transaction, the previous data
 * stays as it was: a failed or cancelled download changes nothing.
 */
export async function runSync(req: SyncRequest): Promise<Record<string, number>> {
  const db = await getDb();
  const now = () => new Date().toISOString();
  const sets = datasetsFor(req.access);
  const extras = new ExtraKeyLog();
  const counts: Record<string, number> = {};
  const startedAt = now();
  const salesFrom = req.salesFrom.format('YYYY-MM-DD');
  const salesTo = req.salesTo.format('YYYY-MM-DD');

  await db.execute(
    `INSERT INTO sync_run (_org_id, started_at, status, error, "trigger") VALUES (?, ?, 'running', NULL, ?)
     ON CONFLICT(_org_id) DO UPDATE SET started_at = excluded.started_at, status = 'running', error = NULL, "trigger" = excluded."trigger"`,
    [req.orgId, startedAt, req.trigger],
  );

  const check = () => {
    if (req.isCancelled()) throw new SyncCancelled();
  };

  /** Bulk-insert API rows into a table's staging copy. */
  const stage = async (key: TableKey, rows: Array<Record<string, unknown>>, own: (r: Record<string, unknown>, i: number) => Scalar[]) => {
    if (!rows.length) return;
    const def: TableDef = TABLES[key];
    const ownCols = def.own.filter((c) => c !== '_rid' && c !== 'json_data');
    const cols = [...ownCols, 'json_data', ...Object.keys(def.columns)];
    const sql = `INSERT OR REPLACE INTO ${q(stagingName(def))} (${cols.map(q).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
    const params = rows.map((r, i) => {
      const { values, extra } = splitRow(def, r);
      extras.add(def.name, extra);
      return [...own(r, i), extra ? JSON.stringify(extra) : null, ...values];
    });
    await db.executeBatch([[sql, params]]);
    counts[key] = (counts[key] ?? 0) + rows.length;
  };

  /** Page through one report until the API says there's no more. */
  const pageAll = async (
    key: TableKey,
    label: string,
    stepIndex: number,
    fetch: (page: number) => Promise<Paged<Record<string, unknown>>>,
    own: (r: Record<string, unknown>) => Scalar[],
    /** Sales come in date chunks, so a per-request total isn't the whole. */
    showTotal: boolean,
  ) => {
    let page = 1;
    for (;;) {
      check();
      const res = await fetch(page);
      check();
      await stage(key, res.items, own);
      req.onProgress({ step: label, loaded: counts[key] ?? 0, total: showTotal ? res.pagination?.total : undefined, stepIndex, stepCount: sets.length });
      const pages = res.pagination?.totalPages ?? 0;
      const more = pages ? page < pages : res.items.length === PAGE;
      if (!more || !res.items.length) return;
      page += 1;
    }
  };

  try {
    await db.transaction(async (tx) => {
      for (const key of sets) await tx.execute(`DELETE FROM ${q(stagingName(TABLES[key]))} WHERE _org_id = ?`, [req.orgId]);
    });

    const salesDate = (r: Record<string, unknown>) => {
      const d = dayjs(String(r.vchdt ?? ''));
      return d.isValid() ? d.format('YYYY-MM-DD') : null;
    };

    for (const [i, key] of sets.entries()) {
      const stepIndex = i + 1;
      const progress = (step: string, loaded = 0, total?: number) =>
        req.onProgress({ step, loaded, total, stepIndex, stepCount: sets.length });
      check();
      switch (key) {
        case 'dashboard': {
          progress('Dashboard');
          const stats = (await dashboardApi.stats()) as unknown as Record<string, unknown>;
          await stage('dashboard', [stats], () => [req.userId, req.orgId, now()]);
          break;
        }
        case 'filterOption': {
          progress('Filter options');
          const d = (await reportsApi.filters(req.orgId)) as FilterDropdowns & Record<string, unknown>;
          const rows = filterOptionRows(d);
          for (const kind of Object.keys(d)) {
            if (!KNOWN_FILTER_KINDS.has(kind)) extras.add(TABLES.filterOption.name, { [kind]: d[kind] });
          }
          await stage(
            'filterOption',
            rows.map((r) => r.row),
            (_, n) => [req.orgId, rows[n].kind],
          );
          break;
        }
        case 'sales':
        case 'mappedSales': {
          const label = key === 'sales' ? 'Sales · All' : 'Sales · Mapped';
          progress(label);
          for (const chunk of dateChunks(req.salesFrom, req.salesTo)) {
            await pageAll(
              key,
              label,
              stepIndex,
              async (page) =>
                (key === 'sales'
                  ? await reportsApi.sales({ dateFrom: chunk.from, dateTo: chunk.to }, page, PAGE, req.orgId)
                  : await reportsApi.mappedSales({ dateFrom: chunk.from, dateTo: chunk.to }, page, PAGE, req.orgId)) as unknown as Paged<
                  Record<string, unknown>
                >,
              (r) => [req.orgId, salesDate(r)],
              false,
            );
          }
          break;
        }
        case 'closing':
        case 'mappedClosing': {
          const label = key === 'closing' ? 'Closing Stock · All' : 'Closing Stock · Mapped';
          progress(label);
          await pageAll(
            key,
            label,
            stepIndex,
            async (page) =>
              (key === 'closing'
                ? await reportsApi.closing({}, page, PAGE, req.orgId)
                : await reportsApi.mappedClosing({}, page, PAGE, req.orgId)) as unknown as Paged<Record<string, unknown>>,
            () => [req.orgId],
            true,
          );
          break;
        }
      }
    }

    check();
    const finishedAt = now();
    // The swap: the old copy is replaced only once everything has arrived.
    await db.transaction(async (tx) => {
      for (const key of Object.keys(TABLES) as TableKey[]) {
        const def: TableDef = TABLES[key];
        const cols = [...def.own.filter((c) => c !== '_rid'), ...Object.keys(def.columns)].map(q).join(', ');
        await tx.execute(`DELETE FROM ${q(def.name)} WHERE _org_id = ?`, [req.orgId]);
        if (sets.includes(key)) {
          await tx.execute(`INSERT INTO ${q(def.name)} (${cols}) SELECT ${cols} FROM ${q(stagingName(def))} WHERE _org_id = ?`, [req.orgId]);
          await tx.execute(`DELETE FROM ${q(stagingName(def))} WHERE _org_id = ?`, [req.orgId]);
        }
      }
      await tx.execute('DELETE FROM sync_state WHERE _org_id = ?', [req.orgId]);
      for (const key of sets) {
        await tx.execute('INSERT INTO sync_state (_org_id, dataset, row_count, synced_at) VALUES (?, ?, ?, ?)', [
          req.orgId,
          key,
          counts[key] ?? 0,
          finishedAt,
        ]);
      }
      for (const e of extras.entries()) {
        await tx.execute(
          `INSERT INTO schema_extra_key (table_name, key, first_seen_at, last_seen_at, example, seen_count) VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(table_name, key) DO UPDATE SET last_seen_at = excluded.last_seen_at, example = excluded.example,
             seen_count = schema_extra_key.seen_count + excluded.seen_count`,
          [e.table, e.key, finishedAt, finishedAt, e.example, e.count],
        );
      }
      await tx.execute(
        `UPDATE sync_run SET finished_at = ?, status = 'ok', error = NULL, sales_from = ?, sales_to = ? WHERE _org_id = ?`,
        [finishedAt, req.access.sales.length ? salesFrom : null, req.access.sales.length ? salesTo : null, req.orgId],
      );
    });
    return counts;
  } catch (e) {
    const cancelled = e instanceof SyncCancelled;
    await db.execute(`UPDATE sync_run SET status = ?, error = ? WHERE _org_id = ?`, [
      cancelled ? 'cancelled' : 'failed',
      cancelled ? null : e instanceof Error ? e.message : String(e),
      req.orgId,
    ]);
    for (const key of sets) await db.execute(`DELETE FROM ${q(stagingName(TABLES[key]))} WHERE _org_id = ?`, [req.orgId]);
    throw e;
  }
}
