import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginRequest, logout as logoutRequest, refreshOnce } from '@/lib/api';
import { clearAuthState } from '@/lib/storage';
import type { AuthUser } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: AuthUser | null;
  adminName: string;
  /** Espelha o RBAC do backend: apenas owner e admin alteram estado. */
  canMutate: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    /**
     * Nada sobrevive ao recarregamento no lado do JavaScript — o access token
     * fica so em memoria. Quem restaura a sessao e o cookie httpOnly do refresh
     * token, enviado automaticamente nesta chamada. Sem cookie valido, o
     * servidor responde 401 e caimos na tela de login.
     */
    async function bootstrap() {
      const session = await refreshOnce();

      if (cancelled) {
        return;
      }

      if (session) {
        setUser(session.user);
      } else {
        clearAuthState();
        setUser(null);
      }

      setLoading(false);
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
      canMutate: user?.role === 'owner' || user?.role === 'admin',
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
