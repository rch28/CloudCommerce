"use client";
import React from "react";
import { User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { accountApi } from "@/services/account.service";

export default function AccountProfilePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const data = await accountApi.getProfile();
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await accountApi.updateProfile({ name, phone: phone || undefined });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 h-6 w-24 animate-pulse rounded bg-border" />
        <div className="mb-6 h-4 w-48 animate-pulse rounded bg-border" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-background" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Profile</h2>
      <p className="mb-6 text-sm text-muted-foreground">Manage your account information.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
          <User size={16} className="text-muted-foreground shrink-0" />
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Your name"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
          <Mail size={16} className="text-muted-foreground shrink-0" />
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Email</label>
            <input
              value={email}
              disabled
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
          <Phone size={16} className="text-muted-foreground shrink-0" />
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Optional"
            />
          </div>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
