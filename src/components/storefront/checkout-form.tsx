"use client";
import { useState, type FormEvent } from "react";
import { useCart } from "@/contexts/CartContext";
import { Loader2, CreditCard } from "lucide-react";
import Link from "next/link";

interface CheckoutFormProps {
  tenant: string;
  onSuccess: (orderNumber: string) => void;
}

export default function CheckoutForm({ tenant, onSuccess }: CheckoutFormProps) {
  const { items, clearCart, pricing } = useCart();
  const [step, setStep] = useState<"info" | "confirm" | "done">("info");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", line1: "", city: "", state: "", zip: "", notes: "" });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === "info") {
      setStep("confirm");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const orderNum = `DEMO-${String(Math.floor(10000 + Math.random() * 90000))}`;
    clearCart();
    setStep("done");
    setLoading(false);
    onSuccess(orderNum);
  }

  if (items.length === 0 && step !== "done") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CreditCard size={48} className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Your cart is empty</p>
        <Link href={`/store/${tenant}/products`} className="mt-4 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white hover:bg-[#8B5CF6] transition-colors">
          Browse products
        </Link>
      </div>
    );
  }

  if (step === "done") return null;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8">
      {step === "info" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4">Shipping Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Full Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Email</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Phone (optional)</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Address Line 1</label>
              <input required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">City</label>
                <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">State</label>
                <input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">ZIP</label>
                <input required value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Order Notes (optional)</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED] resize-none" />
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <div className="space-y-1 text-sm">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between text-muted-foreground">
                  <span>{item.productName} x{item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${pricing.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{pricing.shipping === 0 ? "Free" : `$${pricing.shipping.toFixed(2)}`}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Tax (8%)</span><span>${pricing.tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold text-[#F8FAFC] pt-1"><span>Total</span><span>${pricing.total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4">Confirm Order</h2>
          <div className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Name:</span> <span className="text-[#F8FAFC]">{form.name}</span></div>
            <div><span className="text-muted-foreground">Email:</span> <span className="text-[#F8FAFC]">{form.email}</span></div>
            <div><span className="text-muted-foreground">Address:</span> <span className="text-[#F8FAFC]">{form.line1}, {form.city}, {form.state} {form.zip}</span></div>
            <div><span className="text-muted-foreground">Items:</span> <span className="text-[#F8FAFC]">{items.length} item(s)</span></div>
            <div className="border-t border-border pt-3 text-lg font-bold text-[#F8FAFC]">Total: ${pricing.total.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {step === "confirm" && (
          <button type="button" onClick={() => setStep("info")} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-[#F8FAFC] hover:bg-card transition-colors">
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8B5CF6] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="mx-auto animate-spin" /> : step === "info" ? "Continue to Review" : "Place Order"}
        </button>
      </div>
    </form>
  );
}
