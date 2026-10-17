import dayjs from 'dayjs';

export const toNum = (v: unknown): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
};

const inr2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const qtyFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 });

/** ₹ 1,23,456.00 */
export const formatINR = (v: unknown) => `₹ ${inr2.format(toNum(v))}`;

/** ₹ 12.4 L / ₹ 3.2 Cr / ₹ 45,600 for tiles and chart labels. */
export const formatINRShort = (v: unknown) => {
  const n = toNum(v);
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹ ${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹ ${(n / 1e5).toFixed(2)} L`;
  return `₹ ${inr0.format(n)}`;
};

export const formatCount = (v: unknown) => inr0.format(toNum(v));
export const formatQty = (v: unknown) => qtyFmt.format(toNum(v));

/** 14 Oct 2026 */
export const formatDate = (v?: string | null) => (v ? dayjs(v).format('DD MMM YYYY') : '—');
/** 14 Oct, 15:40 */
export const formatDateTime = (v?: string | null) => (v ? dayjs(v).format('DD MMM, HH:mm') : '—');
/** API date: 2026-10-14 */
export const apiDate = (d: dayjs.Dayjs) => d.format('YYYY-MM-DD');

export const dash = (v?: string | null) => (v && String(v).trim() ? String(v) : '—');
