"use client";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Menu, Zap, X, Heart } from "lucide-react";
import SearchField from "@/components/ui/form-inputs/SearchField";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";

interface StoreHeaderProps {
  tenant: string;
  storeName: string;
  logo?: string | null;
  primaryColor?: string | null;
}

export default function StoreHeader({ tenant, storeName, logo, primaryColor }: StoreHeaderProps) {
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [searchOpen, setSearchOpen] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const base = `/store/${tenant}`;

  const nav = [
    { label: "Home", href: base },
    { label: "Products", href: `${base}/products` },
    { label: "Categories", href: `${base}/categories` },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <button onClick={() => setMobileOpen((v) => !v)} className="text-muted-foreground hover:text-foreground lg:hidden">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href={base} className="flex items-center gap-2.5 shrink-0">
          {logo ? (
            <Image src={logo} alt={storeName} width={32} height={32} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: primaryColor || "#7C3AED" }}>
              <Zap size={16} className="text-white" fill="white" />
            </div>
          )}
          <span className="text-sm font-bold text-foreground">{storeName}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto max-w-xs flex-1 hidden sm:block">
          <SearchField
            searchQuery={searchOpen}
            setSearchQuery={setSearchOpen}
            onKeyDown={(e) => { if (e.key === "Enter" && searchOpen.trim()) window.location.href = `${base}/search?q=${encodeURIComponent(searchOpen.trim())}`; }}
            placeholder="Search products..."
            inputClassName="py-2"
          />
        </div>

        <Link
          href={`${base}/wishlist`}
          className="relative rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Heart size={18} />
          {wishlistCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {wishlistCount > 99 ? "99+" : wishlistCount}
            </span>
          )}
        </Link>

        <Link
          href={`${base}/cart`}
          className="relative rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ShoppingCart size={18} />
          {itemCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#7C3AED] text-[10px] font-bold text-white">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </Link>
        <ThemeToggle />
      </div>

      {mobileOpen && (
        <div className="border-t border-border px-4 py-3 lg:hidden">
          <div className="mb-3">
            <SearchField
              searchQuery={searchOpen}
              setSearchQuery={setSearchOpen}
              onKeyDown={(e) => { if (e.key === "Enter" && searchOpen.trim()) window.location.href = `${base}/search?q=${encodeURIComponent(searchOpen.trim())}`; }}
              placeholder="Search..."
              inputClassName="py-2"
            />
          </div>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              {n.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-3 border-t border-border pt-3 px-3">
            <Link href={`${base}/wishlist`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Heart size={16} />
              Wishlist
              {wishlistCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
            <Link href={`${base}/cart`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ShoppingCart size={16} />
              Cart
              {itemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7C3AED] text-[10px] font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
