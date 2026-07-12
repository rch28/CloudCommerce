"use client";
import React from "react";
import { MapPin, Plus, Pencil, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { accountApi } from "@/services/account.service";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const LABELS = ["Home", "Work", "Other"];

interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

const emptyForm = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  isDefault: false,
};

export default function AccountAddressesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = React.use(params);

  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(emptyForm);

  const fetchAddresses = React.useCallback(async () => {
    const data = await accountApi.listAddresses();
    setAddresses(data);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await accountApi.listAddresses();
      if (!cancelled) setAddresses(data);
    })().catch(() => { if (!cancelled) toast.error("Failed to load addresses"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const openForm = (addr?: Address) => {
    if (addr) {
      setForm({
        label: addr.label,
        line1: addr.line1,
        line2: addr.line2 ?? "",
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country,
        isDefault: addr.isDefault,
      });
      setEditingId(addr.id);
    } else {
      setForm(emptyForm);
      setEditingId(null);
    }
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await accountApi.updateAddress(editingId, form);
      } else {
        await accountApi.createAddress(form);
      }
      toast.success(editingId ? "Address updated" : "Address added");
      closeForm();
      fetchAddresses();
    } catch {
      toast.error("Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try {
      await accountApi.deleteAddress(id);
      toast.success("Address deleted");
      fetchAddresses();
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await accountApi.setDefaultAddress(id);
      toast.success("Default address updated");
      fetchAddresses();
    } catch {
      toast.error("Failed to set default address");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 animate-pulse rounded bg-border" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-border" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 h-5 w-20 animate-pulse rounded bg-border" />
            <div className="mb-1 h-4 w-48 animate-pulse rounded bg-border" />
            <div className="h-4 w-36 animate-pulse rounded bg-border" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Addresses</h2>
        {!formOpen && (
          <Button onClick={() => openForm()} size="sm" className="gap-1.5">
            <Plus size={14} /> Add Address
          </Button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            {editingId ? "Edit Address" : "New Address"}
          </h3>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Label</label>
            <select
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
            >
              {LABELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Address Line 1 <span className="text-rose-400">*</span>
            </label>
            <input
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="123 Main St"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Address Line 2</label>
            <input
              value={form.line2}
              onChange={(e) => setForm({ ...form, line2: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Apt, suite, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                City <span className="text-rose-400">*</span>
              </label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="San Francisco"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                State <span className="text-rose-400">*</span>
              </label>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
              >
                <option value="">Select</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                ZIP <span className="text-rose-400">*</span>
              </label>
              <input
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="94105"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Country</label>
              <input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-[#7C3AED]"
            />
            <span className="text-sm text-foreground">Set as default address</span>
          </label>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Add"}
            </Button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !formOpen ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <MapPin size={48} className="text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No saved addresses</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-[#7C3AED]/20 px-2 py-0.5 text-[10px] font-medium text-[#7C3AED]">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{addr.line1}</p>
                  {addr.line2 && <p className="text-sm text-muted-foreground">{addr.line2}</p>}
                  <p className="text-sm text-muted-foreground">
                    {addr.city}, {addr.state} {addr.zip}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-4">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-[#7C3AED]/20 hover:text-[#7C3AED]"
                      title="Set as default"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => openForm(addr)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-rose-500/20 hover:text-rose-400"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
