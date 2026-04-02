import { formatCurrency, formatDate, formatNumber } from "./utils";

export function formatBankMessage(order) {
  if (order.country === 2 || order.currency === "INR") {
    return [
      "*_INR_*",
      "~--------------------~",
      `Order: *#${order.orderNo}*`,
      `Date: ${formatDate(order.date)}`,
      "~--------------------~",
      `Sender: ${order.senderName || "-"}`,
      `Account Name: ${order.accountName}`,
      `Account No: ${order.accountNo}`,
      `Bank: ${order.bank}`,
      `Branch: ${order.branch || "-"}`,
      `IFSC: ${order.ifscCode || "-"}`,
      // `Rate: ${formatNumber(order.rate)}`,
      // `Service: ${formatNumber(order.serviceCharge)}`,
      // `Payable RM: ${formatCurrency(order.totalPayableAmount, "MYR")}`,
      `Deposit Amt: ${formatCurrency(order.depositAmount ?? order.amount, "INR")}`
    ].join("\n");
  }

  const noteLine = order.notes ? `\n_Notes: ${order.notes}_` : "";

  return [
    "*_IDR_*",
      "~--------------------~",
    `Order: *#${order.orderNo}*`,
    `Date: ${formatDate(order.date)}`,
    "~--------------------~",
    `Sender: ${order.senderName || "-"}`,
    `Account Name: ${order.accountName}`,
    `Account No: ${order.accountNo}`,
    `Bank: ${order.bank}`,
    `Deposit Amount: ${formatCurrency(order.depositAmount ?? order.amount, "IDR")}`,
    // `Rate: ${formatNumber(order.rate)}`,
    // `Service: ${formatNumber(order.serviceCharge)}`,
    // `Payable RM: ${formatCurrency(order.totalPayableAmount, "MYR")}`
  ].join("\n") + (noteLine ? `\n${noteLine}` : "");
}

export function shareViaWhatsApp(message) {
  if (typeof window === "undefined") {
    return Promise.resolve({ opened: false, returned: false });
  }

  const shareWindow = window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");

  return new Promise((resolve) => {
    let appHidden = false;
    let settled = false;
    let earlyTimerId = null;
    let timeoutId = null;

    const cleanup = () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      if (earlyTimerId) {
        window.clearTimeout(earlyTimerId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };

    const finish = (returned) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve({
        opened: Boolean(shareWindow),
        returned,
        appHidden
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        appHidden = true;
        return;
      }

      if (appHidden) {
        finish(true);
      }
    };

    const handleFocus = () => {
      if (appHidden) {
        window.setTimeout(() => finish(true), 150);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    earlyTimerId = window.setTimeout(() => {
      if (!appHidden) {
        finish(false);
      }
    }, 2000);

    timeoutId = window.setTimeout(() => {
      finish(appHidden);
    }, 120000);
  });
}
