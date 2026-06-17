"use client";
import { useState } from "react";
import { X, Zap, Check, ArrowRight, ArrowLeft, Building2, ShoppingBag } from "lucide-react";
import { useAuth, Plan, Role } from "@/contexts/AuthContext";

const PLANS: { name: Plan; price: number; feats: string[] }[] = [
  { name: "Starter", price: 29, feats: ["100 products", "Basic analytics"] },
  { name: "Growth", price: 79, feats: ["1,000 products", "Real-time sync", "Custom domain"] },
  { name: "Scale", price: 199, feats: ["Unlimited products", "Priority support", "API access"] },
];

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("merchant");

  const [storeName, setStoreName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [plan, setPlan] = useState<Plan>("Growth");

  if (!open) return null;

  const reset = () => { setStep(1); setMode("signin"); };
  const close = () => { reset(); onClose(); };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    signIn(email, role);
    close();
  };

  const finishSignup = () => {
    const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Merchant";
    if (role === "admin") {
      signUp({ name, email, role: "admin", storeName: "Platform HQ", subdomain: "platform", plan: "Scale" });
    } else {
      signUp({ name, email, role: "merchant", storeName: storeName || "My Store", subdomain: subdomain || "mystore", plan });
    }
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={close}>
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={close} className="absolute right-4 top-4 z-10 text-slate-400 hover:text-white">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center px-7 pt-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-900/40">
            <Zap size={22} className="text-white" fill="white" />
          </div>
          <h2 className="mt-3 text-xl font-bold text-white">
            {mode === "signin" ? "Welcome back" : step === 1 ? "Create your account" : "Set up your store"}
          </h2>
          <p className="text-sm text-slate-400">
            {mode === "signin" ? "Sign in to CloudCommerce" : step === 1 ? "Start selling in minutes" : `Step ${step - 1} of 2`}
          </p>
        </div>

        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-3 px-7 py-6">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-600" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-600" />

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" onClick={() => setRole("merchant")} className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium ${role === "merchant" ? "border-violet-600 bg-violet-600/15 text-white" : "border-slate-800 text-slate-400"}`}>
                <ShoppingBag size={15} /> Merchant
              </button>
              <button type="button" onClick={() => setRole("admin")} className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium ${role === "admin" ? "border-violet-600 bg-violet-600/15 text-white" : "border-slate-800 text-slate-400"}`}>
                <Building2 size={15} /> Platform Admin
              </button>
            </div>

            <button type="submit" className="mt-2 w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              Sign in
            </button>
            <p className="text-center text-sm text-slate-400">
              No account?{" "}
              <button type="button" onClick={() => { setMode("signup"); setStep(1); }} className="font-medium text-violet-400 hover:underline">
                Sign up
              </button>
            </p>
          </form>
        )}

        {mode === "signup" && step === 1 && (
          <div className="space-y-3 px-7 py-6">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-600" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-600" />

            <p className="pt-1 text-xs text-slate-500">Account type</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setRole("merchant")} className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium ${role === "merchant" ? "border-violet-600 bg-violet-600/15 text-white" : "border-slate-800 text-slate-400"}`}>
                <ShoppingBag size={15} /> Merchant
              </button>
              <button type="button" onClick={() => setRole("admin")} className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium ${role === "admin" ? "border-violet-600 bg-violet-600/15 text-white" : "border-slate-800 text-slate-400"}`}>
                <Building2 size={15} /> Platform Admin
              </button>
            </div>

            <button
              type="button"
              disabled={!email}
              onClick={() => (role === "admin" ? finishSignup() : setStep(2))}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
            >
              {role === "admin" ? "Create admin account" : "Continue"} <ArrowRight size={16} />
            </button>
            <p className="text-center text-sm text-slate-400">
              Have an account?{" "}
              <button type="button" onClick={() => setMode("signin")} className="font-medium text-violet-400 hover:underline">Sign in</button>
            </p>
          </div>
        )}

        {mode === "signup" && step === 2 && (
          <div className="space-y-3 px-7 py-6">
            <div>
              <label className="text-xs text-slate-500">Store name</label>
              <input value={storeName} onChange={(e) => { setStoreName(e.target.value); if (!subdomain) setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "")); }} placeholder="Acme Goods" className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-600" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Subdomain</label>
              <div className="mt-1 flex overflow-hidden rounded-lg border border-slate-800">
                <input value={subdomain} onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))} placeholder="acme" className="flex-1 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none" />
                <span className="bg-slate-800 px-3 py-2.5 text-xs text-slate-400">.cloudcommerce.com</span>
              </div>
            </div>
            <button type="button" onClick={() => setStep(3)} disabled={!storeName || !subdomain} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">
              Choose a plan <ArrowRight size={16} />
            </button>
            <button type="button" onClick={() => setStep(1)} className="flex w-full items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-white">
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        )}

        {mode === "signup" && step === 3 && (
          <div className="space-y-3 px-7 py-6">
            {PLANS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setPlan(p.name)}
                className={`flex w-full items-center justify-between rounded-xl border p-4 text-left ${plan === p.name ? "border-violet-600 bg-violet-600/10" : "border-slate-800"}`}
              >
                <div>
                  <p className="font-semibold text-white">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.feats.join(" · ")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">${p.price}<span className="text-xs font-normal text-slate-400">/mo</span></p>
                  {plan === p.name && <Check size={16} className="ml-auto mt-1 text-violet-400" />}
                </div>
              </button>
            ))}
            <button type="button" onClick={finishSignup} className="mt-2 w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              Launch my store
            </button>
            <button type="button" onClick={() => setStep(2)} className="flex w-full items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-white">
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
