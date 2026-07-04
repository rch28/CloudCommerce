"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { InputField } from "@/components/ui/form-inputs/InputField";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function CustomerRegisterPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);
  const router = useRouter();
  const customerSignUp = useAuthStore((s) => s.customerSignUp);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function handleSubmit(values: RegisterFormValues) {
    setApiError("");
    setLoading(true);
    try {
      await customerSignUp({ ...values, tenantId: tenant });
      router.push(`/store/${tenant}/account`);
      router.refresh();
    } catch (err: any) {
      setApiError(err?.response?.data?.error || "Registration failed");
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
          <h1 className="mt-4 text-xl font-bold text-[#F8FAFC]">Create account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Register to manage your orders and addresses.</p>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <InputField
            control={form.control}
            name="name"
            label="Full name"
            placeholder="John Doe"
            required
          />
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
            placeholder="At least 6 characters"
            type="password"
            required
          />

          {apiError && <p className="text-sm text-rose-400">{apiError}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            variant="gradient"
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={`/store/${tenant}/auth/login`} className="font-medium text-violet-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
