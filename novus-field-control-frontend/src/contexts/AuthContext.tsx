import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, getStoredUser, login as loginRequest, logout as logoutRequest } from '@/lib/api';
import { clearAuthState, readAuthState } from '@/lib/storage';
import type { AuthUser } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: AuthUser | null;
  adminName: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(Boolean(readAuthState()));

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!readAuthState()) {
        setLoading(false);
        return;
      }

      try {
        const nextUser = await getCurrentUser();
        if (!cancelled) {
          setUser(nextUser);
        }
      } catch {
        if (!cancelled) {
          clearAuthState();
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: !!user,
      loading,
      user,
      adminName: user?.fullName || user?.email || 'Administrador',
      async login(email: string, password: string) {
        const response = await loginRequest(email, password);
        setUser(response.user);
      },
      async logout() {
        await logoutRequest();
        setUser(null);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
