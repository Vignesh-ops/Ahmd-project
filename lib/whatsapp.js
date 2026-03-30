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
      `Rate: ${formatNumber(order.rate)}`,
      `Service: ${formatNumber(order.serviceCharge)}`,
      `Payable RM: ${formatCurrency(order.totalPayableAmount, "MYR")}`,
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
    `Rate: ${formatNumber(order.rate)}`,
    `Service: ${formatNumber(order.serviceCharge)}`,
    `Payable RM: ${formatCurrency(order.totalPayableAmount, "MYR")}`
  ].join("\n") + (noteLine ? `\n${noteLine}` : "");
}

export function shareViaWhatsApp(message) {
  if (typeof window === "undefined") {
    return;
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}
