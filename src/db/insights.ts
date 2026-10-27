import dayjs from 'dayjs';
import type { Datum } from '../components/Charts';
import { query, queryOne } from './database';

/**
 * Dashboard figures computed over the downloaded rows. `mapped` picks the
 * mapped table when the user can't see the All view (each view has its own
 * download).
 */

const salesTable = (mapped: boolean) => (mapped ? 'mapped_sales_entry' : 'sales_entry');
const closingTable = (mapped: boolean) => (mapped ? 'mapped_closing_balance' : 'closing_balance');

export interface SalesSummary {
  value: number;
  qty: number;
  invoices: number;
  avgInvoice: number;
  /** One entry per day from `from` to `to`, zero on days without sales. */
  daily: Datum[];
}

/** Same totals as Sales Analytics: amount and actual quantity, every voucher type. */
export async function salesSummary(orgId: number, mapped: boolean, from: string, to: string): Promise<SalesSummary> {
  const t = salesTable(mapped);
  const totals = await queryOne<{ value: number | null; qty: number | null; invoices: number }>(
    `SELECT SUM(amt) AS value, SUM(actlqty) AS qty,
            COUNT(DISTINCT COALESCE(cotablid, '') || '|' || COALESCE(vchno, vchid, id)) AS invoices
       FROM "${t}" WHERE _org_id = ? AND _date BETWEEN ? AND ?`,
    [orgId, from, to],
  );
  const days = await query<{ d: string; v: number | null }>(
    `SELECT _date AS d, SUM(amt) AS v FROM "${t}" WHERE _org_id = ? AND _date BETWEEN ? AND ? GROUP BY _date`,
    [orgId, from, to],
  );
  const byDay = new Map(days.map((r) => [r.d, Number(r.v ?? 0)]));
  const daily: Datum[] = [];
  for (let d = dayjs(from); !d.isAfter(dayjs(to), 'day'); d = d.add(1, 'day')) {
    daily.push({ label: d.format('DD MMM'), value: byDay.get(d.format('YYYY-MM-DD')) ?? 0 });
  }
  const value = Number(totals?.value ?? 0);
  const invoices = Number(totals?.invoices ?? 0);
  return { value, qty: Number(totals?.qty ?? 0), invoices, avgInvoice: invoices ? value / invoices : 0, daily };
}

export interface SilentDistributor {
  id: number;
  name: string;
  /** Latest sale anywhere in the downloaded period, null if none. */
  lastSale: string | null;
}

export interface DistributorActivity {
  total: number;
  active: number;
  silent: SilentDistributor[];
}

/**
 * Distributors are the Tally companies in the filter list (the report's
 * Company filter), plus any company seen in the downloaded sales. Active means
 * at least one sales row between `from` and `to`.
 */
export async function distributorActivity(orgId: number, mapped: boolean, from: string, to: string): Promise<DistributorActivity> {
  const t = salesTable(mapped);
  const known = await query<{ value: string; label: string }>(
    `SELECT value, label FROM filter_option WHERE _org_id = ? AND _kind = 'companies'`,
    [orgId],
  );
  const seen = await query<{ id: number; name: string | null; last: string | null; inPeriod: number }>(
    `SELECT cotablid AS id, MAX(company_name) AS name, MAX(_date) AS last,
            MAX(CASE WHEN _date BETWEEN ? AND ? THEN 1 ELSE 0 END) AS inPeriod
       FROM "${t}" WHERE _org_id = ? AND cotablid IS NOT NULL GROUP BY cotablid`,
    [from, to, orgId],
  );
  const all = new Map<number, SilentDistributor & { active: boolean }>();
  for (const k of known) {
    const id = Number(k.value);
    if (Number.isFinite(id)) all.set(id, { id, name: k.label, lastSale: null, active: false });
  }
  for (const s of seen) {
    const prev = all.get(Number(s.id));
    all.set(Number(s.id), {
      id: Number(s.id),
      name: prev?.name || s.name || `Company ${s.id}`,
      lastSale: s.last,
      active: Number(s.inPeriod) === 1,
    });
  }
  const list = [...all.values()];
  const silent = list
    .filter((d) => !d.active)
    // Most recently active first: they went quiet lately and are the likeliest to come back.
    .sort((a, b) => (b.lastSale ?? '').localeCompare(a.lastSale ?? '') || a.name.localeCompare(b.name))
    .map(({ id, name, lastSale }) => ({ id, name, lastSale }));
  return { total: list.length, active: list.length - silent.length, silent };
}

