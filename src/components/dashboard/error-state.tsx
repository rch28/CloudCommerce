import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
        <AlertTriangle size={28} className="text-rose-400" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-[#F8FAFC]">{title}</h3>
      <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#8B5CF6]"
        >
          <RotateCcw size={15} />
          Try again
        </button>
      )}
    </div>
  );
}
