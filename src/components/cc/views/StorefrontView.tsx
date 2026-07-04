"use client";
import { useState } from "react";
import { ShoppingCart, Plus, Minus, X, Star, Check } from "lucide-react";
import { products } from "@/data/mock";
import { Button } from "@/components/ui/button";

interface CartItem { id: string; name: string; price: number; image: string; qty: number; }

export default function StorefrontView() {
  const live = products.filter((p) => p.status === "active");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sms, setSms] = useState(true);
  const [subscribed, setSubscribed] = useState(false);

  const add = (p: typeof products[number]) =>
    setCart((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) return c.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { id: p.id, name: p.name, price: p.price, image: p.image, qty: 1 }];
    });

  const setQty = (id: string, d: number) =>
    setCart((c) =>
      c.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + d) } : i)).filter((i) => i.qty > 0)
    );

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.qty * i.price, 0);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("https://famous.ai/api/crm/6a297041a1033fa5766e0ad0/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: phone || undefined,
          sms_opt_in: sms === true,
          source: "storefront-newsletter",
          tags: ["newsletter", "storefront"],
        }),
      });
    } catch {}
    setSubscribed(true);
    setEmail("");
    setPhone("");
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-violet-800/40 bg-gradient-to-br from-violet-900/50 via-slate-900 to-slate-950 p-8">
        <div className="relative z-10 max-w-lg">
          <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-300">
            soundwave.cloudcommerce.com
          </span>
          <h2 className="mt-4 text-3xl font-bold text-white">Premium Sound, Reimagined</h2>
          <p className="mt-2 text-slate-300">Shop the latest audio gear with real-time stock and fast checkout.</p>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-violet-600/30 blur-3xl" />
        <button
          onClick={() => setOpen(true)}
          className="absolute right-6 top-6 z-10 flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
        >
          <ShoppingCart size={16} /> Cart
          {count > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-xs">{count}</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {live.map((p) => (
          <div key={p.id} className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 transition-all hover:-translate-y-1 hover:border-violet-700/50">
            <div className="aspect-square overflow-hidden bg-slate-950">
              <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <Star size={12} fill="currentColor" /> 4.{(p.sold % 9)} · {p.sold} sold
              </div>
              <h4 className="mt-1 truncate font-medium text-white">{p.name}</h4>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-white">${p.price.toFixed(2)}</span>
                <Button
                  disabled={p.stock === 0}
                  onClick={() => add(p)}
                  size="sm"
                >
                  {p.stock === 0 ? "Sold out" : "Add"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <div className="mx-auto max-w-md text-center">
          <h3 className="text-xl font-bold text-white">Get early access & deals</h3>
          <p className="mt-1 text-sm text-slate-400">Join the SoundWave list for drops and exclusive offers.</p>
          {subscribed ? (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 py-3 text-emerald-400">
              <Check size={18} /> You&apos;re subscribed!
            </div>
          ) : (
            <form onSubmit={subscribe} className="mt-5 space-y-3 text-left">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-600"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number (optional)"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-600"
              />
              <label className="flex items-start gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} className="mt-0.5 accent-violet-600" />
                <span>Text me updates. Msg &amp; data rates may apply. Reply STOP to unsubscribe.</span>
              </label>
              <Button type="submit" className="w-full" variant="gradient">
                Subscribe
              </Button>
            </form>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setOpen(false)}>
          <div className="flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h3 className="font-semibold text-white">Your Cart</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {cart.length === 0 && <p className="py-10 text-center text-slate-500">Your cart is empty.</p>}
              {cart.map((i) => (
                <div key={i.id} className="flex items-center gap-3 rounded-lg border border-slate-800 p-3">
                  <img src={i.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{i.name}</p>
                    <p className="text-sm text-violet-400">${i.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setQty(i.id, -1)} className="rounded border border-slate-800 p-1 text-slate-300"><Minus size={13} /></button>
                    <span className="w-5 text-center text-sm text-white">{i.qty}</span>
                    <button onClick={() => setQty(i.id, 1)} className="rounded border border-slate-800 p-1 text-slate-300"><Plus size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-800 p-5">
              <div className="mb-3 flex justify-between text-white">
                <span className="text-slate-400">Total</span>
                <span className="text-lg font-bold">${total.toFixed(2)}</span>
              </div>
              <Button disabled={!cart.length} className="w-full" variant="gradient" size="xl">
                Checkout with Stripe
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
