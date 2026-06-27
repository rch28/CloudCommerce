"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/schemas";
import { InputField } from "@/components/ui/form-inputs/InputField";
import { useAuthStore } from "@/stores/auth-store";
import type { z } from "zod/v4";
import { ApiError } from "@/lib/axios";

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const signIn = useAuthStore((s) => s.signIn);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function handleSubmit(values: LoginFormValues) {
    setApiError("");
    setLoading(true);
    try {
      const session = await signIn(values.email, values.password);
      const dest = redirectTo || (session.role === "admin" ? "/admin" : "/merchant/dashboard");
      router.push(dest);
      router.refresh();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.data?.error || err.message : "Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-900/40">
          <Zap size={22} className="text-white" fill="white" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-[#F8FAFC]">Sign in to CloudCommerce</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue</p>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <InputField
          control={form.control}
          name="email"
          label="Email"
          placeholder="you@example.com"
          type="email"
          required
        />
        <InputField
          control={form.control}
          name="password"
          label="Password"
          placeholder="Enter your password"
          type="password"
          required
        />

        {apiError && (
          <p className="text-sm text-rose-400">{apiError}</p>
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
        <Link href="/auth/register" className="font-medium text-violet-400 hover:underline">
          Create one
        </Link>
      </p>

      <div className="mt-8 rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Demo credentials</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Admin: <span className="text-[#F8FAFC]">admin@cloudcommerce.com</span> / <span className="text-[#F8FAFC]">admin123</span></p>
          <p>Merchant: <span className="text-[#F8FAFC]">merchant@demo.com</span> / <span className="text-[#F8FAFC]">merchant123</span></p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] p-4">
      <Suspense fallback={<div className="h-32 w-full max-w-sm animate-pulse rounded-xl bg-slate-800" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
