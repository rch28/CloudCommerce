"use client";
import { Button } from "@/components/ui/button";

export default function TenantError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">{error.message || "An unexpected error occurred loading this store."}</p>
      <Button onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
