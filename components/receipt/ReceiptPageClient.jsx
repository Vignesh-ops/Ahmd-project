"use client";

import { useEffect, useState } from "react";
import BankReceipt from "@/components/receipt/BankReceipt";
import { cacheReceiptOrder, readCachedReceiptOrder } from "@/lib/receipt-cache";

async function fetchReceiptOrder(orderNo) {
  const params = new URLSearchParams({
    type: "bank",
    orderNo
  });
  const response = await fetch(`/api/history?${params.toString()}`, {
    cache: "no-store"
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Could not load receipt.");
  }

  return Array.isArray(payload) ? payload[0] || null : null;
}

export default function ReceiptPageClient({ orderNo, autoPrint = false }) {
  const [order, setOrder] = useState(() => readCachedReceiptOrder(orderNo));
  const [error, setError] = useState("");

  useEffect(() => {
    const cachedOrder = readCachedReceiptOrder(orderNo);
    setOrder(cachedOrder);
    setError("");

    if (cachedOrder) {
      return undefined;
    }

    let active = true;

    async function loadOrder() {
      try {
        const freshOrder = await fetchReceiptOrder(orderNo);

        if (!active) {
          return;
        }

        if (!freshOrder) {
          setError("Receipt not found.");
          return;
        }

        cacheReceiptOrder(freshOrder);
        setOrder(freshOrder);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Could not load receipt.");
        }
      }
    }

    if (orderNo) {
      void loadOrder();
    }

    return () => {
      active = false;
    };
  }, [orderNo]);

  if (order) {
    return <BankReceipt order={order} autoPrint={autoPrint} />;
  }

  return (
    <div className="glass-panel rounded-[32px] border border-white/5 p-8 text-center text-white/60">
      {error || "Preparing receipt..."}
    </div>
  );
}
