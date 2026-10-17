import { dashboardTiles } from '../src/screens/dashboard/tiles';
import type { DashboardStats } from '../src/api/types';

const stats: DashboardStats = {
  role: 'OWNER',
  totalUsers: 12,
  newUsersLast30Days: 3,
  totalOrganizations: 2,
  newOrganizationsLast30Days: 0,
  totalModules: 7,
  activeTallyConnections: 4,
  activeUsersLast24Hours: 5,
  lastLoginAt: null,
};

describe('dashboardTiles (same cards as TallyDex-FE DashboardPage)', () => {
  it('OWNER', () => {
    expect(dashboardTiles('OWNER', stats).map((t) => [t.label, t.value, t.badge])).toEqual([
      ['My Users', '12', '+3 in 30 days'],
      ['Organizations', '2', undefined],
      ['Allocated Modules', '7', undefined],
      ['Users Logged In', '5', 'Last 24h'],
    ]);
  });

  it('SUPEROWNER', () => {
    expect(dashboardTiles('SUPEROWNER', stats).map((t) => t.label)).toEqual([
      'Total Users',
      'Organizations',
      'Active Modules',
      'Users Logged In',
    ]);
  });

  it('USER', () => {
    expect(dashboardTiles('USER', { ...stats, lastLoginAt: '2026-10-14T09:05:00' }).map((t) => [t.label, t.value])).toEqual([
      ['Organizations', '2'],
      ['My Modules', '7'],
      ['Active Tally Connections', '4'],
      ['Last Login', '14 Oct, 09:05'],
    ]);
  });

  it('shows a dash before stats arrive', () => {
    expect(dashboardTiles('USER', undefined)[0]).toMatchObject({ label: 'Organizations', value: '—' });
  });
});
