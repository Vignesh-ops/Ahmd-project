import { cn } from "@/lib/utils";

const styles = {
  pending: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30",
  done: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30",
  failed: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30"
};

export default function StatusBadge({ status = "pending" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        styles[status] || styles.pending
      )}
    >
      {status}
    </span>
  );
}

