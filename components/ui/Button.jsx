import {
  ArrowLeft,
  Check,
  Download,
  Edit3,
  Eye,
  History,
  Loader2,
  Printer,
  RefreshCw,
  Save,
  Send,
  Settings2,
  Trash2,
  UserCog,
  UserPlus,
  X
} from "lucide-react";
import AppLink from "@/components/navigation/AppLink";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-gold text-dark-base hover:bg-gold-light focus-visible:outline-gold",
  secondary:
    "border border-white/10 bg-dark-elevated text-white hover:bg-white/10 focus-visible:outline-white/40",
  ghost:
    "bg-transparent text-white hover:bg-white/10 focus-visible:outline-white/40",
  danger:
    "bg-red-500/90 text-white hover:bg-red-400 focus-visible:outline-red-300"
};

const actionIcons = {
  "add user": UserPlus,
  "back to admin": ArrowLeft,
  cancel: X,
  close: X,
  delete: Trash2,
  deleting: Trash2,
  edit: Edit3,
  export: Download,
  "export xlsx": Download,
  history: History,
  "load more": RefreshCw,
  "manage rates": Settings2,
  "manage users": UserCog,
  "open receipt": Eye,
  print: Printer,
  rates: Settings2,
  reset: RefreshCw,
  "reset password": RefreshCw,
  save: Save,
  "save settings": Save,
  "save store settings": Save,
  share: Send,
  "view history": History,
  "view receipt": Eye,
  "whatsapp share": Send,
  update: Check
};

function getActionIcon(children) {
  if (typeof children !== "string") {
    return null;
  }

  const normalized = children.trim().toLowerCase();

  if (actionIcons[normalized]) {
    return actionIcons[normalized];
  }

  return Object.entries(actionIcons).find(([label]) => normalized.startsWith(label))?.[1] || null;
}

export default function Button({
  children,
  className,
  variant = "primary",
  loading = false,
  icon: Icon,
  fullWidth = false,
  href,
  disabled,
  ...props
}) {
  const AutoIcon = Icon || getActionIcon(children);
  const classes = cn(
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    fullWidth && "w-full",
    className
  );

  if (href) {
    return (
      <AppLink href={href} className={classes} {...props}>
        {AutoIcon ? <AutoIcon className="h-4 w-4 shrink-0" /> : null}
        {children}
      </AppLink>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : AutoIcon ? <AutoIcon className="h-4 w-4 shrink-0" /> : null}
      {children}
    </button>
  );
}
