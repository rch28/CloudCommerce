"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Role = "merchant" | "admin";
export type Plan = "Starter" | "Growth" | "Scale";

export interface Session {
  name: string;
  email: string;
  role: Role;
  storeName: string;
  subdomain: string;
  plan: Plan;
}

interface AuthContextType {
  session: Session | null;
  signIn: (email: string, role: Role) => void;
  signUp: (data: Session) => void;
  signOut: () => void;
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = "cc_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {
      /* ignore corrupt session */
    }
  }, []);

  const persist = (s: Session | null) => {
    setSession(s);
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const signIn = (email: string, role: Role) => {
    const name =
      email
        .split("@")[0]
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()) || "Merchant";
    persist({
      name,
      email,
      role,
      storeName: role === "admin" ? "Platform HQ" : "SoundWave Co.",
      subdomain: role === "admin" ? "platform" : "soundwave",
      plan: "Scale",
    });
  };

  const signUp = (data: Session) => persist(data);
  const signOut = () => persist(null);
  const setRole = (role: Role) => {
    if (session) persist({ ...session, role });
  };

  return (
    <AuthContext.Provider value={{ session, signIn, signUp, signOut, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
