"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Star, ArrowLeft } from "lucide-react";
import { reviewsApi } from "@/services/reviews.service";
import Link from "next/link";

interface ReviewDetail {
  id: string; productId: string; rating: number; title: string | null; body: string | null;
  status: string; isVerified: boolean; moderatedBy: string | null; moderatedAt: string | null;
  createdAt: string;
  customer: { id: string; name: string; email: string } | null;
  product: { id: string; name: string; slug: string } | null;
  images: Array<{ id: string; url: string; alt: string | null; sortOrder: number }>;
  reply: { id: string; body: string; createdAt: string } | null;
  voteCount: number;
}

export default function ReviewDetailView() {
  const params = useParams<{ id: string }>();
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);
  const [modStatus, setModStatus] = useState<"approved" | "hidden" | null>(null);
  const [modSaving, setModSaving] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    (async () => {
      try {
        const data = await reviewsApi.get(params.id);
        setReview(data);
        if (data?.reply) setReplyText(data.reply.body);
      } catch {
        setReview(null);
      }
      setLoading(false);
    })();
  }, [params.id]);

  const handleModerate = async (status: "approved" | "hidden") => {
    setModSaving(true);
    setModStatus(status);
    try {
      const updated = await reviewsApi.moderate(params.id, { status });
      setReview((prev) => prev ? { ...prev, status: updated.status, moderatedBy: updated.moderatedBy, moderatedAt: updated.moderatedAt } : prev);
    } catch { /* ignore */ }
    setModSaving(false);
    setModStatus(null);
  };

  const handleSaveReply = async () => {
    if (!replyText.trim()) return;
    setSavingReply(true);
    try {
      const reply = await reviewsApi.reply(params.id, { body: replyText });
      setReview((prev) => prev ? { ...prev, reply: { id: reply.id, body: reply.body, createdAt: reply.createdAt } } : prev);
    } catch { /* ignore */ }
    setSavingReply(false);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-3xl space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Review not found</p>
        <Link href="/merchant/reviews" className="text-primary text-sm hover:underline mt-2 inline-block">Back to reviews</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <Link href="/merchant/reviews" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to reviews
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{review.product?.name ?? "Product Review"}</h1>
          <p className="text-sm text-muted-foreground">by {review.customer?.name ?? "Anonymous"}</p>
        </div>
        <div className="flex items-center gap-2">
          {review.status === "pending" && (
            <>
              <button
                onClick={() => handleModerate("approved")}
                disabled={modSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {modSaving && modStatus === "approved" ? "Approving..." : "Approve"}
              </button>
              <button
                onClick={() => handleModerate("hidden")}
                disabled={modSaving}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {modSaving && modStatus === "hidden" ? "Hiding..." : "Hide"}
              </button>
            </>
          )}
          {review.status === "approved" && (
            <button
              onClick={() => handleModerate("hidden")}
              disabled={modSaving}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-md text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              Hide Review
            </button>
          )}
          {review.status === "hidden" && (
            <button
              onClick={() => handleModerate("approved")}
              disabled={modSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Unhide
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="inline-flex items-center gap-1">
          {[1,2,3,4,5].map((s) => (
            <Star key={s} size={18} className={s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
          ))}
        </span>
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
          review.status === "approved" ? "bg-green-100 text-green-700" :
          review.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
        }`}>
          {review.status}
        </span>
        {review.isVerified && <span className="text-green-600 text-xs font-medium">Verified Purchase</span>}
        <span className="text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
      </div>

      {review.title && <h2 className="text-lg font-semibold">{review.title}</h2>}
      {review.body && <p className="text-sm leading-relaxed whitespace-pre-wrap">{review.body}</p>}

      {review.images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {review.images.map((img) => (
            <img key={img.id} src={img.url} alt={img.alt ?? ""} className="w-20 h-20 object-cover rounded-md border" />
          ))}
        </div>
      )}

      <div className="border-t pt-6">
        <h3 className="font-medium mb-3">Merchant Reply</h3>
        {review.reply ? (
          <div className="bg-muted/30 rounded-lg p-4 mb-3">
            <p className="text-sm whitespace-pre-wrap">{review.reply.body}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Replied on {new Date(review.reply.createdAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-3">No reply yet</p>
        )}
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write a reply..."
          className="w-full px-3 py-2 border rounded-md text-sm min-h-[80px]"
          rows={3}
        />
        <button
          onClick={handleSaveReply}
          disabled={savingReply || !replyText.trim()}
          className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {savingReply ? "Saving..." : review.reply ? "Update Reply" : "Post Reply"}
        </button>
      </div>

      <div className="border-t pt-4 text-sm text-muted-foreground">
        <p>Votes: {review.voteCount} helpful</p>
        {review.moderatedBy && <p>Moderated by: {review.moderatedBy}</p>}
      </div>
    </div>
  );
}
