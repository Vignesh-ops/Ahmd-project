"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, Landmark, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav({ role }) {
  const pathname = usePathname();

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
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-30 border-t border-white/5 bg-dark-surface/95 backdrop-blur-xl md:hidden">
      <div className={cn("grid h-16", role === "admin" ? "grid-cols-5" : "grid-cols-4")}>
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 px-1 py-2"
            >
              <Icon className={cn("h-4 w-4", active ? "text-gold-light" : "text-white/45")} />
              <span className={cn("text-[11px]", active ? "text-gold-light" : "text-white/45")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
