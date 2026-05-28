"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import useNetworkStatus from "./useNetworkStatus";

export const NETWORK_RETRY_EVENT = "ahmad:network-retry";

export function showNetworkRetryToast() {
  window.dispatchEvent(new Event(NETWORK_RETRY_EVENT));
}

export default function NetworkRetryToast() {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function showToast() {
      setVisible(true);
    }

    window.addEventListener(NETWORK_RETRY_EVENT, showToast);

    if (!isOnline) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener(NETWORK_RETRY_EVENT, showToast);
    };
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline) {
      return undefined;
    }

    const hideTimer = window.setTimeout(() => setVisible(false), 900);
    router.refresh();

    return () => window.clearTimeout(hideTimer);
  }, [isOnline, router]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed left-3 right-3 top-20 z-50 mx-auto max-w-sm rounded-2xl border border-white/10 bg-dark-elevated/95 p-3 text-white shadow-glow backdrop-blur sm:left-auto sm:right-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-100">
          <WifiOff className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{isOnline ? "Back online" : "No internet"}</p>
          <p className="text-xs text-white/60">
            {isOnline ? "Refreshing latest data..." : "Check connection and retry."}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="min-h-[40px] rounded-xl px-3"
          onClick={() => {
            if (navigator.onLine) {
              router.refresh();
              setVisible(false);
            }
          }}
        >
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Retry</span>
        </Button>
      </div>
    </div>
  );
}
