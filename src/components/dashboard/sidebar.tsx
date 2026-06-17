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
  CreditCard,
  BarChart3,
  Zap,
  Tag,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type NavItem = { id: string; label: string; path: string; icon: typeof LayoutDashboard };

const merchantNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", path: "/merchant/dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", path: "/merchant/products", icon: Package },
  { id: "categories", label: "Categories", path: "/merchant/categories", icon: Tag },
  { id: "orders", label: "Orders", path: "/merchant/orders", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", path: "/merchant/inventory", icon: Boxes },
  { id: "customers", label: "Customers", path: "/merchant/customers", icon: Users },
  { id: "storefront", label: "Storefront", path: "/merchant/storefront", icon: Store },
  { id: "analytics", label: "Analytics", path: "/merchant/analytics", icon: BarChart3 },
  { id: "billing", label: "Billing", path: "/merchant/billing", icon: CreditCard },
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

  function NavButton({ item }: { item: NavItem }) {
    const Icon = item.icon;
    const isActive = pathname === item.path;
    return (
      <button
        onClick={() => { router.push(item.path); onClose(); }}
        className={cn(
          "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30"
            : "text-muted-foreground hover:bg-[#1E293B] hover:text-[#F8FAFC]"
        )}
      >
        <Icon size={18} className={cn(isActive ? "text-white" : "text-muted-foreground group-hover:text-[#F8FAFC]")} />
        {item.label}
      </button>
    );
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed z-40 flex h-full w-64 flex-col border-r border-border transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          "bg-[#111827]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7C3AED] shadow-lg shadow-[#7C3AED]/30">
              <Zap size={17} className="text-white" fill="white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-[#F8FAFC]">CloudCommerce</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{storeLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC] lg:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {!isAdmin && (
            <>
              <p className="px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Merchant
              </p>
              {merchantNav.map((item) => <NavButton key={item.id} item={item} />)}
            </>
          )}

          <p className="px-3 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            {isAdmin ? "Platform" : "Account"}
          </p>
          {(isAdmin ? platformNav : platformNav.filter((p) => p.id === "settings")).map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </nav>

        <div className="mx-3 mb-3 mt-auto rounded-xl border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/10 to-transparent p-4">
          <p className="text-sm font-semibold text-[#F8FAFC]">{session?.plan || "Starter"} Plan</p>
          <p className="mt-1 text-xs text-muted-foreground">Logged in as {isAdmin ? "Admin" : "Merchant"}</p>
        </div>
      </aside>
    </>
  );
}
