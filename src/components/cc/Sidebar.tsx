"use client";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Users,
  Store,
  Building2,
  Settings,
  Zap,
  X,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = { id: string; label: string; path: string; icon: typeof LayoutDashboard };

const merchantNav: NavItem[] = [
  { id: "dashboard", label: "Overview", path: "/merchant/dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", path: "/merchant/products", icon: Package },
  { id: "orders", label: "Orders", path: "/merchant/orders", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", path: "/merchant/inventory", icon: Boxes },
  { id: "customers", label: "Customers", path: "/merchant/customers", icon: Users },
  { id: "storefront", label: "Storefront", path: "/merchant/storefront", icon: Store },
  { id: "cms", label: "CMS", path: "/merchant/cms", icon: FileText },
];

const platformNav: NavItem[] = [
  { id: "admin", label: "All Merchants", path: "/admin", icon: Building2 },
  { id: "settings", label: "Settings", path: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { session } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = session?.role === "admin";
  const storeLabel = session?.storeName || "Demo Store";

  const NavButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = pathname === item.path;
    return (
      <button
        onClick={() => { router.push(item.path); onClose(); }}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
          isActive
            ? "bg-gradient-to-r from-violet-600/90 to-violet-700/70 text-white shadow-lg shadow-violet-900/30"
            : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
        }`}
      >
        <Icon size={18} />
        {item.label}
      </button>
    );
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed z-40 flex h-full w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-900/40">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-white">CloudCommerce</p>
              <p className="mt-1 text-[11px] text-slate-500">{storeLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            {isAdmin ? "Merchant Management" : "Merchant"}
          </p>
          {merchantNav.map((item) => <NavButton key={item.id} item={item} />)}

          {isAdmin && (
            <>
              <p className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Platform
              </p>
              {platformNav.map((item) => <NavButton key={item.id} item={item} />)}
            </>
          )}
        </nav>

        <div className="m-3 rounded-xl border border-violet-800/40 bg-gradient-to-br from-violet-900/40 to-slate-900 p-4">
          <p className="text-sm font-semibold text-white">{session?.plan || "Scale"} Plan</p>
          <p className="mt-1 text-xs text-slate-400">Real-time sync · Unlimited products</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">7,500 / 10,000 orders this month</p>
          <button
            onClick={() => window.open(`/store/demo`, "_blank")}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-violet-500/30 px-3 py-1.5 text-xs font-medium text-violet-400 transition-colors hover:bg-violet-500/10"
          >
            <ExternalLink size={12} />
            View Storefront
          </button>
        </div>
      </aside>
    </>
  );
}
