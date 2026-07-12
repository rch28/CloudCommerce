"use client";
import { useState } from "react";
import { Menu, Bell, ChevronDown, LogOut, Building2, ShoppingBag, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TopbarProps {
  title: string;
  onMenu: () => void;
  onSignIn: () => void;
}

export default function Topbar({ title, onMenu, onSignIn }: TopbarProps) {
  const { session, signOut, setRole } = useAuth();
  const [menu, setMenu] = useState(false);

  const initials = session
    ? session.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "";

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
      <button onClick={onMenu} className="text-muted-foreground lg:hidden">
        <Menu size={22} />
      </button>
      <h1 className="text-lg font-semibold text-white sm:text-xl">{title}</h1>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button className="relative rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-white">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-500" />
        </button>

        {session ? (
          <div className="relative">
            <button
              onClick={() => setMenu((m) => !m)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card py-1.5 pl-1.5 pr-2.5 hover:border-border"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white">
                {initials}
              </div>
              <span className="hidden text-sm font-medium text-white sm:inline">{session.name}</span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-white">{session.name}</p>
                    <p className="truncate text-xs text-slate-500">{session.email}</p>
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-medium capitalize text-violet-300">
                      {session.role === "admin" ? <Building2 size={11} /> : <ShoppingBag size={11} />}
                      {session.role}
                    </span>
                  </div>
                  <button
                    onClick={() => { setRole(session.role === "admin" ? "merchant" : "admin"); setMenu(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted"
                  >
                    {session.role === "admin" ? <ShoppingBag size={15} /> : <Building2 size={15} />}
                    Switch to {session.role === "admin" ? "Merchant" : "Platform Admin"}
                  </button>
                  <button
                    onClick={() => { signOut(); setMenu(false); }}
                    className="flex w-full items-center gap-2.5 border-t border-border px-4 py-2.5 text-left text-sm text-rose-400 hover:bg-muted"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <LogIn size={16} /> Sign in
          </button>
        )}
      </div>
    </header>
  );
}
