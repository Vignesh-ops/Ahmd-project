import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Select({ label, options = [], className, ...props }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(props.value || "");

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
        {/* Hidden select for form submission */}
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

        {/* Fancy Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-dark-input appearance-none rounded-2xl border border-white/10 dark:border-gray-300/20 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-gray-100 dark:to-gray-50 px-4 py-3 pr-10 text-sm text-white  outline-none transition hover:border-gold/50 dark:hover:border-gold/40 focus:border-gold/70 focus:ring-2 focus:ring-gold/20 dark:focus:ring-gold/10 text-left flex items-center justify-between"
        >
          <span>{selectedLabel}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-white/40 dark:text-gray-600 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Fancy Dropdown Menu */}
        {isOpen && (
          <div className="absolut bg-dark-inpute z-[9999] top-full left-0 right-0 mt-2 rounded-2xl border border-gold/30 dark:border-gold/40 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-gray-50 dark:to-gray-100 shadow-2xl dark:shadow-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="max-h-64 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full bg-dark-input px-4 py-3 text-sm text-left transition-colors flex items-center gap-3",
                    selected === option.value
                      ? "bg-dark-input bg-gold/20 dark:bg-gold/15 text-gold dark:text-gold border-l-2 border-gold"
                      : "text-white/80 dark:text-gray-700 hover:bg-white/5 dark:hover:bg-gray-200/30 hover:text-white dark:hover:text-gray-900"
                  )}
                >
                  {selected === option.value && (
                    <svg className="w-4 bg-dark-input h-4 text-gold dark:text-gold" fill="currentColor" viewBox="0 0 20 20">
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