import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icon size={28} className="text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-[#F8FAFC]">{title}</h3>
      <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
