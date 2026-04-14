"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { History, Home, Landmark, LogOut, Settings, Shield, Store } from "lucide-react";
import AppLink from "@/components/navigation/AppLink";
import { signOut } from "next-auth/react";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

export default function Navbar({ user }) {
  const pathname = usePathname();
  const isAdmin = user.role === "admin";
  const userLabel = isAdmin ? "Admin" : user.storeName || user.username;
  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/bank-order", label: "Order", icon: Landmark },
    { href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings }
  ];

  if (isAdmin) {
    items.push({ href: "/admin", label: "Admin", icon: Shield });
  }

  return (
    <header
      className="sticky top-0 z-30 border-b border-white/5 backdrop-blur-xl"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        backgroundColor: "#000"
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <AppLink href="/" prefetch={false} className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/30 bg-white/95 shadow-[0_0_0_4px_rgba(212,168,67,0.08)] sm:h-14 sm:w-14">
            <div className="relative h-9 w-9 sm:h-11 sm:w-11">
              <Image
                src="/Ahmad_logo.png"
                alt="Ahmad company logo"
                fill
                priority
                quality={100}
                unoptimized
                className="object-contain"
                sizes="44px"
              />
            </div>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[2rem] font-bold uppercase tracking-[0.22em] text-white/35 md:hidden">AHMAD</p>
            <p className="hidden text-xs uppercase tracking-[0.28em] text-white/35 md:block">AHMAD Enterprises</p>
            <p className="hidden text-sm text-white/65 md:block">Store and admin remittance management</p>
          </div>
        </AppLink>

        <nav className="hidden flex-1 items-center justify-center md:flex">
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/5 bg-white/5 px-2 py-2">
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
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition",
                    active
                      ? "bg-gold/15 text-gold-light"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </AppLink>
              );
            })}
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle showLabel={false} className="px-3" />
          <span className="hidden max-w-[170px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 sm:inline-flex">
            {isAdmin ? <Shield className="h-4 w-4 text-gold-light" /> : <Store className="h-4 w-4 text-teal" />}
            <span className="truncate">{userLabel}</span>
          </span>
          <Button variant="secondary" className="px-3" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
