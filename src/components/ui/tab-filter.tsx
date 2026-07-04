"use client";

import { cn } from "@/lib/utils";

interface TabFilterOption {
  label: string;
  value: string;
}

interface TabFilterProps {
  options: TabFilterOption[];
  value: string;
  onChange: (value: string) => void;
}

function TabFilter({ options, value, onChange }: TabFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition-all cursor-pointer",
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:text-[#F8FAFC]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export { TabFilter };
export type { TabFilterOption };
