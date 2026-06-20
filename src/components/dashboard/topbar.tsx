"use client";
import { useState } from "react";
import {
  Menu,
  ChevronDown,
  LogOut,
  Building2,
  ShoppingBag,
  Search,
  Command,
} from "lucide-react";
import NotificationDropdown from "@/components/dashboard/notification-dropdown";
import { useAuth } from "@/contexts/AuthContext";

interface TopbarProps {
  onMenu: () => void;
  onSearchOpen: () => void;
}

export default function Topbar({ onMenu, onSearchOpen }: TopbarProps) {
  const { session, signOut, setRole } = useAuth();
  const [menu, setMenu] = useState(false);

  const initials = session
    ? session.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-[#020617]/80 px-4 backdrop-blur-xl sm:px-6">
      <button
        onClick={onMenu}
        className="shrink-0 text-muted-foreground transition-colors hover:text-[#F8FAFC] lg:hidden"
      >
        <Menu size={20} />
      </button>

      <button
        onClick={onSearchOpen}
        className="hidden w-full max-w-md items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:border-[#7C3AED]/30 sm:flex"
      >
        <Search size={15} className="shrink-0" />
        <span className="flex-1 text-left">Search pages, actions...</span>
        <kbd className="hidden items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground sm:flex">
          <Command size={11} />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <NotificationDropdown />

        {session && (
          <button className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-[#7C3AED]/30 hover:text-[#F8FAFC] sm:flex">
            <Building2 size={14} />
            <span>{session.storeName}</span>
            <ChevronDown size={12} />
          </button>
        )}

        {session ? (
          <div className="relative">
            <button
              onClick={() => setMenu((m) => !m)}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-[#7C3AED]/30"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">
                {initials}
              </div>
              <span className="hidden text-sm font-medium text-[#F8FAFC] sm:inline">
                {session.name}
              </span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>

            {menu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenu(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-black/40">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-[#F8FAFC]">
                      {session.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {session.email}
                    </p>
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#7C3AED]/10 px-2 py-0.5 text-[11px] font-medium capitalize text-[#8B5CF6]">
                      {session.role === "admin" ? (
                        <Building2 size={11} />
                      ) : (
                        <ShoppingBag size={11} />
                      )}
                      {session.role}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setRole(session.role === "admin" ? "merchant" : "admin");
                      setMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]"
                  >
                    {session.role === "admin" ? (
                      <ShoppingBag size={15} />
                    ) : (
                      <Building2 size={15} />
                    )}
                    Switch to{" "}
                    {session.role === "admin" ? "Merchant" : "Platform Admin"}
                  </button>
                  <button
                    onClick={() => {
                      signOut();
                      setMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 border-t border-border px-4 py-2.5 text-left text-sm text-rose-400 transition-colors hover:bg-[#1E293B]"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
