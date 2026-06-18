"use client";
import React from "react";
import { User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

export default function AccountProfilePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");

  React.useEffect(() => {
    fetch("/api/v1/account/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
      })
      .then((data) => {
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/v1/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || undefined }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
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
            <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-[#09090B]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-[#F8FAFC]">Profile</h2>
      <p className="mb-6 text-sm text-muted-foreground">Manage your account information.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-[#09090B] px-4 py-3">
          <User size={16} className="text-muted-foreground shrink-0" />
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-sm text-[#F8FAFC] outline-none placeholder:text-muted-foreground"
              placeholder="Your name"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-[#09090B] px-4 py-3">
          <Mail size={16} className="text-muted-foreground shrink-0" />
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Email</label>
            <input
              value={email}
              disabled
              className="w-full bg-transparent text-sm text-[#F8FAFC] outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-[#09090B] px-4 py-3">
          <Phone size={16} className="text-muted-foreground shrink-0" />
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-transparent text-sm text-[#F8FAFC] outline-none placeholder:text-muted-foreground"
              placeholder="Optional"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#8B5CF6] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
