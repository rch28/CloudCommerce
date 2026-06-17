"use client";
import { useState } from "react";
import { AlertTriangle, Package, Minus, Plus, Settings2 } from "lucide-react";
import { products as initial } from "@/data/mock";
import DataTable from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InventoryView() {
  const [stock, setStock] = useState<Record<string, number>>(() =>
    Object.fromEntries(initial.map((p) => [p.id, p.stock]))
  );
  const [thresholds] = useState<Record<string, { low: number; reorder: number }>>(() =>
    Object.fromEntries(initial.map((p) => [p.id, { low: 10, reorder: 5 }]))
  );
  const [adjustOpen, setAdjustOpen] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);

  const adjust = (id: string, delta: number) => {
    setStock((s) => ({ ...s, [id]: Math.max(0, (s[id] || 0) + delta) }));
  };

  const lowStockItems = initial.filter((p) => {
    const qty = stock[p.id] || 0;
    const t = thresholds[p.id];
    return t && qty <= t.low;
  });

  const handleBulkAdjust = (id: string) => {
    adjust(id, adjustQty);
    setAdjustOpen(null);
    setAdjustQty(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        {lowStockItems.length > 0 && (
          <span className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-400">
            <AlertTriangle size={15} /> {lowStockItems.length} low-stock alert{lowStockItems.length > 1 ? "s" : ""}
          </span>
        )}
        <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400">
          <Package size={15} /> {initial.length} products tracked
        </span>
      </div>

      <DataTable
        columns={[
          {
            key: "product",
            label: "Product",
            sortable: true,
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as (typeof initial)[0];
              return (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#1E293B]">
                    {p.image ? (
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package size={16} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[#F8FAFC]">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.id}</p>
                  </div>
                </div>
              );
            },
          },
          {
            key: "sold",
            label: "Sold",
            sortable: true,
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as (typeof initial)[0];
              return <span className="text-muted-foreground">{p.sold.toLocaleString()}</span>;
            },
          },
          {
            key: "stock",
            label: "Stock",
            sortable: true,
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as (typeof initial)[0];
              const qty = stock[p.id] || 0;
              const t = thresholds[p.id];
              const isLow = t && qty <= t.low;
              return (
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${qty === 0 ? "text-rose-400" : isLow ? "text-amber-400" : "text-emerald-400"}`}>
                    {qty}
                  </span>
                  {isLow && qty > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      (reorder at {t?.reorder ?? 5})
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            key: "status",
            label: "Status",
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as (typeof initial)[0];
              const qty = stock[p.id] || 0;
              if (qty === 0) return <span className="text-xs font-medium text-rose-400">Out of stock</span>;
              const t = thresholds[p.id];
              if (t && qty <= t.low) return <span className="text-xs font-medium text-amber-400">Low stock</span>;
              return <span className="text-xs font-medium text-emerald-400">In stock</span>;
            },
          },
          {
            key: "actions",
            label: "",
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as (typeof initial)[0];
              return (
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => adjust(p.id, -1)}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]"
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    onClick={() => { setAdjustOpen(p.id); setAdjustQty(1); }}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]"
                  >
                    <Settings2 size={14} />
                  </button>
                  <button
                    onClick={() => adjust(p.id, 1)}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              );
            },
          },
        ]}
        data={initial as unknown as Record<string, unknown>[]}
        searchable
        searchKeys={["name", "id"]}
        pageSize={15}
      />

      {/* Stock adjustment dialog */}
      <Dialog open={!!adjustOpen} onOpenChange={(o) => { if (!o) setAdjustOpen(null); }}>
        <DialogContent className="max-w-sm border-border bg-card text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quantity change</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustQty((q) => Math.max(1, q - 1))}
                  className="border-border"
                >
                  <Minus size={14} />
                </Button>
                <Input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 w-20 border-border bg-background text-center text-[#F8FAFC]"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustQty((q) => q + 1)}
                  className="border-border"
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setAdjustOpen(null)} className="border-border text-muted-foreground">
                Cancel
              </Button>
              <Button onClick={() => adjustOpen && handleBulkAdjust(adjustOpen)} className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6]">
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
