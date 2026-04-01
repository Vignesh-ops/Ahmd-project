"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const RouteFeedbackContext = createContext({
  isNavigating: false,
  startNavigation: () => {}
});

export function RouteFeedbackProvider({ children }) {
  const pathname = usePathname();
  const timeoutRef = useRef(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const clearNavigation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsNavigating(false);
    }, 180);
  }, []);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
  }, []);

  useEffect(() => {
    if (isNavigating) {
      clearNavigation();
    }
  }, [clearNavigation, isNavigating, pathname]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      isNavigating,
      startNavigation
    }),
    [isNavigating, startNavigation]
  );

  return (
    <RouteFeedbackContext.Provider value={value}>
      {children}
      <div
        aria-hidden="true"
        className={`route-progress ${isNavigating ? "route-progress--active" : ""}`}
      />
    </RouteFeedbackContext.Provider>
  );
}

export function useRouteFeedback() {
  return useContext(RouteFeedbackContext);
}
