"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Bluetooth, Printer, Send } from "lucide-react";
import Button from "@/components/ui/Button";
import { markOrderDone } from "@/lib/orderStatus";
import { buildBankReceiptText, bluetoothPrint } from "@/lib/print";
import { formatBankMessage, shareViaWhatsApp } from "@/lib/whatsapp";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

const Barcode = dynamic(() => import("react-barcode"), { ssr: false });

export default function BankReceipt({ order, autoPrint = false }) {
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");

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
      shareViaWhatsApp(formatBankMessage(order));
      await syncDoneStatus("shared");
    } finally {
      setLoading("");
    }
  }

  async function handleBluetoothPrint() {
    try {
      setLoading("bluetooth");
      setMessage("");
      await bluetoothPrint(buildBankReceiptText(order));
      await syncDoneStatus("printed");
    } finally {
      setLoading("");
    }
  }

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
      </div>
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
