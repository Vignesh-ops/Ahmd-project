"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import useNetworkStatus from "./useNetworkStatus";
import { showNetworkRetryToast } from "./NetworkRetryToast";

export default function NetworkStatusIndicator() {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const wasOffline = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }

    if (wasOffline.current) {
      wasOffline.current = false;
      router.refresh();
    }
  }, [isOnline, router]);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex min-h-[44px] items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition",
          "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
        )}
      >
        <Wifi className="h-4 w-4" />
        <span className="hidden sm:inline">Online</span>
      </button>
    );
  }

  const Icon = isOnline ? Wifi : WifiOff;

  return (
    <button
      type="button"
      onClick={() => (isOnline ? router.refresh() : showNetworkRetryToast())}
      title={isOnline ? "Online. Refresh data" : "Offline. Waiting for network"}
      className={cn(
        "inline-flex min-h-[44px] items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition",
        isOnline
          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15"
          : "border-red-400/30 bg-red-500/15 text-red-100"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
      {isOnline ? <RefreshCw className="hidden h-3.5 w-3.5 opacity-70 sm:block" /> : null}
    </button>
  );
}
