"use client";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

export default function MonthFilter({ value }) {
  const router = useRouter();

  return (
    <div className="w-full sm:w-64">
      <label className="flex w-full flex-col gap-2">
        <span className="text-sm font-medium text-white/80">Month</span>
        <span className="relative block">
          <CalendarDays className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gold-light" />
          <input
            type="month"
            value={value}
            onChange={(event) => router.push(`/?month=${event.target.value}`)}
            className="month-filter-select w-full appearance-none rounded-2xl border border-white/10 bg-dark-input py-3 pl-12 pr-11 text-sm font-semibold text-white outline-none transition hover:border-gold/50 focus:border-gold/70 focus:ring-2 focus:ring-gold/20"
          />
        </span>
      </label>
    </div>
  );
}
