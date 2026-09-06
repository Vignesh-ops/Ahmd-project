"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Printer, Send } from "lucide-react";
import ActionStatusMessage from "@/components/ui/ActionStatusMessage";
import Button from "@/components/ui/Button";
import ShareStatusDialog from "@/components/ui/ShareStatusDialog";
import { markOrderDone, verifyOrderStatus } from "@/lib/orderStatus";
import { buildBankReceiptText, printReceipt } from "@/lib/print";
import {
  clearPendingShareConfirmation,
  getPendingShareConfirmation,
  setPendingShareConfirmation
} from "@/lib/shareConfirmation";
import { formatBankMessage, shareViaWhatsApp } from "@/lib/whatsapp";
import { formatDisplayOrderNo } from "@/lib/orderNoDisplay";
import { formatCurrency, formatDate } from "@/lib/utils";

const Barcode = dynamic(() => import("react-barcode"), { ssr: false });

export default function BankReceipt({ order, autoPrint = false }) {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("idle");
  const [shareConfirmOrder, setShareConfirmOrder] = useState(null);
  const autoPrintStartedRef = useRef(false);

  async function syncDoneStatus(actionLabel, silent = false) {
    try {
      const updatedOrder = await markOrderDone(currentOrder);
      setCurrentOrder(updatedOrder);

      if (!silent) {
        setMessage(`Order ${updatedOrder.orderNo} ${actionLabel} and marked done.`);
        setMessageTone("success");
      }
    } catch (error) {
      if (!silent) {
        setMessage(`Order ${order.orderNo} ${actionLabel}, but status update failed: ${error.message}`);
        setMessageTone("error");
      }
    }
  }

  function syncDoneStatusAsync(actionLabel, silent = false, orderToUpdate = currentOrder) {
    clearPendingShareConfirmation(orderToUpdate);
    // Optimistically update order status immediately
    const optimisticOrder = { ...orderToUpdate, status: "done" };
    if (orderToUpdate.id === currentOrder.id) {
      setCurrentOrder(optimisticOrder);
    }
    
    if (!silent) {
      setMessage(`Order ${orderToUpdate.orderNo} ${actionLabel} and marked done.`);
      setMessageTone("success");
    }

    // Update in background with proper error handling and verification
    (async () => {
      try {
        const updatedOrder = await markOrderDone(orderToUpdate);
        
        // Verify the update was successful
        const verified = await verifyOrderStatus(orderToUpdate.id);
        if (verified && verified.status === "done") {
          if (orderToUpdate.id === currentOrder.id) {
            setCurrentOrder(verified);
          }
        } else {
          // Verification failed, keep optimistic for now but try again in 2 seconds
          setTimeout(() => verifyAndUpdate(), 2000);
        }
      } catch (error) {
        if (!silent) {
          setMessage(`Order ${orderToUpdate.orderNo} ${actionLabel}, but status update failed. Retrying...`);
          setMessageTone("error");
        }
        // Retry verification in 2 seconds
        setTimeout(() => verifyAndUpdate(), 2000);
      }
    })();

    async function verifyAndUpdate() {
      try {
        const verified = await verifyOrderStatus(orderToUpdate.id);
        if (verified) {
          if (orderToUpdate.id === currentOrder.id) {
            setCurrentOrder(verified);
          }
          if (verified.status === "done" && !silent) {
            setMessage(`Order ${orderToUpdate.orderNo} ${actionLabel} and marked done.`);
            setMessageTone("success");
          } else if (verified.status !== "done" && !silent) {
            setMessage(`Order status is ${verified.status}. Please try again.`);
            setMessageTone("error");
          }
        }
      } catch (error) {
        if (!silent) {
          setMessage(`Could not verify order status. Please refresh the page.`);
          setMessageTone("error");
        }
      }
    }
  }

  async function handlePrint(silent = false) {
    try {
      setLoading("print");
      if (!silent) {
        setMessage("");
        setMessageTone("idle");
      }
      const result = await printReceipt(buildBankReceiptText(currentOrder));
      if (result.fallback && !silent) {
        setMessage(`Print failed: ${result.error || "No preferred printer available"}`);
        setMessageTone("error");
        return;
      }
      if (!silent) {
        setMessage(`Printed to ${result.deviceName || "printer"}.`);
        setMessageTone("success");
      }
      await syncDoneStatus("printed", silent);
    } catch (error) {
      if (!silent) {
        setMessage(`Print failed: ${error.message}`);
        setMessageTone("error");
      }
    } finally {
      setLoading("");
    }
  }

  async function handleShare() {
    try {
      setLoading("share");
      setMessage("");
      setMessageTone("idle");
      setPendingShareConfirmation(currentOrder);
      const result = await shareViaWhatsApp(formatBankMessage(currentOrder));
      if (currentOrder.status === "done") {
        clearPendingShareConfirmation(currentOrder);
        setMessage(`Order ${currentOrder.orderNo} shared.`);
        setMessageTone("success");
      } else if (result.returned) {
        setShareConfirmOrder(currentOrder);
      } else {
        setShareConfirmOrder(currentOrder);
        setMessage("Share opened. Status remains pending until you confirm it was sent.");
        setMessageTone("idle");
      }
    } finally {
      setLoading("");
    }
  }

  useEffect(() => {
    function restorePendingShareConfirmation() {
      const pendingOrder = getPendingShareConfirmation();
      setShareConfirmOrder(pendingOrder?.status === "done" ? null : pendingOrder);
    }

    restorePendingShareConfirmation();
    window.addEventListener("pageshow", restorePendingShareConfirmation);
    window.addEventListener("focus", restorePendingShareConfirmation);

    return () => {
      window.removeEventListener("pageshow", restorePendingShareConfirmation);
      window.removeEventListener("focus", restorePendingShareConfirmation);
    };
  }, []);

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
      <ShareStatusDialog
        open={Boolean(shareConfirmOrder)}
        orderNo={shareConfirmOrder?.orderNo}
        onDeny={() => {
          if (shareConfirmOrder) {
            clearPendingShareConfirmation(shareConfirmOrder);
          }
          setMessage("Share not confirmed. Order status remains pending.");
          setMessageTone("error");
        }}
        onConfirm={() => {
          const orderToUpdate = shareConfirmOrder;
          if (orderToUpdate) {
            syncDoneStatusAsync("shared", false, orderToUpdate);
          }
        }}
        onDismiss={() => setShareConfirmOrder(null)}
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
      <ActionStatusMessage tone={messageTone} className="print-hide text-center text-sm text-white/55">
        {message || "Share confirmations and successful prints will mark the order as done."}
      </ActionStatusMessage>

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
