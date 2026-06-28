"use client";
import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuthStore, type Session, type Role } from "@/stores/auth-store";

export type { Role };
export type Plan = "Starter" | "Growth" | "Scale";
export type { Session };

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

// AuthProvider delegates to useAuthStore so there is a single source of truth
// for session state across both the dashboard (AuthContext) and storefront
// (useAuthStore) parts of the application.
export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, loading, init, signIn: storeSignIn, signUp: storeSignUp, signOut, setRole, refresh } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  const signIn = useCallback(
    async (email: string, password: string) => { await storeSignIn(email, password); },
    [storeSignIn],
  );

  const signUp = useCallback(
    async (data: { email: string; password: string; name: string; role: Role }) => { await storeSignUp(data); },
    [storeSignUp],
  );

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
