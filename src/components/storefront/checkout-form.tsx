"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import {
  Loader2,
  CreditCard,
  MapPin,
  CheckCircle,
  Plus,
  ChevronRight,
  Truck,
} from "lucide-react";
import Link from "next/link";

interface SavedAddress {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

interface AddressForm {
  label: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
  line2: string;
  country: string;
}

interface CheckoutFormProps {
  tenant: string;
}

const emptyAddress: AddressForm = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
};

interface ShippingOption {
  methodId: string;
  methodName: string;
  carrier: string | null;
  type: string;
  price: number;
}

export default function CheckoutForm({ tenant }: CheckoutFormProps) {
  const { items, isAuthenticated } = useCart();
  const [step, setStep] = useState<"address" | "shipping" | "review">("address");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [address, setAddress] = useState<AddressForm>(emptyAddress);
  const [notes, setNotes] = useState("");

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  const selectedAddr = getSelectedAddress();
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingCost = selectedShipping?.price ?? 0;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + shippingCost + tax;

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/v1/account/addresses")
        .then((res) => (res.ok ? res.json() : []))
        .then((data: SavedAddress[]) => {
          setSavedAddresses(data);
          const defaultAddr = data.find((a) => a.isDefault) ?? data[0];
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  function getSelectedAddress(): Omit<SavedAddress, "id" | "isDefault"> | null {
    if (isAuthenticated && selectedAddressId && !showNewAddress) {
      const addr = savedAddresses.find((a) => a.id === selectedAddressId);
      if (addr) {
        return {
          label: addr.label,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          country: addr.country,
        };
      }
    }
    if (showNewAddress || !isAuthenticated) {
      if (!address.line1 || !address.city || !address.state || !address.zip) return null;
      return {
        label: address.label,
        line1: address.line1,
        line2: address.line2 || null,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
      };
    }
    return null;
  }

  function canContinueToReview(): boolean {
    if (isAuthenticated && !showNewAddress) return selectedAddressId !== "";
    const addr = address;
    return addr.line1 !== "" && addr.city !== "" && addr.state !== "" && addr.zip !== "";
  }

  async function handlePlaceOrder() {
    setLoading(true);
    setError("");

    const selectedAddr = getSelectedAddress();

    if (!selectedShipping) {
      setError("Please select a shipping method");
      setLoading(false);
      return;
    }

    const body: Record<string, unknown> = {
      tenantId: tenant,
      notes: notes || undefined,
      shippingMethodId: selectedShipping.methodId,
      shippingPrice: selectedShipping.price,
    };

    if (isAuthenticated && selectedAddressId && !showNewAddress) {
      body.addressId = selectedAddressId;
    } else if (selectedAddr) {
      body.address = selectedAddr;
    } else {
      setError("Please provide a shipping address");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/checkout/stripe-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to place order");
        setLoading(false);
        return;
      }

      window.location.href = data.stripeUrl;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
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

  if (step === "address") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-[#7C3AED]" />
            Shipping Address
          </h2>

          {isAuthenticated && savedAddresses.length > 0 && !showNewAddress && (
            <div className="space-y-3">
              {savedAddresses.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    selectedAddressId === addr.id
                      ? "border-[#7C3AED] bg-[#7C3AED]/5"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                      selectedAddressId === addr.id
                        ? "border-[#7C3AED] bg-[#7C3AED]"
                        : "border-muted-foreground"
                    }`}>
                      {selectedAddressId === addr.id && (
                        <CheckCircle size={14} className="text-white" />
                      )}
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-[#F8FAFC]">{addr.label}</p>
                      <p className="text-muted-foreground">{addr.line1}</p>
                      {addr.line2 && <p className="text-muted-foreground">{addr.line2}</p>}
                      <p className="text-muted-foreground">{addr.city}, {addr.state} {addr.zip}</p>
                    </div>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setShowNewAddress(true); setSelectedAddressId(""); }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:text-[#F8FAFC] hover:border-muted-foreground/50 transition-colors"
              >
                <Plus size={16} /> Add a new address
              </button>
            </div>
          )}

          {(showNewAddress || !isAuthenticated || savedAddresses.length === 0) && (
            <div className="space-y-4">
              {isAuthenticated && savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewAddress(false)}
                  className="text-sm text-[#7C3AED] hover:text-[#8B5CF6] transition-colors"
                >
                  &larr; Select saved address
                </button>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Label</label>
                  <input
                    value={address.label}
                    onChange={(e) => setAddress({ ...address, label: e.target.value })}
                    className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]"
                    placeholder="Home"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Address Line 1</label>
                <input
                  required
                  value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]"
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Address Line 2 (optional)</label>
                <input
                  value={address.line2}
                  onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                  className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]"
                  placeholder="Apt 4B"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">City</label>
                  <input
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]"
                    placeholder="Portland"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">State</label>
                  <input
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]"
                    placeholder="OR"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">ZIP</label>
                  <input
                    required
                    value={address.zip}
                    onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                    className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]"
                    placeholder="97201"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!canContinueToReview()}
            onClick={async () => {
              setShippingLoading(true);
              setError("");
              try {
                const addr = getSelectedAddress();
                if (!addr) { setShippingLoading(false); return; }
                const shippingItems = items.map((i) => ({
                  variantId: i.variantId,
                  quantity: i.quantity,
                  price: i.price,
                  weight: undefined,
                }));
                const res = await fetch("/api/v1/shipping/calculate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    address: { country: addr.country, state: addr.state, city: addr.city, zip: addr.zip },
                    items: shippingItems,
                  }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setShippingOptions(data.options || []);
                  if (data.options?.length > 0) setSelectedShipping(data.options[0]);
                }
              } catch {}
              setShippingLoading(false);
              setStep("shipping");
            }}
            className="flex items-center gap-2 rounded-lg bg-[#7C3AED] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#8B5CF6] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {shippingLoading ? <Loader2 size={16} className="animate-spin" /> : <>Continue <ChevronRight size={16} /></>}
          </button>
        </div>
      </div>
    );
  }

  if (step === "shipping") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4 flex items-center gap-2">
            <Truck size={18} className="text-[#7C3AED]" />
            Shipping Method
          </h2>

          {selectedAddr && (
            <div className="mb-4 rounded-lg bg-[#09090B] p-3 text-sm">
              <p className="text-muted-foreground">Shipping to</p>
              <p className="text-[#F8FAFC] font-medium">{selectedAddr.line1}, {selectedAddr.city}, {selectedAddr.state} {selectedAddr.zip}</p>
            </div>
          )}

          {shippingOptions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">No shipping options available for this address</p>
              <button
                onClick={() => setStep("address")}
                className="mt-4 text-sm text-[#7C3AED] hover:text-[#8B5CF6] transition-colors"
              >
                &larr; Change address
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {shippingOptions.map((opt) => (
                <button
                  key={opt.methodId}
                  type="button"
                  onClick={() => setSelectedShipping(opt)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    selectedShipping?.methodId === opt.methodId
                      ? "border-[#7C3AED] bg-[#7C3AED]/5"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                        selectedShipping?.methodId === opt.methodId
                          ? "border-[#7C3AED] bg-[#7C3AED]"
                          : "border-muted-foreground"
                      }`}>
                        {selectedShipping?.methodId === opt.methodId && (
                          <CheckCircle size={14} className="text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[#F8FAFC] text-sm">{opt.methodName}</p>
                        {opt.carrier && <p className="text-xs text-muted-foreground">{opt.carrier}</p>}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#F8FAFC]">
                      {opt.price === 0 ? "Free" : `$${opt.price.toFixed(2)}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep("address")}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-[#F8FAFC] hover:bg-card transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!selectedShipping}
            onClick={() => setStep("review")}
            className="flex-1 rounded-lg bg-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8B5CF6] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to Review <ChevronRight size={16} className="inline" />
          </button>
        </div>
      </div>
    );
  }

  const selectedAddr = getSelectedAddress();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4">Review Order</h2>

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Items ({items.length})</h3>
            <div className="divide-y divide-border rounded-lg border border-border">
              {items.map((item) => (
                <div key={item.variantId} className="flex items-center gap-3 p-3 text-sm">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#18181B]">
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <CreditCard size={14} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#F8FAFC]">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#F8FAFC]">${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedAddr && (
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Shipping Address</h3>
              <div className="rounded-lg border border-border bg-[#09090B] p-3 text-sm">
                <p className="font-medium text-[#F8FAFC]">{selectedAddr.label}</p>
                <p className="text-muted-foreground">{selectedAddr.line1}</p>
                {selectedAddr.line2 && <p className="text-muted-foreground">{selectedAddr.line2}</p>}
                <p className="text-muted-foreground">{selectedAddr.city}, {selectedAddr.state} {selectedAddr.zip}</p>
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Order Notes (optional)</h3>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED] resize-none"
              placeholder="Any special instructions?"
            />
          </div>

          {selectedShipping && (
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Shipping Method</h3>
              <div className="rounded-lg border border-border bg-[#09090B] p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#F8FAFC]">{selectedShipping.methodName}</span>
                  <span className="text-muted-foreground">{selectedShipping.price === 0 ? "Free" : `$${selectedShipping.price.toFixed(2)}`}</span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-lg font-bold text-[#F8FAFC]">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep("address")}
          disabled={loading}
          className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-[#F8FAFC] hover:bg-card transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handlePlaceOrder}
          className="flex-1 rounded-lg bg-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8B5CF6] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="mx-auto animate-spin" />
          ) : (
            `Place Order — $${total.toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  );
}
