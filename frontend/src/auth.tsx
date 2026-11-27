import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, json } from './api';
import type { User } from './types';
type AuthContextValue = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; register: (name: string, email: string, password: string) => Promise<void>; logout: () => Promise<void>; refresh: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { setUser((await api<{ user: User }>('/auth/me')).user); }
    catch { setUser(null); }
  }, []);
  useEffect(() => { void refresh().finally(() => setLoading(false)); }, [refresh]);
  const login = useCallback(async (email: string, password: string) => { const r = await api<{ user: User }>('/auth/login', json('POST', { email, password })); setUser(r.user); }, []);
  const register = useCallback(async (name: string, email: string, password: string) => { const r = await api<{ user: User }>('/auth/register', json('POST', { name, email, password })); setUser(r.user); }, []);
  const logout = useCallback(async () => { try { await api('/auth/logout', json('POST')); } finally { setUser(null); } }, []);
  const value = useMemo(() => ({ user, loading, login, register, logout, refresh }), [user, loading, login, register, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth requires AuthProvider'); return value; }
