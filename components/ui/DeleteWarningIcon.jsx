import { AlertTriangle } from "lucide-react";

export default function DeleteWarningIcon() {
  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center" aria-hidden="true">
      <span className="status-pending-ring absolute inset-0 rounded-full border-2 border-red-500/50" />
      <span
        className="status-pending-ring absolute inset-0 rounded-full border-2 border-red-500/50"
        style={{ animationDelay: "0.5s" }}
      />
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
        <AlertTriangle className="status-pending-icon h-6 w-6 text-red-400" />
      </span>
    </span>
  );
}
