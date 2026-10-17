import { api, ApiError, unwrap } from './client';
import type {
  ApiEnvelope,
  ClosingItem,
  ClosingQuery,
  DashboardStats,
  FilterDropdowns,
  LoginData,
  MappedClosingQuery,
  MappedSalesQuery,
  OrganizationModule,
  Paged,
  Pagination,
  SalesItem,
  SalesQuery,
  User,
} from './types';

export const authApi = {
  login: async (email: string, password: string) =>
    unwrap((await api.post<ApiEnvelope<LoginData>>('auth/login', { email, password }, { skipAuthRefresh: true })).data),

  forgotPassword: async (email: string) =>
    (await api.post<ApiEnvelope<{ message: string }>>('auth/forgot-password', { email }, { skipAuthRefresh: true })).data,

  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) =>
    (
      await api.put<ApiEnvelope<{ message: string }>>(
        'auth/change-password',
        { currentPassword, newPassword, confirmPassword },
        { skipAuthRefresh: true },
      )
    ).data,

  updateProfile: async (payload: { firstName?: string; phone?: string }) =>
    unwrap((await api.put<ApiEnvelope<{ user: User }>>('auth/profile', payload)).data),
};

export const dashboardApi = {
  stats: async () => unwrap((await api.get<ApiEnvelope<DashboardStats>>('dashboard/stats')).data),
};

export const modulesApi = {
  forOrganization: async (organizationId: number): Promise<OrganizationModule[]> => {
    const data = unwrap(
      (await api.get<ApiEnvelope<{ modules: OrganizationModule[] }>>(`modules/organization/${organizationId}`)).data,
    );
    return data?.modules ?? [];
  },
};

/** Drop empty filter arrays: the API reads "missing" as "all". */
function compact<T extends object>(q: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.keys(q) as Array<keyof T>).forEach((k) => {
    const v = q[k];
    if (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== '') out[k] = v;
  });
  return out;
}

/** The closing-balance endpoints put items and pagination at the top level. */
interface ClosingEnvelope {
  success?: boolean;
  message?: string;
  data: ClosingItem[];
  pagination: Pagination;
}

function unwrapClosing(body: ClosingEnvelope): Paged<ClosingItem> {
  if (body?.success === false) throw new ApiError(body.message || 'Request failed');
  return {
    items: body?.data ?? [],
    pagination: body?.pagination ?? { total: 0, page: 1, limit: 0, totalPages: 0 },
  };
}

export const reportsApi = {
  filters: async (orgId?: number) =>
    unwrap(
      (await api.get<ApiEnvelope<FilterDropdowns>>('ssv-reports/filters/dropdowns', { tenant: true, tenantId: orgId })).data,
    ),

  sales: async (q: SalesQuery, page: number, limit: number, orgId?: number) =>
    unwrap(
      (await api.post<ApiEnvelope<Paged<SalesItem>>>('ssv-reports/sales', { ...compact(q), page, limit }, { tenant: true, tenantId: orgId }))
        .data,
    ),

  mappedSales: async (q: MappedSalesQuery, page: number, limit: number, orgId?: number) =>
    unwrap(
      (
        await api.post<ApiEnvelope<Paged<SalesItem>>>(
          'ssv-reports/mapped-sales',
          { ...compact(q), page, limit },
          { tenant: true, tenantId: orgId },
        )
      ).data,
    ),

  closing: async (q: ClosingQuery, page: number, limit: number, orgId?: number) =>
    unwrapClosing(
      (await api.post<ClosingEnvelope>('ssv-reports/item-closing-balance/all', { ...compact(q), page, limit }, { tenant: true, tenantId: orgId }))
        .data,
    ),

  mappedClosing: async (q: MappedClosingQuery, page: number, limit: number, orgId?: number) =>
    unwrapClosing(
      (
        await api.post<ClosingEnvelope>(
          'ssv-reports/item-closing-balance/mapped',
          { ...compact(q), page, limit },
          { tenant: true, tenantId: orgId },
        )
      ).data,
    ),
};
