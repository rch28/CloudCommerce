"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, Check, X } from "lucide-react";
import { reviewsApi } from "@/services/reviews.service";

interface PendingReview {
  id: string; rating: number; title: string | null; body: string | null;
  customer: { id: string; name: string; email: string } | null;
  product: { id: string; name: string; slug: string } | null;
  createdAt: string;
}

export default function ReviewModerationView() {
  const router = useRouter();
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await reviewsApi.list({ status: "pending", pageSize: "50" });
        if (!cancelled) setReviews((data as any).items);
      } catch {
        if (!cancelled) setReviews([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleAction = async (id: string, status: "approved" | "hidden") => {
    setActionLoading(id);
    try {
      await reviewsApi.moderate(id, { status });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Moderation Queue</h1>
        <button
          onClick={() => router.push("/merchant/reviews")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          All Reviews
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <p className="text-lg font-medium mb-1">All caught up!</p>
          <p className="text-sm">No reviews pending moderation</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={14} className={s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                    ))}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {r.product?.name ?? "Unknown product"}
                  </span>
                </div>
                {r.title && <p className="font-medium text-sm">{r.title}</p>}
                {r.body && <p className="text-sm text-muted-foreground truncate">{r.body}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  by {r.customer?.name ?? "Anonymous"} &middot; {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleAction(r.id, "approved")}
                  disabled={actionLoading === r.id}
                  className="p-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
                  title="Approve"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => handleAction(r.id, "hidden")}
                  disabled={actionLoading === r.id}
                  className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50"
                  title="Hide"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
