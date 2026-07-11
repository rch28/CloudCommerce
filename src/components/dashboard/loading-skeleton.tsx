import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  variant?:
    | "card"
    | "chart"
    | "table"
    | "page"
    | "table-page"
    | "tabbed-page"
    | "detail-page"
    | "dashboard"
    | "billing-page";
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

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <div className="w-10 shrink-0" />
          <div className="min-w-0 flex-1"><Skeleton className="h-3 w-14" /></div>
          <div className="w-20 shrink-0 sm:w-24"><Skeleton className="h-3 w-12" /></div>
          <div className="hidden w-20 shrink-0 sm:block"><Skeleton className="h-3 w-12" /></div>
          <div className="hidden w-24 shrink-0 md:block"><Skeleton className="h-3 w-12" /></div>
          <div className="w-16 shrink-0"><Skeleton className="h-3 w-10" /></div>
        </div>
        {/* rows */}
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
            {/* checkbox */}
            <div className="w-10 shrink-0"><Skeleton className="h-4 w-4" /></div>
            {/* name + avatar */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="min-w-0 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            {/* category/type */}
            <div className="w-20 shrink-0 sm:w-24"><Skeleton className="h-4 w-14" /></div>
            {/* status badge - hidden on xs */}
            <div className="hidden w-20 shrink-0 sm:block"><Skeleton className="h-5 w-14 rounded-full" /></div>
            {/* date - hidden on sm */}
            <div className="hidden w-24 shrink-0 md:block"><Skeleton className="h-3.5 w-16" /></div>
            {/* actions */}
            <div className="flex w-16 shrink-0 justify-end gap-1">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </div>
        ))}
      </div>
      {/* pagination */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <Skeleton className="h-3.5 w-32" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md bg-muted/50" />
          <Skeleton className="h-7 w-7 rounded-md bg-muted/50" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function TablePageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <TableSkeleton rows={5} />
    </div>
  );
}

function TabbedPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 flex-1 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

function DetailPageSkeleton() {
  return (
    <div className="max-w-3xl space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-16 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-2 h-6 w-32" />
          </div>
        ))}
      </div>
      <TableSkeleton rows={3} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><ChartSkeleton /></div>
        <div><ChartSkeleton /></div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3"><TableSkeleton rows={4} /></div>
        <div className="lg:col-span-2"><ChartSkeleton /></div>
      </div>
    </div>
  );
}

function BillingPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <Skeleton className="mb-4 h-5 w-24" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-5">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-2 h-8 w-28" />
              <div className="mt-3 space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
              <Skeleton className="mt-4 h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <Skeleton className="mb-4 h-5 w-32" />
        <TableSkeleton rows={3} />
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
    case "table-page":
      return <TablePageSkeleton />;
    case "tabbed-page":
      return <TabbedPageSkeleton />;
    case "detail-page":
      return <DetailPageSkeleton />;
    case "dashboard":
      return <DashboardSkeleton />;
    case "billing-page":
      return <BillingPageSkeleton />;
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
