import { create } from 'zustand';
import { authApi, modulesApi } from '../api/endpoints';
import { session } from '../api/session';
import type { Organization, OrganizationModule, User } from '../api/types';
import { storage } from '../services/storage';
import { log } from '../utils/log';
import { queryClient } from './queryClient';

type Status = 'restoring' | 'signedOut' | 'signedIn';

interface SessionState {
  status: Status;
  user: User | null;
  /** First login: the user must set a password before reaching the app. */
  mustChangePassword: boolean;
  organizations: Organization[];
  selectedOrg: Organization | null;
  /** null until loaded; menus deny everything gated while null. */
  modules: OrganizationModule[] | null;
  modulesError: boolean;

  restore: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectOrg: (org: Organization) => Promise<void>;
  loadModules: () => Promise<void>;
  passwordSet: () => void;
  setUser: (u: User) => void;
}

const signedOutState = {
  status: 'signedOut' as const,
  user: null,
  mustChangePassword: false,
  organizations: [],
  selectedOrg: null,
  modules: null,
  modulesError: false,
};

/** Only OWNER and USER have organization modules; the web skips the call for SUPEROWNER. */
const usesOrgModules = (u: User | null) => u?.role === 'OWNER' || u?.role === 'USER';

export const useSession = create<SessionState>((set, get) => ({
  ...signedOutState,
  status: 'restoring',

  restore: async () => {
    const [tokens, user] = await Promise.all([storage.loadTokens(), storage.loadUser()]);
    if (!tokens || !user) {
      set({ ...signedOutState });
      return;
    }
    session.setTokens(tokens);
    const organizations = await storage.loadOrganizations();
    const savedId = await storage.loadSelectedOrgId();
    const selectedOrg = organizations.find((o) => o.id === savedId) ?? organizations[0] ?? null;
    session.setTenantId(selectedOrg?.id ?? null);
    const cachedModules = selectedOrg ? await storage.loadModules(selectedOrg.id) : null;
    set({
      status: 'signedIn',
      user,
      mustChangePassword: !!user.isFirstLogin,
      organizations,
      selectedOrg,
      modules: cachedModules,
      modulesError: false,
    });
    // Refresh in the background; the cached copy shows the menu meanwhile.
    void get().loadModules();
  },

  login: async (email, password) => {
    const data = await authApi.login(email.trim(), password);
    const tokens = { accessToken: data.accessToken, refreshToken: data.refreshToken };
    session.setTokens(tokens);
    const organizations = data.organizations ?? [];
    const selectedOrg = organizations[0] ?? null;
    session.setTenantId(selectedOrg?.id ?? null);
    await Promise.all([
      storage.saveTokens(tokens),
      storage.saveUser(data.user),
      storage.saveOrganizations(organizations),
      selectedOrg ? storage.saveSelectedOrgId(selectedOrg.id) : Promise.resolve(),
    ]);
    set({
      status: 'signedIn',
      user: data.user,
      mustChangePassword: !!data.user.isFirstLogin,
      organizations,
      selectedOrg,
      modules: null,
      modulesError: false,
    });
    // As on the web: a failed module fetch never blocks the login.
    await get().loadModules();
  },

  logout: async () => {
    session.setTokens(null);
    session.setTenantId(null);
    queryClient.clear();
    set({ ...signedOutState });
    await storage.clearSession();
  },

  selectOrg: async (org) => {
    if (get().selectedOrg?.id === org.id) return;
    session.setTenantId(org.id);
    queryClient.clear();
    const cached = await storage.loadModules(org.id);
    set({ selectedOrg: org, modules: cached, modulesError: false });
    await storage.saveSelectedOrgId(org.id);
    await get().loadModules();
  },

  loadModules: async () => {
    const { user, selectedOrg } = get();
    if (!usesOrgModules(user) || !selectedOrg) {
      set({ modules: [], modulesError: false });
      return;
    }
    try {
      const modules = await modulesApi.forOrganization(selectedOrg.id);
      // Ignore a late answer for an organization the user has already left.
      if (get().selectedOrg?.id !== selectedOrg.id) return;
      set({ modules, modulesError: false });
      await storage.saveModules(selectedOrg.id, modules);
    } catch (e) {
      log.warn('module fetch failed', e);
      if (get().selectedOrg?.id === selectedOrg.id) set({ modulesError: true });
    }
  },

  passwordSet: () => {
    const user = get().user;
    if (!user) return;
    const next = { ...user, isFirstLogin: false };
    set({ user: next, mustChangePassword: false });
    void storage.saveUser(next);
  },

  setUser: (u) => {
    set({ user: u });
    void storage.saveUser(u);
  },
}));

// The API client calls these; wired once at import time.
session.setOnTokensRefreshed((t) => {
  void storage.saveTokens(t);
});
session.setOnSessionExpired(() => {
  void useSession.getState().logout();
});