export interface StockAlertRow {
  dealer: string;
  item: string;
  closingQty: number;
  /** Outward quantity this month. */
  monthOutQty: number;
  /** Days the closing stock lasts at this month's daily outward rate; null when nothing moved out. */
  coverDays: number | null;
}

export interface StockAlerts {
  outOfStock: { count: number; rows: StockAlertRow[] };
  lowCover: { count: number; rows: StockAlertRow[] };
}

export const LOW_COVER_DAYS = 7;
/** Rows fetched per alert list; the count is always the full number. */
export const ALERT_ROWS = 100;

/**
 * From closing stock (one row per dealer × item):
 * - out of stock: closing qty ≤ 0 for an item that was in stock at the start
 *   of the month or moved out during it (items that never move are left out);
 * - low cover: in stock, but fewer than LOW_COVER_DAYS days left at this
 *   month's outward rate. Days elapsed are counted up to the row's received_on
 *   date (the day the dealer's data was taken), else up to today.
 */
export async function stockAlerts(orgId: number, mapped: boolean, today = dayjs()): Promise<StockAlerts> {
  const t = closingTable(mapped);
  const select = `COALESCE(NULLIF(dealer_name, ''), company_name, '—') AS dealer,
       COALESCE(NULLIF(ho_item_description, ''), stock_item_name, '—') AS item,
       COALESCE(cbqty, 0) AS closingQty, ABS(COALESCE(monthoutqty, 0)) AS monthOutQty`;
  const days = `MAX(1, COALESCE(CAST(strftime('%d', received_on) AS INTEGER), ?))`;
  const cover = `COALESCE(cbqty, 0) * ${days} / ABS(monthoutqty)`;

  const outWhere = `_org_id = ? AND COALESCE(cbqty, 0) <= 0 AND (COALESCE(monthobqty, 0) > 0 OR ABS(COALESCE(monthoutqty, 0)) > 0)`;
  const lowWhere = `_org_id = ? AND COALESCE(cbqty, 0) > 0 AND ABS(COALESCE(monthoutqty, 0)) > 0 AND ${cover} < ?`;
  const day = today.date();

  const [outCount, outRows, lowCount, lowRows] = await Promise.all([
    queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM "${t}" WHERE ${outWhere}`, [orgId]),
    query<StockAlertRow>(`SELECT ${select}, NULL AS coverDays FROM "${t}" WHERE ${outWhere} ORDER BY monthOutQty DESC, dealer, item LIMIT ?`, [
      orgId,
      ALERT_ROWS,
    ]),
    queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM "${t}" WHERE ${lowWhere}`, [orgId, day, LOW_COVER_DAYS]),
    query<StockAlertRow>(`SELECT ${select}, ${cover} AS coverDays FROM "${t}" WHERE ${lowWhere} ORDER BY coverDays, dealer, item LIMIT ?`, [
      day,
      orgId,
      day,
      LOW_COVER_DAYS,
      ALERT_ROWS,
    ]),
  ]);
  const num = (r: StockAlertRow): StockAlertRow => ({
    ...r,
    closingQty: Number(r.closingQty),
    monthOutQty: Number(r.monthOutQty),
    coverDays: r.coverDays === null ? null : Number(r.coverDays),
  });
  return {
    outOfStock: { count: Number(outCount?.n ?? 0), rows: outRows.map(num) },
    lowCover: { count: Number(lowCount?.n ?? 0), rows: lowRows.map(num) },
  };
}
