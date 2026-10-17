import type { OrganizationModule, Role } from '../api/types';
import { FAMILY_LABEL, reportAccess, VIEW_LABEL, type ReportView } from '../constants/modules';
import type { TabName } from './types';

export interface MenuLeaf {
  id: string;
  label: string;
  tab: TabName;
  view?: ReportView;
}

export interface MenuGroup {
  id: string;
  label: string;
  icon: 'dashboard' | 'sales' | 'stock';
  /** A group with no children is a direct link. */
  tab?: TabName;
  children: MenuLeaf[];
}

/**
 * The sidebar tree for draft 1 (Dashboard + reports). Port of the reports part
 * of Layout.getMenuItems(), flattened to two levels (decision D7). The only
 * place that decides what a role and its modules unlock.
 */
export function buildMenu(role: Role | undefined, modules: OrganizationModule[] | null): MenuGroup[] {
  const access = reportAccess(role, modules);
  const menu: MenuGroup[] = [{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard', tab: 'Home', children: [] }];
  if (access.sales.length) {
    menu.push({
      id: 'sales',
      label: FAMILY_LABEL.sales,
      icon: 'sales',
      children: access.sales.map((v) => ({ id: `sales-${v}`, label: VIEW_LABEL[v], tab: 'Sales', view: v })),
    });
  }
  if (access.stock.length) {
    menu.push({
      id: 'stock',
      label: FAMILY_LABEL.stock,
      icon: 'stock',
      children: access.stock.map((v) => ({ id: `stock-${v}`, label: VIEW_LABEL[v], tab: 'Stock', view: v })),
    });
  }
  return menu;
}
