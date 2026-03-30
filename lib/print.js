import { formatCurrency, formatDate, formatNumber } from "./utils";

const THERMAL_SERVICE_UUID = "000018f0-0000-1000-8000-00805f9b34fb";

export function buildBankReceiptText(order) {
  return [
    "AHMAD ENTERPRISES",
    order.country === 2 ? "BANK TRANSFER INR" : "BANK TRANSFER IDR",
    formatDate(order.date),
    "------------------------------",
    `Order#: ${order.orderNo}`,
    `AccName: ${order.accountName}`,
    `AccNo: ${order.accountNo}`,
    `Bank: ${order.bank}`,
    order.branch ? `Branch: ${order.branch}` : null,
    order.ifscCode ? `IFSC: ${order.ifscCode}` : null,
    `Sender: ${order.senderName || "-"}`,
    `Mobile: ${order.senderMobile}`,
    `Rate: ${formatNumber(order.rate)}`,
    `Service: ${formatNumber(order.serviceCharge)}`,
    "------------------------------",
    `AMOUNT: ${formatCurrency(order.depositAmount ?? order.amount, order.country === 2 ? "INR" : "IDR")}`,
    `PAYABLE (RM): ${formatCurrency(order.totalPayableAmount, "MYR")}`,
    "",
    `${order.storeName || "AHMAD Enterprises"} · ${order.storeCode || ""}`,
    "Thank you"
  ]
    .filter(Boolean)
    .join("\n");
}

export async function bluetoothPrint(receiptText) {
  if (typeof window === "undefined") {
    return { fallback: true };
  }

  if (!navigator.bluetooth) {
    window.print();
    return { fallback: true };
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [THERMAL_SERVICE_UUID]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(THERMAL_SERVICE_UUID);
    const characteristics = await service.getCharacteristics();
    const writable = characteristics.find(
      (characteristic) =>
        characteristic.properties.write || characteristic.properties.writeWithoutResponse
    );

    if (!writable) {
      throw new Error("No writable printer characteristic found.");
    }

    const encoder = new TextEncoder();
    const content = `\u001B@\u001Ba\u0001${receiptText}\n\n\n\u001DV\u0001`;
    await writable.writeValue(encoder.encode(content));

    return { fallback: false };
  } catch (error) {
    window.print();
    return {
      fallback: true,
      error: error.message
    };
  }
}
