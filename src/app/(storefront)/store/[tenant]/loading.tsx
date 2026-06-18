export default function TenantLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7C3AED] border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading store...</p>
      </div>
    </div>
  );
}
