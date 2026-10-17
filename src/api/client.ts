import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { session, type Tokens } from './session';
import type { ApiEnvelope, LoginData } from './types';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Send x-organization-id for the selected organization. */
    tenant?: boolean;
    /** Organization for x-organization-id instead of the selected one (background downloads). */
    tenantId?: number;
    /** A 401 here is a real answer (wrong password), not an expired token. */
    skipAuthRefresh?: boolean;
  }
  // Augments axios's own type of the same name.
  // eslint-disable-next-line @typescript-eslint/no-shadow
  interface InternalAxiosRequestConfig {
    _retried?: boolean;
  }
}

/** Every failure the screens see, with the web portal's wording. */
export class ApiError extends Error {
  status?: number;
  isNetwork: boolean;
  isTimeout: boolean;

  constructor(message: string, opts: { status?: number; isNetwork?: boolean; isTimeout?: boolean } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.isNetwork = !!opts.isNetwork;
    this.isTimeout = !!opts.isTimeout;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const e = error as AxiosError<{ message?: string; error?: string }>;
  if (e?.isAxiosError) {
    if (e.code === 'ECONNABORTED' && !e.response) {
      return new ApiError('The request timed out. The server may still be processing it — please check before retrying.', { isTimeout: true });
    }
    if (!e.response) {
      return new ApiError('Network error. Check your internet connection and try again.', { isNetwork: true });
    }
    const msg = e.response.data?.message || e.response.data?.error || `Request failed (${e.response.status})`;
    return new ApiError(msg, { status: e.response.status });
  }
  return new ApiError(error instanceof Error ? error.message : 'Something went wrong.');
}

export const api: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const tokens = session.getTokens();
  if (tokens?.accessToken) config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  if (config.tenant) {
    const orgId = config.tenantId ?? session.getTenantId();
    if (orgId != null) config.headers['x-organization-id'] = String(orgId);
  }
  return config;
});

/** One refresh at a time; requests that 401 meanwhile wait for its result. */
let refreshing: Promise<Tokens> | null = null;

async function refreshTokens(): Promise<Tokens> {
  const current = session.getTokens();
  if (!current?.refreshToken) throw new ApiError('Session expired', { status: 401 });
  // Bare axios: the refresh call must not go through the 401 handler below.
  const res = await axios.post<ApiEnvelope<LoginData>>(
    `${env.apiBaseUrl}auth/refresh-token`,
    { refreshToken: current.refreshToken },
    { timeout: env.apiTimeoutMs, headers: { 'Content-Type': 'application/json' } },
  );
  const data = res.data?.data;
  if (!res.data?.success || !data?.accessToken) throw new ApiError('Session expired', { status: 401 });
  const next: Tokens = { accessToken: data.accessToken, refreshToken: data.refreshToken || current.refreshToken };
  session.setTokens(next);
  session.tokensRefreshed(next);
  return next;
}

export function refreshOnce(): Promise<Tokens> {
  if (!refreshing) {
    refreshing = refreshTokens().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    const is401 = error.response?.status === 401;
    if (is401 && config && !config.skipAuthRefresh && !config._retried && session.getTokens()) {
      config._retried = true;
      try {
        const t = await refreshOnce();
        config.headers.Authorization = `Bearer ${t.accessToken}`;
        return api(config);
      } catch {
        session.expired();
        throw new ApiError('Your session has expired. Please log in again.', { status: 401 });
      }
    }
    throw toApiError(error);
  },
);

/** Unwraps the { success, message, data } envelope, failing on success: false. */
export function unwrap<T>(body: ApiEnvelope<T>): T {
  if (body && body.success === false) throw new ApiError(body.message || 'Request failed');
  return body.data;
}
