import { ClipboardList, Coins, TrendingUp, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StatCard({ label, value, accent = "gold", className }) {
  const accentMap = {
    gold: {
      line: "from-gold/45 via-gold/20 to-transparent",
      pill: "from-gold/25 to-gold/5 text-gold-light",
      icon: "text-gold-light bg-gold/10 ring-gold/20"
    },
    teal: {
      line: "from-teal/45 via-teal/20 to-transparent",
      pill: "from-teal/20 to-teal/5 text-teal",
      icon: "text-teal bg-teal/10 ring-teal/20"
    },
    rose: {
      line: "from-rose-400/45 via-rose-400/20 to-transparent",
      pill: "from-rose-400/20 to-rose-400/5 text-rose-200",
      icon: "text-rose-200 bg-rose-400/10 ring-rose-400/20"
    }
  };
  const iconMap = {
    "total orders": ClipboardList,
    orders: ClipboardList,
    profit: TrendingUp,
    "total amount": WalletCards,
    amount: WalletCards
  };
  const key = String(label || "").trim().toLowerCase();
  const Icon = iconMap[key] || Coins;
  const tone = accentMap[accent] || accentMap.gold;

  return (
    <div
      className={cn(
        "glass-panel relative overflow-hidden rounded-[28px] border border-white/5 p-5",
        className
      )}
    >
      <div className={cn("mb-4 h-1.5 w-14 rounded-full bg-gradient-to-r", tone.line)} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={cn("inline-flex items-center gap-2 rounded-xl bg-gradient-to-r px-3 py-1.5", tone.pill)}>
            <Icon className="h-4 w-4 shrink-0" />
            <p className="text-base font-bold">{label}</p>
          </div>
          <p className="mt-3 break-words text-lg font-semibold tracking-tight text-white sm:text-2xl">{value}</p>
        </div>
        <div className={cn("hidden h-14 w-14 shrink-0 items-center justify-center rounded-full ring-1 sm:flex", tone.icon)}>
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}
