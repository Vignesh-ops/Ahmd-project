"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import AdminTable from "@/components/admin/AdminTable";
import StoreFilter from "@/components/admin/StoreFilter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatCard from "@/components/ui/StatCard";
import { exportXlsx } from "@/lib/client-export";
import { printCurrentPage } from "@/lib/print";
import { formatCurrency, formatDate } from "@/lib/utils";

const typeOptions = [
  { label: "Bank Transfer", value: "bank" }
];

const statusOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Done", value: "done" },
  { label: "Failed", value: "failed" }
];

export default function AdminDashboard({ stores }) {
  const pageSize = 5;
  const [summary, setSummary] = useState({
    totalToday: 0,
    bankToday: 0,
    byStore: []
  });
  const [orders, setOrders] = useState([]);
  const [filteredSummary, setFilteredSummary] = useState({
    totalOrders: 0,
    bankOrders: 0,
    totalIDR: 0,
    totalINR: 0,
    totalPayableMYR: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    storeCode: "all",
    from: "",
    to: "",
    type: "bank",
    status: "all"
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [exportMessage, setExportMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      const params = new URLSearchParams();

      if (filters.storeCode !== "all") {
        params.set("storeCode", filters.storeCode);
      }

      try {
        const response = await fetch(`/api/admin/summary?${params.toString()}`, {
          signal: controller.signal
        });
        const payload = await response.json();
        setSummary(payload);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load admin summary", error);
        }
      }
    }

    loadSummary();

    return () => {
      controller.abort();
    };
  }, [filters.storeCode]);

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
        setFilteredSummary(payload.summary || {
          totalOrders: 0,
          bankOrders: 0,
          totalIDR: 0,
          totalINR: 0,
          totalPayableMYR: 0
        });
        setHasMore(Boolean(payload.hasMore));
        setTotalCount(Number(payload.totalCount || 0));
        setCurrentPage(Number(payload.page || 1));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load admin orders", error);
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

  const filteredStats = useMemo(() => {
    return {
      idr: filteredSummary.totalIDR,
      inr: filteredSummary.totalINR
    };
  }, [filteredSummary]);

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
      console.error("Failed to load more admin orders", error);
    } finally {
      setLoadingMore(false);
    }
  }

  async function fetchAllMatchingOrders() {
    const allOrders = [];
    let nextPage = 1;
    let more = true;

    while (more) {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.set(key, value);
        }
      });

      params.set("paginated", "true");
      params.set("page", String(nextPage));
      params.set("pageSize", "250");

      const response = await fetch(`/api/history?${params.toString()}`);
      const payload = await response.json();
      allOrders.push(...(payload.items || []));
      more = Boolean(payload.hasMore);
      nextPage += 1;
    }

    return allOrders;
  }

  async function handleDelete(order) {
    setDeleteOrder(order);
    setShowDeleteModal(true);
    setDeleteError(null);
  }

  function removeOrderFromLocalState(order) {
    setOrders((current) => current.filter((item) => !(item.type === order.type && item.id === order.id)));
    setTotalCount((current) => Math.max(0, current - 1));
    setFilteredSummary((current) => ({
      ...current,
      totalOrders: Math.max(0, current.totalOrders - 1),
      bankOrders: Math.max(0, current.bankOrders - 1),
      totalIDR: current.totalIDR - (order.currency === "IDR" ? Number(order.amount || 0) : 0),
      totalINR: current.totalINR - (order.currency === "INR" ? Number(order.amount || 0) : 0),
      totalPayableMYR: Math.max(0, current.totalPayableMYR - Number(order.totalPayableAmount || 0))
    }));
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
      setShowDeleteModal(false);
      setDeleteOrder(null);
      setDeleteLoading(false);
    } catch (error) {
      setDeleteError("Error deleting order.");
      setDeleteLoading(false);
    }
  }
  async function handleExportXlsx() {
    try {
      setExportMessage("");
      const exportOrders = await fetchAllMatchingOrders();
      const result = await exportXlsx(
        "ubi-orders.xlsx",
        [
          ["OrderNo", "Store", "Type", "Customer", "Details", "Amount", "Status", "Date"],
          ...exportOrders.map((order) => [
            order.orderNo,
            order.storeCode,
            order.typeLabel,
            order.customerName,
            order.bankOrAddress,
            formatCurrency(order.amount, order.currency),
            order.status,
            formatDate(order.date)
          ])
        ],
        "Orders"
      );

      if (result?.path) {
        setExportMessage(`XLSX saved to Documents/${result.path}`);
      } else {
        setExportMessage("XLSX downloaded successfully.");
      }
    } catch (error) {
      setExportMessage(error?.message || "Failed to export XLSX.");
    }
  }

  async function handlePrintAll() {
    if (hasMore) {
      const allOrders = await fetchAllMatchingOrders();
      setOrders(allOrders);
      setHasMore(false);
      setTotalCount(allOrders.length);
    }

    await printCurrentPage({ title: "Filtered Orders Report" });
  }

  const activeStore = stores.find((store) => store.storeCode === filters.storeCode);
  const reportScopeLabel =
    filters.storeCode === "all"
      ? "All Accounts"
      : activeStore?.role === "admin"
        ? "Admin Data"
        : `${activeStore?.storeCode || filters.storeCode} · ${activeStore?.storeName || "Store"}`;
  const reportDateLabel =
    filters.from || filters.to
      ? `${filters.from || "Start"} to ${filters.to || "Today"}`
      : "All Dates";

  return (
    <>
      <div className="admin-screen-only space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Orders Today" value={summary.totalToday} />
          <StatCard label="Bank Transfers Today" value={summary.bankToday} accent="teal" />
          <StatCard
            label="Filtered Volume"
            value={`${formatCurrency(filteredStats.idr, "IDR")} / ${formatCurrency(filteredStats.inr, "INR")}`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.byStore.map((store) => (
            <div key={store.storeCode} className="glass-panel rounded-[28px] border border-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/35">
                {store.role === "admin" ? "Admin Scope" : store.storeCode}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{store.storeName}</p>
              <p className="mt-4 text-sm text-white/65">{store.count} orders</p>
              <p className="mt-1 text-sm text-white/55">IDR {formatCurrency(store.totalIDR, "IDR")}</p>
              <p className="text-sm text-white/55">INR {formatCurrency(store.totalINR, "INR")}</p>
              <Button className="mt-4 w-full" variant="secondary" href={`/history?storeCode=${store.storeCode}`}>
                View {store.role === "admin" ? "Admin" : "Store"} History
              </Button>
            </div>
          ))}
        </div>

        <div className="filters-panel glass-panel rounded-[32px] border border-white/5 p-6">
          <div className="grid-form two-col">
            <StoreFilter
              stores={stores}
              label="Data Scope"
              allLabel="All Accounts"
              value={filters.storeCode}
              onChange={(event) => setFilters((current) => ({ ...current, storeCode: event.target.value }))}
            />
            <Select
              label="Order Type"
              options={typeOptions}
              value={filters.type}
              onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
              disabled
            />
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

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" icon={Download} onClick={() => void handleExportXlsx()}>
              Export XLSX
            </Button>
            <Button variant="secondary" icon={Printer} onClick={() => void handlePrintAll()}>
              Print All
            </Button>
          </div>
          {exportMessage ? <p className="mt-3 text-sm text-white/65">{exportMessage}</p> : null}
        </div>
{/* Fancy Delete Confirmation Modal */}
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
        {loading ? (
          <div className="glass-panel rounded-[32px] border border-white/5 p-8 text-center text-white/55">
            Loading orders...
          </div>
        ) : (
          <div className="space-y-4">
            <AdminTable orders={orders} onDelete={handleDelete} />
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
      </div>

      <div className="admin-print-area">
        <div className="admin-print-header">
          <p className="admin-print-kicker">AHMAD Enterprises</p>
          <h1>Filtered Orders Report</h1>
          <p>Scope: {reportScopeLabel}</p>
          <p>Date Range: {reportDateLabel}</p>
          <p>Status: {filters.status === "all" ? "All Statuses" : filters.status}</p>
          <p>
            Volume: {formatCurrency(filteredStats.idr, "IDR")} / {formatCurrency(filteredStats.inr, "INR")}
          </p>
        </div>

        <AdminTable orders={orders} printMode />
      </div>
    </>
  );
}
