"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import Button from "@/components/ui/Button";

const RESULT_DISPLAY_MS = 1200;

export default function ShareStatusDialog({
  open,
  orderNo,
  title = "Have you successfully shared the order?",
  kicker = "WhatsApp Share",
  onConfirm,
  onDeny,
  onDismiss
}) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) {
      setResult(null);
    }
  }, [open]);

  useEffect(() => {
    if (!result) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setResult(null);
      onDismiss?.();
    }, RESULT_DISPLAY_MS);

    return () => window.clearTimeout(timer);
  }, [result, onDismiss]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="dialog-surface w-full max-w-sm rounded-xl border border-gold/20 p-6 shadow-2xl">
        {result ? (
          <div className="status-result-pop flex flex-col items-center gap-3 py-3 text-center">
            {result === "done" ? (
              <>
                <svg viewBox="0 0 52 52" className="h-16 w-16" aria-hidden="true">
                  <circle
                    className="status-success-circle"
                    cx="26"
                    cy="26"
                    r="24"
                    fill="none"
                    stroke="#1ECFB0"
                    strokeWidth="3"
                  />
                  <path
                    className="status-success-check"
                    fill="none"
                    stroke="#1ECFB0"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 27l7 7 15-15"
                  />
                </svg>
                <p className="text-lg font-semibold text-white">Marked as Done</p>
                <p className="text-sm text-white/55">Order {orderNo} is complete.</p>
              </>
            ) : (
              <>
                <span className="relative flex h-16 w-16 items-center justify-center">
                  <span className="status-pending-ring absolute inset-0 rounded-full border-2 border-gold/60" />
                  <span
                    className="status-pending-ring absolute inset-0 rounded-full border-2 border-gold/60"
                    style={{ animationDelay: "0.5s" }}
                  />
                  <Clock3 className="status-pending-icon relative h-8 w-8 text-gold-light" />
                </span>
                <p className="text-lg font-semibold text-white">Still Pending</p>
                <p className="text-sm text-white/55">Order {orderNo} needs to be sent again.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs uppercase tracking-[0.22em] text-gold-light/80">{kicker}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-3 text-sm text-white/65">
              {orderNo ? `Confirm only if order ${orderNo} was sent successfully.` : ""}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  onDeny?.();
                  setResult("pending");
                }}
              >
                No
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  onConfirm?.();
                  setResult("done");
                }}
              >
                Yes
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
