"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function RefreshAfterNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const pendingHref = window.sessionStorage.getItem("refresh-after-navigation");

    if (!pendingHref) {
      return;
    }

    const currentHref = searchParams.size ? `${pathname}?${searchParams.toString()}` : pathname;

    if (pendingHref === pathname || pendingHref === currentHref) {
      window.sessionStorage.removeItem("refresh-after-navigation");
      router.refresh();
    }
  }, [pathname, router, searchParams]);

  return null;
}
