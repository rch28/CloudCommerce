"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Loader2 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { productsApi } from "@/services/products.service";

interface OptionValue {
  label: string;
  value: string;
}

interface OptionGroup {
  id: string;
  name: string;
  values: OptionValue[];
}

interface OptionManagerProps {
  productId: string;
  onVariantsGenerated?: (count: number) => void;
}

export default function OptionManager({ productId, onVariantsGenerated }: OptionManagerProps) {
  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [basePrice, setBasePrice] = useState(0);
  const [baseSku, setBaseSku] = useState("");

  useEffect(() => {
    loadOptions();
  }, [productId]);

  async function loadOptions() {
    try {
      const data = await productsApi.getOptions(productId);
      setGroups(data.map((o: any) => ({
        id: o.id,
        name: o.name,
        values: (o.values || []).map((v: any) => ({ label: v.label, value: v.value })),
      })));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function addGroup() {
    setGroups((prev) => [...prev, { id: `new-${Date.now()}`, name: "", values: [] }]);
  }

  function removeGroup(index: number) {
    setGroups((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGroupName(index: number, name: string) {
    setGroups((prev) => prev.map((g, i) => (i === index ? { ...g, name } : g)));
  }

  function addValue(groupIndex: number) {
    setGroups((prev) => prev.map((g, i) => (i === groupIndex ? { ...g, values: [...g.values, { label: "", value: "" }] } : g)));
  }

  function removeValue(groupIndex: number, valueIndex: number) {
    setGroups((prev) => prev.map((g, i) => (i === groupIndex ? { ...g, values: g.values.filter((_, vi) => vi !== valueIndex) } : g)));
  }

  function updateValue(groupIndex: number, valueIndex: number, field: "label" | "value", val: string) {
    setGroups((prev) => prev.map((g, i) => (i === groupIndex ? {
      ...g,
      values: g.values.map((v, vi) => (vi === valueIndex ? { ...v, [field]: val } : v)),
    } : g)));
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const payload = {
        productId,
        options: groups.map((g) => ({
          name: g.name,
          values: g.values.map((v) => (v.value || v.label)),
        })),
        basePrice,
        baseSku,
      };
      const results = await productsApi.generateVariants(payload);
      onVariantsGenerated?.(results.length);
      await loadOptions();
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <LoadingSpinner size={16} text="Loading options..." className="py-8" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Option Groups</h3>
        <Button type="button" variant="outline" size="sm" onClick={addGroup} className="border-border text-muted-foreground hover:text-foreground">
          <Plus size={14} className="mr-1" /> Add Group
        </Button>
      </div>

      {groups.length === 0 && (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center">
          <p className="text-xs text-muted-foreground">No option groups defined yet — add Size, Color, Material, etc.</p>
        </div>
      )}

      <div className="space-y-3">
        {groups.map((group, gi) => (
          <div key={group.id} className="rounded-lg border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex-1">
                <Input
                  className="h-8 border-border bg-card text-sm text-foreground"
                  placeholder="Option name (e.g. Size, Color)"
                  value={group.name}
                  onChange={(e) => updateGroupName(gi, e.target.value)}
                />
              </div>
              <button type="button" onClick={() => removeGroup(gi)} className="ml-2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-rose-400">
                <X size={14} />
              </button>
            </div>
            <div className="ml-2 space-y-2">
              {group.values.map((val, vi) => (
                <div key={vi} className="flex items-center gap-2">
                  <Input
                    className="h-8 flex-1 border-border bg-card text-xs text-foreground"
                    placeholder="Label (e.g. Small)"
                    value={val.label}
                    onChange={(e) => updateValue(gi, vi, "label", e.target.value)}
                  />
                  <Input
                    className="h-8 flex-1 border-border bg-card text-xs text-foreground font-mono"
                    placeholder="Value (e.g. S)"
                    value={val.value}
                    onChange={(e) => updateValue(gi, vi, "value", e.target.value)}
                  />
                  <button type="button" onClick={() => removeValue(gi, vi)} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-rose-400">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addValue(gi)} className="text-xs text-muted-foreground transition-colors hover:text-[#7C3AED]">
                + Add value
              </button>
            </div>
          </div>
        ))}
      </div>

      {groups.length > 0 && (
        <div className="rounded-lg border border-border bg-background p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generate Variants</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Base Price ($) <span className="text-red-500">*</span></Label>
              <Input
                type="number" step="0.01"
                className="h-8 border-border bg-card text-foreground"
                value={basePrice || ""}
                onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Base SKU <span className="text-red-500">*</span></Label>
              <Input
                className="h-8 border-border bg-card text-foreground"
                placeholder="e.g. PROD-BASE"
                value={baseSku}
                onChange={(e) => setBaseSku(e.target.value)}
              />
            </div>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Will generate {groups.reduce((acc, g) => acc * Math.max(1, g.values.length), 1)} variant(s) — one for each combination.
          </p>
          <Button
            type="button"
            disabled={generating || !baseSku}
            onClick={handleGenerate}
            className="mt-3"
          >
            {generating ? (
              <><Loader2 size={14} className="mr-1 animate-spin" /> Generating...</>
            ) : (
              "Generate Variants"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
