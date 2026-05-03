"use client";

import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";

export default function MonthFilter({ value }) {
  const router = useRouter();

  return (
    <div className="w-full sm:w-56">
      <Input
        label="Month"
        type="month"
        value={value}
        onChange={(event) => router.push(`/?month=${event.target.value}`)}
      />
    </div>
  );
}
