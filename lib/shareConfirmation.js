"use client";

const STORAGE_KEY = "ahmd.pendingShareConfirmation";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getPendingShareConfirmation() {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const order = JSON.parse(rawValue);
    return order?.id && order?.orderNo ? order : null;
  } catch {
    return null;
  }
}

export function setPendingShareConfirmation(order) {
  if (!canUseStorage() || !order?.id || !order?.orderNo || order.status === "done") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...order,
      pendingShareConfirmationAt: Date.now()
    })
  );
}

export function clearPendingShareConfirmation(order) {
  if (!canUseStorage()) {
    return;
  }

  const pendingOrder = getPendingShareConfirmation();
  if (!order || !pendingOrder || pendingOrder.id === order.id) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
