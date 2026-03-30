"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ahmad-theme";
const ThemeContext = createContext(null);

function resolveTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.body?.setAttribute("data-theme", theme);
}

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initialTheme = resolveTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [ready, theme]);

  const value = useMemo(
    () => ({
      theme,
      ready,
      setTheme,
      toggleTheme() {
        setTheme((current) => (current === "light" ? "dark" : "light"));
      }
    }),
    [theme, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return value;
}
