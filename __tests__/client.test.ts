import axios, { type InternalAxiosRequestConfig } from 'axios';
import { api, ApiError } from '../src/api/client';
import { session } from '../src/api/session';

function httpError(config: InternalAxiosRequestConfig, status: number, message: string) {
  return Object.assign(new Error(String(status)), {
    isAxiosError: true,
    config,
    response: { status, data: { message }, headers: {}, config, statusText: '' },
  });
}

/** Fake transport: 401 for the stale token, 200 otherwise; change-password always 401s. */
function installAdapter() {
  const seen: Array<{ url?: string; auth?: string; org?: string }> = [];
  api.defaults.adapter = async (config) => {
    const auth = String(config.headers?.Authorization ?? '');
    seen.push({ url: config.url, auth, org: config.headers?.['x-organization-id'] as string | undefined });
    if (config.url?.includes('change-password')) throw httpError(config, 401, 'Current password is incorrect');
    if (auth === 'Bearer old') throw httpError(config, 401, 'expired');
    return { data: { success: true, data: { ok: config.url } }, status: 200, statusText: 'OK', headers: {}, config };
  };
  return seen;
}

describe('api client', () => {
  let postSpy: jest.SpyInstance;

  beforeEach(() => {
    session.setTokens({ accessToken: 'old', refreshToken: 'r1' });
    session.setTenantId(7);
    session.setOnTokensRefreshed(null);
    session.setOnSessionExpired(null);
    postSpy = jest.spyOn(axios, 'post').mockResolvedValue({
      data: { success: true, data: { accessToken: 'new', refreshToken: 'r2' } },
    });
  });
  afterEach(() => postSpy.mockRestore());

  it('refreshes once for parallel 401s, then replays every request with the new token', async () => {
    const seen = installAdapter();
    const saved = jest.fn();
    session.setOnTokensRefreshed(saved);
    const [a, b] = await Promise.all([api.get('dashboard/stats'), api.get('auth/activity')]);
    expect(a.data.data.ok).toBe('dashboard/stats');
    expect(b.data.data.ok).toBe('auth/activity');
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy.mock.calls[0][1]).toEqual({ refreshToken: 'r1' });
    expect(session.getTokens()).toEqual({ accessToken: 'new', refreshToken: 'r2' });
    expect(saved).toHaveBeenCalledWith({ accessToken: 'new', refreshToken: 'r2' });
    expect(seen.filter((s) => s.auth === 'Bearer new')).toHaveLength(2);
  });

  it('expires the session when the refresh token is rejected', async () => {
    installAdapter();
    postSpy.mockRejectedValueOnce(new Error('refresh rejected'));
    const expired = jest.fn();
    session.setOnSessionExpired(expired);
    await expect(api.get('dashboard/stats')).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it('treats a 401 from change-password as a wrong password, not an expired session', async () => {
    installAdapter();
    session.setTokens({ accessToken: 'fresh', refreshToken: 'r1' });
    const expired = jest.fn();
    session.setOnSessionExpired(expired);
    const err = await api.put('auth/change-password', {}, { skipAuthRefresh: true }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe('Current password is incorrect');
    expect(postSpy).not.toHaveBeenCalled();
    expect(expired).not.toHaveBeenCalled();
  });

  it('sends x-organization-id only on tenant requests', async () => {
    const seen = installAdapter();
    session.setTokens({ accessToken: 'fresh', refreshToken: 'r1' });
    await api.get('dashboard/stats');
    await api.post('ssv-reports/sales', {}, { tenant: true });
    expect(seen[0].org).toBeUndefined();
    expect(seen[1].org).toBe('7');
  });

  it('reports a network failure with the web wording', async () => {
    api.defaults.adapter = async (config) => {
      throw Object.assign(new Error('Network Error'), { isAxiosError: true, config });
    };
    session.setTokens({ accessToken: 'fresh', refreshToken: 'r1' });
    await expect(api.get('dashboard/stats')).rejects.toMatchObject({ isNetwork: true });
  });
});
