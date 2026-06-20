"use client";
import React from "react";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingCart, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function CartPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);
  const { items, updateQuantity, removeItem, subtotal, itemCount, pricing } = useCart();
  const base = `/store/${tenant}`;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-[#F8FAFC]">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Looks like you haven&apos;t added anything yet.</p>
        <Link href={`${base}/products`} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-6 py-3 text-sm font-medium text-white hover:bg-[#8B5CF6] transition-colors">
          <ArrowLeft size={16} /> Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-[#F8FAFC] mb-6">Shopping Cart ({itemCount} items)</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 rounded-xl border border-border bg-card p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#18181B]">
                {item.image ? <img src={item.image} alt={item.productName} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">N/A</div>}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`${base}/products/${item.slug}`} className="font-medium text-[#F8FAFC] hover:text-[#8B5CF6] transition-colors">{item.productName}</Link>
                <p className="mt-0.5 text-sm text-[#7C3AED]">${item.price.toFixed(2)}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-border">
                    <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="p-1.5 text-muted-foreground hover:text-[#F8FAFC]"><Minus size={12} /></button>
                    <span className="w-8 text-center text-sm text-[#F8FAFC]">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="p-1.5 text-muted-foreground hover:text-[#F8FAFC]"><Plus size={12} /></button>
                  </div>
                  <button onClick={() => removeItem(item.variantId)} className="text-rose-400 hover:text-rose-300 transition-colors text-sm">Remove</button>
                </div>
              </div>
              <div className="text-right text-sm font-medium text-[#F8FAFC]">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-6 h-fit">
          <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${pricing.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{pricing.shipping === 0 ? "Free" : `$${pricing.shipping.toFixed(2)}`}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>${pricing.tax.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 text-lg font-bold text-[#F8FAFC]"><span>Total</span><span>${pricing.total.toFixed(2)}</span></div>
          </div>
          <Link href={`${base}/checkout`} className="mt-6 flex w-full items-center justify-center rounded-lg bg-[#7C3AED] px-4 py-3 text-sm font-medium text-white hover:bg-[#8B5CF6] transition-colors">
            Proceed to Checkout
          </Link>
          <Link href={`${base}/products`} className="mt-3 flex w-full items-center justify-center text-sm text-muted-foreground hover:text-[#F8FAFC] transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
