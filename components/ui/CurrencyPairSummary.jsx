import { formatCurrency, formatCurrencyPlain } from "@/lib/utils";

export default function CurrencyPairSummary({ idr = 0, idrMyr = 0, inr = 0, inrMyr = 0, compact = false }) {
  const rowClassName = compact ? "block leading-relaxed" : "block";

  return (
    <span className="block space-y-1">
      <span className={rowClassName}>
        {formatCurrency(idr, "IDR")} / {formatCurrencyPlain(idrMyr, "MYR")}
      </span>
      <span className={rowClassName}>
        {formatCurrencyPlain(inr, "INR")} / {formatCurrencyPlain(inrMyr, "MYR")}
      </span>
    </span>
  );
}
