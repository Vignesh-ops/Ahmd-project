import { cn } from "@/lib/utils";

export default function RadioPill({ value, label, checked, onChange, name }) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={checked}
      className={cn(
        "min-h-[44px] min-w-[44px] rounded-2xl border px-4 py-2 text-sm font-semibold transition",
        checked
          ? "border-gold bg-gold text-dark-base"
          : "border-white/10 bg-dark-input text-white/80 hover:bg-dark-elevated"
      )}
      name={name}
    >
      {label}
    </button>
  );
}

