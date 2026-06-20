"use client";

import { useState, useEffect } from "react";
import RatingStars from "./RatingStars";
import RatingDistribution from "./RatingDistribution";
import { reviewsApi } from "@/services/reviews.service";

interface ReviewItem {
  id: string; rating: number; title: string | null; body: string | null;
  isVerified: boolean; createdAt: string; voteCount: number;
  customer: { name: string } | null;
  images: Array<{ id: string; url: string; alt: string | null }>;
  reply: { id: string; body: string; createdAt: string } | null;
}

interface Stats {
  averageRating: number; reviewCount: number; distribution: Record<number, number>;
}

interface Props {
  productId: string;
  showStats?: boolean;
}

export default function ReviewList({ productId, showStats = true }: Props) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"recent" | "highest" | "lowest">("recent");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    const params = { page: String(page), pageSize: String(pageSize), sort, stats: "true" };
    reviewsApi.storefrontList(productId, params)
      .then((data) => {
        setReviews(data.items);
        setTotal(data.total);
        if (data.stats) setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId, page, sort]);

  const totalPages = Math.ceil(total / pageSize);

  if (loading && reviews.length === 0) {
    return <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded" />)}</div>;
  }

  return (
    <div>
      {showStats && stats && (
        <div className="mb-8">
          <RatingDistribution distribution={stats.distribution} total={stats.reviewCount} averageRating={stats.averageRating} />
        </div>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{total} review{total !== 1 ? "s" : ""}</p>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}
            className="px-3 py-1.5 border rounded-md text-sm bg-background"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium mb-1">No reviews yet</p>
          <p className="text-sm">Be the first to review this product</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((r) => (
            <div key={r.id} className="border-b pb-6 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <RatingStars rating={r.rating} />
                  <span className="font-medium text-sm">{r.customer?.name ?? "Anonymous"}</span>
                  {r.isVerified && <span className="text-xs text-green-600 font-medium">Verified</span>}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.title && <h4 className="font-medium text-sm mb-1">{r.title}</h4>}
              {r.body && <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>}
              {r.images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {r.images.map((img) => (
                    <img key={img.id} src={img.url} alt={img.alt ?? ""} className="w-16 h-16 object-cover rounded-md border" />
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">{r.voteCount} found helpful</p>
              {r.reply && (
                <div className="mt-3 ml-4 pl-3 border-l-2 border-primary/30">
                  <p className="text-xs font-medium text-primary">Merchant Response</p>
                  <p className="text-sm mt-1">{r.reply.body}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
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
