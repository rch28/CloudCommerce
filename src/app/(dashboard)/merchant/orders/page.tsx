"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/dashboard/page-header";
import Badge from "@/components/cc/Badge";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { TabFilter } from "@/components/ui/tab-filter";
import SearchField from "@/components/ui/form-inputs/SearchField";
import LoadingSkeleton from "@/components/dashboard/loading-skeleton";
import EmptyState from "@/components/dashboard/empty-state";
import { ordersApi } from "@/services/orders.service";

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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(total / LIMIT);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        tenantId: "t-1",
        page: String(page),
        limit: String(LIMIT),
        status: statusFilter,
      };
      if (search) params.search = search;

      const data = await ordersApi.list(params);
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [statusFilter, search]);

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
                  <th className="px-5 py-3.5 font-medium">Order</th>
                  <th className="px-5 py-3.5 font-medium">Customer</th>
                  <th className="px-5 py-3.5 font-medium">Items</th>
                  <th className="px-5 py-3.5 font-medium">Date</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="transition-colors hover:bg-[#1E293B] cursor-pointer"
                    onClick={() => window.location.href = `/merchant/orders/${o.id}`}
                  >
                    <td className="px-5 py-4 font-mono text-sm font-medium text-[#7C3AED]">
                      #{o.number}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#F8FAFC]">{o.customerName || "Guest"}</p>
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
                    <td className="px-5 py-4 text-right font-semibold text-[#F8FAFC]">
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
                  className="rounded-lg p-1.5 transition-colors hover:bg-[#1E293B] hover:text-[#F8FAFC] disabled:opacity-40"
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
                          : "hover:bg-[#1E293B] hover:text-[#F8FAFC]"
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
        </div>
      )}
    </div>
  );
}
