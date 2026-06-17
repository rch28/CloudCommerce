"use client";
import React, { useState } from "react";
import CheckoutForm from "@/components/storefront/checkout-form";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function CheckoutPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const base = `/store/${tenant}`;

  if (orderNumber) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <CheckCircle size={64} className="mx-auto text-emerald-500 mb-6" />
        <h1 className="text-3xl font-bold text-[#F8FAFC]">Order Placed!</h1>
        <p className="mt-3 text-muted-foreground">Your order <span className="font-mono text-[#F8FAFC]">#{orderNumber}</span> has been placed successfully.</p>
        <p className="mt-1 text-sm text-muted-foreground">We'll send you a confirmation email shortly.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href={`${base}/account/orders`} className="rounded-lg bg-[#7C3AED] px-6 py-3 text-sm font-medium text-white hover:bg-[#8B5CF6] transition-colors">
            View Orders
          </Link>
          <Link href={`${base}/products`} className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-[#F8FAFC] hover:bg-card transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-[#F8FAFC] mb-8">Checkout</h1>
      <CheckoutForm tenant={tenant} onSuccess={(num) => setOrderNumber(num)} />
    </div>
  );
}
