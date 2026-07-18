"use client";

import { useState, useEffect } from "react";
import { reviewsApi } from "@/services/reviews.service";
import { useRouter } from "next/navigation";
import { Star, Filter, MoreHorizontal } from "lucide-react";
import SearchField from "@/components/ui/form-inputs/SearchField";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectField } from "@/components/ui/select-field";
import { useSearch } from "@/hooks/useSearch";

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
  const { search, setSearch, debouncedSearch } = useSearch();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
      if (statusFilter !== "all") params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      try {
        const data = await reviewsApi.list(params);
        if (!cancelled) {
          setReviews((data as any).items);
          setTotal((data as any).total);
        }
      } catch {
        if (!cancelled) {
          setReviews([]);
          setTotal(0);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [page, statusFilter, debouncedSearch]);

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
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 flex-1 max-w-sm rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="space-y-3">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Reviews</h1>

      <div className="flex gap-4 items-center">
        <SearchField
          searchQuery={search}
          setSearchQuery={setSearch}
          setPage={setPage}
          placeholder="Search reviews..."
          className="max-w-md"
        />
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <SelectField
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            size="compact"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </SelectField>
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
