"use client";

import { useState } from "react";
import RatingStars from "./RatingStars";
import { reviewsApi } from "@/services/reviews.service";

interface Props {
  productId: string;
  orderItemId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({ productId, orderItemId, onSuccess, onCancel }: Props) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating"); return; }

    setSaving(true);
    setError("");

    try {
      await reviewsApi.create({ productId, orderItemId, rating, title: title || undefined, body: body || undefined });
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to submit review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-medium">Write a Review</h3>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Rating</label>
        <RatingStars rating={rating} size={24} interactive onChange={setRating} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Title (optional)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="w-full px-3 py-2 border rounded-md text-sm"
          placeholder="Summarize your experience"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Review (optional)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          rows={4}
          className="w-full px-3 py-2 border rounded-md text-sm"
          placeholder="Tell others about your experience"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Submitting..." : "Submit Review"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-md text-sm hover:bg-muted"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
