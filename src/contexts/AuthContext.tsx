"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

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

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.loggedIn && data.user) {
        setSession({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
        });
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    setSession({
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
    });
  }, []);

  const signUp = useCallback(async (data: { email: string; password: string; name: string; role: Role }) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Registration failed");
    setSession({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
    });
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
  }, []);

  const setRole = useCallback((role: Role) => {
    setSession((prev) => prev ? { ...prev, role } : null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut, setRole, refresh: fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
