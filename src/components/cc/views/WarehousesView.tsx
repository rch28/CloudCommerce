"use client";
import { useState, useEffect, useCallback } from "react";
import { warehouseApi } from "@/services/warehouse.service";
import {
  Warehouse, Building2, MapPin, Boxes, ArrowRightLeft, Truck,
  Plus, Pencil, Trash2, Search, Loader2, AlertCircle, Check, X,
  Globe, Filter, ArrowUpDown, RefreshCw, Package,
} from "lucide-react";
import DataTable from "@/components/dashboard/data-table";
import EmptyState from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface WarehouseItem {
  id: string;
  name: string;
  code: string;
  type: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  sortOrder: number;
  _count: { inventories: number };
}

interface InvItem {
  id: string;
  warehouseId: string;
  variantId: string;
  quantity: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  variant: {
    id: string;
    sku: string;
    product: { id: string; name: string; slug: string };
  };
}

interface TransferItem {
  id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  variantId: string;
  quantity: number;
  status: string;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  fromWarehouse: { id: string; name: string; code: string };
  toWarehouse: { id: string; name: string; code: string };
}

interface AllocationPlanItem {
  warehouseId: string;
  warehouseName: string;
  variantId: string;
  allocated: number;
}

const mockWarehouses: WarehouseItem[] = [
  { id: "wh-1", name: "New York Warehouse", code: "WH-NYC", type: "main", address: "123 Broadway", city: "New York", state: "NY", country: "US", zip: "10001", latitude: 40.7128, longitude: -74.006, isActive: true, sortOrder: 0, _count: { inventories: 12 } },
  { id: "wh-2", name: "Los Angeles Hub", code: "WH-LAX", type: "secondary", address: "456 Sunset Blvd", city: "Los Angeles", state: "CA", country: "US", zip: "90028", latitude: 34.0522, longitude: -118.2437, isActive: true, sortOrder: 1, _count: { inventories: 8 } },
  { id: "wh-3", name: "Returns Center", code: "WH-RTN", type: "returns", address: null, city: "Chicago", state: "IL", country: "US", zip: null, latitude: null, longitude: null, isActive: true, sortOrder: 2, _count: { inventories: 3 } },
];

const mockInv: InvItem[] = [
  { id: "wi-1", warehouseId: "wh-1", variantId: "v-1", quantity: 50, reserved: 5, available: 45, lowStockThreshold: 10, variant: { id: "v-1", sku: "TEE-BLK-S", product: { id: "p-1", name: "Black T-Shirt", slug: "black-tshirt" } } },
  { id: "wi-2", warehouseId: "wh-1", variantId: "v-2", quantity: 100, reserved: 20, available: 80, lowStockThreshold: 15, variant: { id: "v-2", sku: "TEE-WHT-M", product: { id: "p-2", name: "White T-Shirt", slug: "white-tshirt" } } },
  { id: "wi-3", warehouseId: "wh-2", variantId: "v-1", quantity: 30, reserved: 0, available: 30, lowStockThreshold: 10, variant: { id: "v-1", sku: "TEE-BLK-S", product: { id: "p-1", name: "Black T-Shirt", slug: "black-tshirt" } } },
];

const mockTransfers: TransferItem[] = [
  { id: "st-1", fromWarehouseId: "wh-1", toWarehouseId: "wh-2", variantId: "v-1", quantity: 20, status: "completed", notes: "Rebalance stock", completedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString(), fromWarehouse: { id: "wh-1", name: "New York Warehouse", code: "WH-NYC" }, toWarehouse: { id: "wh-2", name: "Los Angeles Hub", code: "WH-LAX" } },
  { id: "st-2", fromWarehouseId: "wh-1", toWarehouseId: "wh-3", variantId: "v-3", quantity: 5, status: "in_transit", notes: null, completedAt: null, createdAt: new Date().toISOString(), fromWarehouse: { id: "wh-1", name: "New York Warehouse", code: "WH-NYC" }, toWarehouse: { id: "wh-3", name: "Returns Center", code: "WH-RTN" } },
];

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "completed": return "success" as const;
    case "in_transit": return "info" as const;
    case "cancelled": return "destructive" as const;
    case "pending": return "warning" as const;
    default: return "default" as const;
  }
};

