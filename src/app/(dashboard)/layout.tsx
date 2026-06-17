"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/cc/Sidebar";
import Topbar from "@/components/cc/Topbar";
import AuthModal from "@/components/cc/AuthModal";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";

const titles: Record<string, string> = {
  "/merchant/dashboard": "Overview",
  "/merchant/products": "Products",
  "/merchant/orders": "Orders",
  "/merchant/inventory": "Inventory",
  "/merchant/customers": "Customers",
  "/merchant/storefront": "Storefront",
  "/admin": "All Merchants",
  "/admin/settings": "Settings",
  "/merchant/settings": "Settings",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const pathname = usePathname();

  const title = titles[pathname] || "Dashboard";

  return (
    <AuthProvider>
      <AppProvider>
        <div className="flex h-screen overflow-hidden bg-slate-950 font-sans text-slate-200">
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar
              title={title}
              onMenu={() => setSidebarOpen(true)}
              onSignIn={() => setAuthOpen(true)}
            />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
          </div>
          <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
      </AppProvider>
    </AuthProvider>
  );
}
