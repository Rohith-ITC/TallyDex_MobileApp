import { salesAnalytics, stockAnalytics } from '../src/screens/reports/aggregate';
import type { ClosingItem, SalesItem } from '../src/api/types';

const sale = (p: Partial<SalesItem>): SalesItem => ({
  id: 1,
  cotablid: 1,
  ledname: '',
  itemname: 'item',
  rate: 0,
  disc: 0,
  amt: 0,
  actlqty: 0,
  bildqty: 0,
  unitsybl: 'PCS',
  vchid: 1,
  vchno: '1',
  vchdt: '2026-04-10',
  vchtype: 'Sales',
  vchtyperesname: 'Sales',
  partyled: 'P',
  company_name: 'C',
  ...p,
});

describe('salesAnalytics', () => {
  const rows = [
    sale({ amt: '1000.50', actlqty: '2', ho_dealer_delname: 'A', ho_itemdesc: 'X', ho_dealer_region: 'West', vchdt: '2026-04-10' }),
    sale({ amt: 500, actlqty: 1, ho_dealer_delname: 'B', ho_itemdesc: 'X', ho_dealer_region: '', vchdt: '2026-05-02' }),
    sale({ amt: 250, actlqty: 1, ho_dealer_delname: 'A', ho_itemdesc: 'Y', vchdt: '2026-05-20', vchtyperesname: 'Credit Note' }),
  ];
  const a = salesAnalytics(rows);

  it('totals revenue and quantity, reading string decimals', () => {
    expect(a.totalRevenue).toBeCloseTo(1750.5);
    expect(a.totalQty).toBe(4);
  });

  it('averages per dealer and per product', () => {
    expect(a.dealerCount).toBe(2);
    expect(a.avgRevenuePerDealer).toBeCloseTo(875.25);
    expect(a.productCount).toBe(2);
  });

  it('ranks dealers and labels blank regions Unknown, like the web', () => {
    expect(a.dealers.map((d) => d.label)).toEqual(['A', 'B']);
    expect(a.regions.map((d) => d.label).sort()).toEqual(['Unknown', 'West']);
  });

  it('groups by month in calendar order and picks credit notes as returns', () => {
    expect(a.revenueByMonth.map((d) => d.label)).toEqual(['Apr 26', 'May 26']);
    expect(a.returnsByMonth).toEqual([{ label: 'May 26', value: 250 }]);
  });
});

describe('stockAnalytics', () => {
  it('sums closing value and counts distinct dealers and items', () => {
    const base = { company_name: 'C', stock_item_name: 's', ho_item_description: 'd' };
    const rows = [
      { ...base, dealer_name: 'A', ho_item_code: 'I1', ho_item_group: 'G', cbamt: '100', cbqty: '5' },
      { ...base, dealer_name: 'B', ho_item_code: 'I1', ho_item_group: 'G', cbamt: 50, cbqty: 1 },
    ] as unknown as ClosingItem[];
    const s = stockAnalytics(rows);
    expect(s.totalValue).toBe(150);
    expect(s.totalQty).toBe(6);
    expect(s.dealerCount).toBe(2);
    expect(s.itemCount).toBe(1);
    expect(s.groupsByValue).toEqual([{ label: 'G', value: 150 }]);
  });
});
