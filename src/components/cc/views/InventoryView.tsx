"use client";
import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Package,
  Loader2,
  RefreshCw,
  History,
  Archive,
  RotateCcw,
} from "lucide-react";
import { inventoryApi } from "@/services/inventory.service";
import DataTable from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SearchField from "@/components/ui/form-inputs/SearchField";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface InventoryItem {
  id: string;
  variantId: string;
  quantity: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  reorderLevel: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  variant: {
    id: string;
    sku: string;
    price: number;
    product: { id: string; name: string; slug: string };
  };
}

interface StockLog {
  id: string;
  variantId: string;
  change: number;
  reason: string;
  previousQty: number;
  newQty: number;
  createdAt: string;
}

export default function InventoryView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "low_stock" | "out_of_stock">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [adjustOpen, setAdjustOpen] = useState<string | null>(null);
  const [adjustChange, setAdjustChange] = useState(1);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyVariantId, setHistoryVariantId] = useState<string | null>(null);
  const [historyLogs, setHistoryLogs] = useState<StockLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchItems = async (f: string, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (f === "low_stock") p.set("lowStock", "true");
      if (f === "out_of_stock") p.set("outOfStock", "true");
      if (q.trim()) p.set("search", q.trim());
      const res = await fetch(`/api/v1/inventory?${p.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
      else setItems(data.items ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(filter, searchQuery);
  }, [filter]);

  const onSearchChange = (val: string) => {
    setSearchQuery(val);
    fetchItems(filter, val);
  };

  const handleAdjust = async () => {
    if (!adjustOpen || !adjustReason.trim()) return;
    setAdjusting(true);
    try {
      await inventoryApi.update({
        variantId: adjustOpen,
        change: adjustChange,
        reason: adjustReason,
      });
      setAdjustOpen(null);
      setAdjustChange(1);
      setAdjustReason("");
      await fetchItems(filter, searchQuery);
    } catch {
      // silent
    } finally {
      setAdjusting(false);
    }
  };

  const openHistory = async (variantId: string) => {
    setHistoryVariantId(variantId);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const data = await inventoryApi.getHistory(variantId);
      setHistoryLogs(data);
    } catch {
      setHistoryLogs([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const lowStockCount = items.filter((i) => i.status === "low_stock").length;
  const outOfStockCount = items.filter(
    (i) => i.status === "out_of_stock",
  ).length;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-12 text-center">
        <AlertTriangle size={32} className="text-rose-400" />
        <p className="mt-3 text-sm font-medium text-rose-400">{error}</p>
        <Button
          onClick={() => fetchItems(filter, searchQuery)}
          variant="outline"
          size="sm"
          className="mt-4 border-border text-muted-foreground"
        >
          <RefreshCw size={14} className="mr-1" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Alert bar */}
      <div className="flex flex-wrap items-center gap-3">
        {outOfStockCount > 0 && (
          <span className="inline-flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-400">
            <AlertTriangle size={15} /> {outOfStockCount} out of stock
          </span>
        )}
        {lowStockCount > 0 && (
          <span className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-400">
            <AlertTriangle size={15} /> {lowStockCount} low-stock
          </span>
        )}
        <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400">
          <Package size={15} /> {items.length} variants tracked
        </span>
        <Button
          onClick={() => fetchItems(filter, searchQuery)}
          variant="ghost"
          size="icon"
          className="ml-auto h-8 w-8 text-muted-foreground"
        >
          <RefreshCw size={14} />
        </Button>
      </div>

      <SearchField
        searchQuery={searchQuery}
        setSearchQuery={onSearchChange}
        placeholder="Search by product name or SKU..."
      />

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
        {(["all", "low_stock", "out_of_stock"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === tab
                ? "bg-[#7C3AED] text-white"
                : "text-muted-foreground hover:text-[#F8FAFC]"
            }`}
          >
            {tab === "all"
              ? "All"
              : tab === "low_stock"
                ? "Low Stock"
                : "Out of Stock"}
          </button>
        ))}
      </div>

      {/* Data table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 size={20} className="mr-2 animate-spin" />
          Loading inventory...
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-4 py-12 text-center">
          <Package size={32} className="text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            {filter === "all"
              ? "No inventory records found"
              : "No items match the current filter"}
          </p>
          {filter !== "all" && (
            <Button
              onClick={() => setFilter("all")}
              variant="outline"
              size="sm"
              className="mt-3 border-border text-muted-foreground"
            >
              Show all
            </Button>
          )}
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "product",
              label: "Product / Variant",
              sortable: true,
              render: (item: Record<string, unknown>) => {
                const i = item as unknown as InventoryItem;
                return (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E293B]">
                      <Package size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-[#F8FAFC]">
                        {i.variant.product.name}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {i.variant.sku}
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              key: "stock",
              label: "On Hand",
              sortable: true,
              render: (item: Record<string, unknown>) => {
                const i = item as unknown as InventoryItem;
                return (
                  <span
                    className={`font-semibold ${i.quantity === 0 ? "text-rose-400" : i.status === "low_stock" ? "text-amber-400" : "text-emerald-400"}`}
                  >
                    {i.quantity}
                  </span>
                );
              },
            },
            {
              key: "reserved",
              label: "Reserved",
              render: (item: Record<string, unknown>) => {
                const i = item as unknown as InventoryItem;
                return (
                  <span className="text-muted-foreground">{i.reserved}</span>
                );
              },
            },
            {
              key: "available",
              label: "Available",
              sortable: true,
              render: (item: Record<string, unknown>) => {
                const i = item as unknown as InventoryItem;
                return (
                  <span className="font-medium text-[#F8FAFC]">
                    {i.available}
                  </span>
                );
              },
            },
            {
              key: "status",
              label: "Status",
              render: (item: Record<string, unknown>) => {
                const i = item as unknown as InventoryItem;
                if (i.quantity === 0)
                  return (
                    <span className="text-xs font-medium text-rose-400">
                      Out of stock
                    </span>
                  );
                if (i.status === "low_stock")
                  return (
                    <span className="text-xs font-medium text-amber-400">
                      Low stock
                    </span>
                  );
                return (
                  <span className="text-xs font-medium text-emerald-400">
                    In stock
                  </span>
                );
              },
            },
            {
              key: "threshold",
              label: "Threshold",
              render: (item: Record<string, unknown>) => {
                const i = item as unknown as InventoryItem;
                return (
                  <span className="text-xs text-muted-foreground">
                    {i.lowStockThreshold}
                  </span>
                );
              },
            },
            {
              key: "actions",
              label: "",
              render: (item: Record<string, unknown>) => {
                const i = item as unknown as InventoryItem;
                return (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openHistory(i.variantId)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]"
                      title="Stock history"
                    >
                      <History size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setAdjustOpen(i.variantId);
                        setAdjustChange(1);
                        setAdjustReason("");
                      }}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]"
                      title="Adjust stock"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                );
              },
            },
          ]}
          data={items as unknown as Record<string, unknown>[]}
          searchable={false}
          pageSize={15}
        />
      )}

      {/* Stock adjustment dialog */}
      <Dialog
        open={!!adjustOpen}
        onOpenChange={(o) => {
          if (!o) setAdjustOpen(null);
        }}
      >
        <DialogContent className="max-w-sm border-border bg-card text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Positive to add, negative to remove
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Change amount <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                className="h-10 border-border bg-background text-[#F8FAFC]"
                value={adjustChange}
                onChange={(e) => setAdjustChange(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Reason <span className="text-red-500">*</span>
              </Label>
              <Input
                className="h-10 border-border bg-background text-[#F8FAFC]"
                placeholder="e.g. Received from supplier"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setAdjustOpen(null)}
                className="border-border text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdjust}
                disabled={
                  adjusting || !adjustReason.trim() || adjustChange === 0
                }
                className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] disabled:opacity-50"
              >
                {adjusting ? (
                  <>
                    <Loader2 size={14} className="mr-1 animate-spin" />{" "}
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock history dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg border-border bg-card text-[#F8FAFC]">
          <DialogHeader>
            <DialogTitle>Stock History</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {historyVariantId ? `Variant: ${historyVariantId}` : ""}
            </DialogDescription>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 size={16} className="mr-2 animate-spin" />
              Loading history...
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No stock history found
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {historyLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${log.change > 0 ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {log.change > 0 ? `+${log.change}` : log.change}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({log.previousQty} &rarr; {log.newQty})
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {log.reason}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
