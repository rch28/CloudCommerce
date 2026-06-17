import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function ChartCard({ title, description, action, children, className }: ChartCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className ?? ""}`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[#F8FAFC]">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      {children}
    </div>
  );
}
