import React from "react";
import CheckoutForm from "@/components/storefront/checkout-form";

export default function CheckoutPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-[#F8FAFC] mb-8">Checkout</h1>
      <CheckoutForm tenant={tenant} />
    </div>
  );
}
