import { ArrowRight, Landmark } from "lucide-react";
import MonthFilter from "@/components/dashboard/MonthFilter";
import AppLink from "@/components/navigation/AppLink";
import Button from "@/components/ui/Button";
import CurrencyPairSummary from "@/components/ui/CurrencyPairSummary";
import OrderCard from "@/components/ui/OrderCard";
import StatCard from "@/components/ui/StatCard";
import { getAvailableOrderMonths, getCombinedOrders, getOrderSummary } from "@/lib/orders";
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

export default async function DashboardPage({ searchParams }) {
  const session = await requireSession();
  const resolvedSearchParams = await searchParams;
  const selectedMonth = resolvedSearchParams?.month || getCurrentMonthValue();
  const monthRange = buildMonthRange(selectedMonth);
  const monthFilters = {
    from: monthRange.from,
    to: monthRange.to
  };
  const [monthSummary, todaySummary, recentOrders, availableMonths] = await Promise.all([
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
              Hello, {session.user.role === "admin" ? "Admin" : session.user.storeName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Full activity snapshot across your remittance workflow, with quick access to new bank transfer orders.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <MonthFilter months={monthOptions} value={selectedMonth} />
            <Button href="/bank-order" icon={Landmark}>
              New Bank Order
            </Button>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[32px] border border-white/5 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">Today</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Today&apos;s activity</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[560px]">
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Orders</p>
              <p className="mt-2 text-lg font-semibold text-white">{todaySummary.totalOrders}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Profit</p>
              <p className="mt-2 text-lg font-semibold text-white">
                <CurrencyPairSummary
                  idr={todaySummary.profitIDR}
                  idrMyr={todaySummary.profitIDRMYR}
                  inr={todaySummary.profitINR}
                  inrMyr={todaySummary.profitINRMYR}
                  compact
                />
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Amount</p>
              <p className="mt-2 text-lg font-semibold text-white">
                <CurrencyPairSummary
                  idr={todaySummary.totalIDR}
                  idrMyr={todaySummary.totalPayableIDRMYR}
                  inr={todaySummary.totalINR}
                  inrMyr={todaySummary.totalPayableINRMYR}
                  compact
                />
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/35">{selectedMonthLabel}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Month activity</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total Orders" value={monthSummary.totalOrders} />
          <StatCard
            label="Profit"
            value={
              <CurrencyPairSummary
                idr={monthSummary.profitIDR}
                idrMyr={monthSummary.profitIDRMYR}
                inr={monthSummary.profitINR}
                inrMyr={monthSummary.profitINRMYR}
              />
            }
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
              />
            }
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">Recent Orders</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Latest activity</h2>
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
