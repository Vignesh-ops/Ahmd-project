import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

const styles = {
  pending: "status-pending bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30",
  done: "status-done bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30",
  failed: "status-failed bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30"
};

const icons = {
  pending: Clock3,
  done: CheckCircle2,
  failed: AlertTriangle
};

export default function StatusBadge({ status = "pending" }) {
  const Icon = icons[status] || icons.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        styles[status] || styles.pending
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

