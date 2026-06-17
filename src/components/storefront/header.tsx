"use client";
import Link from "next/link";
import { Search, ShoppingCart, Menu, Zap, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";

interface StoreHeaderProps {
  tenant: string;
  storeName: string;
}

export default function StoreHeader({ tenant, storeName }: StoreHeaderProps) {
  const { itemCount } = useCart();
  const [searchOpen, setSearchOpen] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const base = `/store/${tenant}`;

  const nav = [
    { label: "Home", href: base },
    { label: "Products", href: `${base}/products` },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[#09090B]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <button onClick={() => setMobileOpen((v) => !v)} className="text-muted-foreground hover:text-[#F8FAFC] lg:hidden">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href={base} className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]">
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <span className="text-sm font-bold text-[#F8FAFC]">{storeName}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-[#F8FAFC]">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="relative ml-auto max-w-xs flex-1 hidden sm:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchOpen}
            onChange={(e) => setSearchOpen(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && searchOpen.trim()) window.location.href = `${base}/products?search=${encodeURIComponent(searchOpen.trim())}`; }}
            placeholder="Search products..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]"
          />
        </div>

        <Link
          href={`${base}/cart`}
          className="relative rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-[#F8FAFC]"
        >
          <ShoppingCart size={18} />
          {itemCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#7C3AED] text-[10px] font-bold text-white">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </Link>
      </div>

      {mobileOpen && (
        <div className="border-t border-border px-4 py-3 lg:hidden">
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchOpen}
              onChange={(e) => setSearchOpen(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && searchOpen.trim()) window.location.href = `${base}/products?search=${encodeURIComponent(searchOpen.trim())}`; }}
              placeholder="Search..."
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]"
            />
          </div>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-muted-foreground hover:text-[#F8FAFC]">
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
