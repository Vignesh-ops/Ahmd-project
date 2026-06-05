import { AlertTriangle, ArrowRight, Clock3, Landmark } from "lucide-react";
import MonthFilter from "@/components/dashboard/MonthFilter";
import TimeGreeting from "@/components/dashboard/TimeGreeting";
import AppLink from "@/components/navigation/AppLink";
import Button from "@/components/ui/Button";
import CurrencyPairSummary from "@/components/ui/CurrencyPairSummary";
import OrderCountSummary from "@/components/ui/OrderCountSummary";
import OrderCard from "@/components/ui/OrderCard";
import ProfitSummary from "@/components/ui/ProfitSummary";
import StatCard from "@/components/ui/StatCard";
import { getAvailableOrderMonths, getCombinedOrders, getOpenOrderStatusSummary, getOrderSummary } from "@/lib/orders";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCurrentMonthValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthRange(monthValue) {
  const [yearValue, monthIndexValue] = String(monthValue || "").split("-");
  const year = Number(yearValue);
  const monthIndex = Number(monthIndexValue) - 1;

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return buildMonthRange(getCurrentMonthValue());
  }

  return {
    from: new Date(year, monthIndex, 1),
    to: new Date(year, monthIndex + 1, 0)
  };
}

function ensureSelectedMonthOption(months, selectedMonth) {
  if (months.some((month) => month.value === selectedMonth)) {
    return months;
  }

  const { from } = buildMonthRange(selectedMonth);
  const label = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(from);

  return [{ value: selectedMonth, label }, ...months];
}

function buildHistoryStatusHref(status, storeCode) {
  const params = new URLSearchParams({ status });

  if (storeCode) {
    params.set("storeCode", storeCode);
  }

  return `/history?${params.toString()}`;
}

function StatusCountLink({ href, icon: Icon, label, count, tone = "amber" }) {
  const toneClassName = tone === "rose" ? "open-orders-link--rose" : "open-orders-link--amber";

  return (
    <AppLink
      href={href}
      className={`open-orders-link inline-flex min-h-[44px] items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${toneClassName}`}
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
      <span className="open-orders-count rounded-full px-2.5 py-1 font-mono text-xs">{count}</span>
    </AppLink>
  );
}

