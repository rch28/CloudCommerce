"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Mail } from "lucide-react";
import SearchField from "@/components/ui/form-inputs/SearchField";
import LoadingSkeleton from "@/components/dashboard/loading-skeleton";
import EmptyState from "@/components/dashboard/empty-state";
import { customersApi } from "@/services/customers.service";
import { useSearch } from "@/hooks/useSearch";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orderCount: number;
  totalSpent: number;
  joined: string;
}

const LIMIT = 20;

export default function CustomersView() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { search, setSearch, debouncedSearch } = useSearch();
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(total / LIMIT);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  }

  const sortedCustomers = useMemo(() => {
    if (!sortKey) return customers;
    return [...customers].sort((a, b) => {
      const aVal = a[sortKey as keyof CustomerRow];
      const bVal = b[sortKey as keyof CustomerRow];
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal ?? "").localeCompare(String(bVal ?? ""), undefined, { numeric: true });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [customers, sortKey, sortOrder]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (debouncedSearch) params.search = debouncedSearch;
      const data = await customersApi.list(params);
      setCustomers(data.customers ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setCustomers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div className="space-y-6">
      <SearchField
        searchQuery={search}
        setSearchQuery={setSearch}
        placeholder="Search customers by name or email..."
        className="max-w-sm"
      />

      {loading ? (
        <LoadingSkeleton variant="table-page" />
      ) : customers.length === 0 ? (
        <EmptyState message="No customers found" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("name")}>
                    <span className="inline-flex items-center gap-1">Customer {sortKey === "name" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="px-5 py-3.5 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("orderCount")}>
                    <span className="inline-flex items-center gap-1">Orders {sortKey === "orderCount" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="px-5 py-3.5 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("totalSpent")}>
                    <span className="inline-flex items-center gap-1">Total Spent {sortKey === "totalSpent" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="px-5 py-3.5 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("joined")}>
                    <span className="inline-flex items-center gap-1">Joined {sortKey === "joined" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                  </th>
                  <th className="px-5 py-3.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedCustomers.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white">
                          {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/15 px-2.5 py-0.5 text-xs font-medium text-sky-400">
                        {c.orderCount} orders
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">
                      ${c.totalSpent.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {new Date(c.joined).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/merchant/customers/${c.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-[#7C3AED]/30 hover:text-foreground"
                      >
                        <Mail size={13} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-[#7C3AED]/30 hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-[#7C3AED]/30 hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
