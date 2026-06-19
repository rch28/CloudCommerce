"use client";
import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/sidebar";
import Topbar from "@/components/dashboard/topbar";
import CommandPalette from "@/components/dashboard/command-palette";
import AuthModal from "@/components/cc/AuthModal";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const pathname = usePathname();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setCommandOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AuthProvider>
      <AppProvider>
        <div className="flex h-screen overflow-hidden bg-slate-950 font-sans text-[#F8FAFC]">
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar
              onMenu={() => setSidebarOpen(true)}
              onSearchOpen={() => setCommandOpen(true)}
            />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
          </div>
          <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
          <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
      </AppProvider>
    </AuthProvider>
  );
}
