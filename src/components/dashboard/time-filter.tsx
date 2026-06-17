"use client";
import { Calendar } from "lucide-react";

export type TimeRangeValue = "today" | "week" | "month" | "year" | "custom";

interface TimeFilterProps {
  value: TimeRangeValue;
  onChange: (range: TimeRangeValue, start?: string, end?: string) => void;
  showCustom?: boolean;
}

const options: { value: TimeRangeValue; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export default function TimeFilter({ value, onChange, showCustom = true }: TimeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar size={14} className="text-muted-foreground" />
      <div className="flex rounded-lg border border-border overflow-hidden">
        {[...options, ...(showCustom ? [{ value: "custom" as const, label: "Custom" }] : [])].map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              value === opt.value
                ? "bg-[#7C3AED] text-white"
                : "text-muted-foreground hover:text-[#F8FAFC] hover:bg-card"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {value === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            onChange={(e) => onChange("custom", e.target.value, undefined)}
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-[#F8FAFC] outline-none"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            onChange={(e) => onChange("custom", undefined, e.target.value)}
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-[#F8FAFC] outline-none"
          />
        </div>
      )}
    </div>
  );
}
