"use client";
import { X, ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  tenant: string;
}

export default function CartDrawer({ open, onClose, tenant }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, subtotal, itemCount, pricing } = useCart();
  const base = `/store/${tenant}`;

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />}
      <div className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-[#09090B] transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-[#F8FAFC]" />
            <span className="font-semibold text-[#F8FAFC]">Cart ({itemCount})</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-card hover:text-[#F8FAFC] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-16 text-center">
              <ShoppingCart size={48} className="text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Your cart is empty</p>
              <Link href={`${base}/products`} onClick={onClose} className="mt-4 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white hover:bg-[#8B5CF6] transition-colors">
                Browse products
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#18181B]">
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">N/A</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`${base}/products/${item.slug}`} onClick={onClose} className="text-sm font-medium text-[#F8FAFC] hover:text-[#8B5CF6] transition-colors truncate block">
                      {item.productName}
                    </Link>
                    <p className="mt-0.5 text-sm text-[#7C3AED]">${item.price.toFixed(2)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="rounded-md border border-border p-1 text-muted-foreground hover:text-[#F8FAFC] transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm text-[#F8FAFC]">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="rounded-md border border-border p-1 text-muted-foreground hover:text-[#F8FAFC] transition-colors">
                        <Plus size={12} />
                      </button>
                      <button onClick={() => removeItem(item.variantId)} className="ml-auto rounded-md p-1 text-rose-400 hover:bg-rose-500/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border px-4 py-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-[#F8FAFC]">${pricing.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Shipping</span>
                <span>{pricing.shipping === 0 ? "Free" : `$${pricing.shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Tax</span>
                <span>${pricing.tax.toFixed(2)}</span>
              </div>
            </div>
            <Link href={`${base}/checkout`} onClick={onClose} className="mt-3 flex w-full items-center justify-center rounded-lg bg-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8B5CF6] transition-colors">
              Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
