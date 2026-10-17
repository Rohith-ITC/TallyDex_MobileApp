import type { ClosingItem, DashboardStats, FilterDropdowns, Paged, SalesItem } from '../api/types';
import { query, queryOne } from './database';
import type { Scalar } from './rows';
import type { TableKey } from './schema';

/** Rebuilds an API-shaped row: typed columns plus whatever was kept in json_data. */
function hydrate<T>(row: Record<string, Scalar>): T {
  const { json_data, ...rest } = row;
  const extra = typeof json_data === 'string' && json_data ? (JSON.parse(json_data) as Record<string, unknown>) : null;
  return (extra ? { ...extra, ...rest } : rest) as T;
}

interface Where {
  sql: string;
  params: Scalar[];
}

const placeholders = (n: number) => Array.from({ length: n }, () => '?').join(', ');

function inList(clauses: string[], params: Scalar[], expr: string, values: Array<string | number> | undefined) {
  if (!values?.length) return;
  clauses.push(`${expr} IN (${placeholders(values.length)})`);
  params.push(...values);
}

/** Option values are stored as text; the subqueries below match on them. */
const optionSubquery = (column: 'label' | 'code', kind: string, n: number) =>
  `(SELECT ${column} FROM filter_option WHERE _org_id = ? AND _kind = '${kind}' AND value IN (${placeholders(n)}))`;

export interface LocalSalesFilter {
  dateFrom: string;
  dateTo: string;
  companyIds?: number[];
  dealerIds?: number[];
  hoItemIds?: number[];
  regions?: string[];
  divisions?: string[];
}

/** Same filters the API applies, as SQL over the downloaded rows. */
export function salesWhere(orgId: number, mapped: boolean, f: LocalSalesFilter): Where {
  const clauses = ['_org_id = ?', '_date BETWEEN ? AND ?'];
  const params: Scalar[] = [orgId, f.dateFrom, f.dateTo];
  if (mapped) {
    inList(clauses, params, 'COALESCE(ho_dealer_id, mapped_ho_dealer_id)', f.dealerIds);
    inList(clauses, params, 'COALESCE(ho_stockitem_id, mapped_ho_stockitem_id)', f.hoItemIds);
    inList(clauses, params, 'ho_dealer_region', f.regions);
    inList(clauses, params, 'ho_dealer_division', f.divisions);
  } else {
    inList(clauses, params, 'cotablid', f.companyIds);
  }
  return { sql: clauses.join(' AND '), params };
}

export interface LocalClosingFilter {
  companyIds?: number[];
  dealerIds?: number[];
  stockGroups?: string[];
  categories?: string[];
  states?: string[];
  regions?: string[];
  divisions?: string[];
}

/**
 * Closing rows carry names and codes, not ids, so company and dealer ids from
 * the pickers are matched through the downloaded filter options.
 */
export function closingWhere(orgId: number, mapped: boolean, f: LocalClosingFilter): Where {
  const clauses = ['_org_id = ?'];
  const params: Scalar[] = [orgId];
  if (mapped) {
    if (f.dealerIds?.length) {
      clauses.push(`dealer_code IN ${optionSubquery('code', 'dealers', f.dealerIds.length)}`);
      params.push(orgId, ...f.dealerIds.map(String));
    }
    inList(clauses, params, 'ho_item_group', f.stockGroups);
    inList(clauses, params, 'ho_item_category', f.categories);
    inList(clauses, params, 'dealer_state', f.states);
    inList(clauses, params, 'dealer_region', f.regions);
    inList(clauses, params, 'dealer_division', f.divisions);
  } else if (f.companyIds?.length) {
    clauses.push(`company_name IN ${optionSubquery('label', 'companies', f.companyIds.length)}`);
    params.push(orgId, ...f.companyIds.map(String));
  }
  return { sql: clauses.join(' AND '), params };
}

