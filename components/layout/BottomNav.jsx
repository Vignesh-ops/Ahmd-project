"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, History, Landmark, Settings, Shield } from "lucide-react";
import AppLink from "@/components/navigation/AppLink";
import { cn } from "@/lib/utils";

const nonKeyboardInputTypes = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit"
]);

function opensSoftKeyboard(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element.isContentEditable) {
    return true;
  }

  if (element instanceof HTMLTextAreaElement) {
    return !element.disabled && !element.readOnly;
  }

  if (element instanceof HTMLSelectElement) {
    return !element.disabled;
  }

  if (element instanceof HTMLInputElement) {
    return !element.disabled && !element.readOnly && !nonKeyboardInputTypes.has(element.type);
  }

  return false;
}

export default function BottomNav({ role }) {
  const pathname = usePathname();
  const [hideForKeyboard, setHideForKeyboard] = useState(false);

  useEffect(() => {
    let blurTimer;

    function updateVisibility(target = document.activeElement) {
      setHideForKeyboard(opensSoftKeyboard(target));
    }

    function handleFocusIn(event) {
      window.clearTimeout(blurTimer);
      updateVisibility(event.target);
    }

    function handleFocusOut() {
      window.clearTimeout(blurTimer);
      blurTimer = window.setTimeout(() => updateVisibility(), 80);
    }

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    updateVisibility();

    return () => {
      window.clearTimeout(blurTimer);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/bank-order", label: "Order", icon: Landmark },
    { href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings }
  ];

  if (role === "admin") {
    items.push({ href: "/admin", label: "Admin", icon: Shield });
  }

  return (
    <nav
      className={cn(
        "bottom-nav fixed bottom-0 left-0 right-0 z-30 border-t border-white/5 bg-dark-surface/95 backdrop-blur-xl md:hidden",
        hideForKeyboard && "hidden"
      )}
    >
      <div className={cn("grid h-16", role === "admin" ? "grid-cols-5" : "grid-cols-4")}>
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const Icon = item.icon;

          return (
            <AppLink
              key={item.href}
              href={item.href}
              prefetch={item.href !== "/"}
              className="flex flex-col items-center justify-center gap-1 px-1 py-2"
            >
              <Icon className={cn("h-4 w-4", active ? "text-gold-light" : "text-white/45")} />
              <span className={cn("text-[11px]", active ? "text-gold-light" : "text-white/45")}>
                {item.label}
              </span>
            </AppLink>
          );
        })}
      </div>
    </nav>
  );
}
