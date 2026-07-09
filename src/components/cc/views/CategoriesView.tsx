"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoriesApi } from "@/services/categories.service";
import Badge from "../Badge";
import DataTable from "@/components/dashboard/data-table";
import CategoryForm from "@/components/dashboard/category-form";
import ActionButtons from "@/components/ui/action-buttons";
import ConfirmDeleteDialog from "@/components/dashboard/confirm-delete-dialog";
import BulkActionBar from "@/components/dashboard/bulk-action-bar";
import SearchField from "@/components/ui/form-inputs/SearchField";
import { SelectField } from "@/components/ui/select-field";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Fetch categories from the API. Includes optional status and category filters.
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        pageSize: String(pageSize),
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (categoryFilter !== "all") {
        params.categoryId = categoryFilter;
      }
      const data = await categoriesApi.list(params);
      setCategories(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and refresh when pagination, status, or category changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await fetchCategories();
    })();
    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, categoryFilter]);

  const filtered = categories.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (
      searchQuery &&
      !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    // The category filter is applied server‑side via the `categoryId` query parameter.
    // Hence we only filter by status and search term on the client.
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === categories.length) setSelected(new Set());
    else setSelected(new Set(categories.map((c) => c.id)));
  };

  const handleSave = useCallback(
    async (data: {
      name: string;
      slug?: string;
      description?: string;
      image?: string;
      parentId?: string;
      status?: string;
    }) => {
      try {
        if (editing) {
          await categoriesApi.patch(editing.id, data);
        } else {
          await categoriesApi.create(data);
        }
        await fetchCategories();
        setFormOpen(false);
        setEditing(null);
      } catch {
        /* ignore */
      }
    },
    [editing, fetchCategories],
  );

  const handleArchive = useCallback(
    async (id: string) => {
      try {
        await categoriesApi.patch(id, { action: "archive" });
        await fetchCategories();
      } catch {
        /* ignore */
      }
    },
    [fetchCategories],
  );

  const handleRestore = useCallback(
    async (id: string) => {
      try {
        await categoriesApi.patch(id, { action: "restore" });
        await fetchCategories();
      } catch {
        /* ignore */
      }
    },
    [fetchCategories],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await categoriesApi.delete(id);
        await fetchCategories();
      } catch {
        /* ignore */
      }
      setConfirmDelete(null);
    },
    [fetchCategories],
  );

  const handleBulkArchive = useCallback(async () => {
    try {
      await categoriesApi.bulk({
        action: "archive",
        ids: Array.from(selected),
      });
      setSelected(new Set());
      await fetchCategories();
    } catch {
      /* ignore */
    }
  }, [selected, fetchCategories]);

  const handleBulkDelete = useCallback(async () => {
    try {
      await categoriesApi.bulk({ action: "delete", ids: Array.from(selected) });
      setSelected(new Set());
      await fetchCategories();
    } catch {
      /* ignore */
    }
  }, [selected, fetchCategories]);

  return (
    <div className="space-y-5">
      <BulkActionBar
        selectedCount={selected.size}
        onArchive={handleBulkArchive}
        onDelete={handleBulkDelete}
        onClear={() => setSelected(new Set())}
      />

      <div className="flex items-center gap-3">
        {/* Search input on the left side */}
        <SearchField
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
          placeholder="Search categories..."
        />

        <SelectField
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
            setSelected(new Set());
          }}
          size="compact"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </SelectField>
        {/* Category filter */}
        <SelectField
          value={categoryFilter}
          onChange={(e) => {
            // When a specific category is chosen we want to filter by that category ID.
            // Reset the status filter to "all" so it does not unintentionally limit the results.
            setCategoryFilter(e.target.value);
            setStatusFilter("all");
            setPage(1);
            setSelected(new Set());
          }}
          size="compact"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> Add Category
        </Button>
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
            label: "Name",
            sortable: true,
            render: (item: Record<string, unknown>) => {
              const c = item as unknown as Category;
              return (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E293B]">
                    {c.image ? (
                      <img
                        src={c.image}
                        alt=""
                        className="h-full w-full rounded-lg object-cover"
                      />
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
              return (
                <span className="text-sm text-muted-foreground line-clamp-1">
                  {c.description || "—"}
                </span>
              );
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
              return (
                <span className="text-sm text-muted-foreground">
                  {parent?.name || "—"}
                </span>
              );
            },
          },
          {
            key: "actions",
            label: "",
            render: (item: Record<string, unknown>) => {
              const c = item as unknown as Category;
              return (
                <ActionButtons
                  actions={[
                    { type: "edit", tooltip: "Edit category", onClick: () => { setEditing(c); setFormOpen(true); } },
                    ...(c.status !== "archived"
                      ? [{ type: "archive" as const, tooltip: "Archive category", onClick: () => handleArchive(c.id) }]
                      : [{ type: "restore" as const, tooltip: "Restore category", onClick: () => handleRestore(c.id) }]
                    ),
                    { type: "delete", tooltip: "Delete category", onClick: () => setConfirmDelete(c.id) },
                  ]}
                />
              );
            },
          },
        ]}
        data={filtered as unknown as Record<string, unknown>[]}
        searchable={false}
        serverPagination={{ page, totalPages, total, onPageChange: setPage }}
        emptyTitle="No categories yet"
        emptyDescription="Create your first category to organize your products."
        loading={loading}
      />

      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing ?? undefined}
        categories={categories}
        onSave={handleSave}
      />

      <ConfirmDeleteDialog
        open={confirmDelete !== null}
        onOpenChange={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete!)}
        entityName="Category"
      />
    </div>
  );
}
