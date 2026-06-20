"use client";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const labelMap: Record<string, string> = {
  merchant: "Merchant",
  dashboard: "Dashboard",
  products: "Products",
  categories: "Categories",
  orders: "Orders",
  inventory: "Inventory",
  customers: "Customers",
  storefront: "Storefront",
  cms: "CMS",
  admin: "Admin",
  settings: "Settings",
};

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/merchant/dashboard" className="transition-colors hover:text-[#F8FAFC]">
            <Home size={14} />
          </Link>
          {segments.map((segment, index) => {
            const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
            const href = "/" + segments.slice(0, index + 1).join("/");
            const isLast = index === segments.length - 1;
            return (
              <span key={href} className="flex items-center gap-1">
                <ChevronRight size={13} className="text-muted-foreground/40" />
                {isLast ? (
                  <span className="font-medium text-[#F8FAFC]">{label}</span>
                ) : (
                  <Link href={href} className="transition-colors hover:text-[#F8FAFC]">
                    {label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
        <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC] sm:text-2xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
