import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs, { type Dayjs } from 'dayjs';
import { create } from 'zustand';
import { toApiError } from '../api/client';
import { reportAccess } from '../constants/modules';
import { wipeAllData } from '../db/database';
import { localData, type SyncInfo } from '../db/localData';
import { runSync, SyncCancelled, type SyncProgress } from '../sync/syncEngine';
import { log } from '../utils/log';
import { useSession } from './sessionStore';

/** Data older than this is refreshed automatically (when auto-update is on). */
export const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const AUTO_UPDATE_KEY = 'tdx.autoUpdate';

type Trigger = 'first' | 'auto' | 'manual';

interface SyncState {
  /** Organization the info below belongs to (0 = no organization, SUPEROWNER). */
  orgId: number | null;
  info: SyncInfo | null;
  running: boolean;
  trigger: Trigger | null;
  progress: SyncProgress | null;
  lastError: string | null;
  /** Bumped whenever local data changes; part of every local query key. */
  version: number;
  autoUpdate: boolean;
  updateSheetOpen: boolean;

  refreshInfo: () => Promise<void>;
  start: (range: { from: Dayjs; to: Dayjs } | null, trigger: Trigger) => Promise<boolean>;
  cancel: () => void;
  setAutoUpdate: (on: boolean) => void;
  setUpdateSheetOpen: (open: boolean) => void;
}

let cancelToken = { cancelled: false };
/** The download in flight; a new one starts only after it has fully unwound. */
let currentRun: Promise<unknown> | null = null;

const currentOrgId = () => useSession.getState().selectedOrg?.id ?? 0;

/** The sales period a download uses when the user didn't pick one. */
export function defaultSalesRange(info: SyncInfo | null, today = dayjs()): { from: Dayjs; to: Dayjs } {
  const run = info?.run;
  if (!run?.sales_from || !run.sales_to) return { from: today.startOf('month'), to: today };
  const from = dayjs(run.sales_from);
  const to = dayjs(run.sales_to);
  // A period that ran up to the day it was downloaded keeps running up to today.
  const endedOnSyncDay = run.finished_at ? to.isSame(dayjs(run.finished_at), 'day') : false;
  return { from, to: endedOnSyncDay ? today : to };
}

/** What to do on open / foreground / organization change. */
export function autoSyncDecision(info: SyncInfo | null, autoUpdate: boolean, now = Date.now()): Trigger | null {
  if (!info?.hasData) return 'first';
  if (!autoUpdate) return null;
  const last = info.run?.finished_at ? Date.parse(info.run.finished_at) : 0;
  return now - last > STALE_AFTER_MS ? 'auto' : null;
}

export const useSync = create<SyncState>((set, get) => ({
  orgId: null,
  info: null,
  running: false,
  trigger: null,
  progress: null,
  lastError: null,
  version: 0,
  autoUpdate: true,
  updateSheetOpen: false,

  refreshInfo: async () => {
    const orgId = currentOrgId();
    try {
      const info = await localData.syncInfo(orgId);
      if (currentOrgId() === orgId) set({ orgId, info });
    } catch (e) {
      log.warn('sync info failed', e);
    }
  },

  start: async (range, trigger) => {
    const session = useSession.getState();
    const user = session.user;
    if (!user || session.status !== 'signedIn') return false;
    if (get().running) {
      if (trigger !== 'manual') return false;
      get().cancel();
    }
    // A cancelled run still cleans up its staging rows; never overlap with it.
    if (currentRun) await currentRun.catch(() => {});
    const orgId = currentOrgId();
    const r = range ?? defaultSalesRange(get().info);
    const token = { cancelled: false };
    cancelToken = token;
    set({ running: true, trigger, progress: null, lastError: null });
    try {
      currentRun = runSync({
        orgId,
        userId: user.id,
        access: reportAccess(user.role, session.modules),
        salesFrom: r.from,
        salesTo: r.to,
        trigger,
        isCancelled: () => token.cancelled,
        onProgress: (p) => {
          if (!token.cancelled) set({ progress: p });
        },
      });
      await currentRun;
      if (token.cancelled) return false;
      set((s) => ({ running: false, progress: null, version: s.version + 1 }));
      await get().refreshInfo();
      return true;
    } catch (e) {
      if (e instanceof SyncCancelled || token.cancelled) return false;
      const msg = toApiError(e).message;
      log.warn('sync failed', msg);
      set({ running: false, progress: null, lastError: msg });
      await get().refreshInfo();
      return false;
    } finally {
      if (cancelToken === token) currentRun = null;
    }
  },

  cancel: () => {
    cancelToken.cancelled = true;
    set({ running: false, progress: null, trigger: null });
  },

  setAutoUpdate: (on) => {
    set({ autoUpdate: on });
    void AsyncStorage.setItem(AUTO_UPDATE_KEY, on ? '1' : '0').catch(() => {});
    if (on) void maybeAutoSync();
  },

  setUpdateSheetOpen: (open) => set({ updateSheetOpen: open }),
}));

/** Downloads in the background when there's no data yet, or it's over a day old. */
export async function maybeAutoSync() {
  const s = useSession.getState();
  if (s.status !== 'signedIn' || s.mustChangePassword) return;
  // Wait for permissions: they decide which reports get downloaded.
  if (s.modules === null) return;
  await useSync.getState().refreshInfo();
  const sync = useSync.getState();
  if (sync.running) return;
  const decision = autoSyncDecision(sync.info, sync.autoUpdate);
  if (decision) void sync.start(null, decision);
}

let started = false;

/** Wires the background download to sign-in, organization and app-foreground changes. Call once. */
export function startSyncController() {
  if (started) return;
  started = true;

  void AsyncStorage.getItem(AUTO_UPDATE_KEY)
    .then((v) => {
      if (v === '0') useSync.setState({ autoUpdate: false });
    })
    .catch(() => {});

  let prev = { status: '', orgId: -1, modulesReady: false, mustChangePassword: false };
  useSession.subscribe((s) => {
    const next = { status: s.status, orgId: s.selectedOrg?.id ?? 0, modulesReady: s.modules !== null, mustChangePassword: s.mustChangePassword };
    const changed =
      next.status !== prev.status ||
      next.orgId !== prev.orgId ||
      next.modulesReady !== prev.modulesReady ||
      next.mustChangePassword !== prev.mustChangePassword;
    const orgChanged = next.orgId !== prev.orgId && prev.orgId !== -1;
    const signedOut = prev.status === 'signedIn' && next.status === 'signedOut';
    prev = next;
    if (!changed) return;

    if (signedOut) {
      useSync.getState().cancel();
      useSync.setState({ info: null, orgId: null, lastError: null, version: useSync.getState().version + 1 });
      void wipeAllData().catch((e) => log.error('wipe failed', e));
      return;
    }
    if (orgChanged) {
      // The running download belongs to the organization the user just left.
      useSync.getState().cancel();
      useSync.setState({ info: null, lastError: null });
    }
    void maybeAutoSync();
  });

  AppState.addEventListener('change', (st) => {
    if (st === 'active') void maybeAutoSync();
  });
  // While the app stays open, look again every 30 minutes.
  setInterval(() => void maybeAutoSync(), 30 * 60 * 1000);
}
