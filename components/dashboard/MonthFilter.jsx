"use client";

import { useRouter } from "next/navigation";
import Select from "@/components/ui/Select";

export default function MonthFilter({ months = [], value }) {
  const router = useRouter();

  if (!months.length) {
    return null;
  }

  return (
    <div className="w-full sm:w-56">
      <Select
        label="Month"
        value={value}
        options={months}
        onChange={(event) => router.push(`/?month=${event.target.value}`)}
      />
    </div>
  );
}
