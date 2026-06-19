import { Star } from "lucide-react";

interface Props {
  rating: number;
  size?: number;
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function RatingStars({ rating, size = 16, showValue, interactive, onChange }: Props) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"} ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
        >
          <Star size={size} fill={star <= rating ? "currentColor" : "none"} />
        </button>
      ))}
      {showValue && <span className="ml-1 text-sm text-muted-foreground">{rating.toFixed(1)}</span>}
    </span>
  );
}
