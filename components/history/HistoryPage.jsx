"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import OrderCard from "@/components/ui/OrderCard";
import StatCard from "@/components/ui/StatCard";
import StoreFilter from "@/components/admin/StoreFilter";
import { markOrderDone } from "@/lib/orderStatus";
import { formatBankMessage, shareViaWhatsApp } from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/utils";
import Select from "@/components/ui/Select";

const statusOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Done", value: "done" },
  { label: "Failed", value: "failed" }
];

export default function HistoryPage({
  isAdmin,
  stores = [],
  initialStoreCode = "all",
  initialStoreName = ""
}) {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    status: "all",
    storeCode: initialStoreCode
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.set(key, value);
        }
      });

      const response = await fetch(`/api/history?${params.toString()}`);
      const payload = await response.json();
      setOrders(payload);
      setLoading(false);
    }

    loadOrders();
  }, [filters]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      bank: orders.length,
      idr: orders
        .filter((order) => order.currency === "IDR")
        .reduce((sum, order) => sum + Number(order.amount || 0), 0),
      inr: orders
        .filter((order) => order.currency === "INR")
        .reduce((sum, order) => sum + Number(order.amount || 0), 0),
      myrPayable: orders.reduce((sum, order) => sum + Number(order.totalPayableAmount || 0), 0)
    };
  }, [orders]);

  function getMessage(order) {
    return formatBankMessage(order);
  }

  function applyOrderUpdate(updatedOrder) {
    setOrders((current) =>
      current.map((item) => (item.type === updatedOrder.type && item.id === updatedOrder.id ? updatedOrder : item))
    );
    setSelectedOrder((current) =>
      current && current.type === updatedOrder.type && current.id === updatedOrder.id ? updatedOrder : current
    );
  }

  async function syncDoneStatus(order, actionLabel) {
    try {
      const updatedOrder = await markOrderDone(order);
      applyOrderUpdate(updatedOrder);
      return updatedOrder;
    } catch (error) {
      window.alert(`Order ${order.orderNo} ${actionLabel}, but status update failed: ${error.message}`);
      return order;
    }
  }

  async function handleShare(order) {
    shareViaWhatsApp(getMessage(order));
    await syncDoneStatus(order, "shared");
  }

  async function handlePrint(order) {
    window.open(`/receipt/${order.orderNo}?autoprint=true`, "_blank", "noopener,noreferrer");
    await syncDoneStatus(order, "sent to print");
  }

  async function handleDelete(order) {
    const confirmed = window.confirm(`Delete ${order.orderNo}?`);

    if (!confirmed) {
      return;
    }

    const endpoint = `/api/orders/bank/${order.id}`;

    await fetch(endpoint, { method: "DELETE" });
    setOrders((current) => current.filter((item) => !(item.type === order.type && item.id === order.id)));
    setSelectedOrder(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Orders" value={stats.total} />
        <StatCard label="Bank Transfers" value={stats.bank} accent="teal" />
        <StatCard label="IDR Volume" value={formatCurrency(stats.idr, "IDR")} />
        <StatCard label="INR Volume" value={formatCurrency(stats.inr, "INR")} />
        <StatCard label="Payable (RM)" value={formatCurrency(stats.myrPayable, "MYR")} />
      </div>

      {isAdmin && initialStoreCode !== "all" ? (
        <div className="glass-panel rounded-[28px] border border-gold/20 bg-gold/10 p-4 text-sm text-white/75">
          Focused history view for {initialStoreName || initialStoreCode}. Change the Data Scope filter to switch
          accounts or view all.
        </div>
      ) : null}

      <div className="filters-panel glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="grid-form two-col">
          {isAdmin ? (
            <StoreFilter
              stores={stores}
              label="Data Scope"
              allLabel="All Accounts"
              value={filters.storeCode}
              onChange={(event) => setFilters((current) => ({ ...current, storeCode: event.target.value }))}
            />
          ) : null}
          <Input
            label="From"
            type="date"
            value={filters.from}
            onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
          />
          <Input
            label="To"
            type="date"
            value={filters.to}
            onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
          />
          <Select
            label="Status"
            options={statusOptions}
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          />
        </div>
      </div>

      {loading ? (
        <div className="glass-panel rounded-[32px] border border-white/5 p-8 text-center text-white/55">
          Loading orders...
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={`${order.type}-${order.id}`}
              role="button"
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => setSelectedOrder(order)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setSelectedOrder(order);
                }
              }}
            >
              <OrderCard order={order} showStore={isAdmin}>
                <Button
                  variant="secondary"
                  onClick={async (event) => {
                    event.stopPropagation();
                    await handleShare(order);
                  }}
                >
                  Share
                </Button>
                <Button
                  variant="secondary"
                  onClick={async (event) => {
                    event.stopPropagation();
                    await handlePrint(order);
                  }}
                >
                  Print
                </Button>
                <Button
                  variant="danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDelete(order);
                  }}
                >
                  Delete
                </Button>
              </OrderCard>
            </div>
          ))}

          {!orders.length ? (
            <div className="glass-panel rounded-[32px] border border-white/5 p-8 text-center text-white/55">
              No orders match the current filters.
            </div>
          ) : null}
        </div>
      )}

      {selectedOrder ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-[32px] border border-white/10 p-6">
            <p className="font-mono text-sm text-gold-light">{selectedOrder.orderNo}</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{selectedOrder.customerName}</h3>
            <p className="mt-2 text-sm text-white/60">{selectedOrder.bankOrAddress}</p>
            <div className="mt-5 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">Type</p>
                <p className="mt-2">{selectedOrder.typeLabel}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">Amount</p>
                <p className="mt-2">
                  {formatCurrency(selectedOrder.amount, selectedOrder.currency)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">Payable (RM)</p>
                <p className="mt-2">
                  {formatCurrency(selectedOrder.totalPayableAmount, "MYR")}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => window.open(`/receipt/${selectedOrder.orderNo}`, "_blank")}>
                Open Receipt
              </Button>
              <Button variant="secondary" onClick={() => handleShare(selectedOrder)}>
                WhatsApp Share
              </Button>
              <Button variant="secondary" onClick={() => handlePrint(selectedOrder)}>
                Print
              </Button>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
