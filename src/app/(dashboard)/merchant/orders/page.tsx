"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import PageHeader from "@/components/dashboard/page-header";
import Badge from "@/components/cc/Badge";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { TabFilter } from "@/components/ui/tab-filter";
import SearchField from "@/components/ui/form-inputs/SearchField";
import LoadingSkeleton from "@/components/dashboard/loading-skeleton";
import EmptyState from "@/components/dashboard/empty-state";
import { ordersApi } from "@/services/orders.service";
import { useSearch } from "@/hooks/useSearch";

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Paid", value: "paid" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refunded", value: "refunded" },
];

const LIMIT = 20;

interface OrderRow {
  id: string;
  number: string;
  status: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  createdAt: string;
}

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const { search, setSearch, debouncedSearch } = useSearch();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
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

  const sortedOrders = useMemo(() => {
    if (!sortKey) return orders;
    return [...orders].sort((a, b) => {
      const aVal = a[sortKey as keyof OrderRow];
      const bVal = b[sortKey as keyof OrderRow];
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal ?? "").localeCompare(String(bVal ?? ""), undefined, { numeric: true });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [orders, sortKey, sortOrder]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        tenantId: "t-1",
        page: String(page),
        limit: String(LIMIT),
        status: statusFilter,
      };
      if (debouncedSearch) params.search = debouncedSearch;

      const data = await ordersApi.list(params);
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Manage and track customer orders" />

      <TabFilter
        options={STATUS_FILTERS}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      <SearchField
        searchQuery={search}
        setSearchQuery={setSearch}
        placeholder="Search by order #, customer name or email..."
        className="max-w-sm"
      />

      {loading ? (
        <LoadingSkeleton variant="table-page" />
      ) : orders.length === 0 ? (
        <EmptyState message="No orders found" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("number")}>
                      <span className="inline-flex items-center gap-1">Order {sortKey === "number" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                    </th>
                    <th className="px-5 py-3.5 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("customerName")}>
                      <span className="inline-flex items-center gap-1">Customer {sortKey === "customerName" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                    </th>
                    <th className="px-5 py-3.5 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("itemCount")}>
                      <span className="inline-flex items-center gap-1">Items {sortKey === "itemCount" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                    </th>
                    <th className="px-5 py-3.5 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("createdAt")}>
                      <span className="inline-flex items-center gap-1">Date {sortKey === "createdAt" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                    </th>
                    <th className="px-5 py-3.5 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("status")}>
                      <span className="inline-flex items-center gap-1">Status {sortKey === "status" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                    </th>
                    <th className="px-5 py-3.5 text-right font-medium cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("total")}>
                      <span className="inline-flex items-center gap-1 justify-end">Total {sortKey === "total" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {sortedOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="transition-colors hover:bg-accent cursor-pointer"
                    onClick={() => window.location.href = `/merchant/orders/${o.id}`}
                  >
                    <td className="px-5 py-4 font-mono text-sm font-medium text-[#7C3AED]">
                      #{o.number}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{o.customerName || "Guest"}</p>
                      {o.customerEmail && (
                        <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{o.itemCount}</td>
                    <td className="px-5 py-4 text-muted-foreground text-xs">
                      {new Date(o.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={o.status} />
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-foreground">
                      ${o.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm text-muted-foreground">
              <span>
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 3, totalPages - 6));
                  const p = start + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-[28px] rounded-lg px-2 py-1 text-sm font-medium transition-colors ${
                        p === page
                          ? "bg-[#7C3AED] text-white"
                          : "hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
