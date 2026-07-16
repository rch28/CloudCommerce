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
    <div className="rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 px-5 py-3.5"><Skeleton className="h-3 w-3" /></th>
              <th className="px-5 py-3.5"><Skeleton className="h-3 w-16" /></th>
              <th className="hidden px-5 py-3.5 sm:table-cell"><Skeleton className="h-3 w-20" /></th>
              <th className="hidden px-5 py-3.5 sm:table-cell"><Skeleton className="h-3 w-14" /></th>
              <th className="hidden px-5 py-3.5 md:table-cell"><Skeleton className="h-3 w-16" /></th>
              <th className="px-5 py-3.5"><Skeleton className="h-3 w-10" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <td className="px-5 py-4"><Skeleton className="h-4 w-4" /></td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </td>
                <td className="hidden px-5 py-4 sm:table-cell"><Skeleton className="h-4 w-16 rounded" /></td>
                <td className="hidden px-5 py-4 sm:table-cell"><Skeleton className="h-5 w-14 rounded-full" /></td>
                <td className="hidden px-5 py-4 md:table-cell"><Skeleton className="h-3.5 w-20" /></td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    <Skeleton className="h-7 w-7 rounded-md" />
                    <Skeleton className="h-7 w-7 rounded-md" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <Skeleton className="h-3.5 w-32" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
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
