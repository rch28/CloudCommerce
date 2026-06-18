export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 h-4 w-48 rounded bg-card animate-pulse" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-square rounded-xl bg-[#18181B] animate-pulse" />
        <div className="space-y-4">
          <div className="h-4 w-16 rounded bg-card animate-pulse" />
          <div className="h-8 w-64 rounded bg-card animate-pulse" />
          <div className="h-4 w-32 rounded bg-card animate-pulse" />
          <div className="h-10 w-40 rounded bg-card animate-pulse" />
          <div className="h-20 w-full rounded bg-card animate-pulse" />
        </div>
      </div>
    </div>
  );
}
