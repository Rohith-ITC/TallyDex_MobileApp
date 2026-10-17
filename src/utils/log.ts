/** The one place that may call console. Debug output is dropped in release builds. */
export const log = {
  debug: (...args: unknown[]) => {
    if (__DEV__) console.log('[tdx]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (__DEV__) console.warn('[tdx]', ...args);
  },
  error: (...args: unknown[]) => console.error('[tdx]', ...args),
};
