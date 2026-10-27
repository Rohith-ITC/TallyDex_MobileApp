import dayjs from 'dayjs';

type Row = Record<string, string | number | null>;

/** Fresh empty database with `rows` inserted per table, and the insights module. */
async function load(tables: Record<string, Row[]>) {
  jest.resetModules();
  require('@op-engineering/op-sqlite').__reset();
  const { getDb } = require('../src/db/database');
  const db = await getDb();
  for (const [table, rows] of Object.entries(tables)) {
    for (const r of rows) {
      const cols = Object.keys(r);
      await db.execute(`INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, Object.values(r));
    }
  }
  return require('../src/db/insights');
}

let nextId = 1;
const sale = (cotablid: number, date: string, amt: number, vchno: string, extra: Row = {}): Row => ({
  _org_id: 42,
  _date: date,
  id: nextId++,
  cotablid,
  company_name: `Company ${cotablid}`,
  vchno,
  vchdt: date,
  amt,
  actlqty: 2,
  ...extra,
});

const company = (id: number, name: string): Row => ({ _org_id: 42, _kind: 'companies', value: String(id), label: name, code: null });

const stock = (item: string, r: Row): Row => ({
  _org_id: 42,
  dealer_name: 'Alpha Traders',
  company_name: 'Alpha Co',
  stock_item_name: item,
  received_on: '2026-10-20',
  ...r,
});

describe('dashboard insights (real SQLite)', () => {
  it('sums this month, counts invoices once and fills days without sales', async () => {
    const i = await load({
      sales_entry: [
        sale(1, '2026-10-02', 100, 'INV1'),
        sale(1, '2026-10-02', 50, 'INV1'), // second line of the same invoice
        sale(2, '2026-10-04', 250, 'INV1'), // same number, another company
        sale(1, '2026-09-30', 999, 'OLD'), // last month
        { ...sale(1, '2026-10-03', 70, 'X'), _org_id: 43 }, // another organization
      ],
    });
    const s = await i.salesSummary(42, false, '2026-10-01', '2026-10-05');
    expect(s).toMatchObject({ value: 400, qty: 6, invoices: 2, avgInvoice: 200 });
    expect(s.daily.map((d: { value: number }) => d.value)).toEqual([0, 150, 0, 250, 0]);
    expect(s.daily[0].label).toBe('01 Oct');
  });

  it('lists distributors without sales this month, most recently active first', async () => {
    const i = await load({
      filter_option: [company(1, 'North Co'), company(2, 'South Co'), company(3, 'East Co'), company(4, 'West Co')],
      mapped_sales_entry: [
        sale(1, '2026-10-10', 100, 'A'),
        sale(2, '2026-09-12', 100, 'B'),
        sale(4, '2026-09-25', 100, 'C'),
        sale(5, '2026-10-11', 100, 'D', { company_name: 'Not In List' }),
      ],
    });
    const a = await i.distributorActivity(42, true, '2026-10-01', '2026-10-27');
    expect(a.total).toBe(5);
    expect(a.active).toBe(2);
    expect(a.silent).toEqual([
      { id: 4, name: 'West Co', lastSale: '2026-09-25' },
      { id: 2, name: 'South Co', lastSale: '2026-09-12' },
      { id: 3, name: 'East Co', lastSale: null },
    ]);
  });

  it('flags items that ran out and items with under a week of stock', async () => {
    const i = await load({
      closing_balance: [
        stock('Ran out', { cbqty: 0, monthobqty: 10, monthoutqty: 10 }),
        stock('Never moves', { cbqty: 0, monthobqty: 0, monthoutqty: 0 }),
        // 20 sold in 20 days → 1 a day; 3 left → 3 days.
        stock('Low', { cbqty: 3, monthoutqty: 20 }),
        // 20 sold in 20 days; 30 left → 30 days.
        stock('Plenty', { cbqty: 30, monthoutqty: 20 }),
        // No received_on: days counted to today (the 10th) → 5 a day; 10 left → 2 days.
        stock('Low, no date', { cbqty: 10, monthoutqty: 50, received_on: null, dealer_name: null }),
        stock('In stock, not selling', { cbqty: 40, monthoutqty: 0 }),
      ],
    });
    const a = await i.stockAlerts(42, false, dayjs('2026-10-10'));
    expect(a.outOfStock.count).toBe(1);
    expect(a.outOfStock.rows[0]).toMatchObject({ item: 'Ran out', dealer: 'Alpha Traders', closingQty: 0, monthOutQty: 10, coverDays: null });
    expect(a.lowCover.count).toBe(2);
    expect(a.lowCover.rows.map((r: { item: string; dealer: string; coverDays: number }) => [r.item, r.dealer, r.coverDays])).toEqual([
      ['Low, no date', 'Alpha Co', 2],
      ['Low', 'Alpha Traders', 3],
    ]);
  });
});
