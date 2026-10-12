import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { AuthUser } from '../types';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('dompola_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    // Don't block admin UI for long if /me is slow.
    const unlock = window.setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 4_000);
    api<AuthUser>('/api/auth/me')
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        // Keep session if login already filled user; only hard-logout when unknown.
        if (cancelled) return;
        setUser((prev) => {
          if (prev) return prev;
          localStorage.removeItem('dompola_token');
          setToken(null);
          return null;
        });
      })
      .finally(() => {
        window.clearTimeout(unlock);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(unlock);
    };
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      logout: () => {
        localStorage.removeItem('dompola_token');
        setToken(null);
        setUser(null);
      },
      login: async (email, password) => {
        const login = email.trim();
        const normalized = login.includes('@') ? login.toLowerCase() : `${login.toLowerCase()}@dompola.ru`;
        const res = await api<{ token: string; user: AuthUser }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: normalized, password }),
        });
        localStorage.setItem('dompola_token', res.token);
        setToken(res.token);
        setUser(res.user);
      },
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}
