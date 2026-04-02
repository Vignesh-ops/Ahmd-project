import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Select({ label, options = [], className, ...props }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(props.value || "");

  useEffect(() => {
    setSelected(props.value || "");
  }, [props.value]);

  const handleSelect = (value) => {
    setSelected(value);
    setIsOpen(false);
    props.onChange?.({ target: { value } });
  };

  const selectedLabel = options.find((opt) => opt.value === selected)?.label || "Select...";

  return (
    <label className={cn("flex w-full flex-col gap-2", className)}>
      {label ? (
        <span className="text-sm font-medium text-white/80 ">
          {label}
        </span>
      ) : null}
      
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => handleSelect(e.target.value)}
          className="hidden"
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-dark-input px-4 py-3 pr-10 text-left text-sm text-white outline-none transition hover:border-gold/50 focus:border-gold/70 focus:ring-2 focus:ring-gold/20"
          aria-expanded={isOpen}
        >
          <span>{selectedLabel}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-white/40 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-[9999] mt-2 overflow-hidden rounded-2xl border border-gold/30 bg-dark-elevated shadow-2xl animate-in fade-in zoom-in-95">
            <div className="max-h-64 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full items-center gap-3 bg-dark-input px-4 py-3 text-left text-sm transition-colors",
                    selected === option.value
                      ? "border-l-2 border-gold bg-gold/20 text-gold"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {selected === option.value && (
                    <svg className="h-4 w-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </label>
  );
}
