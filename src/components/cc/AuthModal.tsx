"use client";
import { useState } from "react";
import { X, Zap, ArrowLeft, ShoppingBag, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useAuthStore, type Role } from "@/stores/auth-store";
import { InputField } from "@/components/ui/form-inputs/InputField";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

const ROLES: { id: Role; label: string; desc: string; icon: typeof ShoppingBag }[] = [
  { id: "merchant", label: "Merchant", desc: "Manage your store and products", icon: ShoppingBag },
  { id: "admin", label: "Admin", desc: "Platform administration", icon: ShieldCheck },
];

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>("merchant");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  if (!open) return null;

  const reset = () => { setStep(1); setMode("signin"); setApiError(""); loginForm.reset(); signUpForm.reset(); };
  const close = () => { reset(); onClose(); };

  const handleSignIn = async (values: LoginFormValues) => {
    setApiError("");
    setLoading(true);
    try {
      const session = await signIn(values.email, values.password);
      close();
      router.push(session.role === "admin" ? "/admin" : "/merchant");
      router.refresh();
    } catch (err: any) {
      setApiError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (values: SignUpFormValues) => {
    setApiError("");
    setLoading(true);
    try {
      const session = await signUp({ ...values, role });
      close();
      router.push(session.role === "admin" ? "/admin" : "/merchant");
      router.refresh();
    } catch (err: any) {
      setApiError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={close}>
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={close} className="absolute right-4 top-4 z-10 text-muted-foreground hover:text-white">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center px-7 pt-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-900/40">
            <Zap size={22} className="text-white" fill="white" />
          </div>

          {mode === "signin" ? (
            <>
              <h2 className="mt-3 text-xl font-bold text-white">Welcome back</h2>
              <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>

              <form onSubmit={loginForm.handleSubmit(handleSignIn)} className="mt-6 w-full space-y-4">
                <InputField
                  control={loginForm.control}
                  name="email"
                  label="Email"
                  placeholder="you@example.com"
                  type="email"
                  required
                />
                <InputField
                  control={loginForm.control}
                  name="password"
                  label="Password"
                  placeholder="Enter your password"
                  type="password"
                  required
                />

                {apiError && <p className="text-sm text-rose-400">{apiError}</p>}

                <Button
                  type="submit" disabled={loading}
                  className="w-full"
                  variant="gradient"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <p className="mt-4 text-sm text-muted-foreground">
                No account?{" "}
                <button onClick={() => { setMode("signup"); setStep(1); setApiError(""); }} className="font-medium text-violet-400 hover:underline">
                  Create one
                </button>
              </p>
            </>
          ) : step === 1 ? (
            <>
              <h2 className="mt-3 text-xl font-bold text-white">Create account</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose your account type</p>

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
                          : "border-border bg-card hover:border-violet-600/50"
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/20">
                        <Icon size={20} className="text-violet-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{r.label}</p>
                        <p className="text-sm text-muted-foreground">{r.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="font-medium text-violet-400 hover:underline">Sign in</button>
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-xl font-bold text-white">Account details</h2>
              <p className="mt-1 text-sm text-muted-foreground">Fill in your information</p>

              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="mt-6 w-full space-y-4">
                <InputField
                  control={signUpForm.control}
                  name="name"
                  label="Full name"
                  placeholder="John Doe"
                  required
                />
                <InputField
                  control={signUpForm.control}
                  name="email"
                  label="Email"
                  placeholder="you@example.com"
                  type="email"
                  required
                />
                <InputField
                  control={signUpForm.control}
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
                    className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:text-white"
                  >
                    <ArrowLeft size={16} className="inline" /> Back
                  </button>
                  <Button
                    type="submit" disabled={loading}
                    className="flex-1"
                    variant="gradient"
                  >
                    {loading ? "Creating..." : `Create ${role} account`}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
