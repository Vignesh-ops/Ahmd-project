import { Loader2 } from "lucide-react";
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

export default function Button({
  children,
  className,
  variant = "primary",
  loading = false,
  icon: Icon,
  fullWidth = false,
  href,
  ...props
}) {
  const classes = cn(
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    fullWidth && "w-full",
    className
  );

  if (href) {
    return (
      <AppLink href={href} className={classes} {...props}>
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {children}
      </AppLink>
    );
  }

  return (
    <button
      className={classes}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}
