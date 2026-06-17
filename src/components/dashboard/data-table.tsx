"use client";
import { useState, useMemo, type ReactNode } from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import EmptyState from "@/components/dashboard/empty-state";
import LoadingSkeleton from "@/components/dashboard/loading-skeleton";

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render: (item: Record<string, unknown>) => ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  searchable?: boolean;
  searchKeys?: string[];
  filterable?: boolean;
  filters?: { label: string; value: string }[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  pageSize?: number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  actions?: ReactNode;
}

export default function DataTable({
  columns,
  data,
  searchable = true,
  searchKeys,
  filterable = false,
  filters,
  activeFilter,
  onFilterChange,
  pageSize = 10,
  loading = false,
  emptyTitle = "No items found",
  emptyDescription = "Try adjusting your search or filters.",
  actions,
}: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...data];
    if (search && searchKeys) {
      const q = search.toLowerCase();
      result = result.filter((item: Record<string, unknown>) =>
        searchKeys.some((key: string) => String(item[key] ?? "").toLowerCase().includes(q))
      );
    }
    if (sortKey) {
      result.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const aVal = String(a[sortKey] ?? "");
        const bVal = String(b[sortKey] ?? "");
        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
        return sortOrder === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, sortKey, sortOrder, searchKeys]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setPage(1);
  }

  if (loading) {
    return <LoadingSkeleton variant="table" />;
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {searchable && (
            <div className="relative max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search..."
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-[#F8FAFC] placeholder-muted-foreground outline-none focus:border-[#7C3AED]"
              />
            </div>
          )}
          {filterable && filters && onFilterChange && (
            <div className="flex flex-wrap gap-1.5">
              {filters.map((f: { label: string; value: string }) => (
                <button
                  key={f.value}
                  onClick={() => { onFilterChange(f.value); setPage(1); }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeFilter === f.value
                      ? "bg-[#7C3AED] text-white"
                      : "border border-border bg-background text-muted-foreground hover:text-[#F8FAFC]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-5 py-3.5 font-medium ${col.sortable ? "cursor-pointer select-none hover:text-[#F8FAFC]" : ""}`}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {col.sortable && sortKey === col.key && (
                          sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginated.map((item: Record<string, unknown>, i: number) => (
                  <tr key={(item.id as string) || String(i)} className="transition-colors hover:bg-[#1E293B]">
                    {columns.map((col: Column) => (
                      <td key={col.key} className="px-5 py-4">
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm text-muted-foreground">
              <span>
                Page {page} of {totalPages} ({filtered.length} total)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC] disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, page - 2);
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-[28px] rounded-lg px-2 py-1 text-sm font-medium transition-colors ${
                        p === page ? "bg-[#7C3AED] text-white" : "hover:bg-[#1E293B] hover:text-[#F8FAFC]"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC] disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
