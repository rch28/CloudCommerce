import Link from "next/link";
import { Package, MapPin, User, LogOut } from "lucide-react";

export default async function AccountLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const base = `/store/${tenant}/account`;

  const nav = [
    { href: base, label: "Profile", icon: User },
    { href: `${base}/orders`, label: "Orders", icon: Package },
    { href: `${base}/addresses`, label: "Addresses", icon: MapPin },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-[#F8FAFC] mb-6">My Account</h1>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-card hover:text-[#F8FAFC] transition-colors">
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
          <hr className="my-2 border-border" />
          <Link href={`/store/${tenant}`} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-card hover:text-rose-400 transition-colors">
            <LogOut size={16} />
            Back to Store
          </Link>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
