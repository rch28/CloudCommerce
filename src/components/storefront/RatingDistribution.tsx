interface Props {
  distribution: Record<number, number>;
  total: number;
  averageRating: number;
}

export default function RatingDistribution({ distribution, total, averageRating }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
        <div className="text-sm text-muted-foreground">
          <p>{total} review{total !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-8 text-right text-muted-foreground">{star} ★</span>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 text-xs text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
