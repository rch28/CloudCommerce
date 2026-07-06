import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon: Icon = Inbox, title, description, message, action, className = "" }: EmptyStateProps) {
  if (message) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-xl border border-border bg-card py-24 ${className}`}>
        <p className="text-muted-foreground">{message}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 ${className}`}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icon size={28} className="text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-[#F8FAFC]">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
