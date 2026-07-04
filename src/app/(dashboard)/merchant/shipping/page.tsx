"use client";

import { useState, useEffect, startTransition } from "react";
import { Plus, Pencil, Trash2, Truck, Globe, GripVertical } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { shippingApi } from "@/services/shipping.service";

type Zone = {
  id: string;
  name: string;
  countries: string[];
  states: string[];
  regions: string[];
  zipCodes: string[];
  zipRanges: { start: string; end: string }[] | null;
  rates: Rate[];
};

type Method = {
  id: string;
  name: string;
  type: string;
  configuration: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  rates: { id: string; zoneId: string; price: number }[];
};

type Rate = {
  id: string;
  zoneId: string;
  methodId: string;
  price: number;
  method: { id: string; name: string; type: string };
};

const COUNTRIES = ["US", "CA", "GB", "DE", "FR", "AU", "JP"];
const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

export default function ShippingPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [tab, setTab] = useState<"zones" | "methods">("zones");
  const [editingZone, setEditingZone] = useState<Partial<Zone> | null>(null);
  const [editingMethod, setEditingMethod] = useState<Partial<Method> | null>(
    null,
  );
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [showMethodForm, setShowMethodForm] = useState(false);
  const [rateForm, setRateForm] = useState<{
    zoneId: string;
    methodId: string;
    price: string;
  } | null>(null);

  async function loadData() {
    try {
      const [z, m] = await Promise.all([
        shippingApi.listZones(),
        shippingApi.listMethods(),
      ]);
      setZones(z ?? []);
      setMethods(m ?? []);
    } catch {
      setZones([]);
      setMethods([]);
    }
  }

  useEffect(() => {
    startTransition(() => {
      loadData();
    });
  }, []);

  async function saveZone() {
    if (!editingZone?.name) return;
    try {
      if (editingZone.id) {
        await shippingApi.updateZone(editingZone.id, editingZone);
      } else {
        await shippingApi.createZone(editingZone);
      }
      setShowZoneForm(false);
      setEditingZone(null);
      loadData();
    } catch {
      // silent
    }
  }

  async function deleteZone(id: string) {
    try {
      await shippingApi.deleteZone(id);
      loadData();
    } catch {
      // silent
    }
  }

  async function saveMethod() {
    if (!editingMethod?.name || !editingMethod?.type) return;
    try {
      if (editingMethod.id) {
        await shippingApi.updateMethod(editingMethod.id, editingMethod);
      } else {
        await shippingApi.createMethod(editingMethod);
      }
      setShowMethodForm(false);
      setEditingMethod(null);
      loadData();
    } catch {
      // silent
    }
  }

  async function deleteMethod(id: string) {
    try {
      await shippingApi.deleteMethod(id);
      loadData();
    } catch {
      // silent
    }
  }

  async function saveRate() {
    if (!rateForm) return;
    try {
      await shippingApi.createRate({
        zoneId: rateForm.zoneId,
        methodId: rateForm.methodId,
        price: parseFloat(rateForm.price),
      });
      setRateForm(null);
      loadData();
    } catch {
      // silent
    }
  }

  async function deleteRate(zoneId: string, methodId: string) {
    try {
      await shippingApi.deleteRate({ zoneId, methodId });
      loadData();
    } catch {
      // silent
    }
  }

  return (
    <div>
      <PageHeader
        title="Shipping"
        description="Configure shipping zones, rates, and delivery methods"
      />

      <div className="mb-6 border-b border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setTab("zones")}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              tab === "zones"
                ? "border-[#7C3AED] text-[#F8FAFC]"
                : "border-transparent text-muted-foreground hover:text-[#F8FAFC]"
            }`}
          >
            <Globe size={15} className="inline mr-1.5" />
            Zones
          </button>
          <button
            onClick={() => setTab("methods")}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              tab === "methods"
                ? "border-[#7C3AED] text-[#F8FAFC]"
                : "border-transparent text-muted-foreground hover:text-[#F8FAFC]"
            }`}
          >
            <Truck size={15} className="inline mr-1.5" />
            Methods
          </button>
        </div>
      </div>

      {tab === "zones" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingZone({
                  name: "",
                  countries: ["US"],
                  states: [],
                  regions: [],
                  zipCodes: [],
                });
                setShowZoneForm(true);
              }}
              size="sm"
              className="gap-1.5"
            >
              <Plus size={15} /> Add Zone
            </Button>
          </div>

          {showZoneForm && editingZone && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-semibold text-[#F8FAFC]">
                {editingZone.id ? "Edit Zone" : "New Zone"}
              </h3>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Zone Name
                </label>
                <input
                  value={editingZone.name || ""}
                  onChange={(e) =>
                    setEditingZone({ ...editingZone, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                  placeholder="e.g., Domestic, International, West Coast"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Countries
                </label>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        const next = (editingZone.countries || []).includes(c)
                          ? (editingZone.countries || []).filter((x) => x !== c)
                          : [...(editingZone.countries || []), c];
                        setEditingZone({ ...editingZone, countries: next });
                      }}
                      className={`px-3 py-1 rounded-md text-xs border transition-colors ${
                        (editingZone.countries || []).includes(c)
                          ? "border-[#7C3AED] bg-[#7C3AED]/20 text-[#7C3AED]"
                          : "border-border text-muted-foreground hover:text-[#F8FAFC]"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  States (US)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {US_STATES.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        const next = (editingZone.states || []).includes(s)
                          ? (editingZone.states || []).filter((x) => x !== s)
                          : [...(editingZone.states || []), s];
                        setEditingZone({ ...editingZone, states: next });
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                        (editingZone.states || []).includes(s)
                          ? "border-[#7C3AED] bg-[#7C3AED]/20 text-[#7C3AED]"
                          : "border-border text-muted-foreground hover:text-[#F8FAFC]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowZoneForm(false);
                    setEditingZone(null);
                  }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <Button onClick={saveZone}>
                  Save
                </Button>
              </div>
            </div>
          )}

          {zones.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Globe
                size={40}
                className="mx-auto text-muted-foreground/30 mb-3"
              />
              <p className="text-muted-foreground text-sm">
                No shipping zones configured
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-[#F8FAFC]">{zone.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingZone(zone);
                          setShowZoneForm(true);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-[#F8FAFC] transition-colors"
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
                  <div className="flex flex-wrap gap-2 mb-3">
                    {zone.countries.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded bg-[#1E293B] text-[11px] text-muted-foreground"
                      >
                        {c}
                      </span>
                    ))}
                    {zone.states.slice(0, 5).map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded bg-[#1E293B] text-[11px] text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                    {zone.states.length > 5 && (
                      <span className="px-2 py-0.5 rounded bg-[#1E293B] text-[11px] text-muted-foreground">
                        +{zone.states.length - 5}
                      </span>
                    )}
                  </div>
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground mb-2">
                      Shipping Rates
                    </p>
                    {zone.rates.length === 0 ? (
                      <p className="text-xs text-muted-foreground/50">
                        No rates assigned
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {zone.rates.map((rate) => (
                          <div
                            key={rate.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-[#F8FAFC]">
                              {rate.method.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                ${Number(rate.price).toFixed(2)}
                              </span>
                              <button
                                onClick={() =>
                                  deleteRate(zone.id, rate.methodId)
                                }
                                className="p-0.5 text-muted-foreground hover:text-rose-400 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() =>
                        setRateForm({
                          zoneId: zone.id,
                          methodId: "",
                          price: "",
                        })
                      }
                      className="mt-2 flex items-center gap-1 text-xs text-[#7C3AED] hover:text-[#8B5CF6] transition-colors"
                    >
                      <Plus size={12} /> Add Rate
                    </button>
                    {rateForm && rateForm.zoneId === zone.id && (
                      <div className="mt-3 flex items-center gap-2">
                        <select
                          value={rateForm.methodId}
                          onChange={(e) =>
                            setRateForm({
                              ...rateForm,
                              methodId: e.target.value,
                            })
                          }
                          className="flex-1 rounded-lg border border-border bg-[#09090B] px-2 py-1.5 text-xs text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                        >
                          <option value="">Select method</option>
                          {methods
                            .filter((m) => m.isActive)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.type})
                              </option>
                            ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={rateForm.price}
                          onChange={(e) =>
                            setRateForm({ ...rateForm, price: e.target.value })
                          }
                          className="w-24 rounded-lg border border-border bg-[#09090B] px-2 py-1.5 text-xs text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                          placeholder="0.00"
                        />
                        <Button onClick={saveRate} size="sm">
                          Add
                        </Button>
                        <button
                          onClick={() => setRateForm(null)}
                          className="px-2 py-1.5 text-xs text-muted-foreground hover:text-[#F8FAFC] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "methods" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingMethod({
                  name: "",
                  type: "flat",
                  configuration: { rate: 0 },
                  isActive: true,
                  sortOrder: 0,
                });
                setShowMethodForm(true);
              }}
              size="sm"
              className="gap-1.5"
            >
              <Plus size={15} /> Add Method
            </Button>
          </div>

          {showMethodForm && editingMethod && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-semibold text-[#F8FAFC]">
                {editingMethod.id ? "Edit Method" : "New Method"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Method Name
                  </label>
                  <input
                    value={editingMethod.name || ""}
                    onChange={(e) =>
                      setEditingMethod({
                        ...editingMethod,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                    placeholder="e.g., Standard, Express"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    Type
                  </label>
                  <select
                    value={editingMethod.type || "flat"}
                    onChange={(e) =>
                      setEditingMethod({
                        ...editingMethod,
                        type: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                  >
                    <option value="flat">Flat Rate</option>
                    <option value="weight_based">Weight Based</option>
                    <option value="price_based">Order Value Based</option>
                    <option value="free">Free Shipping</option>
                  </select>
                </div>
              </div>

              {(editingMethod.type === "flat" ||
                editingMethod.type === "weight_based" ||
                editingMethod.type === "price_based") && (
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {editingMethod.type === "weight_based"
                      ? "Rate per unit weight ($)"
                      : "Rate ($)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={(editingMethod.configuration?.rate as number) ?? 0}
                    onChange={(e) =>
                      setEditingMethod({
                        ...editingMethod,
                        configuration: {
                          ...editingMethod.configuration,
                          rate: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full max-w-xs rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                  />
                </div>
              )}

              {editingMethod.type === "price_based" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Minimum Order ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        (editingMethod.configuration?.minOrder as number) ?? 0
                      }
                      onChange={(e) =>
                        setEditingMethod({
                          ...editingMethod,
                          configuration: {
                            ...editingMethod.configuration,
                            minOrder: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Maximum Order ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        (editingMethod.configuration?.maxOrder as number) ?? ""
                      }
                      onChange={(e) => {
                        const val = e.target.value
                          ? parseFloat(e.target.value)
                          : undefined;
                        setEditingMethod({
                          ...editingMethod,
                          configuration: {
                            ...editingMethod.configuration,
                            maxOrder: val,
                          },
                        });
                      }}
                      className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                      placeholder="No max"
                    />
                  </div>
                </div>
              )}

              {editingMethod.type === "weight_based" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Min Weight
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={
                        (editingMethod.configuration?.minWeight as number) ?? 0
                      }
                      onChange={(e) =>
                        setEditingMethod({
                          ...editingMethod,
                          configuration: {
                            ...editingMethod.configuration,
                            minWeight: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Max Weight
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={
                        (editingMethod.configuration?.maxWeight as number) ?? ""
                      }
                      onChange={(e) => {
                        const val = e.target.value
                          ? parseFloat(e.target.value)
                          : undefined;
                        setEditingMethod({
                          ...editingMethod,
                          configuration: {
                            ...editingMethod.configuration,
                            maxWeight: val,
                          },
                        });
                      }}
                      className="w-full rounded-lg border border-border bg-[#09090B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                      placeholder="No max"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={editingMethod.isActive ?? true}
                    onChange={(e) =>
                      setEditingMethod({
                        ...editingMethod,
                        isActive: e.target.checked,
                      })
                    }
                    className="rounded border-border"
                  />
                  Active
                </label>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingMethod.sortOrder ?? 0}
                    onChange={(e) =>
                      setEditingMethod({
                        ...editingMethod,
                        sortOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-20 rounded-lg border border-border bg-[#09090B] px-2 py-1.5 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowMethodForm(false);
                    setEditingMethod(null);
                  }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <Button onClick={saveMethod}>
                  Save
                </Button>
              </div>
            </div>
          )}

          {methods.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Truck
                size={40}
                className="mx-auto text-muted-foreground/30 mb-3"
              />
              <p className="text-muted-foreground text-sm">
                No shipping methods configured
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {methods.map((method) => (
                <div
                  key={method.id}
                  className="rounded-xl border border-border bg-card p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical
                      size={16}
                      className="text-muted-foreground/30"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[#F8FAFC] text-sm">
                          {method.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            method.type === "flat"
                              ? "bg-blue-500/10 text-blue-400"
                              : method.type === "weight_based"
                                ? "bg-amber-500/10 text-amber-400"
                                : method.type === "price_based"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {method.type.replace("_", " ")}
                        </span>
                        {!method.isActive && (
                          <span className="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {method.type === "flat" &&
                          `$${Number((method.configuration?.rate as number) ?? 0).toFixed(2)} flat rate`}
                        {method.type === "weight_based" &&
                          `$${Number((method.configuration?.rate as number) ?? 0).toFixed(2)} / unit weight`}
                        {method.type === "price_based" &&
                          `$${Number((method.configuration?.rate as number) ?? 0).toFixed(2)} (min: $${method.configuration?.minOrder ?? 0})`}
                        {method.type === "free" && "Free shipping"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingMethod(method);
                        setShowMethodForm(true);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-[#F8FAFC] transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteMethod(method.id)}
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
    </div>
  );
}
