// MVP: sessionStorage (cleared on tab close). Trade-off documented in README: XSS-exposed,
// so we never render raw HTML and ship a strict CSP. httpOnly cookie is a post-MVP backend change.
const KEY = "tm_token";
export const tokenStore = {
  get(): string | null { try { return sessionStorage.getItem(KEY); } catch { return null; } },
  set(t: string) { try { sessionStorage.setItem(KEY, t); } catch { /* storage unavailable */ } },
  clear() { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } },
};
