import { hasModule, reportAccess } from '../src/constants/modules';
import { buildMenu } from '../src/navigation/menu';
import type { OrganizationModule } from '../src/api/types';

const mods = (...codes: string[]): OrganizationModule[] => codes.map((code) => ({ code, status: 'ACTIVE' }));
const ALL = mods('SecondarySales', 'SSV_SalesAnalytics', 'ClosingStock', 'ClosingStock_Analytics');

describe('module gating (deny by default)', () => {
  it('denies everything while modules are not loaded', () => {
    expect(hasModule(null, 'SecondarySales')).toBe(false);
    expect(reportAccess('OWNER', null)).toEqual({ sales: [], stock: [] });
  });

  it('ignores modules that are not ACTIVE', () => {
    expect(hasModule([{ code: 'SecondarySales', status: 'INACTIVE' }], 'SecondarySales')).toBe(false);
  });

  it('gives OWNER and USER the views their modules allow', () => {
    for (const role of ['OWNER', 'USER'] as const) {
      expect(reportAccess(role, ALL)).toEqual({
        sales: ['all', 'mapped', 'analytics'],
        stock: ['all', 'mapped', 'analytics'],
      });
    }
    expect(reportAccess('USER', mods('SecondarySales'))).toEqual({ sales: ['all', 'mapped'], stock: [] });
    expect(reportAccess('USER', mods('ClosingStock_Analytics'))).toEqual({ sales: [], stock: ['analytics'] });
  });

  it('gives SUPEROWNER no reports (connected mode is not in draft 1, as in Layout.tsx)', () => {
    expect(reportAccess('SUPEROWNER', ALL)).toEqual({ sales: [], stock: [] });
  });
});

describe('buildMenu', () => {
  it('always starts with Dashboard', () => {
    expect(buildMenu('SUPEROWNER', [])).toEqual([
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', tab: 'Home', children: [] },
    ]);
  });

  it('flattens Reports into Sales and Closing Stock groups, two levels deep', () => {
    const menu = buildMenu('OWNER', ALL);
    expect(menu.map((g) => g.label)).toEqual(['Dashboard', 'Sales', 'Closing Stock']);
    expect(menu[1].children.map((c) => [c.label, c.tab, c.view])).toEqual([
      ['All', 'Sales', 'all'],
      ['Mapped', 'Sales', 'mapped'],
      ['Analytics', 'Sales', 'analytics'],
    ]);
    expect(menu[2].children.map((c) => c.tab)).toEqual(['Stock', 'Stock', 'Stock']);
  });

  it('drops a group whose modules are all off', () => {
    expect(buildMenu('USER', mods('ClosingStock')).map((g) => g.id)).toEqual(['dashboard', 'stock']);
  });
});
