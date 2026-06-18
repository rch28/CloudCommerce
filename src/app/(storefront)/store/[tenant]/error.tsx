"use client";

export default function TenantError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-bold text-[#F8FAFC]">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">{error.message || "An unexpected error occurred loading this store."}</p>
      <button onClick={reset} className="rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#8B5CF6]">
        Try again
      </button>
    </div>
  );
}
