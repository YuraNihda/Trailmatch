import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_EXPIRED_EVENT, request } from "../api/client";
import { tokenStore } from "../api/token";
import type { User } from "../api/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(d: { email: string; password: string; full_name: string; phone?: string }): Promise<void>;
  logout(): void;
  refresh(): Promise<void>;
}
const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(!!tokenStore.get());

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) { setUser(null); setLoading(false); return; }
    try { setUser(await request<User>("/users/me")); } catch { setUser(null); } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const onExpired = () => { setUser(null); qc.clear(); };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [qc]);

  const login = useCallback(async (email: string, password: string) => {
    const t = await request<{ access_token: string }>("/auth/login", { method: "POST", body: { email, password } });
    tokenStore.set(t.access_token);
    await refresh();
  }, [refresh]);

  const register = useCallback(async (d: { email: string; password: string; full_name: string; phone?: string }) => {
    await request("/auth/register", { method: "POST", body: { ...d, phone: d.phone || undefined } });
    await login(d.email, d.password);
  }, [login]);

  const logout = useCallback(() => { tokenStore.clear(); setUser(null); qc.clear(); }, [qc]);

  const value = useMemo(() => ({ user, loading, login, register, logout, refresh }), [user, loading, login, register, logout, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
