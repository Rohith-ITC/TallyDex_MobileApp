import dayjs from 'dayjs';
import { splitRow } from '../src/db/rows';
import type { ReportAccess } from '../src/constants/modules';


jest.mock('../src/api/endpoints', () => ({
  dashboardApi: { stats: jest.fn() },
  reportsApi: { filters: jest.fn(), sales: jest.fn(), mappedSales: jest.fn(), closing: jest.fn(), mappedClosing: jest.fn() },
}));

const ALL: ReportAccess = { sales: ['all', 'mapped', 'analytics'], stock: ['all', 'mapped', 'analytics'] };
const page = <T,>(items: T[], pageNo = 1, totalPages = 1) => ({ items, pagination: { total: items.length, page: pageNo, limit: 1000, totalPages } });

const sale = (id: number, vchdt: string, extra: Record<string, unknown> = {}) => ({
  id,
  cotablid: id % 2 ? 1 : 2,
  company_name: id % 2 ? 'North Co' : 'South Co',
  vchno: `INV${id}`,
  vchdt,
  vchtype: 'Sales',
  vchtyperesname: 'Sales',
  partyled: `Party ${id}`,
  itemname: 'Item',
  amt: String(id * 100),
  actlqty: '2.5',
  bildqty: 2,
  unitsybl: 'PCS',
  rate: 40,
  disc: 0,
  ...extra,
});

const closing = (dealer: string, code: string, amt: number, extra: Record<string, unknown> = {}) => ({
  company_name: 'North Co',
  dealer_code: code,
  dealer_name: dealer,
  stock_item_name: 'Soap',
  ho_item_code: 'H1',
  ho_item_description: 'Soap 100g',
  ho_item_group: 'Personal',
  cbqty: '10',
  cbamt: amt,
  ...extra,
});

/** Fresh modules + empty database for each test. */
function load() {
  jest.resetModules();
  require('@op-engineering/op-sqlite').__reset();
  const endpoints = require('../src/api/endpoints');
  const engine = require('../src/sync/syncEngine');
  const { localData } = require('../src/db/localData');
  const database = require('../src/db/database');
  const schema = require('../src/db/schema');
  const { dashboardApi, reportsApi } = endpoints;
  dashboardApi.stats.mockResolvedValue({ role: 'OWNER', totalUsers: 4, totalModules: 7, lastLoginAt: null, newKpi: 99 });
  reportsApi.filters.mockResolvedValue({
    companies: [{ id: 1, name: 'North Co', guid: 'g1' }, { id: 2, name: 'South Co', guid: 'g2' }],
    dealers: [{ id: 10, delname: 'Alpha Traders', delcode: 'D10' }, { id: 11, delname: 'Beta Stores', delcode: 'D11' }],
    hoStockitems: [{ id: 5, itemdesc: 'Soap 100g', itemcode: 'H1' }],
    stockgroups: ['Personal'],
    stockcategories: [],
    states: ['Karnataka'],
    regions: ['South'],
    divisions: [],
  });
  // Two pages in the first weekly chunk, nothing after.
  reportsApi.sales.mockImplementation(async (q: { dateFrom: string }, p: number) =>
    q.dateFrom === '2026-10-01' ? (p === 1 ? page([sale(1, '2026-10-02'), sale(2, '2026-10-03')], 1, 2) : page([sale(3, '2026-10-05')], 2, 2)) : page([]),
  );
  reportsApi.mappedSales.mockImplementation(async (q: { dateFrom: string }) =>
    q.dateFrom === '2026-10-08' ? page([sale(7, '2026-10-09', { ho_dealer_id: 10, ho_dealer_region: 'South', ho_dealer_delname: 'Alpha Traders' })]) : page([]),
  );
  reportsApi.closing.mockResolvedValue(page([closing('Alpha Traders', 'D10', 500, { godown: 'Main' })]));
  reportsApi.mappedClosing.mockResolvedValue(page([closing('Alpha Traders', 'D10', 500), closing('Beta Stores', 'D11', 300)]));
  return { engine, localData, database, schema, reportsApi };
}

