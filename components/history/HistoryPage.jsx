"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import CurrencyPairSummary from "@/components/ui/CurrencyPairSummary";
import Input from "@/components/ui/Input";
import OrderCard from "@/components/ui/OrderCard";
import StatCard from "@/components/ui/StatCard";
import StoreFilter from "@/components/admin/StoreFilter";
import { formatDisplayOrderNo } from "@/lib/orderNoDisplay";
import { markOrderDone } from "@/lib/orderStatus";
import { formatBankMessage, shareViaWhatsApp } from "@/lib/whatsapp";
import { openInAppOrTab } from "@/lib/native";
import { formatCurrency } from "@/lib/utils";
import Select from "@/components/ui/Select";
import InfoDialog from "@/components/ui/InfoDialog";

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
  const pageSize = 5;
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    status: "all",
    storeCode: initialStoreCode
  });
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    bankOrders: 0,
    totalIDR: 0,
    totalINR: 0,
    totalPayableMYR: 0,
    totalPayableIDRMYR: 0,
    totalPayableINRMYR: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [shareDialogOrderNo, setShareDialogOrderNo] = useState("");
  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.set(key, value);
        }
      });
      params.set("paginated", "true");
      params.set("page", "1");
      params.set("pageSize", String(pageSize));

      try {
        const response = await fetch(`/api/history?${params.toString()}`, {
          signal: controller.signal
        });
        const payload = await response.json();
        setOrders(payload.items || []);
        setSummary(payload.summary || {
          totalOrders: 0,
          bankOrders: 0,
          totalIDR: 0,
          totalINR: 0,
          totalPayableMYR: 0,
          totalPayableIDRMYR: 0,
          totalPayableINRMYR: 0
        });
        setHasMore(Boolean(payload.hasMore));
        setTotalCount(Number(payload.totalCount || 0));
        setCurrentPage(Number(payload.page || 1));
        setSelectedOrder(null);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load history orders", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      controller.abort();
    };
  }, [filters]);

  const stats = useMemo(() => {
    return {
      total: summary.totalOrders,
      bank: summary.bankOrders,
      idr: summary.totalIDR,
      inr: summary.totalINR,
      myrPayable: summary.totalPayableMYR,
      idrMyr: summary.totalPayableIDRMYR,
      inrMyr: summary.totalPayableINRMYR
    };
  }, [summary]);

  async function loadMoreOrders() {
    if (loading || loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      }
    });

    params.set("paginated", "true");
    params.set("page", String(currentPage + 1));
    params.set("pageSize", String(pageSize));

    try {
      const response = await fetch(`/api/history?${params.toString()}`);
      const payload = await response.json();

      setOrders((current) => [...current, ...(payload.items || [])]);
      setHasMore(Boolean(payload.hasMore));
      setTotalCount(Number(payload.totalCount || 0));
      setCurrentPage(Number(payload.page || currentPage + 1));
    } catch (error) {
      console.error("Failed to load more history orders", error);
    } finally {
      setLoadingMore(false);
    }
  }

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

  function removeOrderFromLocalState(order) {
    setOrders((current) => current.filter((item) => !(item.type === order.type && item.id === order.id)));
    setTotalCount((current) => Math.max(0, current - 1));
    setSummary((current) => ({
      ...current,
      totalOrders: Math.max(0, current.totalOrders - 1),
      bankOrders: Math.max(0, current.bankOrders - 1),
      totalIDR: current.totalIDR - (order.currency === "IDR" ? Number(order.amount || 0) : 0),
      totalINR: current.totalINR - (order.currency === "INR" ? Number(order.amount || 0) : 0),
      totalPayableMYR: Math.max(0, current.totalPayableMYR - Number(order.totalPayableAmount || 0)),
      totalPayableIDRMYR:
        order.currency === "IDR"
          ? Math.max(0, current.totalPayableIDRMYR - Number(order.totalPayableAmount || 0))
          : current.totalPayableIDRMYR,
      totalPayableINRMYR:
        order.currency === "INR"
          ? Math.max(0, current.totalPayableINRMYR - Number(order.totalPayableAmount || 0))
          : current.totalPayableINRMYR
    }));
  }

  async function syncDoneStatus(order, actionLabel) {
    try {
      const updatedOrder = await markOrderDone(order);
      applyOrderUpdate(updatedOrder);
      setActionError(null);
      return updatedOrder;
    } catch (error) {
      setActionError(`Order ${order.orderNo} ${actionLabel}, but status update failed: ${error.message}`);
      return order;
    }
  }

  async function handleShare(order) {
    const sharePromise = shareViaWhatsApp(getMessage(order));
    await syncDoneStatus(order, "shared");
    const result = await sharePromise;
    if (result.returned) {
      setShareDialogOrderNo(order.orderNo);
    }
  }

  async function handlePrint(order) {
    openInAppOrTab(`/receipt/${order.orderNo}?autoprint=true`);
    await syncDoneStatus(order, "sent to print");
  }

  async function handleDelete(order) {
    setDeleteOrder(order);
    setShowDeleteModal(true);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteOrder) return;

    setDeleteLoading(true);
    try {
      const endpoint = `/api/orders/bank/${deleteOrder.id}`;
      const response = await fetch(endpoint, { method: "DELETE" });

      if (!response.ok) {
        setDeleteError("Failed to delete order.");
        setDeleteLoading(false);
        return;
      }

      removeOrderFromLocalState(deleteOrder);
      setSelectedOrder(null);
      setShowDeleteModal(false);
      setDeleteOrder(null);
      setDeleteLoading(false);
    } catch (error) {
      setDeleteError("Error deleting order.");
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <InfoDialog
        open={Boolean(shareDialogOrderNo)}
        title="Back from WhatsApp"
        description={`If the message was sent successfully for order ${shareDialogOrderNo}, tap OK to continue.`}
        onClose={() => setShareDialogOrderNo("")}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Orders" value={stats.total} />
        <StatCard label="Bank Transfers" value={stats.bank} accent="teal" />
        <StatCard
          label="Total Amount"
          value={<CurrencyPairSummary idr={stats.idr} idrMyr={stats.idrMyr} inr={stats.inr} inrMyr={stats.inrMyr} />}
        />
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
            placeholder="DD/MM/YYYY"
            type="date"
            value={filters.from}
            onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
          />
          <Input
            label="To"
            placeholder="DD/MM/YYYY"
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

      {actionError ? (
        <div className="rounded-[28px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-white/80">
          {actionError}
        </div>
      ) : null}

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
                {order.status === "pending" ? (
                  <Button
                    variant="secondary"
                    href={`/bank-order?edit=${order.id}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    Edit
                  </Button>
                ) : null}
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

          {orders.length ? (
            <div className="glass-panel rounded-[28px] border border-white/5 p-4 text-center">
              <p className="text-sm text-white/60">
                Showing {orders.length} of {totalCount} orders
              </p>
              {hasMore ? (
                <Button className="mt-3" variant="secondary" onClick={() => void loadMoreOrders()} loading={loadingMore}>
                  Load More
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="dialog-surface w-full max-w-sm rounded-xl border border-red-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-10a8 8 0 100 16 8 8 0 000-16z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Order?</h3>
            </div>

            <p className="text-white/30 mb-6">
              Are you sure you want to delete order <span className="font-semibold text-red-300">{deleteOrder?.orderNo}</span>? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="dialog-secondary-button flex-1 rounded-lg bg-white/10 px-4 py-2 text-white transition-colors disabled:opacity-50 hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedOrder ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-[32px] border border-white/10 p-6">
            <p className="font-mono text-sm text-gold-light">{formatDisplayOrderNo(selectedOrder.orderNo)}</p>
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
              <Button variant="secondary" onClick={() => openInAppOrTab(`/receipt/${selectedOrder.orderNo}`)}>
                Open Receipt
              </Button>
              <Button variant="secondary" onClick={() => handleShare(selectedOrder)}>
                WhatsApp Share
              </Button>
              <Button variant="secondary" onClick={() => handlePrint(selectedOrder)}>
                Print
              </Button>
              {selectedOrder.status === "pending" ? (
                <Button variant="secondary" href={`/bank-order?edit=${selectedOrder.id}`}>
                  Edit
                </Button>
              ) : null}
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
