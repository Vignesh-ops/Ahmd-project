const RECEIPT_CACHE_PREFIX = "receipt-order:";

export function cacheReceiptOrder(order) {
  if (typeof window === "undefined" || !order?.orderNo) {
    return;
  }

  try {
    window.sessionStorage.setItem(`${RECEIPT_CACHE_PREFIX}${order.orderNo}`, JSON.stringify(order));
  } catch {
    // Receipt navigation should not fail just because browser storage is unavailable.
  }
}

export function readCachedReceiptOrder(orderNo) {
  if (typeof window === "undefined" || !orderNo) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(`${RECEIPT_CACHE_PREFIX}${orderNo}`);
    const order = raw ? JSON.parse(raw) : null;
    return order?.orderNo === orderNo ? order : null;
  } catch {
    return null;
  }
}
