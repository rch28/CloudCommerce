"use client";
import { useState, useCallback } from "react";
import { Plus, Pencil, Archive, Trash2, Package } from "lucide-react";
import Badge from "../Badge";
import { products as allProducts, type Product } from "@/data/mock";
import DataTable from "@/components/dashboard/data-table";
import ProductForm from "@/components/dashboard/product-form";


export default function ProductsView() {
  const [products, setProducts] = useState<Product[]>([...allProducts]);
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const cats = ["All", "Audio", "Wearables", "Accessories"];

  const filtered = products.filter(
    (p) =>
      (cat === "All" || p.category === cat) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = useCallback((data: { name: string; description?: string; status: string; categoryId?: string; variants: { sku: string; price: number; quantity: number }[] }) => {
    if (editing) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? { ...p, name: data.name, status: data.status as Product["status"], price: data.variants[0]?.price ?? p.price, stock: data.variants[0]?.quantity ?? p.stock }
            : p
        )
      );
    } else {
      const newProduct: Product = {
        id: `P-${Date.now()}`,
        name: data.name,
        category: data.categoryId || "",
        price: data.variants[0]?.price || 0,
        stock: data.variants[0]?.quantity || 0,
        image: "",
        status: data.status as Product["status"],
        sold: 0,
        variants: data.variants.map((v) => v.sku),
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
    setFormOpen(false);
    setEditing(null);
  }, [editing]);

  const handleArchive = useCallback((id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "archived" as Product["status"] } : p))
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setConfirmDelete(null);
  }, []);

  return (
    <div className="space-y-5">
      <DataTable
        columns={[
          {
            key: "name",
            label: "Product",
            sortable: true,
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as Product;
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
                    <p className="text-xs text-muted-foreground">{p.category} · {p.variants.length} variants</p>
                  </div>
                </div>
              );
            },
          },
          {
            key: "price",
            label: "Price",
            sortable: true,
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as Product;
              return <span className="font-medium text-[#F8FAFC]">${p.price.toFixed(2)}</span>;
            },
          },
          {
            key: "stock",
            label: "Stock",
            sortable: true,
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as Product;
              return (
                <span className={`font-medium ${p.stock === 0 ? "text-rose-400" : p.stock < 15 ? "text-amber-400" : "text-emerald-400"}`}>
                  {p.stock === 0 ? "Out of stock" : p.stock}
                </span>
              );
            },
          },
          {
            key: "sold",
            label: "Sold",
            sortable: true,
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as Product;
              return <span className="text-muted-foreground">{p.sold.toLocaleString()}</span>;
            },
          },
          {
            key: "status",
            label: "Status",
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as Product;
              return <Badge status={p.status} />;
            },
          },
          {
            key: "actions",
            label: "",
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as Product;
              return (
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => { setEditing(p); setFormOpen(true); }}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]"
                  >
                    <Pencil size={14} />
                  </button>
                  {p.status !== "archived" && (
                    <button
                      onClick={() => handleArchive(p.id)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-amber-400"
                    >
                      <Archive size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(p.id)}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-rose-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            },
          },
        ]}
        data={filtered as unknown as Record<string, unknown>[]}
        searchable
        searchKeys={["name", "category"]}
        filterable
        filters={cats.map((c) => ({ label: c, value: c }))}
        activeFilter={cat}
        onFilterChange={(v) => { setCat(v); setSearch(""); }}
        emptyTitle="No products yet"
        emptyDescription="Create your first product to start selling."
        actions={
          <button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#8B5CF6]"
          >
            <Plus size={16} /> Add Product
          </button>
        }
      />

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing || undefined}
        onSave={handleSave}
      />

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#F8FAFC]">Delete Product</h3>
            <p className="mt-2 text-sm text-muted-foreground">Are you sure? This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
