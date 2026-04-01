import Link from "next/link";
import { ArrowUpRight, Home, Landmark, Phone } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

export default function OrderCard({ order, href, showStore = false, children }) {
  const showLinkIndicator = Boolean(href);
  const icon =
    order.type === "bank" ? (
      <Landmark className="h-4 w-4 text-gold-light" />
    ) : (
      <Home className="h-4 w-4 text-teal" />
    );

  const amount =
    order.type === "home"
      ? `${formatCurrency(order.amount, "INR")} · ${formatCurrency(order.localAmount, "IDR")}`
      : formatCurrency(order.amount, order.currency);

  const content = (
    <div className="glass-panel w-full relative z-[1] overflow-hidden rounded-[28px] border border-white/5 p-5 transition hover:border-gold/25">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
            {icon}
            {order.typeLabel}
          </div>
          <div className="min-w-0">
            <p className="break-all font-mono text-sm text-gold-light">{order.orderNo}</p>
            <h3 className="mt-1 break-words text-lg font-semibold text-white">{order.customerName}</h3>
            <p className="break-words text-sm text-white/55">{order.bankOrAddress || "No extra details"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:shrink-0">
          <StatusBadge status={order.status} />
          {showLinkIndicator ? (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/45 transition group-hover:bg-gold/20 group-hover:text-gold-light">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-white/65 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/35">Amount</p>
          <p className="mt-1 break-words font-semibold text-white">{amount}</p>
          {order.totalPayableAmount ? (
            <p className="mt-1 text-xs text-white/45">Payable {formatCurrency(order.totalPayableAmount, "MYR")}</p>
          ) : null}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/35">Date</p>
          <p className="mt-1 text-white">{formatDateTime(order.date)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/35">Contact</p>
          <p className="mt-1 inline-flex items-center gap-2 text-white">
            <Phone className="h-4 w-4 text-white/40" />
            {order.senderMobile || order.benMobile || "-"}
          </p>
        </div>
      </div>

      {showStore ? (
        <div className="mt-4 break-words rounded-2xl bg-white/5 px-3 py-2 text-xs text-white/55">
          {order.storeName} · {order.storeCode}
        </div>
      ) : null}

      {children ? <div className="mt-5 flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="group block">
      {content}
    </Link>
  );
}
