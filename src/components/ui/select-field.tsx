import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  options?: SelectOption[];
  size?: "default" | "compact" | "sm" | "md";
}

const sizeClasses: Record<NonNullable<SelectFieldProps["size"]>, string> = {
  default:
    "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#7C3AED]",
  compact:
    "rounded-lg border border-border bg-card px-3 py-2.5 text-xs text-[#F8FAFC] outline-none focus:border-[#7C3AED]",
  sm: "h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-[#F8FAFC] outline-none",
  md: "h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-[#F8FAFC] outline-none",
};

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ options, size = "default", className, children, ...props }, ref) => (
    <select ref={ref} className={cn(sizeClasses[size], className)} {...props}>
      {options
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  ),
);

SelectField.displayName = "SelectField";

export { SelectField };
