import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  spinnerClassName?: string;
  text?: string;
}

export function LoadingSpinner({ size = 24, className, spinnerClassName, text }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <Loader2
        size={size}
        className={cn("animate-spin text-muted-foreground", spinnerClassName)}
      />
      {text && <p className="mt-4 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
