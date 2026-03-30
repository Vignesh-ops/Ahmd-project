import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Select({ label, options = [], className, ...props }) {
  return (
    <label className={cn("flex w-full flex-col gap-2", className)}>
      {label ? <span className="text-sm font-medium text-white/80">{label}</span> : null}
      <span className="relative">
        <select
          className="w-full appearance-none rounded-2xl border border-white/10 bg-dark-input px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-gold/70 focus:ring-2 focus:ring-gold/20"
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      </span>
    </label>
  );
}

