"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Star, Filter, MoreHorizontal } from "lucide-react";

interface ReviewItem {
  id: string; rating: number; title: string | null; body: string | null; status: string;
  isVerified: boolean; createdAt: string;
  customer: { id: string; name: string; email: string } | null;
  product: { id: string; name: string; slug: string } | null;
  reply: { id: string; body: string } | null;
  voteCount: number;
}

const STATUSES = ["all", "pending", "approved", "hidden"] as const;

export default function ReviewsView() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/v1/reviews?${params}`);
    if (res.ok) {
      const data = await res.json();
      setReviews(data.items);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const totalPages = Math.ceil(total / pageSize);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      approved: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      hidden: "bg-red-100 text-red-700",
    };
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-500"}`}>
        {status}
      </span>
    );
  };

  const starDisplay = (rating: number) => (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} size={14} className={s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
      ))}
    </span>
  );

  if (loading && reviews.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Reviews</h1>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-md text-sm bg-background"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left px-4 py-3 font-medium">Product</th>
              <th className="text-left px-4 py-3 font-medium">Customer</th>
              <th className="text-left px-4 py-3 font-medium">Rating</th>
              <th className="text-left px-4 py-3 font-medium">Review</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No reviews yet</td></tr>
            ) : reviews.map((r) => (
              <tr
                key={r.id}
                className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                onClick={() => router.push(`/merchant/reviews/${r.id}`)}
              >
                <td className="px-4 py-3 max-w-[200px] truncate font-medium">
                  {r.product?.name ?? "—"}
                </td>
                <td className="px-4 py-3">{r.customer?.name ?? "—"}</td>
                <td className="px-4 py-3">{starDisplay(r.rating)}</td>
                <td className="px-4 py-3 max-w-[300px] truncate text-muted-foreground">
                  {r.title || r.body?.slice(0, 100) || "—"}
                </td>
                <td className="px-4 py-3">{statusBadge(r.status)}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button className="p-1 hover:bg-muted rounded">
                    <MoreHorizontal size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
