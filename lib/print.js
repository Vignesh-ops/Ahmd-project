import { Capacitor, registerPlugin } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { UsbPrinter } from "@posx/capacitor-usb-printer";
import { isNativeCapacitor } from "./native";
import { formatCurrencyPlain, formatDate } from "./utils";

const BluetoothPrinter = registerPlugin("BluetoothPrinter");
const WebPrint = registerPlugin("WebPrint");
const PREFERRED_PRINTER_KEY = "preferred_printer_v1";

function canUseNativePrinting() {
  return isNativeCapacitor();
}

function isBluetoothPrinterAvailable() {
  return isNativeCapacitor() && Capacitor.isPluginAvailable("BluetoothPrinter");
}

function encodeEscPos(receiptText) {
  const encoder = new TextEncoder();
  const content = `\u001B@\u001Ba\u0001${receiptText}\n\n\n\u001DV\u0001`;
  return encoder.encode(content);
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function bytesToBase64(bytes) {
  if (typeof window === "undefined" || typeof window.btoa !== "function") {
    return "";
  }
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

function normalizePrinter(printer) {
  if (!printer) {
    return null;
  }
  return {
    type: printer.type,
    id: String(printer.id),
    name: printer.name || "Printer",
    meta: printer.meta || {}
  };
}

function isSamePrinter(printer, preferred) {
  if (!printer || !preferred) return false;
  return printer.type === preferred.type && String(printer.id) === String(preferred.id);
}

async function readPreferredPrinter() {
  if (canUseNativePrinting()) {
    const { value } = await Preferences.get({ key: PREFERRED_PRINTER_KEY });
    if (!value) return null;
    return normalizePrinter(JSON.parse(value));
  }

  if (typeof window !== "undefined" && window.localStorage) {
    const raw = window.localStorage.getItem(PREFERRED_PRINTER_KEY);
    if (!raw) return null;
    try {
      return normalizePrinter(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  return null;
}

async function savePreferredPrinter(printer) {
  const normalized = normalizePrinter(printer);
  if (!normalized) {
    if (canUseNativePrinting()) {
      await Preferences.remove({ key: PREFERRED_PRINTER_KEY });
    } else if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(PREFERRED_PRINTER_KEY);
    }
    return null;
  }

  const value = JSON.stringify(normalized);
  if (canUseNativePrinting()) {
    await Preferences.set({ key: PREFERRED_PRINTER_KEY, value });
  } else if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(PREFERRED_PRINTER_KEY, value);
  }

  return normalized;
}

export function buildBankReceiptText(order) {
  const depositAmount = formatCurrencyPlain(
    order.depositAmount ?? order.amount,
    order.country === 2 ? "INR" : "IDR"
  );
  const totalPayable = formatCurrencyPlain(order.totalPayableAmount, "MYR");

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
    "------------------------------",
    "DEPOSIT AMOUNT",
    depositAmount,
    "PAYABLE (RM)",
    totalPayable,
    "",
    [order.storeName || "AHMAD Enterprises", order.storeCode || ""].filter(Boolean).join(" - "),
    "Thank you"
  ]
    .filter(Boolean)
    .join("\n");
}

export async function getPreferredPrinter() {
  return readPreferredPrinter();
}

export async function setPreferredPrinter(printer) {
  return savePreferredPrinter(printer);
}

export function canUseNativePrinters() {
  return canUseNativePrinting();
}

export async function printCurrentPage(options = {}) {
  if (canUseNativePrinting() && Capacitor.isPluginAvailable("WebPrint")) {
    await WebPrint.printCurrentPage({
      title: options.title || "AHMAD Enterprises"
    });
    return { native: true };
  }

  if (typeof window !== "undefined" && typeof window.print === "function") {
    window.print();
    return { native: false };
  }

  throw new Error("Printing is not supported in this environment.");
}

function normalizePermissionState(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}


function hasGrantedAliases(result, aliases) {
  return aliases.every((alias) => {
    const direct = normalizePermissionState(result?.[alias]);
    if (direct === "granted") return true;
    const full = normalizePermissionState(result?.[`android.permission.${alias}`]);
    return full === "granted";
  });
}

function isPermissionGrantedByMethod(methodName, result, requiredAliases, fallbackAliases = []) {
  if (methodName === "requestConnectPermissions" && result?.connectGranted === true) {
    return true;
  }
  if (methodName === "requestScanPermissions" && result?.scanGranted === true) {
    return true;
  }
  if (methodName === "requestPermissions" && (result?.connectGranted === true || result?.scanGranted === true)) {
    return true;
  }

  return (
    hasGrantedAliases(result, requiredAliases) ||
    (fallbackAliases.length > 0 && hasGrantedAliases(result, fallbackAliases))
  );
}

async function requestBluetoothPermissions(methodName, requiredAliases) {
  if (!canUseNativePrinting() || !isBluetoothPrinterAvailable()) {
    return { granted: false, error: "BluetoothPrinter plugin is not available." };
  }
  try {
    const result = await BluetoothPrinter[methodName]();

    // Primary check: the explicit boolean flags the Java plugin now always sets
    if (methodName === "requestConnectPermissions" && result?.connectGranted === true) {
      return { granted: true, result };
    }
    if (methodName === "requestScanPermissions" && result?.scanGranted === true) {
      return { granted: true, result };
    }
    if (
      methodName === "requestPermissions" &&
      result?.connectGranted === true &&
      result?.scanGranted === true
    ) {
      return { granted: true, result };
    }

    // Secondary check: alias strings (in case an older build answers this way)
    const granted = hasGrantedAliases(result, requiredAliases);
    return { granted, result };
  } catch (error) {
    return { granted: false, error: error.message };
  }
}

export async function requestBluetoothAllPermissions() {
  return requestBluetoothPermissions("requestPermissions", ["bluetoothConnect", "bluetoothScan"]);
}
 
export async function requestBluetoothScanPermissions() {
  return requestBluetoothPermissions("requestScanPermissions", ["bluetoothScan", "bluetoothConnect"]);
}
 
export async function requestBluetoothConnectPermissions() {
  return requestBluetoothPermissions("requestConnectPermissions", ["bluetoothConnect"]);
}

export async function openBluetoothPermissionSettings() {
  if (!canUseNativePrinting() || !isBluetoothPrinterAvailable()) {
    throw new Error("BluetoothPrinter plugin is not available in this build.");
  }
  if (typeof BluetoothPrinter.openAppSettings !== "function") {
    throw new Error("Bluetooth settings are not available in this build.");
  }
  await BluetoothPrinter.openAppSettings();
}

export async function getPairedBluetoothPrinters() {
  if (!canUseNativePrinting() || !isBluetoothPrinterAvailable()) {
    throw new Error("BluetoothPrinter plugin is not available in this build.");
  }
  const result = await BluetoothPrinter.getPairedDevices();
  return (result?.devices || []).map((device) => ({
    type: "bluetooth",
    id: device.address,
    name: device.name || "Bluetooth printer",
    meta: { address: device.address, bonded: device.bonded }
  }));
}

export async function getUsbPrinters() {
  if (!canUseNativePrinting()) {
    return [];
  }
  try {
    const result = await UsbPrinter.listDevices();
    return (result?.devices || []).map((device) => ({
      type: "usb",
      id: String(device.deviceId),
      name: device.productName || device.deviceName || "USB printer",
      meta: {
        deviceId: device.deviceId,
        serialNumber: device.serialNumber,
        vendorId: device.vendorId,
        productId: device.productId
      }
    }));
  } catch {
    return [];
  }
}

export async function getAvailablePrinters() {
  const [bluetooth, usb, preferred] = await Promise.all([
    getPairedBluetoothPrinters(),
    getUsbPrinters(),
    getPreferredPrinter()
  ]);

  const withPreferred = (list) =>
    list.map((printer) => ({
      ...printer,
      preferred: isSamePrinter(printer, preferred)
    }));

  return {
    bluetooth: withPreferred(bluetooth),
    usb: withPreferred(usb),
    preferred
  };
}

export async function startBluetoothDiscovery({ onDeviceFound, onFinished } = {}) {
  if (!canUseNativePrinting() || !isBluetoothPrinterAvailable()) {
    throw new Error("BluetoothPrinter plugin is not available in this build.");
  }

  const handles = [];
  if (onDeviceFound) {
    handles.push(await BluetoothPrinter.addListener("deviceFound", onDeviceFound));
  }
  if (onFinished) {
    handles.push(await BluetoothPrinter.addListener("discoveryFinished", onFinished));
  }

  await BluetoothPrinter.startDiscovery();

  return {
    started: true,
    remove: async () => {
      await BluetoothPrinter.stopDiscovery();
      await Promise.all(handles.map((handle) => handle.remove()));
    }
  };
}

export async function pairBluetoothPrinter(address) {
  if (!canUseNativePrinting() || !isBluetoothPrinterAvailable()) {
    throw new Error("BluetoothPrinter plugin is not available in this build.");
  }
  return BluetoothPrinter.pair({ address });
}

export async function printTestSlip(printer) {
  return printReceipt("TEST PRINT\nAHMAD ENTERPRISES\nPrinter connected.\n", printer);
}

export async function printReceipt(receiptText, preferredOverride = null) {
  if (!canUseNativePrinting()) {
    if (typeof window !== "undefined") {
      window.print();
    }
    return { fallback: true, reason: "web" };
  }

  const preferred = preferredOverride || (await getPreferredPrinter());
  if (!preferred) {
    return { fallback: true, error: "No preferred printer selected." };
  }

  const bytes = encodeEscPos(receiptText);

  if (preferred.type === "usb") {
    const deviceId = Number(preferred.id);
    const permission = await UsbPrinter.requestPermission({ deviceId });
    if (!permission?.granted) {
      return { fallback: true, error: "USB permission denied." };
    }
    await UsbPrinter.connect({ deviceId });
    await UsbPrinter.print({ deviceId, data: bytesToHex(bytes) });
    return { fallback: false, deviceName: preferred.name };
  }

  if (preferred.type === "bluetooth") {
    if (!isBluetoothPrinterAvailable()) {
      return { fallback: true, error: "BluetoothPrinter plugin is not available in this build." };
    }
    const permission = await requestBluetoothConnectPermissions();
    if (!permission.granted) {
      return { fallback: true, error: "Bluetooth permission denied." };
    }
    const data = bytesToBase64(bytes);
    if (!data) {
      return { fallback: true, error: "Bluetooth data encoding failed." };
    }
    await BluetoothPrinter.print({ address: preferred.id, data });
    return { fallback: false, deviceName: preferred.name };
  }

  return { fallback: true, error: "Unknown printer type." };
}
