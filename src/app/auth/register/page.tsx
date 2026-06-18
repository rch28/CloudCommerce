"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Building2, ShoppingBag, ShieldCheck } from "lucide-react";

const ROLES = [
  { id: "merchant", label: "Merchant", desc: "Manage your store and products", icon: ShoppingBag },
  { id: "admin", label: "Admin", desc: "Platform administration", icon: ShieldCheck },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("merchant");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      const dest = role === "admin" ? "/admin" : "/merchant";
      router.push(dest);
      router.refresh();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-900/40">
            <Zap size={22} className="text-white" fill="white" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-[#F8FAFC]">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 1 ? "Choose your account type" : "Fill in your details"}
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-3">
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => { setRole(r.id); setStep(2); }}
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                    role === r.id
                      ? "border-violet-600 bg-violet-600/10"
                      : "border-border bg-card hover:border-violet-600/50"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/20">
                    <Icon size={20} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium text-[#F8FAFC]">{r.label}</p>
                    <p className="text-sm text-muted-foreground">{r.desc}</p>
                  </div>
                </button>
              );
            })}
            <p className="pt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-violet-400 hover:underline">Sign in</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
                placeholder="At least 6 characters"
              />
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-[#F8FAFC]"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                {loading ? "Creating account..." : `Create ${role} account`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
