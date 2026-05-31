"use client";

import { Moon, SunMedium } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ className, showLabel = true }) {
  const { ready, theme, toggleTheme } = useTheme();
  const isLight = ready && theme === "light";
  const label = isLight ? "Dark Mode" : "Light Mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "theme-toggle inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/10 bg-dark-elevated px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10",
        isLight && "theme-toggle--light",
        !showLabel && "!h-11 !w-11 !px-0",
        className
      )}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      title={isLight ? "Switch to dark theme" : "Switch to light theme"}
    >
      <span className="theme-toggle-orbit" aria-hidden="true">
        <SunMedium className="theme-toggle-icon theme-toggle-sun h-5 w-5" />
        <Moon className="theme-toggle-icon theme-toggle-moon h-5 w-5" />
      </span>
      {showLabel ? <span className="hidden sm:inline">{label}</span> : null}
    </button>
  );
}
