"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Printer, Send } from "lucide-react";
import Button from "@/components/ui/Button";
import InfoDialog from "@/components/ui/InfoDialog";
import { markOrderDone } from "@/lib/orderStatus";
import { buildBankReceiptText, printReceipt } from "@/lib/print";
import { formatBankMessage, shareViaWhatsApp } from "@/lib/whatsapp";
import { formatDisplayOrderNo } from "@/lib/orderNoDisplay";
import { formatCurrency, formatDate } from "@/lib/utils";

const Barcode = dynamic(() => import("react-barcode"), { ssr: false });

export default function BankReceipt({ order, autoPrint = false }) {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const autoPrintStartedRef = useRef(false);

  async function syncDoneStatus(actionLabel, silent = false) {
    try {
      const updatedOrder = await markOrderDone(currentOrder);
      setCurrentOrder(updatedOrder);

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
      const result = await printReceipt(buildBankReceiptText(currentOrder));
      if (result.fallback && !silent) {
        setMessage(`Print failed: ${result.error || "No preferred printer available"}`);
        return;
      }
      if (!silent) {
        setMessage(`Printed to ${result.deviceName || "printer"}.`);
      }
      await syncDoneStatus("printed", silent);
    } catch (error) {
      if (!silent) {
        setMessage(`Print failed: ${error.message}`);
      }
    } finally {
      setLoading("");
    }
  }

  async function handleShare() {
    try {
      setLoading("share");
      setMessage("");
      const result = await shareViaWhatsApp(formatBankMessage(currentOrder));
      if (currentOrder.status === "done") {
        setMessage(`Order ${currentOrder.orderNo} shared.`);
      } else if (result.returned) {
        setShowShareDialog(true);
      } else {
        setMessage("Share opened. Status remains pending until you confirm it was sent.");
      }
    } finally {
      setLoading("");
    }
  }

  useEffect(() => {
    if (!autoPrint || autoPrintStartedRef.current) {
      return undefined;
    }

    let active = true;
    autoPrintStartedRef.current = true;

    async function runAutoPrint() {
      try {
        setLoading("print");
        const result = await printReceipt(buildBankReceiptText(currentOrder));
        if (!result.fallback) {
          const updatedOrder = await markOrderDone(currentOrder);
          if (active) {
            setCurrentOrder(updatedOrder);
          }
        }
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
  }, [autoPrint, currentOrder]);

  const amount = formatCurrency(currentOrder.depositAmount ?? currentOrder.amount, currentOrder.currency);
  const totalPayable = formatCurrency(currentOrder.totalPayableAmount, "MYR");
  const displayOrderNo = formatDisplayOrderNo(currentOrder.orderNo);

  return (
    <div className="page-fade space-y-6">
      <InfoDialog
        open={showShareDialog}
        title="Have you successfully shared the order?"
        description={`Confirm only if order ${currentOrder.orderNo} was sent successfully.`}
        confirmLabel="Yes"
        cancelLabel="No"
        onCancel={() => {
          setShowShareDialog(false);
          setMessage("Share not confirmed. Order status remains pending.");
        }}
        onClose={() => {
          setShowShareDialog(false);
          void syncDoneStatus("shared");
        }}
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
      </div>
      <p className="print-hide text-center text-sm text-white/55">
        {message || "Share confirmations and successful prints will mark the order as done."}
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
              {currentOrder.country === 2 ? "Bank Transfer INR" : "Bank Transfer IDR"}
            </p>
            <p className="mt-2 text-xs">{formatDate(currentOrder.date)}</p>
          </div>

          <div className="thermal-divider" />

          <div className="space-y-2 text-sm">
            <p>Order#: {displayOrderNo}</p>
            <p>AccName: {currentOrder.accountName}</p>
            <p>AccNo: {currentOrder.accountNo}</p>
            <p>Bank: {currentOrder.bank}</p>
            {currentOrder.branch ? <p>Branch: {currentOrder.branch}</p> : null}
            {currentOrder.ifscCode ? <p>IFSC: {currentOrder.ifscCode}</p> : null}
            <p>Sender: {currentOrder.senderName || "-"}</p>
            <p>Mobile: {currentOrder.senderMobile}</p>
          </div>

          <div className="thermal-divider" />

          <div className="space-y-2 text-center">
            <p className="text-xs uppercase tracking-[0.2em]">Deposit Amount</p>
            <p className="text-xl font-bold">{amount}</p>
            <p className="pt-1 text-xs uppercase tracking-[0.2em]">Total Payable (RM)</p>
            <p className="text-lg font-semibold">{totalPayable}</p>
            <div className="flex justify-center pt-2">
              <Barcode value={currentOrder.orderNo} text={displayOrderNo} width={1.2} height={40} fontSize={10} background="#ffffff" />
            </div>
          </div>

          <div className="thermal-divider" />

          <div className="text-center text-xs">
            <p>
              {currentOrder.storeName} · {currentOrder.storeCode}
            </p>
            <p className="mt-1">Thank you</p>
          </div>
        </div>
      </div>
    </div>
  );
}
