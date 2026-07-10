import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="mt-2">
          <Skeleton className="h-4 w-24 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <Skeleton className="h-5 w-32" />
            <div className="mt-2">
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="mt-3">
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
