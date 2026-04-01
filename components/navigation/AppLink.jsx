"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useMemo } from "react";
import { useRouteFeedback } from "@/components/navigation/RouteFeedbackProvider";

const AppLink = forwardRef(function AppLink(
  { href, onClick, onMouseEnter, onTouchStart, prefetch = true, ...props },
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
          !props.target &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          startNavigation();
          warmRoute();
        }

        onClick?.(event);
      }}
      {...props}
    />
  );
});

export default AppLink;
