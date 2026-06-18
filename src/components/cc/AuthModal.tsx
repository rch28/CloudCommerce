"use client";
import { useState } from "react";
import { X, Zap, Check, ArrowRight, ArrowLeft, ShoppingBag, ShieldCheck } from "lucide-react";
import { useAuth, type Plan, type Role } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const PLANS: { name: Plan; price: number; feats: string[] }[] = [
  { name: "Starter", price: 29, feats: ["100 products", "Basic analytics"] },
  { name: "Growth", price: 79, feats: ["1,000 products", "Real-time sync", "Custom domain"] },
  { name: "Scale", price: 199, feats: ["Unlimited products", "Priority support", "API access"] },
];

const ROLES: { id: Role; label: string; desc: string; icon: typeof ShoppingBag }[] = [
  { id: "merchant", label: "Merchant", desc: "Manage your store and products", icon: ShoppingBag },
  { id: "admin", label: "Admin", desc: "Platform administration", icon: ShieldCheck },
];

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("merchant");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [plan, setPlan] = useState<Plan>("Growth");

  if (!open) return null;

  const reset = () => { setStep(1); setMode("signin"); setError(""); };
  const close = () => { reset(); onClose(); };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      close();
      router.push(role === "admin" ? "/admin" : "/merchant");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) return;
    setError("");
    setLoading(true);
    try {
      await signUp({ email, password, name, role });
      close();
      router.push(role === "admin" ? "/admin" : "/merchant");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
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

          {mode === "signin" ? (
            <>
              <h2 className="mt-3 text-xl font-bold text-white">Welcome back</h2>
              <p className="mt-1 text-sm text-slate-400">Sign in to your account</p>

              <form onSubmit={handleSignIn} className="mt-6 w-full space-y-4">
                <div>
                  <label className="text-sm text-slate-400">Email</label>
                  <input
                    type="email" value={email} required
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Password</label>
                  <input
                    type="password" value={password} required
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500"
                    placeholder="Enter your password"
                  />
                </div>

                {error && <p className="text-sm text-rose-400">{error}</p>}

                <button
                  type="submit" disabled={loading}
                  className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <p className="mt-4 text-sm text-slate-400">
                No account?{" "}
                <button onClick={() => { setMode("signup"); setStep(1); setError(""); }} className="font-medium text-violet-400 hover:underline">
                  Create one
                </button>
              </p>
            </>
          ) : step === 1 ? (
            <>
              <h2 className="mt-3 text-xl font-bold text-white">Create account</h2>
              <p className="mt-1 text-sm text-slate-400">Choose your account type</p>

              <div className="mt-6 w-full space-y-3">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => { setRole(r.id); setStep(2); }}
                      className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                        role === r.id
                          ? "border-violet-600 bg-violet-600/10"
                          : "border-slate-800 bg-slate-900 hover:border-violet-600/50"
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/20">
                        <Icon size={20} className="text-violet-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{r.label}</p>
                        <p className="text-sm text-slate-400">{r.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-sm text-slate-400">
                Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="font-medium text-violet-400 hover:underline">Sign in</button>
              </p>
            </>
          ) : step === 2 ? (
            <>
              <h2 className="mt-3 text-xl font-bold text-white">Account details</h2>
              <p className="mt-1 text-sm text-slate-400">Fill in your information</p>

              <div className="mt-6 w-full space-y-4">
                <div>
                  <label className="text-sm text-slate-400">Full name</label>
                  <input
                    type="text" value={name} required
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Email</label>
                  <input
                    type="email" value={email} required
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Password</label>
                  <input
                    type="password" value={password} required minLength={6}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500"
                    placeholder="At least 6 characters"
                  />
                </div>

                {error && <p className="text-sm text-rose-400">{error}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="rounded-lg border border-slate-800 px-4 py-2.5 text-sm text-slate-400 hover:text-white"
                  >
                    <ArrowLeft size={16} className="inline" /> Back
                  </button>
                  <button
                    onClick={handleSignUp} disabled={loading || !name || !email || !password}
                    className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
                  >
                    {loading ? "Creating..." : `Create ${role} account`}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
