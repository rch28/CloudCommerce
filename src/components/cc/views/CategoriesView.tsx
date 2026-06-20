"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Archive, Trash2, RotateCcw, Tag } from "lucide-react";
import { categoriesApi } from "@/services/categories.service";
import Badge from "../Badge";
import DataTable from "@/components/dashboard/data-table";
import CategoryForm from "@/components/dashboard/category-form";

interface Category {
  id: string; name: string; slug: string; description: string | null;
  image: string | null; parentId: string | null; status: string;
  createdAt: string; updatedAt: string;
}

export default function CategoriesView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.list();
      setCategories(data.items ?? []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const filtered = statusFilter === "all"
    ? categories
    : categories.filter((c) => c.status === statusFilter);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.id)));
  };

  const handleSave = useCallback(async (data: { name: string; slug?: string; description?: string; image?: string; parentId?: string; status?: string }) => {
    try {
      if (editing) {
        await categoriesApi.patch(editing.id, data);
      } else {
        await categoriesApi.create(data);
      }
      await fetchCategories();
      setFormOpen(false);
      setEditing(null);
    } catch { /* ignore */ }
  }, [editing, fetchCategories]);

  const handleArchive = useCallback(async (id: string) => {
    try {
      await categoriesApi.patch(id, { action: "archive" });
      await fetchCategories();
    } catch { /* ignore */ }
  }, [fetchCategories]);

  const handleRestore = useCallback(async (id: string) => {
    try {
      await categoriesApi.patch(id, { action: "restore" });
      await fetchCategories();
    } catch { /* ignore */ }
  }, [fetchCategories]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await categoriesApi.delete(id);
      await fetchCategories();
    } catch { /* ignore */ }
    setConfirmDelete(null);
  }, [fetchCategories]);

  const handleBulkArchive = useCallback(async () => {
    try {
      await categoriesApi.bulk({ action: "archive", ids: Array.from(selected) });
      setSelected(new Set());
      await fetchCategories();
    } catch { /* ignore */ }
  }, [selected, fetchCategories]);

  const handleBulkDelete = useCallback(async () => {
    try {
      await categoriesApi.bulk({ action: "delete", ids: Array.from(selected) });
      setSelected(new Set());
      await fetchCategories();
    } catch { /* ignore */ }
  }, [selected, fetchCategories]);

  return (
    <div className="space-y-5">
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-4 py-2.5">
          <span className="text-sm text-[#F8FAFC]">{selected.size} selected</span>
          <button onClick={handleBulkArchive} className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-amber-400">
            Archive All
          </button>
          <button onClick={handleBulkDelete} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-rose-400">
            Delete All
          </button>
          <button onClick={() => setSelected(new Set())} className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-[#F8FAFC]">
            Clear
          </button>
        </div>
      )}

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
            label: "Name",
            sortable: true,
            render: (item: Record<string, unknown>) => {
              const c = item as unknown as Category;
              return (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E293B]">
                    {c.image ? (
                      <img src={c.image} alt="" className="h-full w-full rounded-lg object-cover" />
                    ) : (
                      <Tag size={15} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[#F8FAFC]">{c.name}</p>
                    <p className="text-xs text-muted-foreground">/{c.slug}</p>
                  </div>
                </div>
              );
            },
          },
          {
            key: "description",
            label: "Description",
            render: (item: Record<string, unknown>) => {
              const c = item as unknown as Category;
              return <span className="text-sm text-muted-foreground line-clamp-1">{c.description || "—"}</span>;
            },
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            render: (item: Record<string, unknown>) => {
              const c = item as unknown as Category;
              return <Badge status={c.status} />;
            },
          },
          {
            key: "parentId",
            label: "Parent",
            render: (item: Record<string, unknown>) => {
              const c = item as unknown as Category;
              const parent = categories.find((p) => p.id === c.parentId);
              return <span className="text-sm text-muted-foreground">{parent?.name || "—"}</span>;
            },
          },
          {
            key: "actions",
            label: "",
            render: (item: Record<string, unknown>) => {
              const c = item as unknown as Category;
              return (
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => { setEditing(c); setFormOpen(true); }}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC]"
                  >
                    <Pencil size={14} />
                  </button>
                  {c.status !== "archived" ? (
                    <button
                      onClick={() => handleArchive(c.id)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-amber-400"
                    >
                      <Archive size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestore(c.id)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] hover:text-emerald-400"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(c.id)}
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
        searchKeys={["name", "slug", "description"]}
        filterable
        filters={[
          { label: "All", value: "all" },
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
          { label: "Archived", value: "archived" },
        ]}
        activeFilter={statusFilter}
        onFilterChange={(v) => { setStatusFilter(v); setSelected(new Set()); }}
        emptyTitle="No categories yet"
        emptyDescription="Create your first category to organize your products."
        loading={loading}
        actions={
          <button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#8B5CF6]"
          >
            <Plus size={16} /> Add Category
          </button>
        }
      />

      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing ?? undefined}
        categories={categories}
        onSave={handleSave}
      />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#F8FAFC]">Delete Category</h3>
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
