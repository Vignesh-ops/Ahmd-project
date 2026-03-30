"use client";

import { Moon, SunMedium } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ className, showLabel = true }) {
  const { ready, theme, toggleTheme } = useTheme();
  const isLight = ready && theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/10 bg-dark-elevated px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10",
        className
      )}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      title={isLight ? "Switch to dark theme" : "Switch to light theme"}
    >
      {isLight ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
      {showLabel ? <span className="hidden sm:inline">{isLight ? "Dark Mode" : "Light Mode"}</span> : null}
    </button>
  );
}
