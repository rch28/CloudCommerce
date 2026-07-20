"use client";
import { useState, useMemo } from "react";
import { Download, ChevronUp, ChevronDown } from "lucide-react";
import { TabFilter } from "@/components/ui/tab-filter";
import Badge from "../Badge";
import { orders as allOrders } from "@/data/mock";
import SearchField from "@/components/ui/form-inputs/SearchField";
import { useSearch } from "@/hooks/useSearch";

export default function OrdersView() {
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { search, setSearch, debouncedSearch } = useSearch();

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  }
  const statuses = [
    { label: "All", value: "all" },
    { label: "Paid", value: "paid" },
    { label: "Pending", value: "pending" },
    { label: "Shipped", value: "shipped" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const filtered = allOrders.filter(
    (o) =>
      (status === "all" || o.status === status) &&
      (o.customer.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        o.id.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  const sortedFiltered = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey as keyof typeof filtered[number]];
      const bVal = b[sortKey as keyof typeof filtered[number]];
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal ?? "").localeCompare(String(bVal ?? ""), undefined, { numeric: true });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortOrder]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabFilter
          options={statuses}
          value={status}
          onChange={setStatus}
        />
        <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <SearchField
        searchQuery={search}
        setSearchQuery={setSearch}
        placeholder="Search orders..."
        className="max-w-sm"
      />

      <div className="overflow-hidden rounded-xl border border-border bg-muted/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("id")}>
                  <span className="inline-flex items-center gap-1">Order {sortKey === "id" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                </th>
                <th className="px-5 py-3.5 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("customer")}>
                  <span className="inline-flex items-center gap-1">Customer {sortKey === "customer" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                </th>
                <th className="px-5 py-3.5 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("items")}>
                  <span className="inline-flex items-center gap-1">Items {sortKey === "items" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                </th>
                <th className="px-5 py-3.5 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("date")}>
                  <span className="inline-flex items-center gap-1">Date {sortKey === "date" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                </th>
                <th className="px-5 py-3.5 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("status")}>
                  <span className="inline-flex items-center gap-1">Status {sortKey === "status" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                </th>
                <th className="px-5 py-3.5 text-right cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("total")}>
                  <span className="inline-flex items-center gap-1 justify-end">Total {sortKey === "total" && (sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {sortedFiltered.map((o) => (
                <tr key={o.id} className="hover:bg-accent/40">
                  <td className="px-5 py-4 font-medium text-violet-400">{o.id}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{o.customer}</p>
                    <p className="text-xs text-slate-500">{o.email}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{o.items}</td>
                  <td className="px-5 py-4 text-muted-foreground">{o.date}</td>
                  <td className="px-5 py-4"><Badge status={o.status} /></td>
                  <td className="px-5 py-4 text-right font-semibold text-white">${o.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
