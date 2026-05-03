import { formatPreciseNumber } from "@/lib/utils";

export default function ProfitSummary({ idr = 0, inr = 0, compact = false }) {
  const rowClassName = compact ? "block leading-relaxed" : "block";

  return (
    <span className="block space-y-1">
      <span className={rowClassName}>IDR: {formatPreciseNumber(idr)}RM</span>
      <span className={rowClassName}>INR: {formatPreciseNumber(inr)}RM</span>
    </span>
  );
}
