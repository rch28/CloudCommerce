export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="h-8 w-48 rounded-lg bg-card animate-pulse" />
        <div className="mt-2 h-4 w-32 rounded-lg bg-card animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-square bg-[#18181B] animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-3 w-16 rounded bg-card animate-pulse" />
              <div className="h-4 w-32 rounded bg-card animate-pulse" />
              <div className="h-6 w-20 rounded bg-card animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
