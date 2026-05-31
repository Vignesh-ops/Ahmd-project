"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Input({
  label,
  hint,
  error,
  prefix,
  icon: Icon,
  className,
  inputClassName,
  mono = false,
  textarea = false,
  allowPasswordToggle = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const canTogglePassword = !textarea && allowPasswordToggle && props.type === "password";
  const resolvedType = canTogglePassword ? (showPassword ? "text" : "password") : props.type;
  const sharedClassName = cn(
    "w-full rounded-2xl border border-white/10 bg-dark-input px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-gold/70 focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-70",
    mono && "font-mono",
    (prefix || Icon) && "pl-10",
    canTogglePassword && "pr-12",
    props.readOnly && "bg-white/5",
    inputClassName
  );
  const showDatePlaceholder = !textarea && resolvedType === "date" && !props.value && props.placeholder;

  return (
    <label className={cn("flex w-full flex-col gap-2", className)}>
      {label ? (
        <span className="text-sm font-medium text-white/80">
          {label}
          {hint ? <span className="ml-2 text-xs text-white/45">{hint}</span> : null}
        </span>
      ) : null}
      <span className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-light" />
        ) : prefix ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/45">
            {prefix}
          </span>
        ) : null}
        {textarea ? (
          <textarea className={sharedClassName} {...props} />
        ) : (
          <input
            className={sharedClassName}
            data-empty={resolvedType === "date" && !props.value ? "true" : undefined}
            {...props}
            type={resolvedType}
          />
        )}
        {showDatePlaceholder ? (
          <span className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm text-white/40">
            {props.placeholder}
          </span>
        ) : null}
        {canTogglePassword ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/45 transition hover:text-white"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </span>
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </label>
  );
}
