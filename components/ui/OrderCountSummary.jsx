import { formatNumber } from "@/lib/utils";

export default function OrderCountSummary({ idr = 0, inr = 0, compact = false }) {
  const rowClassName = compact ? "block leading-relaxed" : "block";

  return (
    <span className="block space-y-1">
      <span className={rowClassName}>IDR: {formatNumber(idr, 0)}</span>
      <span className={rowClassName}>INR: {formatNumber(inr, 0)}</span>
    </span>
  );
}
