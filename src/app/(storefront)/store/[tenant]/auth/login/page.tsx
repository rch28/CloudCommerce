"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { storefrontApi } from "@/services/storefront.service";

export default function CustomerLoginPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { mergeAfterLogin } = useCart();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await storefrontApi.customerLogin({ email, password });
      await mergeAfterLogin();
      router.push(redirect || `/store/${tenant}/account`);
      router.refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Login failed");
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
          <h1 className="mt-4 text-xl font-bold text-[#F8FAFC]">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Access your account to manage orders and addresses.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-violet-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href={`/store/${tenant}/auth/register`} className="font-medium text-violet-400 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