async function paged<T>(table: string, where: Where, order: string, page: number, limit: number): Promise<Paged<T>> {
  const totalRow = await queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM "${table}" WHERE ${where.sql}`, where.params);
  const total = Number(totalRow?.n ?? 0);
  const rows = await query(`SELECT * FROM "${table}" WHERE ${where.sql} ORDER BY ${order} LIMIT ? OFFSET ?`, [
    ...where.params,
    limit,
    (page - 1) * limit,
  ]);
  return {
    items: rows.map((r) => hydrate<T>(r)),
    pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export const localData = {
  salesPage: (orgId: number, mapped: boolean, f: LocalSalesFilter, page: number, limit: number) =>
    paged<SalesItem>(mapped ? 'mapped_sales_entry' : 'sales_entry', salesWhere(orgId, mapped, f), '_date DESC, id DESC', page, limit),

  closingPage: (orgId: number, mapped: boolean, f: LocalClosingFilter, page: number, limit: number) =>
    paged<ClosingItem>(mapped ? 'mapped_closing_balance' : 'closing_balance', closingWhere(orgId, mapped, f), '_rid', page, limit),

  /** Every matching row, for analytics. */
  allMappedSales: async (orgId: number, f: LocalSalesFilter) => {
    const w = salesWhere(orgId, true, f);
    return (await query(`SELECT * FROM mapped_sales_entry WHERE ${w.sql}`, w.params)).map((r) => hydrate<SalesItem>(r));
  },

  allMappedClosing: async (orgId: number, f: LocalClosingFilter) => {
    const w = closingWhere(orgId, true, f);
    return (await query(`SELECT * FROM mapped_closing_balance WHERE ${w.sql}`, w.params)).map((r) => hydrate<ClosingItem>(r));
  },

  dashboard: async (userId: number, orgId: number): Promise<DashboardStats | null> => {
    const r = await queryOne(`SELECT * FROM dashboard_stats WHERE _user_id = ? AND _org_id = ?`, [userId, orgId]);
    return r ? hydrate<DashboardStats>(r) : null;
  },

  filters: async (orgId: number): Promise<FilterDropdowns> => {
    const rows = await query<{ _kind: string; value: string; label: string; code: string | null }>(
      `SELECT _kind, value, label, code FROM filter_option WHERE _org_id = ? ORDER BY label COLLATE NOCASE`,
      [orgId],
    );
    const by = (k: string) => rows.filter((r) => r._kind === k);
    const strs = (k: string) => by(k).map((r) => r.label);
    return {
      companies: by('companies').map((r) => ({ id: Number(r.value), name: r.label, guid: r.code ?? '' })),
      dealers: by('dealers').map((r) => ({ id: Number(r.value), delname: r.label, delcode: r.code ?? '' })),
      hoStockitems: by('hoStockitems').map((r) => ({ id: Number(r.value), itemdesc: r.label, itemcode: r.code ?? '' })),
      stockgroups: strs('stockgroups'),
      stockcategories: strs('stockcategories'),
      states: strs('states'),
      regions: strs('regions'),
      divisions: strs('divisions'),
    };
  },

  syncInfo: async (orgId: number) => {
    const run = await queryOne<{
      started_at: string | null;
      finished_at: string | null;
      status: string | null;
      error: string | null;
      sales_from: string | null;
      sales_to: string | null;
      trigger: string | null;
    }>(`SELECT * FROM sync_run WHERE _org_id = ?`, [orgId]);
    const states = await query<{ dataset: TableKey; row_count: number; synced_at: string }>(
      `SELECT dataset, row_count, synced_at FROM sync_state WHERE _org_id = ?`,
      [orgId],
    );
    const datasets: Partial<Record<TableKey, { rows: number; syncedAt: string }>> = {};
    for (const s of states) datasets[s.dataset] = { rows: Number(s.row_count), syncedAt: s.synced_at };
    return { run, datasets, hasData: states.length > 0 };
  },

  extraKeys: () =>
    query<{ table_name: string; key: string; first_seen_at: string; last_seen_at: string; example: string; seen_count: number }>(
      `SELECT * FROM schema_extra_key ORDER BY table_name, key`,
    ),

  /** Approximate database size in bytes. */
  sizeBytes: async () => {
    const pc = await queryOne<{ page_count: number }>('PRAGMA page_count');
    const ps = await queryOne<{ page_size: number }>('PRAGMA page_size');
    return Number(pc?.page_count ?? 0) * Number(ps?.page_size ?? 0);
  },
};

export type SyncInfo = Awaited<ReturnType<typeof localData.syncInfo>>;
