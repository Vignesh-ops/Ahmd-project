import { cn } from "@/lib/utils";

export default function StatCard({ label, value, accent = "gold", className }) {
  const accentMap = {
    gold: "from-gold/20 to-transparent text-gold-light",
    teal: "from-teal/20 to-transparent text-teal",
    rose: "from-rose-400/20 to-transparent text-rose-200"
  };

  return (
    <div
      className={cn(
        "glass-panel rounded-[28px] border border-white/5 p-5",
        className
      )}
    >
      <div className={cn("mb-4 h-1.5 w-12 rounded-full bg-gradient-to-r", accentMap[accent] || accentMap.gold)} />
      <div className="inline-block rounded-lg bg-gradient-to-r from-gold/30 to-gold/10 px-3 py-1.5">
        <p className="text-base font-bold text-gold-light decoration-gold-light decoration-2 underline-offset-2">{label}</p>
      </div>
      <p className="mt-2 break-words text-lg font-semibold tracking-tight text-white sm:text-2xl">{value}</p>
    </div>
  );
}
