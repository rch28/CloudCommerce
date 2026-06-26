"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Archive,
  Trash2,
  Copy,
  RotateCcw,
  Package,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";
import { productsApi } from "@/services/products.service";
import { categoriesApi } from "@/services/categories.service";
import Badge from "../Badge";
import DataTable from "@/components/dashboard/data-table";
import ProductForm from "@/components/dashboard/product-form";
import SearchField from "@/components/ui/form-inputs/SearchField";

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: string;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  images: { url: string; alt: string | null; sortOrder: number }[];
  variants: {
    id: string;
    sku: string;
    price: number;
    comparePrice: number | null;
    costPrice: number | null;
    quantity: number;
    isDefault: boolean;
    status: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export default function ProductsView() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProducts = async (pageNum = page) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (searchQuery) params.q = searchQuery;
      if (categoryFilter !== "all") params.categoryId = categoryFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      params.page = String(pageNum);
      params.pageSize = String(pageSize);
      const data = await productsApi.list(params);
      setProducts(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string> = {};
        if (searchQuery) params.q = searchQuery;
        if (categoryFilter !== "all") params.categoryId = categoryFilter;
        if (statusFilter !== "all") params.status = statusFilter;
        params.page = String(page);
        params.pageSize = String(pageSize);
        const data = await productsApi.list(params);
        if (!cancelled) {
          setProducts(data.items ?? []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 0);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load products");
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
      try {
        const data = await categoriesApi.list();
        if (!cancelled) setCategories(data.items ?? []);
      } catch {
        /* non-critical */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, categoryFilter, statusFilter, page]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleSelectAll = () => {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  };

  const handleSave = useCallback(
    async (data: any) => {
      try {
        if (editing) {
          await productsApi.update(editing.id, data);
        } else {
          await productsApi.create(data);
        }
        await fetchProducts();
        setFormOpen(false);
        setEditing(null);
      } catch {
        /* ignore */
      }
    },
    [editing, fetchProducts],
  );

  const handleArchive = useCallback(
    async (id: string) => {
      setActionLoading(id);
      try {
        await productsApi.patch(id, { action: "archive" });
        await fetchProducts();
      } catch {
        /* ignore */
      }
      setActionLoading(null);
    },
    [fetchProducts],
  );

  const handleRestore = useCallback(
    async (id: string) => {
      setActionLoading(id);
      try {
        await productsApi.patch(id, { action: "restore" });
        await fetchProducts();
      } catch {
        /* ignore */
      }
      setActionLoading(null);
    },
    [fetchProducts],
  );

  const handleDuplicate = useCallback(
    async (id: string) => {
      setActionLoading(id);
      try {
        await productsApi.duplicate(id);
        await fetchProducts();
      } catch {
        /* ignore */
      }
      setActionLoading(null);
    },
    [fetchProducts],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await productsApi.delete(id);
        await fetchProducts();
      } catch {
        /* ignore */
      }
      setConfirmDelete(null);
    },
    [fetchProducts],
  );

  const handleBulkArchive = useCallback(async () => {
    try {
      await productsApi.bulk({ action: "archive", ids: Array.from(selected) });
      setSelected(new Set());
      await fetchProducts();
    } catch {
      /* ignore */
    }
  }, [selected, fetchProducts]);

  const handleBulkDelete = useCallback(async () => {
    try {
      await productsApi.bulk({ action: "delete", ids: Array.from(selected) });
      setSelected(new Set());
      await fetchProducts();
    } catch {
      /* ignore */
    }
  }, [selected, fetchProducts]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 px-6 py-16 text-center">
        <AlertCircle size={32} className="text-rose-400" />
        <h3 className="mt-4 text-lg font-semibold text-[#F8FAFC]">
          Failed to load products
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => fetchProducts()}
          className="mt-4 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#8B5CF6]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center">
        <Loader2 size={28} className="animate-spin text-[#7C3AED]" />
        <p className="mt-4 text-sm text-muted-foreground">
          Loading products...
        </p>
      </div>
    );
  }

  const statusFilters = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Draft", value: "draft" },
    { label: "Archived", value: "archived" },
  ];

  const categoryFilters = [
    { label: "All Categories", value: "all" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  return (
    <div className="space-y-5">
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-4 py-2.5">
          <span className="text-sm text-[#F8FAFC]">
            {selected.size} selected
          </span>
          <button
            onClick={handleBulkArchive}
            className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-amber-400"
          >
            Archive All
          </button>
          <button
            onClick={handleBulkDelete}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-rose-400"
          >
            Delete All
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-[#F8FAFC]"
          >
            Clear
          </button>
        </div>
      )}

      {/* Search + Filter bar */}
      <div className="flex items-center gap-3">
        <SearchField
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
          placeholder="Search products by name, SKU, description..."
        />

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
            setSelected(new Set());
          }}
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
        >
          {categoryFilters.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
            setSelected(new Set());
          }}
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-[#F8FAFC] outline-none focus:border-[#7C3AED]"
        >
          {statusFilters.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8B5CF6]"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <DataTable
        columns={[
          {
            key: "select",
            label: "",
            render: (item: Record<string, unknown>) => (
              <input
                type="checkbox"
                checked={selected.has(item.id as string)}
                onChange={() => toggleSelect(item.id as string)}
                className="h-4 w-4 rounded border-border bg-background accent-[#7C3AED]"
              />
            ),
          },
          {
            key: "name",
            label: "Product",
            sortable: true,
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as ProductData;
              const image = p.images?.[0]?.url;
              return (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#1E293B]">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package size={16} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[#F8FAFC]">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.category?.name ?? "Uncategorized"} ·{" "}
                      {p.variants?.length ?? 0} variant
                      {(p.variants?.length ?? 0) !== 1 ? "s" : ""}
                    </p>
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
              const p = item as unknown as ProductData;
              const v = p.variants?.find((x) => x.isDefault) ?? p.variants?.[0];
              const price = Number(v?.price ?? 0);
              const compare =
                v?.comparePrice != null ? Number(v.comparePrice) : null;
              return (
                <div className="font-medium text-[#F8FAFC]">
                  ${price.toFixed(2)}
                  {compare != null && compare > price && (
                    <span className="ml-1.5 text-xs text-muted-foreground line-through">
                      ${compare.toFixed(2)}
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            key: "quantity",
            label: "Stock",
            sortable: true,
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as ProductData;
              const qty = p.variants?.reduce((s, v) => s + v.quantity, 0) ?? 0;
              return (
                <span
                  className={`font-medium ${qty === 0 ? "text-rose-400" : qty < 15 ? "text-amber-400" : "text-emerald-400"}`}
                >
                  {qty === 0 ? "Out of stock" : qty}
                </span>
              );
            },
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as ProductData;
              return <Badge status={p.status} />;
            },
          },
          {
            key: "createdAt",
            label: "Created",
            sortable: true,
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as ProductData;
              return (
                <span className="text-sm text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              );
            },
          },
          {
            key: "actions",
            label: "",
            render: (item: Record<string, unknown>) => {
              const p = item as unknown as ProductData;
              const isBusy = actionLoading === p.id;
              return (
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => {
                      setEditing(p);
                      setFormOpen(true);
                    }}
                    disabled={isBusy}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC] disabled:opacity-30"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(p.id)}
                    disabled={isBusy}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-cyan-400 disabled:opacity-30"
                  >
                    <Copy size={14} />
                  </button>
                  {p.status !== "archived" ? (
                    <button
                      onClick={() => handleArchive(p.id)}
                      disabled={isBusy}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-amber-400 disabled:opacity-30"
                    >
                      {isBusy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Archive size={14} />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestore(p.id)}
                      disabled={isBusy}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-emerald-400 disabled:opacity-30"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(p.id)}
                    disabled={isBusy}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-rose-400 disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            },
          },
        ]}
        data={products as unknown as Record<string, unknown>[]}
        searchable={false}
        serverPagination={{ page, totalPages, total, onPageChange: setPage }}
        emptyTitle="No products yet"
        emptyDescription="Create your first product to start selling."
      />

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing ?? undefined}
        categories={categories}
        onSave={handleSave}
      />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#F8FAFC]">
              Delete Product
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure? This action cannot be undone.
            </p>
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
