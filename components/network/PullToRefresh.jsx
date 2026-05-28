"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import useNetworkStatus from "./useNetworkStatus";
import { showNetworkRetryToast } from "./NetworkRetryToast";

const pullThreshold = 82;
const maxPullDistance = 118;

function canStartPull(target) {
  if (window.scrollY > 0) {
    return false;
  }

  if (!(target instanceof HTMLElement)) {
    return true;
  }

  return !target.closest("input, textarea, select, button, a, [role='button']");
}

export default function PullToRefresh() {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const startY = useRef(0);
  const pulling = useRef(false);
  const distanceRef = useRef(0);
  const isOnlineRef = useRef(isOnline);
  const refreshingRef = useRef(false);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    distanceRef.current = distance;
  }, [distance]);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    let refreshTimer;

    function finishRefresh() {
      refreshTimer = window.setTimeout(() => {
        setRefreshing(false);
        setDistance(0);
      }, 650);
    }

    function handleTouchStart(event) {
      if (event.touches.length !== 1 || !canStartPull(event.target)) {
        pulling.current = false;
        return;
      }

      pulling.current = true;
      startY.current = event.touches[0].clientY;
    }

    function handleTouchMove(event) {
      if (!pulling.current || refreshingRef.current) {
        return;
      }

      const pullDistance = event.touches[0].clientY - startY.current;

      if (pullDistance <= 0) {
        distanceRef.current = 0;
        setDistance(0);
        return;
      }

      const nextDistance = Math.min(maxPullDistance, pullDistance * 0.55);
      distanceRef.current = nextDistance;
      setDistance(nextDistance);
    }

    function handleTouchEnd() {
      if (!pulling.current) {
        return;
      }

      pulling.current = false;

      if (distanceRef.current >= pullThreshold) {
        refreshingRef.current = true;
        setRefreshing(true);

        if (isOnlineRef.current) {
          router.refresh();
        } else {
          showNetworkRetryToast();
        }

        finishRefresh();
        return;
      }

      distanceRef.current = 0;
      setDistance(0);
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [router]);

  const visible = distance > 0 || refreshing;
  const ready = distance >= pullThreshold;

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 transition-all duration-200 md:hidden",
        visible ? "opacity-100" : "opacity-0"
      )}
      style={{ transform: `translate(-50%, ${refreshing ? 52 : Math.max(0, distance - 36)}px)` }}
    >
      <div className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-white/10 bg-dark-elevated/95 px-4 py-2 text-xs font-semibold text-white shadow-glow backdrop-blur">
        {refreshing ? (
          <Loader2 className="h-4 w-4 animate-spin text-gold-light" />
        ) : (
          <RefreshCw className={cn("h-4 w-4 text-gold-light transition", ready && "rotate-180")} />
        )}
        <span>{refreshing ? "Refreshing" : ready ? "Release to refresh" : "Pull to refresh"}</span>
      </div>
    </div>
  );
}
