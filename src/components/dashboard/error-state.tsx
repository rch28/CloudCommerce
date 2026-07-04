import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <Button onClick={onRetry} className="gap-2">
          <RotateCcw size={15} />
          Try again
        </Button>
      )}
    </div>
  );
}
