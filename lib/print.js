import { formatCurrency, formatDate, formatNumber } from "./utils";

const THERMAL_SERVICE_UUID = "000018f0-0000-1000-8000-00805f9b34fb";
const PRINTER_SERVICE_UUIDS = [
  THERMAL_SERVICE_UUID,
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
];
const MAX_WRITE_CHUNK = 180;

async function resolveWritableCharacteristic(server) {
  for (const serviceUuid of PRINTER_SERVICE_UUIDS) {
    try {
      const service = await server.getPrimaryService(serviceUuid);
      const characteristics = await service.getCharacteristics();
      const writable = characteristics.find(
        (characteristic) =>
          characteristic.properties.write || characteristic.properties.writeWithoutResponse
      );

      if (writable) {
        return writable;
      }
    } catch {
      // Keep checking common thermal-printer services.
    }
  }

  const services = await server.getPrimaryServices();

  for (const service of services) {
    const characteristics = await service.getCharacteristics();
    const writable = characteristics.find(
      (characteristic) =>
        characteristic.properties.write || characteristic.properties.writeWithoutResponse
    );

    if (writable) {
      return writable;
    }
  }

  throw new Error("No writable printer characteristic found.");
}

async function writeInChunks(characteristic, bytes) {
  for (let index = 0; index < bytes.length; index += MAX_WRITE_CHUNK) {
    const chunk = bytes.slice(index, index + MAX_WRITE_CHUNK);

    if (characteristic.properties.writeWithoutResponse && characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
    } else {
      await characteristic.writeValue(chunk);
    }
  }
}

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
      optionalServices: PRINTER_SERVICE_UUIDS
    });

    const server = await device.gatt.connect();
    const writable = await resolveWritableCharacteristic(server);

    const encoder = new TextEncoder();
    const content = `\u001B@\u001Ba\u0001${receiptText}\n\n\n\u001DV\u0001`;
    await writeInChunks(writable, encoder.encode(content));
    device.gatt?.disconnect?.();

    return { fallback: false };
  } catch (error) {
    window.print();
    return {
      fallback: true,
      error: error.message
    };
  }
}
