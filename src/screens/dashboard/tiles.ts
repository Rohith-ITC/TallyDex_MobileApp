import dayjs from 'dayjs';
import { Building, Clock, Layers, Link, UserCheck, Users, type LucideIcon } from 'lucide-react-native';
import type { DashboardStats, Role } from '../../api/types';
import { formatCount } from '../../utils/format';

export interface Tile {
  label: string;
  value: string;
  badge?: string;
  icon: LucideIcon;
}

/** The four role cards from TallyDex-FE DashboardPage.tsx, same titles and badges. */
export function dashboardTiles(role: Role | undefined, s: DashboardStats | undefined): Tile[] {
  const count = (v?: number) => (v === undefined ? '—' : formatCount(v));
  const in30 = (v?: number) => (v ? `+${v} in 30 days` : undefined);
  if (role === 'SUPEROWNER' || role === 'OWNER') {
    return [
      { label: role === 'OWNER' ? 'My Users' : 'Total Users', value: count(s?.totalUsers), badge: in30(s?.newUsersLast30Days), icon: Users },
      { label: 'Organizations', value: count(s?.totalOrganizations), badge: in30(s?.newOrganizationsLast30Days), icon: Building },
      { label: role === 'OWNER' ? 'Allocated Modules' : 'Active Modules', value: count(s?.totalModules), icon: Layers },
      { label: 'Users Logged In', value: count(s?.activeUsersLast24Hours), badge: 'Last 24h', icon: UserCheck },
    ];
  }
  return [
    { label: 'Organizations', value: count(s?.totalOrganizations), icon: Building },
    { label: 'My Modules', value: count(s?.totalModules), icon: Layers },
    { label: 'Active Tally Connections', value: count(s?.activeTallyConnections), icon: Link },
    { label: 'Last Login', value: s?.lastLoginAt ? dayjs(s.lastLoginAt).format('DD MMM, HH:mm') : '—', icon: Clock },
  ];
}
