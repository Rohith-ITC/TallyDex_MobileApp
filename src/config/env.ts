/**
 * Production API, from the TallyDex Postman environment. For a local backend
 * on the Android emulator use 'http://10.0.2.2:3001/api/v3/' (debug builds
 * would also need cleartext HTTP allowed for that host).
 */
export const env = {
  apiBaseUrl: 'https://tallydex.itcatalystindia.com/api/v3/',
  apiTimeoutMs: 30000,
  appName: 'Tally DEx',
} as const;
