"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/schemas";
import { InputField } from "@/components/ui/form-inputs/InputField";
import { useAuthStore } from "@/stores/auth-store";
import { useCart } from "@/contexts/CartContext";
import type { z } from "zod/v4";
import { Button } from "@/components/ui/button";

type LoginFormValues = z.infer<typeof loginSchema>;

export default function CustomerLoginPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const customerSignIn = useAuthStore((s) => s.customerSignIn);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const { mergeAfterLogin } = useCart();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function handleSubmit(values: LoginFormValues) {
    setApiError("");
    setLoading(true);
    try {
      await customerSignIn(values.email, values.password, tenant);
      await mergeAfterLogin();
      router.push(redirect || `/store/${tenant}/account`);
      router.refresh();
    } catch (err: any) {
      setApiError(err?.response?.data?.error || "Login failed");
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            variant="gradient"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
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
