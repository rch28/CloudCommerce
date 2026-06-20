"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { authApi } from "@/services/auth.service";

export type Role = "merchant" | "admin";
export type Plan = "Starter" | "Growth" | "Scale";

export interface Session {
  id: string;
  name: string;
  email: string;
  role: Role;
  storeName?: string;
  subdomain?: string;
  plan?: Plan;
}

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { email: string; password: string; name: string; role: Role }) => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: Role) => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.me().then((data) => {
      if (data.loggedIn && data.user) {
        setSession({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role as Role,
        });
      } else {
        setSession(null);
      }
    }).catch(() => {
      setSession(null);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    setSession({
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role as Role,
    });
  }, []);

  const signUp = useCallback(async (data: { email: string; password: string; name: string; role: Role }) => {
    const result = await authApi.register(data);
    setSession({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role as Role,
    });
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout();
    setSession(null);
    window.location.href = "/";
  }, []);

  const setRole = useCallback((role: Role) => {
    setSession((prev) => prev ? { ...prev, role } : null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.me();
      if (data.loggedIn && data.user) {
        setSession({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role as Role,
        });
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut, setRole, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
