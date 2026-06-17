import Link from "next/link";
import { Zap } from "lucide-react";

interface StoreFooterProps {
  tenant: string;
  storeName: string;
}

export default function StoreFooter({ tenant, storeName }: StoreFooterProps) {
  const base = `/store/${tenant}`;

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]">
                <Zap size={16} className="text-white" fill="white" />
              </div>
              <span className="text-sm font-bold text-[#F8FAFC]">{storeName}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Powered by CloudCommerce</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-[#F8FAFC]">Shop</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link href={`${base}/products`} className="block transition-colors hover:text-[#F8FAFC]">All Products</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-[#F8FAFC]">Account</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link href={`${base}/cart`} className="block transition-colors hover:text-[#F8FAFC]">Cart</Link>
              <Link href={`${base}/account/orders`} className="block transition-colors hover:text-[#F8FAFC]">Orders</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-[#F8FAFC]">Support</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>contact@{tenant}.com</p>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {storeName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
