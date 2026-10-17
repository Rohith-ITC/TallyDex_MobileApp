/**
 * In-memory session the API client reads on every request. Kept apart from the
 * stores so the client never imports them (no import cycles).
 */
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

let tokens: Tokens | null = null;
let tenantId: number | null = null;
let onTokensRefreshed: ((t: Tokens) => void) | null = null;
let onSessionExpired: (() => void) | null = null;

export const session = {
  getTokens: () => tokens,
  setTokens: (t: Tokens | null) => {
    tokens = t;
  },
  getTenantId: () => tenantId,
  setTenantId: (id: number | null) => {
    tenantId = id;
  },
  /** Called by the client after a successful silent refresh (to persist them). */
  setOnTokensRefreshed: (fn: ((t: Tokens) => void) | null) => {
    onTokensRefreshed = fn;
  },
  tokensRefreshed: (t: Tokens) => onTokensRefreshed?.(t),
  /** Called by the client when the refresh token is rejected. */
  setOnSessionExpired: (fn: (() => void) | null) => {
    onSessionExpired = fn;
  },
  expired: () => onSessionExpired?.(),
};
