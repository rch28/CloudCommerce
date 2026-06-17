import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  variant?: "card" | "chart" | "table" | "page";
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-11 w-11 rounded-lg" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-[260px] w-full rounded-lg" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Skeleton className="mb-4 h-5 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
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
  );
}

export default function LoadingSkeleton({ variant = "card" }: LoadingSkeletonProps) {
  switch (variant) {
    case "card":
      return <CardSkeleton />;
    case "chart":
      return <ChartSkeleton />;
    case "table":
      return <TableSkeleton />;
    case "page":
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-7 w-32" />
            </div>
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2"><ChartSkeleton /></div>
            <div><ChartSkeleton /></div>
          </div>
          <TableSkeleton />
        </div>
      );
    default:
      return <CardSkeleton />;
  }
}
