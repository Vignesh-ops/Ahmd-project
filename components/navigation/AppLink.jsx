"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useMemo } from "react";
import { useRouteFeedback } from "@/components/navigation/RouteFeedbackProvider";
import { showNetworkRetryToast } from "@/components/network/NetworkRetryToast";

const AppLink = forwardRef(function AppLink(
  { href, onClick, onMouseEnter, onTouchStart, prefetch = true, refreshOnNavigate = false, target, className, ...rest },
  ref
) {
  const router = useRouter();
  const { startNavigation } = useRouteFeedback();

  const hrefString = useMemo(() => {
    if (typeof href === "string") {
      return href;
    }

    if (!href) {
      return "";
    }

    return href.pathname || "";
  }, [href]);

  function warmRoute() {
    if (prefetch && hrefString) {
      router.prefetch(hrefString);
    }
  }

  return (
    <Link
      ref={ref}
      href={href}
      prefetch={prefetch}
      target={target}
      onMouseEnter={(event) => {
        warmRoute();
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        warmRoute();
        onTouchStart?.(event);
      }}
      onClick={(event) => {
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !target &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          if (!navigator.onLine) {
            event.preventDefault();
            showNetworkRetryToast();
            return;
          }

          startNavigation();
          warmRoute();

          if (refreshOnNavigate && hrefString) {
            window.sessionStorage.setItem("refresh-after-navigation", hrefString);
          }
        }

        onClick?.(event);
      }}
      className={className}
      {...rest}
    />
  );
});

export default AppLink;
