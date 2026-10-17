import type { OrganizationModule, Role } from '../api/types';

/** Module codes from TallyDex-FE/src/App.tsx (only the report ones are used in draft 1). */
export const MODULES = {
  secondarySales: 'SecondarySales',
  salesAnalytics: 'SSV_SalesAnalytics',
  closingStock: 'ClosingStock',
  closingStockAnalytics: 'ClosingStock_Analytics',
} as const;

export type ModuleCode = (typeof MODULES)[keyof typeof MODULES];

/** Deny by default: no answer yet means no access. */
export function hasModule(modules: OrganizationModule[] | null, code: string): boolean {
  return !!modules?.some((m) => m.code === code && m.status === 'ACTIVE');
}

export type ReportView = 'all' | 'mapped' | 'analytics';
export type ReportFamily = 'sales' | 'stock';

export interface ReportAccess {
  sales: ReportView[];
  stock: ReportView[];
}

/**
 * Which report views a user can open. Mirrors Layout.getMenuItems(): a
 * SUPEROWNER sees reports only when connected to an organization, which
 * draft 1 doesn't support, so SUPEROWNER gets none.
 */
export function reportAccess(role: Role | undefined, modules: OrganizationModule[] | null): ReportAccess {
  if (!role || role === 'SUPEROWNER') return { sales: [], stock: [] };
  const sales: ReportView[] = [];
  const stock: ReportView[] = [];
  if (hasModule(modules, MODULES.secondarySales)) sales.push('all', 'mapped');
  if (hasModule(modules, MODULES.salesAnalytics)) sales.push('analytics');
  if (hasModule(modules, MODULES.closingStock)) stock.push('all', 'mapped');
  if (hasModule(modules, MODULES.closingStockAnalytics)) stock.push('analytics');
  return { sales, stock };
}

export const VIEW_LABEL: Record<ReportView, string> = { all: 'All', mapped: 'Mapped', analytics: 'Analytics' };
export const FAMILY_LABEL: Record<ReportFamily, string> = { sales: 'Sales', stock: 'Closing Stock' };