const request = (over: Record<string, unknown> = {}) => ({
  orgId: 42,
  userId: 7,
  access: ALL,
  salesFrom: dayjs('2026-10-01'),
  salesTo: dayjs('2026-10-14'),
  trigger: 'first' as const,
  isCancelled: () => false,
  onProgress: () => {},
  ...over,
});

describe('splitRow', () => {
  it('types known fields and keeps unknown ones for json_data', () => {
    const r = splitRow({ columns: { id: 'INTEGER', amt: 'REAL', vchno: 'TEXT' } }, { id: '12', amt: '10.50', vchno: 5, brandNew: { a: 1 } });
    expect(r.values).toEqual([12, 10.5, '5']);
    expect(r.extra).toEqual({ brandNew: { a: 1 } });
  });

  it('stores blanks as NULL and has no extra when every field is known', () => {
    expect(splitRow({ columns: { amt: 'REAL', vchno: 'TEXT' } }, { amt: '', vchno: null })).toEqual({ values: [null, null], extra: null });
  });
});

describe('runSync + localData (real SQLite)', () => {
  it('downloads every dataset, paging and chunking, then serves it locally', async () => {
    const { engine, localData, reportsApi } = load();
    const counts = await engine.runSync(request());
    expect(counts).toEqual({ dashboard: 1, filterOption: 8, sales: 3, mappedSales: 1, closing: 1, mappedClosing: 2 });
    // 14 days → two weekly chunks, the first one paged twice.
    expect(reportsApi.sales.mock.calls.map((c: unknown[]) => [(c[0] as { dateFrom: string }).dateFrom, c[1], c[3]])).toEqual([
      ['2026-10-01', 1, 42],
      ['2026-10-01', 2, 42],
      ['2026-10-08', 1, 42],
    ]);

    const all = await localData.salesPage(42, false, { dateFrom: '2026-10-01', dateTo: '2026-10-14' }, 1, 50);
    expect(all.pagination.total).toBe(3);
    expect(all.items.map((i: { id: number }) => i.id)).toEqual([3, 2, 1]);
    expect(all.items[0].amt).toBe(300);

    const north = await localData.salesPage(42, false, { dateFrom: '2026-10-01', dateTo: '2026-10-14', companyIds: [1] }, 1, 50);
    expect(north.items.map((i: { id: number }) => i.id)).toEqual([3, 1]);

    const outside = await localData.salesPage(42, false, { dateFrom: '2026-09-01', dateTo: '2026-09-30' }, 1, 50);
    expect(outside.pagination.total).toBe(0);

    const mapped = await localData.salesPage(42, true, { dateFrom: '2026-10-01', dateTo: '2026-10-14', dealerIds: [10], regions: ['South'] }, 1, 50);
    expect(mapped.items.map((i: { id: number }) => i.id)).toEqual([7]);

    const dash = await localData.dashboard(7, 42);
    expect(dash).toMatchObject({ role: 'OWNER', totalUsers: 4, newKpi: 99 });

    const filters = await localData.filters(42);
    expect(filters.dealers).toEqual([
      { id: 10, delname: 'Alpha Traders', delcode: 'D10' },
      { id: 11, delname: 'Beta Stores', delcode: 'D11' },
    ]);

    const info = await localData.syncInfo(42);
    expect(info.hasData).toBe(true);
    expect(info.run).toMatchObject({ status: 'ok', sales_from: '2026-10-01', sales_to: '2026-10-14', trigger: 'first' });
    expect(info.datasets.sales.rows).toBe(3);
  });

  it('keeps unknown fields in json_data and logs them', async () => {
    const { engine, localData } = load();
    await engine.runSync(request());
    const page1 = await localData.closingPage(42, false, {}, 1, 50);
    expect(page1.items[0]).toMatchObject({ dealer_name: 'Alpha Traders', godown: 'Main', cbqty: 10 });
    const keys = await localData.extraKeys();
    expect(keys.map((k: { table_name: string; key: string }) => `${k.table_name}.${k.key}`).sort()).toEqual([
      'closing_balance.godown',
      'dashboard_stats.newKpi',
    ]);
  });

  it('matches closing filters on dealer and company ids through the downloaded options', async () => {
    const { engine, localData } = load();
    await engine.runSync(request());
    const beta = await localData.closingPage(42, true, { dealerIds: [11] }, 1, 50);
    expect(beta.items.map((i: { dealer_name: string }) => i.dealer_name)).toEqual(['Beta Stores']);
    const south = await localData.closingPage(42, false, { companyIds: [2] }, 1, 50);
    expect(south.pagination.total).toBe(0);
  });

  it('leaves the previous data untouched when an update fails halfway', async () => {
    const { engine, localData, reportsApi } = load();
    await engine.runSync(request());
    reportsApi.sales.mockResolvedValue(page([sale(99, '2026-10-02')]));
    reportsApi.mappedClosing.mockRejectedValue(new Error('Network error'));
    await expect(engine.runSync(request({ trigger: 'manual' }))).rejects.toThrow('Network error');

    const all = await localData.salesPage(42, false, { dateFrom: '2026-10-01', dateTo: '2026-10-14' }, 1, 50);
    expect(all.items.map((i: { id: number }) => i.id)).toEqual([3, 2, 1]);
    const info = await localData.syncInfo(42);
    expect(info.run).toMatchObject({ status: 'failed', error: 'Network error' });
    expect(info.hasData).toBe(true);
    const { query } = require('../src/db/database');
    expect((await query('SELECT COUNT(*) AS n FROM sales_entry__staging'))[0].n).toBe(0);
  });

  it('stops without changing anything when cancelled', async () => {
    const { engine, localData } = load();
    let calls = 0;
    await expect(engine.runSync(request({ isCancelled: () => ++calls > 3 }))).rejects.toBeInstanceOf(engine.SyncCancelled);
    expect((await localData.syncInfo(42)).hasData).toBe(false);
  });

  it('keeps organizations apart and wipes everything on logout', async () => {
    const { engine, localData, database } = load();
    await engine.runSync(request());
    await engine.runSync(request({ orgId: 43 }));
    expect((await localData.syncInfo(43)).datasets.sales.rows).toBe(3);
    expect((await localData.salesPage(42, false, { dateFrom: '2026-10-01', dateTo: '2026-10-14' }, 1, 50)).pagination.total).toBe(3);
    await database.wipeAllData();
    expect((await localData.syncInfo(42)).hasData).toBe(false);
    expect(await localData.extraKeys()).toEqual([]);
  });

  it('promotes a json_data field to a real column', async () => {
    const { engine, schema, database, localData } = load();
    await engine.runSync(request());
    const d = await database.getDb();
    for (const sql of schema.promoteColumnSql('closing_balance', 'godown', 'TEXT')) await d.execute(sql);
    const [row] = await database.query('SELECT godown, json_data FROM closing_balance');
    expect(row).toEqual({ godown: 'Main', json_data: null });
    expect((await localData.extraKeys()).map((k: { key: string }) => k.key)).toEqual(['newKpi']);
  });

  it('only downloads what the modules allow', () => {
    const { engine } = load();
    expect(engine.datasetsFor({ sales: [], stock: [] })).toEqual(['dashboard']);
    expect(engine.datasetsFor({ sales: ['analytics'], stock: ['all'] })).toEqual(['dashboard', 'filterOption', 'mappedSales', 'closing']);
  });

  it('splits the sales period into weekly chunks', () => {
    const { engine } = load();
    expect(engine.dateChunks(dayjs('2026-10-01'), dayjs('2026-10-16'))).toEqual([
      { from: '2026-10-01', to: '2026-10-07' },
      { from: '2026-10-08', to: '2026-10-14' },
      { from: '2026-10-15', to: '2026-10-16' },
    ]);
  });
});
