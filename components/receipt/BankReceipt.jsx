"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Bluetooth, Plus, Printer, RefreshCw, Send } from "lucide-react";
import Button from "@/components/ui/Button";
import InfoDialog from "@/components/ui/InfoDialog";
import { markOrderDone } from "@/lib/orderStatus";
import {
  bluetoothPrint,
  buildBankReceiptText,
  canListGrantedBluetoothDevices,
  canUseBluetoothPrinting,
  getSavedBluetoothDevices,
  requestBluetoothDevice
} from "@/lib/print";
import { formatBankMessage, shareViaWhatsApp } from "@/lib/whatsapp";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

const Barcode = dynamic(() => import("react-barcode"), { ssr: false });

export default function BankReceipt({ order, autoPrint = false }) {
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [savedPrinters, setSavedPrinters] = useState([]);
  const [bluetoothReady, setBluetoothReady] = useState(false);
  const [canListSavedPrinters, setCanListSavedPrinters] = useState(false);

  async function syncDoneStatus(actionLabel, silent = false) {
    try {
      const updatedOrder = await markOrderDone(order);

      if (!silent) {
        setMessage(`Order ${updatedOrder.orderNo} ${actionLabel} and marked done.`);
      }
    } catch (error) {
      if (!silent) {
        setMessage(`Order ${order.orderNo} ${actionLabel}, but status update failed: ${error.message}`);
      }
    }
  }

  async function handlePrint(silent = false) {
    try {
      setLoading("print");
      if (!silent) {
        setMessage("");
      }
      window.print();
      await syncDoneStatus("printed", silent);
    } finally {
      setLoading("");
    }
  }

  async function handleShare() {
    try {
      setLoading("share");
      setMessage("");
      const result = await shareViaWhatsApp(formatBankMessage(order));
      await syncDoneStatus("shared");
      if (result.returned) {
        setShowShareDialog(true);
      }
    } finally {
      setLoading("");
    }
  }

  async function refreshSavedPrinters(silent = false) {
    if (!canUseBluetoothPrinting() || !canListGrantedBluetoothDevices()) {
      setSavedPrinters([]);
      return;
    }

    try {
      const devices = await getSavedBluetoothDevices();
      setSavedPrinters(devices);

      if (!silent && devices.length === 0) {
        setMessage("No saved Bluetooth printers yet. Use Pair New Device to choose one.");
      }
    } catch (error) {
      if (!silent) {
        setMessage(`Could not load saved Bluetooth printers: ${error.message}`);
      }
    }
  }

  async function handleBluetoothPrint(device) {
    try {
      setLoading("bluetooth");
      setMessage("");
      const result = await bluetoothPrint(buildBankReceiptText(order), device);

      if (result.fallback && result.error) {
        setMessage(`Bluetooth print was unavailable, so the browser print dialog was opened instead. ${result.error}`);
      } else if (result.fallback) {
        setMessage("Bluetooth print was unavailable, so the browser print dialog was opened instead.");
      } else {
        setMessage(`Printed to ${result.deviceName}.`);
        await refreshSavedPrinters(true);
      }

      await syncDoneStatus("printed");
    } finally {
      setLoading("");
    }
  }

  async function handlePairNewDevice() {
    try {
      setLoading("pair");
      setMessage("");

      const device = await requestBluetoothDevice();
      await refreshSavedPrinters(true);
      await handleBluetoothPrint(device);
    } catch (error) {
      setMessage(`Could not pair a new Bluetooth printer: ${error.message}`);
    } finally {
      setLoading("");
    }
  }

  useEffect(() => {
    setBluetoothReady(canUseBluetoothPrinting());
    setCanListSavedPrinters(canListGrantedBluetoothDevices());
    void refreshSavedPrinters(true);
  }, []);

  useEffect(() => {
    if (!autoPrint) {
      return undefined;
    }

    let active = true;

    async function runAutoPrint() {
      try {
        setLoading("print");
        window.print();
        await markOrderDone(order);
      } finally {
        if (active) {
          setLoading("");
        }
      }
    }

    void runAutoPrint();

    return () => {
      active = false;
    };
  }, [autoPrint, order]);

  const amount = formatCurrency(order.depositAmount ?? order.amount, order.currency);
  const totalPayable = formatCurrency(order.totalPayableAmount, "MYR");

  return (
    <div className="page-fade space-y-6">
      <InfoDialog
        open={showShareDialog}
        title="Back from WhatsApp"
        description={`If the message was sent successfully for order ${order.orderNo}, tap OK to continue.`}
        onClose={() => setShowShareDialog(false)}
      />
      <div className="print-hide flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <Button
          variant="secondary"
          icon={Printer}
          loading={loading === "print"}
          onClick={() => handlePrint()}
          className="w-full sm:w-auto"
        >
          Print
        </Button>
        <Button
          variant="secondary"
          icon={Send}
          loading={loading === "share"}
          onClick={() => handleShare()}
          className="w-full sm:w-auto"
        >
          WhatsApp Share
        </Button>
        <Button
          icon={Bluetooth}
          loading={loading === "bluetooth"}
          onClick={() => handleBluetoothPrint()}
          className="w-full sm:w-auto"
        >
          Bluetooth Print
        </Button>
        {bluetoothReady ? (
          <Button
            variant="secondary"
            icon={Plus}
            loading={loading === "pair"}
            onClick={() => handlePairNewDevice()}
            className="w-full sm:w-auto"
          >
            Pair New Device
          </Button>
        ) : null}
      </div>
      {bluetoothReady ? (
        <div className="print-hide mx-auto max-w-3xl rounded-3xl border border-white/10 bg-dark-elevated/70 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Saved Bluetooth Printers</p>
              <p className="text-xs text-white/55">
                {canListSavedPrinters
                  ? "Previously allowed printers can be reused here."
                  : "This browser can print by Bluetooth, but it cannot list saved devices."}
              </p>
            </div>
            {canListSavedPrinters ? (
              <Button
                variant="ghost"
                icon={RefreshCw}
                onClick={() => refreshSavedPrinters()}
                className="w-full sm:w-auto"
              >
                Refresh Printers
              </Button>
            ) : null}
          </div>
          {canListSavedPrinters ? (
            savedPrinters.length > 0 ? (
              <div className="mt-4 flex flex-col gap-2">
                {savedPrinters.map((device) => (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => handleBluetoothPrint(device)}
                    disabled={loading === "bluetooth" || loading === "pair"}
                    className="flex min-h-[52px] items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-left transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>
                      <span className="block text-sm font-medium text-white">{device.name || "Unnamed printer"}</span>
                      <span className="block text-xs text-white/45">Tap to print without pairing again</span>
                    </span>
                    <Bluetooth className="h-4 w-4 text-gold-light" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/55">
                No saved printers yet. Tap Pair New Device to choose a printer from Android&apos;s Bluetooth picker.
              </p>
            )
          ) : null}
        </div>
      ) : null}
      <p className="print-hide text-center text-sm text-white/55">
        {message || "Sharing or printing this receipt will mark the order as done."}
      </p>

      <div className="print-area">
        <div className="thermal-paper">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-black/15 bg-white">
              <img
                src="/Ahmad_logo.png"
                alt="Ahmad company logo"
                className="h-14 w-14 object-contain"
              />
            </div>
            <p className="mt-1 text-xs uppercase tracking-[0.22em]">
              {order.country === 2 ? "Bank Transfer INR" : "Bank Transfer IDR"}
            </p>
            <p className="mt-2 text-xs">{formatDate(order.date)}</p>
          </div>

          <div className="thermal-divider" />

          <div className="space-y-2 text-sm">
            <p>Order#: {order.orderNo}</p>
            <p>AccName: {order.accountName}</p>
            <p>AccNo: {order.accountNo}</p>
            <p>Bank: {order.bank}</p>
            {order.branch ? <p>Branch: {order.branch}</p> : null}
            {order.ifscCode ? <p>IFSC: {order.ifscCode}</p> : null}
            <p>Sender: {order.senderName || "-"}</p>
            <p>Mobile: {order.senderMobile}</p>
            <p>Rate: {formatNumber(order.rate)}</p>
            <p>Service: {formatNumber(order.serviceCharge)}</p>
          </div>

          <div className="thermal-divider" />

          <div className="space-y-2 text-center">
            <p className="text-xs uppercase tracking-[0.2em]">Deposit Amount</p>
            <p className="text-xl font-bold">{amount}</p>
            <p className="pt-1 text-xs uppercase tracking-[0.2em]">Total Payable (RM)</p>
            <p className="text-lg font-semibold">{totalPayable}</p>
            <div className="flex justify-center pt-2">
              <Barcode value={order.orderNo} width={1.2} height={40} fontSize={10} background="#ffffff" />
            </div>
          </div>

          <div className="thermal-divider" />

          <div className="text-center text-xs">
            <p>
              {order.storeName} · {order.storeCode}
            </p>
            <p className="mt-1">Thank you</p>
          </div>
        </div>
      </div>
    </div>
  );
}
