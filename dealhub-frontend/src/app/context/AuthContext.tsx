import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { UserProfile, UserRole } from "../types";
import { me, login as apiLogin, logout as apiLogout } from "../api/authApi";
import { getAuthToken, setAuthToken } from "../api/http";
import type { LoginRequest } from "../api/contracts";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;

  refreshUser: (opts?: { silent?: boolean }) => Promise<void>;
  setUser: (user: UserProfile | null) => void;

  login: (req: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);

    try {
      const token = getAuthToken();

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const profile = (await me()) as unknown as UserProfile;
      setUser(profile);
    } catch (e) {
      setUser(null);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (req: LoginRequest) => {
    setLoading(true);
    try {
      await apiLogin(req);
      await refreshUser({ silent: true });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const token = getAuthToken();
    const isAuthenticated = !!token && !!user;
    return {
      user,
      loading,
      isAuthenticated,
      refreshUser,
      setUser,
      login,
      logout,
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function hasRole(user: UserProfile | null, allowed: UserRole[]) {
  if (!user) return false;
  return allowed.includes(user.role);
}