function OpenOrdersPanel({ summary, isAdmin }) {
  if (!summary?.total) {
    return null;
  }

  return (
    <section className="open-orders-panel glass-panel rounded-[32px] p-5 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="open-orders-eyebrow text-xs uppercase tracking-[0.22em]">Needs Attention</p>
          <h2 className="open-orders-title mt-2 text-xl font-semibold">Pending / Failed Orders</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {summary.pending ? (
            <StatusCountLink
              href={buildHistoryStatusHref("pending")}
              icon={Clock3}
              label="Pending"
              count={summary.pending}
            />
          ) : null}
          {summary.failed ? (
            <StatusCountLink
              href={buildHistoryStatusHref("failed")}
              icon={AlertTriangle}
              label="Failed"
              count={summary.failed}
              tone="rose"
            />
          ) : null}
        </div>
      </div>

      {isAdmin && summary.stores?.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {summary.stores.map((store) => (
            <div key={store.userId} className="open-orders-store-card rounded-[24px] border p-4">
              <p className="open-orders-store-code text-xs uppercase tracking-[0.2em]">
                {store.role === "admin" ? "Admin" : store.storeCode}
              </p>
              <h3 className="open-orders-store-name mt-1 truncate text-base font-semibold">{store.storeName}</h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {store.pending ? (
                  <StatusCountLink
                    href={buildHistoryStatusHref("pending", store.storeCode)}
                    icon={Clock3}
                    label="Pending"
                    count={store.pending}
                  />
                ) : null}
                {store.failed ? (
                  <StatusCountLink
                    href={buildHistoryStatusHref("failed", store.storeCode)}
                    icon={AlertTriangle}
                    label="Failed"
                    count={store.failed}
                    tone="rose"
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default async function DashboardPage({ searchParams }) {
  const session = await requireSession();
  const isAdmin = session.user.role === "admin";
  const resolvedSearchParams = await searchParams;
  const selectedMonth = resolvedSearchParams?.month || getCurrentMonthValue();
  const monthRange = buildMonthRange(selectedMonth);
  const monthFilters = {
    from: monthRange.from,
    to: monthRange.to
  };
  const [monthSummary, todaySummary, recentOrders, availableMonths, openOrderSummary] = await Promise.all([
    getOrderSummary({
      sessionUser: session.user,
      filters: monthFilters
    }),
    getOrderSummary({
      sessionUser: session.user,
      filters: {
        today: true
      }
    }),
    getCombinedOrders({
      sessionUser: session.user,
      filters: {
        ...monthFilters,
        limit: 5
      }
    }),
    getAvailableOrderMonths({
      sessionUser: session.user
    }),
    getOpenOrderStatusSummary({
      sessionUser: session.user
    })
  ]);
  const monthOptions = ensureSelectedMonthOption(availableMonths, selectedMonth);
  const selectedMonthLabel = monthOptions.find((month) => month.value === selectedMonth)?.label || "Selected Month";

  return (
    <div className="page-fade space-y-6">
      <section className="glass-panel rounded-[36px] border border-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.26em] text-white/35">Dashboard</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">
              <TimeGreeting name={isAdmin ? "Admin" : session.user.storeName} />
            </h1>
            {/* <p className="mt-2 max-w-2xl text-sm text-white/55">
              Full activity snapshot across your remittance workflow, with quick access to new bank transfer orders.
            </p> */}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {isAdmin ? <MonthFilter months={monthOptions} value={selectedMonth} /> : null}
            <Button href="/bank-order" icon={Landmark}>
              New Bank Order
            </Button>
          </div>
        </div>
      </section>

      <OpenOrdersPanel summary={openOrderSummary} isAdmin={isAdmin} />

      {isAdmin ? (
        <section className="glass-panel rounded-[36px] border border-white/5 p-6 space-y-4 shadow-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">{selectedMonthLabel}</p>
            <h2 className="mt-2 text-2xl font-bold text-white decoration-gold-light decoration-2 underline-offset-4">Monthly Activity</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Total Orders"
              value={<OrderCountSummary idr={monthSummary.orderCountIDR} inr={monthSummary.orderCountINR} compact />}
            />
            <StatCard
              label="Profit"
              value={<ProfitSummary idr={monthSummary.profitIDR} inr={monthSummary.profitINR} compact />}
              accent="teal"
            />
            <StatCard
              label="Total Amount"
              value={
                <CurrencyPairSummary
                  idr={monthSummary.totalIDR}
                  idrMyr={monthSummary.totalPayableIDRMYR}
                  inr={monthSummary.totalINR}
                  inrMyr={monthSummary.totalPayableINRMYR}
                  compact
                />
              }
            />
          </div>
        </section>
      ) : null}

      <section className="glass-panel rounded-[36px] border border-white/5 p-6 space-y-4 shadow-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/35">Today</p>
          <h2 className="mt-2 text-2xl font-bold text-white decoration-gold-light decoration-2 underline-offset-4">Today&apos;s Activity</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Orders"
            value={<OrderCountSummary idr={todaySummary.orderCountIDR} inr={todaySummary.orderCountINR} compact />}
          />
          {isAdmin && (
            <StatCard
              label="Profit"
              value={<ProfitSummary idr={todaySummary.profitIDR} inr={todaySummary.profitINR} compact />}
              accent="teal"
            />
          )}
          <StatCard
            label="Amount"
            value={
              <CurrencyPairSummary
                idr={todaySummary.totalIDR}
                idrMyr={todaySummary.totalPayableIDRMYR}
                inr={todaySummary.totalINR}
                inrMyr={todaySummary.totalPayableINRMYR}
                compact
              />
            }
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">Recent Orders</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Latest Activity</h2>
          </div>
          <AppLink href="/history" className="inline-flex items-center gap-2 text-sm text-gold-light">
            View all
            <ArrowRight className="h-4 w-4" />
          </AppLink>
        </div>

        <div className="space-y-4">
          {recentOrders.map((order) => (
            <OrderCard key={`${order.type}-${order.id}`} order={order}>
              <Button variant="secondary" href={`/receipt/${order.orderNo}`}>
                View Receipt
              </Button>
              {order.status === "pending" ? (
                <Button variant="secondary" href={`/bank-order?edit=${order.id}`}>
                  Edit
                </Button>
              ) : null}
            </OrderCard>
          ))}

          {!recentOrders.length ? (
            <div className="glass-panel rounded-[32px] border border-white/5 p-8 text-center text-white/55">
              No orders yet. Use the quick actions above to create the first one.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
