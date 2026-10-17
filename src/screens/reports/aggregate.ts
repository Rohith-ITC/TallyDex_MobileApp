import dayjs from 'dayjs';
import type { ClosingItem, SalesItem } from '../../api/types';
import type { Datum } from '../../components/Charts';
import { toNum } from '../../utils/format';

/** Sum `value` per `key`, largest first. Blank keys become "Unknown", as on the web. */
export function sumBy<T>(rows: T[], key: (r: T) => string | null | undefined, value: (r: T) => number): Datum[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = (key(r) || '').trim() || 'Unknown';
    m.set(k, (m.get(k) ?? 0) + value(r));
  }
  return [...m.entries()].map(([label, v]) => ({ label, value: v })).sort((a, b) => b.value - a.value);
}

/** Per month in calendar order: "Apr 26". */
export function byMonth<T>(rows: T[], date: (r: T) => string, value: (r: T) => number): Datum[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const d = dayjs(date(r));
    if (!d.isValid()) continue;
    const k = d.format('YYYY-MM');
    m.set(k, (m.get(k) ?? 0) + value(r));
  }
  return [...m.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => ({ label: dayjs(`${k}-01`).format('MMM YY'), value: v }));
}

/** Port of SalesAnalyticsPage.processChartData (mapped sales). */
export function salesAnalytics(rows: SalesItem[]) {
  const amt = (r: SalesItem) => toNum(r.amt);
  const qty = (r: SalesItem) => toNum(r.actlqty);
  const totalRevenue = rows.reduce((s, r) => s + amt(r), 0);
  const totalQty = rows.reduce((s, r) => s + qty(r), 0);
  const dealers = sumBy(rows, (r) => r.ho_dealer_delname, amt);
  const products = sumBy(rows, (r) => r.ho_itemdesc || r.stockitem_name || r.itemname, amt);
  const top10 = dealers.slice(0, 10).reduce((s, d) => s + d.value, 0);
  return {
    totalRevenue,
    totalQty,
    dealerCount: dealers.length,
    productCount: products.length,
    avgRevenuePerDealer: dealers.length ? totalRevenue / dealers.length : 0,
    avgRevenuePerProduct: products.length ? totalRevenue / products.length : 0,
    top10DealerShare: totalRevenue > 0 ? (top10 / totalRevenue) * 100 : 0,
    revenueByMonth: byMonth(rows, (r) => r.vchdt, amt),
    qtyByMonth: byMonth(rows, (r) => r.vchdt, qty),
    dealers,
    products,
    regions: sumBy(rows, (r) => r.ho_dealer_region, amt),
    states: sumBy(rows, (r) => r.ho_dealer_state, amt),
    divisions: sumBy(rows, (r) => r.ho_dealer_division, amt),
    stockGroups: sumBy(rows, (r) => r.ho_stockgroup, amt),
    returnsByMonth: byMonth(
      rows.filter((r) => (r.vchtyperesname || '').toLowerCase().includes('credit')),
      (r) => r.vchdt,
      amt,
    ),
  };
}

/** Port of the ClosingBalanceAnalyticsPage totals and group-bys (mapped closing). */
export function stockAnalytics(rows: ClosingItem[]) {
  const val = (r: ClosingItem) => toNum(r.cbamt);
  const qty = (r: ClosingItem) => toNum(r.cbqty);
  const dealers = sumBy(rows, (r) => r.dealer_name, val);
  return {
    totalValue: rows.reduce((s, r) => s + val(r), 0),
    totalQty: rows.reduce((s, r) => s + qty(r), 0),
    dealerCount: dealers.length,
    itemCount: new Set(rows.map((r) => r.ho_item_code || r.stock_item_name)).size,
    groupsByValue: sumBy(rows, (r) => r.ho_item_group, val),
    groupsByQty: sumBy(rows, (r) => r.ho_item_group, qty),
    categoriesByValue: sumBy(rows, (r) => r.ho_item_category, val),
    dealers,
    states: sumBy(rows, (r) => r.dealer_state, val),
    regions: sumBy(rows, (r) => r.dealer_region, val),
    items: sumBy(rows, (r) => r.ho_item_description || r.stock_item_name, val),
  };
}
