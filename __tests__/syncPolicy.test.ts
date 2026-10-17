import dayjs from 'dayjs';

jest.mock('../src/store/sessionStore', () => ({ useSession: { getState: () => ({}), subscribe: () => () => {} } }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}) }));

const { autoSyncDecision, defaultSalesRange, STALE_AFTER_MS } = require('../src/store/syncStore');

const info = (finished: string | null, from: string | null = null, to: string | null = null) => ({
  hasData: !!finished,
  datasets: {},
  run: finished ? { finished_at: finished, sales_from: from, sales_to: to, status: 'ok' } : null,
});

describe('when to download', () => {
  const now = Date.parse('2026-10-16T10:00:00Z');

  it('downloads in the background when there is no data yet', () => {
    expect(autoSyncDecision(info(null), true, now)).toBe('first');
    expect(autoSyncDecision(null, false, now)).toBe('first');
  });

  it('updates automatically once the data is over 24 hours old', () => {
    expect(autoSyncDecision(info(new Date(now - STALE_AFTER_MS - 1000).toISOString()), true, now)).toBe('auto');
    expect(autoSyncDecision(info(new Date(now - 60_000).toISOString()), true, now)).toBeNull();
  });

  it('never updates on its own when auto-update is off', () => {
    expect(autoSyncDecision(info(new Date(now - 3 * STALE_AFTER_MS).toISOString()), false, now)).toBeNull();
  });
});

describe('which sales period', () => {
  const today = dayjs('2026-10-16');

  it('starts with this month, as the screens do', () => {
    const r = defaultSalesRange(null, today);
    expect([r.from.format('YYYY-MM-DD'), r.to.format('YYYY-MM-DD')]).toEqual(['2026-10-01', '2026-10-16']);
  });

  it('rolls a period that ended on its download day forward to today', () => {
    const r = defaultSalesRange(info('2026-10-14T09:00:00', '2026-04-01', '2026-10-14') as never, today);
    expect([r.from.format('YYYY-MM-DD'), r.to.format('YYYY-MM-DD')]).toEqual(['2026-04-01', '2026-10-16']);
  });

  it('keeps a past period the user chose as it was', () => {
    const r = defaultSalesRange(info('2026-10-14T09:00:00', '2025-04-01', '2026-03-31') as never, today);
    expect([r.from.format('YYYY-MM-DD'), r.to.format('YYYY-MM-DD')]).toEqual(['2025-04-01', '2026-03-31']);
  });
});
