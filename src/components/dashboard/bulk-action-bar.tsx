"use client";

interface BulkActionBarProps {
  selectedCount: number;
  onArchive?: () => void;
  onDelete?: () => void;
  onClear: () => void;
}

export default function BulkActionBar({
  selectedCount,
  onArchive,
  onDelete,
  onClear,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-4 py-2.5">
      <span className="text-sm text-foreground">
        {selectedCount} selected
      </span>
      {onArchive && (
        <button
          onClick={onArchive}
          className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-amber-400"
        >
          Archive All
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-rose-400"
        >
          Delete All
        </button>
      )}
      <button
        onClick={onClear}
        className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Clear
      </button>
    </div>
  );
}
