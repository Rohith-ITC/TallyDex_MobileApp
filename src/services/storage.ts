import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import type { Tokens } from '../api/session';
import type { Organization, OrganizationModule, User } from '../api/types';
import { log } from '../utils/log';

const TOKEN_SERVICE = 'com.itcatalyst.tallydex.session';

// Never rename these keys: users upgrade in place.
const KEYS = {
  user: 'tdx.user',
  organizations: 'tdx.organizations',
  selectedOrgId: 'tdx.selectedOrgId',
  modulesPrefix: 'tdx.orgModules.',
} as const;

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (e) {
    log.warn('storage read failed', key, e);
    return null;
  }
}

async function writeJson(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    log.warn('storage write failed', key, e);
  }
}

export const storage = {
  /** Tokens go to the Android Keystore-backed keychain, never AsyncStorage. */
  saveTokens: async (t: Tokens) => {
    await Keychain.setGenericPassword('tokens', JSON.stringify(t), { service: TOKEN_SERVICE });
  },
  loadTokens: async (): Promise<Tokens | null> => {
    try {
      const res = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });
      return res ? (JSON.parse(res.password) as Tokens) : null;
    } catch (e) {
      log.warn('keychain read failed', e);
      return null;
    }
  },

  saveUser: (u: User) => writeJson(KEYS.user, u),
  loadUser: () => readJson<User>(KEYS.user),
  saveOrganizations: (o: Organization[]) => writeJson(KEYS.organizations, o),
  loadOrganizations: async () => (await readJson<Organization[]>(KEYS.organizations)) ?? [],
  saveSelectedOrgId: (id: number) => writeJson(KEYS.selectedOrgId, id),
  loadSelectedOrgId: () => readJson<number>(KEYS.selectedOrgId),
  saveModules: (orgId: number, m: OrganizationModule[]) => writeJson(KEYS.modulesPrefix + orgId, m),
  loadModules: (orgId: number) => readJson<OrganizationModule[]>(KEYS.modulesPrefix + orgId),

  clearSession: async () => {
    try {
      await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
    } catch (e) {
      log.warn('keychain reset failed', e);
    }
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith('tdx.')));
  },
};
