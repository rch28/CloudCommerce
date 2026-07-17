"use client";

import { useState, useEffect, useCallback } from "react";
import { taxApi } from "@/services/tax.service";
import {
  Globe, Percent, MapPin, Plus, Pencil, Trash2,
  Loader2, AlertCircle, Settings,
} from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import ErrorState from "@/components/dashboard/error-state";
import EmptyState from "@/components/dashboard/empty-state";
import LoadingSkeleton from "@/components/dashboard/loading-skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SearchField from "@/components/ui/form-inputs/SearchField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/useDebounce";

interface TaxZone {
  id: string;
  name: string;
  type: string;
  country: string;
  state: string | null;
  region: string | null;
  zipCodes: string[];
  isActive: boolean;
  rates: TaxRate[];
}

interface TaxRate {
  id: string;
  zoneId: string;
  name: string;
  type: string;
  rate: number;
  priority: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  zone?: { id: string; name: string };
}

const TAX_TYPES = ["country", "state", "region"] as const;
const RATE_TYPES = ["percentage", "compound"] as const;
const PROVIDERS = [
  { value: "builtin", label: "Built-in" },
  { value: "taxjar", label: "TaxJar" },
  { value: "avalara", label: "Avalara" },
];

export default function TaxSettingsView() {
  const [tab, setTab] = useState<"zones" | "rates" | "settings">("zones");
  const [zones, setZones] = useState<TaxZone[]>([]);
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [zoneDialog, setZoneDialog] = useState(false);
  const [editingZone, setEditingZone] = useState<Partial<TaxZone> | null>(null);

  const [rateDialog, setRateDialog] = useState(false);
  const [editingRate, setEditingRate] = useState<Partial<TaxRate> | null>(null);

  const [provider, setProvider] = useState("builtin");
  const [saving, setSaving] = useState(false);

  const fetchZones = useCallback(async () => {
    try {
      const params: Record<string, string> = { pageSize: "100" };
      if (debouncedSearch) params.search = debouncedSearch;
      const data = await taxApi.listZones(params);
      setZones((data as any).items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tax zones");
    }
  }, [debouncedSearch]);

  const fetchRates = useCallback(async () => {
    try {
      const data = await taxApi.listRates({ pageSize: "100" });
      setRates((data as any).items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tax rates");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchZones(), fetchRates()]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [fetchZones, fetchRates]);

  async function saveZone() {
    if (!editingZone?.name) return;
    setSaving(true);
    try {
      if (editingZone.id) {
        await taxApi.updateZone(editingZone.id, editingZone);
      } else {
        await taxApi.createZone(editingZone);
      }
      setZoneDialog(false);
      setEditingZone(null);
      await Promise.all([fetchZones(), fetchRates()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save zone");
    }
    setSaving(false);
  }

  async function deleteZone(id: string) {
    setSaving(true);
    try {
      await taxApi.deleteZone(id);
      await Promise.all([fetchZones(), fetchRates()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete zone");
    }
    setSaving(false);
  }

  async function saveRate() {
    if (!editingRate?.name || !editingRate?.zoneId || editingRate?.rate === undefined) return;
    setSaving(true);
    try {
      if (editingRate.id) {
        await taxApi.updateRate(editingRate.id, editingRate);
      } else {
        await taxApi.createRate(editingRate);
      }
      setRateDialog(false);
      setEditingRate(null);
      await Promise.all([fetchZones(), fetchRates()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save rate");
    }
    setSaving(false);
  }

  async function deleteRate(id: string) {
    setSaving(true);
    try {
      await taxApi.deleteRate(id);
      await Promise.all([fetchZones(), fetchRates()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete rate");
    }
    setSaving(false);
  }

  if (loading) return <div className="p-6"><LoadingSkeleton variant="page" /></div>;
  if (error && zones.length === 0 && rates.length === 0) {
    return (
      <div className="p-6">
        <PageHeader title="Tax" description="Manage tax zones, rates, and settings" />
        <ErrorState message={error} onRetry={() => { setError(null); setLoading(true); Promise.all([fetchZones(), fetchRates()]).then(() => setLoading(false)); }} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Tax" description="Manage tax zones, rates, and settings" />

      <div className="mb-6 border-b border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setTab("zones")}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              tab === "zones"
                ? "border-[#7C3AED] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe size={15} className="inline mr-1.5" />
            Tax Zones
          </button>
          <button
            onClick={() => setTab("rates")}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              tab === "rates"
                ? "border-[#7C3AED] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Percent size={15} className="inline mr-1.5" />
            Tax Rates
          </button>
          <button
            onClick={() => setTab("settings")}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              tab === "settings"
                ? "border-[#7C3AED] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings size={15} className="inline mr-1.5" />
            Settings
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertCircle size={15} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-rose-400/70 hover:text-rose-400">Dismiss</button>
        </div>
      )}

      {tab === "zones" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <SearchField
              searchQuery={search}
              setSearchQuery={setSearch}
              placeholder="Search zones..."
              className="max-w-xs"
            />
            <Button
              onClick={() => {
                setEditingZone({ name: "", type: "country", country: "US", zipCodes: [], isActive: true });
                setZoneDialog(true);
              }}
              className="gap-1.5"
            >
              <Plus size={15} /> Add Zone
            </Button>
          </div>

          {zones.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="No tax zones configured"
              description="Create your first tax zone to start calculating taxes based on customer location."
              action={
                <Button
                  onClick={() => {
                    setEditingZone({ name: "", type: "country", country: "US", zipCodes: [], isActive: true });
                    setZoneDialog(true);
                  }}
                >
                  <Plus size={15} /> Create Zone
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {zones.map((zone) => (
                <div key={zone.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{zone.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400 capitalize">{zone.type}</span>
                      {!zone.isActive && (
                        <span className="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">Inactive</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingZone(zone);
                          setZoneDialog(true);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteZone(zone.id)}
                        className="p-1.5 text-muted-foreground hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <MapPin size={12} />
                    <span>{zone.country}</span>
                    {zone.state && <span>· {zone.state}</span>}
                    {zone.region && <span>· {zone.region}</span>}
                    {zone.zipCodes.length > 0 && <span>· {zone.zipCodes.length} ZIP(s)</span>}
                    <span className="ml-auto">{zone.rates.length} rate(s)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "rates" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingRate({ name: "", zoneId: "", type: "percentage", rate: 0, priority: 0, isActive: true });
                setRateDialog(true);
              }}
              className="gap-1.5"
            >
              <Plus size={15} /> Add Rate
            </Button>
          </div>

          {rates.length === 0 ? (
            <EmptyState
              icon={Percent}
              title="No tax rates configured"
              description="Add tax rates to your zones to define how much tax should be applied."
              action={
                <Button
                  onClick={() => {
                    setEditingRate({ name: "", zoneId: "", type: "percentage", rate: 0, priority: 0, isActive: true });
                    setRateDialog(true);
                  }}
                >
                  <Plus size={15} /> Create Rate
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {rates.map((rate) => (
                <div key={rate.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground text-sm">{rate.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          rate.type === "percentage"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {rate.type}
                        </span>
                        {!rate.isActive && (
                          <span className="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rate.zone?.name ?? "Unknown zone"} · {(Number(rate.rate) * 100).toFixed(2)}% · Priority {rate.priority}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingRate(rate);
                        setRateDialog(true);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteRate(rate.id)}
                      className="p-1.5 text-muted-foreground hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "settings" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 max-w-md">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Settings size={16} /> Tax Provider
          </h3>
          <p className="text-sm text-muted-foreground">
            Choose which provider handles tax calculation. Built-in uses your configured zones and rates.
          </p>
          <div>
            <Label>Provider</Label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[#7C3AED]"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            Set TAX_PROVIDER environment variable to persist this setting. Current: <code className="text-[#7C3AED]">{provider}</code>
          </p>
        </div>
      )}

      {/* Zone Dialog */}
      <Dialog open={zoneDialog} onOpenChange={setZoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingZone?.id ? "Edit Tax Zone" : "Create Tax Zone"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Zone Name <span className="text-red-500">*</span></Label>
              <Input
                value={editingZone?.name ?? ""}
                onChange={(e) => setEditingZone((prev) => ({ ...prev!, name: e.target.value }))}
                placeholder="e.g., US Domestic, California"
              />
            </div>
            <div>
              <Label>Type</Label>
              <select
                value={editingZone?.type ?? "country"}
                onChange={(e) => setEditingZone((prev) => ({ ...prev!, type: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[#7C3AED]"
              >
                {TAX_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={editingZone?.country ?? "US"}
                onChange={(e) => setEditingZone((prev) => ({ ...prev!, country: e.target.value }))}
                placeholder="US"
              />
            </div>
            <div>
              <Label>State (optional)</Label>
              <Input
                value={editingZone?.state ?? ""}
                onChange={(e) => setEditingZone((prev) => ({ ...prev!, state: e.target.value || null }))}
                placeholder="e.g., CA"
              />
            </div>
            <div>
              <Label>Region (optional)</Label>
              <Input
                value={editingZone?.region ?? ""}
                onChange={(e) => setEditingZone((prev) => ({ ...prev!, region: e.target.value || null }))}
                placeholder="e.g., West Coast"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="zone-active"
                checked={editingZone?.isActive ?? true}
                onChange={(e) => setEditingZone((prev) => ({ ...prev!, isActive: e.target.checked }))}
                className="rounded border-border"
              />
              <Label htmlFor="zone-active" className="mb-0">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setZoneDialog(false); setEditingZone(null); }}>Cancel</Button>
            <Button onClick={saveZone} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-1.5 animate-spin" />}
              {editingZone?.id ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rate Dialog */}
      <Dialog open={rateDialog} onOpenChange={setRateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRate?.id ? "Edit Tax Rate" : "Create Tax Rate"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rate Name <span className="text-red-500">*</span></Label>
              <Input
                value={editingRate?.name ?? ""}
                onChange={(e) => setEditingRate((prev) => ({ ...prev!, name: e.target.value }))}
                placeholder="e.g., VAT, Sales Tax"
              />
            </div>
            <div>
              <Label>Tax Zone <span className="text-red-500">*</span></Label>
              <select
                value={editingRate?.zoneId ?? ""}
                onChange={(e) => setEditingRate((prev) => ({ ...prev!, zoneId: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[#7C3AED]"
              >
                <option value="">Select zone</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Type</Label>
              <select
                value={editingRate?.type ?? "percentage"}
                onChange={(e) => setEditingRate((prev) => ({ ...prev!, type: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[#7C3AED]"
              >
                {RATE_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Rate (decimal, e.g. 0.08 for 8%) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={editingRate?.rate ?? 0}
                onChange={(e) => setEditingRate((prev) => ({ ...prev!, rate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Input
                type="number"
                min="0"
                value={editingRate?.priority ?? 0}
                onChange={(e) => setEditingRate((prev) => ({ ...prev!, priority: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rate-active"
                checked={editingRate?.isActive ?? true}
                onChange={(e) => setEditingRate((prev) => ({ ...prev!, isActive: e.target.checked }))}
                className="rounded border-border"
              />
              <Label htmlFor="rate-active" className="mb-0">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRateDialog(false); setEditingRate(null); }}>Cancel</Button>
            <Button onClick={saveRate} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-1.5 animate-spin" />}
              {editingRate?.id ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
