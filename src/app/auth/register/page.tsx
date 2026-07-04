"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, ShoppingBag, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Form } from "@/components/ui/form";
import { InputField } from "@/components/ui/form-inputs/InputField";
import { useAuthStore } from "@/stores/auth-store";
import type { Role } from "@/stores/auth-store";
import { ApiError } from "@/lib/axios";
import { Button } from "@/components/ui/button";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const ROLES: { id: Role; label: string; desc: string; icon: typeof ShoppingBag }[] = [
  { id: "merchant", label: "Merchant", desc: "Manage your store and products", icon: ShoppingBag },
  { id: "admin", label: "Admin", desc: "Platform administration", icon: ShieldCheck },
];

export default function RegisterPage() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>("merchant");
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
      await signUp({ ...values, role });
      const dest = role === "admin" ? "/admin" : "/merchant";
      router.push(dest);
      router.refresh();
    } catch (err) {
      setApiError(err instanceof ApiError ? err.data?.error || err.message : "Connection error. Please try again.");
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
          <Form {...form}>
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

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-[#F8FAFC]"
                >
                  Back
                </button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                  variant="gradient"
                >
                  {loading ? "Creating account..." : `Create ${role} account`}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
