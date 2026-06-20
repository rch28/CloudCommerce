"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { User, Package, MapPin, Heart, Gift, LogOut, Loader2 } from "lucide-react";

export default function AccountLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);
  const pathname = usePathname();
  const router = useRouter();
  const [authState, setAuthState] = React.useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const base = `/store/${tenant}/account`;

  React.useEffect(() => {
    fetch("/api/v1/account/profile")
      .then((res) => {
        if (res.ok) {
          setAuthState("authenticated");
        } else {
          setAuthState("unauthenticated");
        }
      })
      .catch(() => setAuthState("unauthenticated"));
  }, []);

  React.useEffect(() => {
    if (authState === "unauthenticated") {
      router.replace(`/store/${tenant}/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [authState, tenant, pathname, router]);

  if (authState === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const nav = [
    { href: base, label: "Profile", icon: User },
    { href: `${base}/orders`, label: "Orders", icon: Package },
    { href: `${base}/addresses`, label: "Addresses", icon: MapPin },
    { href: `${base}/loyalty`, label: "Loyalty", icon: Gift },
    { href: `/store/${tenant}/wishlist`, label: "Wishlist", icon: Heart },
  ];

  const isActive = (href: string) => {
    if (href === base) return pathname === base;
    return pathname.startsWith(href);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-[#F8FAFC]">My Account</h1>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive(item.href)
                  ? "bg-[#7C3AED]/10 text-[#7C3AED]"
                  : "text-muted-foreground hover:bg-card hover:text-[#F8FAFC]"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
          <hr className="my-2 border-border" />
          <Link
            href={`/store/${tenant}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-rose-400"
          >
            <LogOut size={16} />
            Back to Store
          </Link>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
