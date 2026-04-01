"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RouteWarmup({ routes = [] }) {
  const router = useRouter();

  useEffect(() => {
    routes.forEach((route) => {
      if (route) {
        router.prefetch(route);
      }
    });
  }, [router, routes]);

  return null;
}
