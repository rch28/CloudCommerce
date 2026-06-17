"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Users,
  Store,
  Building2,
  Settings,
  Search,
  Plus,
  BarChart3,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";

  const merchantItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/merchant/dashboard" },
    { label: "Products", icon: Package, path: "/merchant/products" },
    { label: "Orders", icon: ShoppingCart, path: "/merchant/orders" },
    { label: "Inventory", icon: Boxes, path: "/merchant/inventory" },
    { label: "Customers", icon: Users, path: "/merchant/customers" },
    { label: "Storefront", icon: Store, path: "/merchant/storefront" },
    { label: "Settings", icon: Settings, path: "/merchant/settings" },
  ];

  const adminItems = [
    { label: "All Merchants", icon: Building2, path: "/admin" },
    { label: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  const quickActions = [
    { label: "Create Product", icon: Plus, action: () => router.push("/merchant/products") },
    { label: "View Reports", icon: BarChart3, action: () => router.push(isAdmin ? "/admin" : "/merchant/dashboard") },
    { label: "New Order", icon: FileText, action: () => router.push("/merchant/orders") },
  ];

  const navigate = useCallback((path: string) => {
    router.push(path);
    onOpenChange(false);
  }, [router, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, actions..." />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-6">
            <Search size={20} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No results found</p>
          </div>
        </CommandEmpty>
        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem key={action.label} onSelect={action.action}>
              <action.icon className="mr-2 h-4 w-4" />
              <span>{action.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={isAdmin ? "Platform" : "Merchant"}>
          {(isAdmin ? adminItems : merchantItems).map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem key={item.path} onSelect={() => navigate(item.path)}>
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        {!isAdmin && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Admin">
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem key={item.path} onSelect={() => navigate(item.path)}>
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