export default function WarehousesView() {
  const [activeTab, setActiveTab] = useState("warehouses");
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>(mockWarehouses);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Warehouse form
  const [formOpen, setFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseItem | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "", type: "main", address: "", city: "", state: "", country: "US", zip: "", isActive: true, sortOrder: 0 });
  const [saving, setSaving] = useState(false);

  // Inventory tab
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [inventory, setInventory] = useState<InvItem[]>(mockInv);
  const [invLoading, setInvLoading] = useState(false);

  // Transfer tab
  const [transfers, setTransfers] = useState<TransferItem[]>(mockTransfers);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferFormOpen, setTransferFormOpen] = useState(false);
  const [transferData, setTransferData] = useState({ fromWarehouseId: "", toWarehouseId: "", variantId: "", quantity: 1, notes: "" });
  const [transferSaving, setTransferSaving] = useState(false);

  // Allocation tab
  const [allocInput, setAllocInput] = useState("v-1:10, v-2:20");
  const [allocationResult, setAllocationResult] = useState<{ success: boolean; allocations: AllocationPlanItem[]; shortages: Array<{ variantId: string; requested: number; available: number }> } | null>(null);
  const [allocLoading, setAllocLoading] = useState(false);

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await warehouseApi.list();
      setWarehouses((data as any).items ?? data);
    } catch {
      setWarehouses(mockWarehouses);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInventory = useCallback(async (whId: string) => {
    setInvLoading(true);
    try {
      const data = await warehouseApi.getInventory(whId);
      setInventory((data as any).items ?? data);
    } catch {
      setInventory(mockInv.filter((i) => i.warehouseId === whId));
    } finally {
      setInvLoading(false);
    }
  }, []);

  const fetchTransfers = useCallback(async () => {
    setTransferLoading(true);
    try {
      const data = await warehouseApi.listTransfers();
      setTransfers((data as any).items ?? data);
    } catch {
      setTransfers(mockTransfers);
    } finally {
      setTransferLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
    fetchTransfers();
  }, [fetchWarehouses, fetchTransfers]);

  useEffect(() => {
    if (activeTab === "inventory" && selectedWarehouseId) {
      fetchInventory(selectedWarehouseId);
    }
  }, [activeTab, selectedWarehouseId, fetchInventory]);

  // ── Warehouse CRUD ──
  const openCreate = () => {
    setEditingWarehouse(null);
    setFormData({ name: "", code: "", type: "main", address: "", city: "", state: "", country: "US", zip: "", isActive: true, sortOrder: 0 });
    setFormOpen(true);
  };

  const openEdit = (wh: WarehouseItem) => {
    setEditingWarehouse(wh);
    setFormData({ name: wh.name, code: wh.code, type: wh.type, address: wh.address ?? "", city: wh.city ?? "", state: wh.state ?? "", country: wh.country, zip: wh.zip ?? "", isActive: wh.isActive, sortOrder: wh.sortOrder });
    setFormOpen(true);
  };

  const handleSaveWarehouse = async () => {
    setSaving(true);
    try {
      if (editingWarehouse) {
        await warehouseApi.update(editingWarehouse.id, formData);
      } else {
        await warehouseApi.create(formData);
      }
      setFormOpen(false);
      await fetchWarehouses();
    } catch {
      const newWh: WarehouseItem = {
        id: `wh-${Date.now()}`,
        ...formData,
        latitude: null,
        longitude: null,
        _count: { inventories: 0 },
      };
      if (editingWarehouse) {
        setWarehouses((prev) => prev.map((w) => w.id === editingWarehouse.id ? { ...w, ...formData } : w));
      } else {
        setWarehouses((prev) => [...prev, newWh]);
      }
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWarehouse = async (id: string, name: string) => {
    if (!confirm(`Delete warehouse "${name}"?`)) return;
    try {
      await warehouseApi.delete(id);
      await fetchWarehouses();
    } catch {
      setWarehouses((prev) => prev.filter((w) => w.id !== id));
    }
  };

  // ── Transfer ──
  const handleCreateTransfer = async () => {
    if (!transferData.fromWarehouseId || !transferData.toWarehouseId || !transferData.variantId || transferData.quantity < 1) return;
    setTransferSaving(true);
    try {
      await warehouseApi.createTransfer(transferData);
      setTransferFormOpen(false);
      setTransferData({ fromWarehouseId: "", toWarehouseId: "", variantId: "", quantity: 1, notes: "" });
      await fetchTransfers();
    } catch {
      const newTransfer: TransferItem = {
        id: `st-${Date.now()}`,
        fromWarehouseId: transferData.fromWarehouseId,
        toWarehouseId: transferData.toWarehouseId,
        variantId: transferData.variantId,
        quantity: transferData.quantity,
        status: "pending",
        notes: transferData.notes || null,
        completedAt: null,
        createdAt: new Date().toISOString(),
        fromWarehouse: warehouses.find((w) => w.id === transferData.fromWarehouseId) ?? { id: "", name: "Unknown", code: "" },
        toWarehouse: warehouses.find((w) => w.id === transferData.toWarehouseId) ?? { id: "", name: "Unknown", code: "" },
      };
      setTransfers((prev) => [newTransfer, ...prev]);
      setTransferFormOpen(false);
      setTransferData({ fromWarehouseId: "", toWarehouseId: "", variantId: "", quantity: 1, notes: "" });
    } finally {
      setTransferSaving(false);
    }
  };

  const handleUpdateTransferStatus = async (id: string, status: string) => {
    try {
      await warehouseApi.updateTransfer(id, { status });
      await fetchTransfers();
    } catch {
      setTransfers((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    }
  };

  // ── Allocation test ──
  const handleAllocate = async () => {
    setAllocLoading(true);
    setAllocationResult(null);
    try {
      const items = allocInput.split(",").map((s) => {
        const [vid, qty] = s.trim().split(":");
        return { variantId: vid.trim(), quantity: parseInt(qty.trim(), 10) || 1 };
      });
      const data = await warehouseApi.allocate({ items, destination: { country: "US", state: "NY" } });
      setAllocationResult(data);
    } catch {
      setAllocationResult({ success: false, allocations: [], shortages: [] });
    } finally {
      setAllocLoading(false);
    }
  };

  const tabs = [
    { id: "warehouses", label: "Warehouses", icon: Building2 },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "transfers", label: "Stock Transfers", icon: ArrowRightLeft },
    { id: "allocation", label: "Allocation Engine", icon: Boxes },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Warehouse & Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage warehouses, stock levels, transfers, and allocation</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id ? "bg-[#7C3AED] text-white" : "text-muted-foreground hover:text-[#F8FAFC]"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Warehouses Tab ── */}
      {activeTab === "warehouses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse size={20} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{warehouses.length} warehouses</span>
            </div>
            <Button onClick={openCreate} className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6]">
              <Plus size={14} className="mr-1" /> Add Warehouse
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 size={20} className="mr-2 animate-spin" /> Loading...
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  key: "name",
                  label: "Warehouse",
                  sortable: true,
                  render: (item: Record<string, unknown>) => {
                    const w = item as unknown as WarehouseItem;
                    return (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E293B]">
                          <Building2 size={16} className={w.isActive ? "text-emerald-400" : "text-muted-foreground"} />
                        </div>
                        <div>
                          <p className="font-medium text-[#F8FAFC]">{w.name}</p>
                          <p className="text-xs font-mono text-muted-foreground">{w.code}</p>
                        </div>
                      </div>
                    );
                  },
                },
                {
                  key: "type",
                  label: "Type",
                  render: (item: Record<string, unknown>) => {
                    const w = item as unknown as WarehouseItem;
                    return <Badge variant="outline" className="capitalize">{w.type}</Badge>;
                  },
                },
                {
                  key: "location",
                  label: "Location",
                  render: (item: Record<string, unknown>) => {
                    const w = item as unknown as WarehouseItem;
                    return (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin size={12} />
                        {[w.city, w.state, w.country].filter(Boolean).join(", ") || "—"}
                      </span>
                    );
                  },
                },
                {
                  key: "inventories",
                  label: "Items",
                  render: (item: Record<string, unknown>) => {
                    const w = item as unknown as WarehouseItem;
                    return <span className="text-sm text-muted-foreground">{w._count.inventories}</span>;
                  },
                },
                {
                  key: "status",
                  label: "Status",
                  render: (item: Record<string, unknown>) => {
                    const w = item as unknown as WarehouseItem;
                    return w.isActive
                      ? <Badge variant="success">Active</Badge>
                      : <Badge variant="destructive">Inactive</Badge>;
                  },
                },
                {
                  key: "actions",
                  label: "",
                  render: (item: Record<string, unknown>) => {
                    const w = item as unknown as WarehouseItem;
                    return (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(w)} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteWarehouse(w.id, w.name)} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-400" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  },
                },
              ]}
              data={warehouses as unknown as Record<string, unknown>[]}
              searchable
              searchKeys={["name", "code", "city", "state"]}
              pageSize={10}
            />
          )}

          {/* Warehouse Form Dialog */}
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogContent className="max-w-lg border-border bg-card text-[#F8FAFC]">
              <DialogHeader>
                <DialogTitle>{editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingWarehouse ? "Update warehouse details" : "Create a new warehouse location"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Name</Label>
                  <Input className="h-10 border-border bg-background text-[#F8FAFC]" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Code</Label>
                  <Input className="h-10 border-border bg-background text-[#F8FAFC]" value={formData.code} onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))} placeholder="WH-XXX" />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Type</Label>
                  <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-[#F8FAFC]" value={formData.type} onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}>
                    <option value="main">Main</option>
                    <option value="secondary">Secondary</option>
                    <option value="dropshipping">Dropshipping</option>
                    <option value="returns">Returns</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Sort Order</Label>
                  <Input type="number" className="h-10 border-border bg-background text-[#F8FAFC]" value={formData.sortOrder} onChange={(e) => setFormData((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Address</Label>
                  <Input className="h-10 border-border bg-background text-[#F8FAFC]" value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>City</Label>
                  <Input className="h-10 border-border bg-background text-[#F8FAFC]" value={formData.city} onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))} />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>State</Label>
                  <Input className="h-10 border-border bg-background text-[#F8FAFC]" value={formData.state} onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))} />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Country</Label>
                  <Input className="h-10 border-border bg-background text-[#F8FAFC]" value={formData.country} onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))} />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>ZIP Code</Label>
                  <Input className="h-10 border-border bg-background text-[#F8FAFC]" value={formData.zip} onChange={(e) => setFormData((p) => ({ ...p, zip: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFormOpen(false)} className="border-border text-muted-foreground">Cancel</Button>
                <Button onClick={handleSaveWarehouse} disabled={saving || !formData.name || !formData.code} className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6]">
                  {saving ? <><Loader2 size={14} className="mr-1 animate-spin" /> Saving...</> : editingWarehouse ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ── Inventory Tab ── */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Label className="whitespace-nowrap">Warehouse:</Label>
            <select
              className="h-10 flex-1 max-w-xs rounded-md border border-border bg-background px-3 text-sm text-[#F8FAFC]"
              value={selectedWarehouseId}
              onChange={(e) => { setSelectedWarehouseId(e.target.value); }}
            >
              <option value="">Select a warehouse</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
              ))}
            </select>
          </div>

          {!selectedWarehouseId ? (
            <EmptyState icon={Package} title="Select a Warehouse" description="Choose a warehouse to view its inventory" />
          ) : invLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 size={20} className="mr-2 animate-spin" /> Loading inventory...
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  key: "product",
                  label: "Product / SKU",
                  sortable: true,
                  render: (item: Record<string, unknown>) => {
                    const i = item as unknown as InvItem;
                    return (
                      <div>
                        <p className="font-medium text-[#F8FAFC]">{i.variant.product.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{i.variant.sku}</p>
                      </div>
                    );
                  },
                },
                {
                  key: "quantity",
                  label: "On Hand",
                  sortable: true,
                  render: (item: Record<string, unknown>) => {
                    const i = item as unknown as InvItem;
                    return <span className={`font-semibold ${i.quantity === 0 ? "text-rose-400" : i.quantity <= i.lowStockThreshold ? "text-amber-400" : "text-emerald-400"}`}>{i.quantity}</span>;
                  },
                },
                {
                  key: "reserved",
                  label: "Reserved",
                  render: (item: Record<string, unknown>) => {
                    const i = item as unknown as InvItem;
                    return <span className="text-muted-foreground">{i.reserved}</span>;
                  },
                },
                {
                  key: "available",
                  label: "Available",
                  sortable: true,
                  render: (item: Record<string, unknown>) => {
                    const i = item as unknown as InvItem;
                    return <span className="font-medium text-[#F8FAFC]">{i.available}</span>;
                  },
                },
                {
                  key: "threshold",
                  label: "Threshold",
                  render: (item: Record<string, unknown>) => {
                    const i = item as unknown as InvItem;
                    return <span className="text-xs text-muted-foreground">{i.lowStockThreshold}</span>;
                  },
                },
              ]}
              data={inventory as unknown as Record<string, unknown>[]}
              searchable
              searchKeys={["variant.product.name", "variant.sku"]}
              pageSize={15}
            />
          )}
        </div>
      )}

      {/* ── Stock Transfers Tab ── */}
      {activeTab === "transfers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{transfers.length} transfers</span>
            <Button onClick={() => setTransferFormOpen(true)} className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6]">
              <ArrowRightLeft size={14} className="mr-1" /> New Transfer
            </Button>
          </div>

          {transferLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 size={20} className="mr-2 animate-spin" /> Loading transfers...
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  key: "from",
                  label: "From",
                  render: (item: Record<string, unknown>) => {
                    const t = item as unknown as TransferItem;
                    return <span className="text-sm text-[#F8FAFC]">{t.fromWarehouse.name}</span>;
                  },
                },
                {
                  key: "to",
                  label: "To",
                  render: (item: Record<string, unknown>) => {
                    const t = item as unknown as TransferItem;
                    return <span className="text-sm text-[#F8FAFC]">{t.toWarehouse.name}</span>;
                  },
                },
                {
                  key: "variantId",
                  label: "Variant ID",
                  render: (item: Record<string, unknown>) => {
                    const t = item as unknown as TransferItem;
                    return <span className="font-mono text-xs text-muted-foreground">{t.variantId}</span>;
                  },
                },
                {
                  key: "quantity",
                  label: "Qty",
                  sortable: true,
                  render: (item: Record<string, unknown>) => {
                    const t = item as unknown as TransferItem;
                    return <span className="font-semibold">{t.quantity}</span>;
                  },
                },
                {
                  key: "status",
                  label: "Status",
                  render: (item: Record<string, unknown>) => {
                    const t = item as unknown as TransferItem;
                    return <Badge variant={statusBadgeVariant(t.status)} className="capitalize">{t.status.replace("_", " ")}</Badge>;
                  },
                },
                {
                  key: "actions",
                  label: "",
                  render: (item: Record<string, unknown>) => {
                    const t = item as unknown as TransferItem;
                    if (t.status === "pending") {
                      return (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleUpdateTransferStatus(t.id, "in_transit")} className="rounded-lg px-2 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/10" title="Mark in transit">
                            <Truck size={14} />
                          </button>
                          <button onClick={() => handleUpdateTransferStatus(t.id, "completed")} className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10" title="Complete">
                            <Check size={14} />
                          </button>
                          <button onClick={() => handleUpdateTransferStatus(t.id, "cancelled")} className="rounded-lg px-2 py-1 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10" title="Cancel">
                            <X size={14} />
                          </button>
                        </div>
                      );
                    }
                    return null;
                  },
                },
              ]}
              data={transfers as unknown as Record<string, unknown>[]}
              searchable={false}
              pageSize={10}
            />
          )}

          {/* Transfer Form Dialog */}
          <Dialog open={transferFormOpen} onOpenChange={setTransferFormOpen}>
            <DialogContent className="max-w-md border-border bg-card text-[#F8FAFC]">
              <DialogHeader>
                <DialogTitle>Create Stock Transfer</DialogTitle>
                <DialogDescription className="text-muted-foreground">Move stock between warehouses</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>From Warehouse</Label>
                  <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-[#F8FAFC]" value={transferData.fromWarehouseId} onChange={(e) => setTransferData((p) => ({ ...p, fromWarehouseId: e.target.value }))}>
                    <option value="">Select source</option>
                    {warehouses.map((wh) => <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>To Warehouse</Label>
                  <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-[#F8FAFC]" value={transferData.toWarehouseId} onChange={(e) => setTransferData((p) => ({ ...p, toWarehouseId: e.target.value }))}>
                    <option value="">Select destination</option>
                    {warehouses.filter((w) => w.id !== transferData.fromWarehouseId).map((wh) => <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Variant ID</Label>
                  <Input className="h-10 border-border bg-background text-[#F8FAFC]" value={transferData.variantId} onChange={(e) => setTransferData((p) => ({ ...p, variantId: e.target.value }))} placeholder="v-xxx" />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" min={1} className="h-10 border-border bg-background text-[#F8FAFC]" value={transferData.quantity} onChange={(e) => setTransferData((p) => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input className="h-10 border-border bg-background text-[#F8FAFC]" value={transferData.notes} onChange={(e) => setTransferData((p) => ({ ...p, notes: e.target.value }))} placeholder="Rebalance stock" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTransferFormOpen(false)} className="border-border text-muted-foreground">Cancel</Button>
                <Button onClick={handleCreateTransfer} disabled={transferSaving || !transferData.fromWarehouseId || !transferData.toWarehouseId || !transferData.variantId} className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6]">
                  {transferSaving ? <><Loader2 size={14} className="mr-1 animate-spin" /> Creating...</> : "Create Transfer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ── Allocation Engine Tab ── */}
      {activeTab === "allocation" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold text-[#F8FAFC]">Test Allocation Engine</h3>
            <p className="mt-1 text-sm text-muted-foreground">Enter variant IDs and quantities (comma-separated) to simulate stock allocation</p>
            <div className="mt-4 flex gap-3">
              <Input
                className="flex-1 h-10 border-border bg-background text-[#F8FAFC] font-mono"
                value={allocInput}
                onChange={(e) => setAllocInput(e.target.value)}
                placeholder="v-1:10, v-2:20"
              />
              <Button onClick={handleAllocate} disabled={allocLoading} className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6]">
                {allocLoading ? <Loader2 size={14} className="animate-spin" /> : "Allocate"}
              </Button>
            </div>
          </div>

          {allocationResult && (
            <div className="space-y-4">
              <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${
                allocationResult.success ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-amber-500/30 bg-amber-500/5 text-amber-400"
              }`}>
                {allocationResult.success ? <Check size={18} /> : <AlertCircle size={18} />}
                <span className="text-sm font-medium">
                  {allocationResult.success ? "Full allocation available" : "Some items have insufficient stock"}
                </span>
              </div>

              {allocationResult.allocations.length > 0 && (
                <div className="rounded-lg border border-border bg-card">
                  <div className="border-b border-border px-5 py-3">
                    <h4 className="text-sm font-semibold text-[#F8FAFC]">Allocation Plan</h4>
                  </div>
                  <div className="divide-y divide-border/60">
                    {allocationResult.allocations.map((a, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-[#F8FAFC]">{a.warehouseName}</p>
                          <p className="text-xs text-muted-foreground font-mono">Variant: {a.variantId}</p>
                        </div>
                        <Badge variant="success">{a.allocated} units</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {allocationResult.shortages.length > 0 && (
                <div className="rounded-lg border border-rose-500/30 bg-card">
                  <div className="border-b border-rose-500/30 px-5 py-3">
                    <h4 className="text-sm font-semibold text-rose-400">Shortages</h4>
                  </div>
                  <div className="divide-y divide-rose-500/10">
                    {allocationResult.shortages.map((s, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-3">
                        <span className="text-sm font-mono text-[#F8FAFC]">{s.variantId}</span>
                        <div className="text-sm">
                          <span className="text-muted-foreground">{s.available} / {s.requested} available</span>
                          <span className="ml-2 text-rose-400 font-medium">short {s.requested - s.available}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!allocationResult && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-4 py-12 text-center">
              <Boxes size={32} className="text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">Enter items above and click Allocate to test the allocation engine</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
