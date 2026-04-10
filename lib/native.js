export function isNativeCapacitor() {
  return typeof window !== "undefined" &&
    typeof window.Capacitor?.isNativePlatform === "function" &&
    window.Capacitor.isNativePlatform();
}

export function openInAppOrTab(url) {
  if (typeof window === "undefined") {
    return;
  }

  if (isNativeCapacitor()) {
    window.location.href = url;
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
