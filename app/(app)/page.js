import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import Button from "@/components/ui/Button";
import OrderCard from "@/components/ui/OrderCard";
import StatCard from "@/components/ui/StatCard";
import { getCombinedOrders, summarizeOrders } from "@/lib/orders";
import { requireSession } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireSession();
  const [allOrders, todayOrders, recentOrders] = await Promise.all([
    getCombinedOrders({
      sessionUser: session.user
    }),
    getCombinedOrders({
      sessionUser: session.user,
      filters: {
        today: true
      }
    }),
    getCombinedOrders({
      sessionUser: session.user,
      filters: {
        limit: 5
      }
    })
  ]);

  const summary = summarizeOrders(allOrders);
  const todaySummary = summarizeOrders(todayOrders);

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
            <Button href="/bank-order" icon={Landmark}>
              New Bank Order
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Orders" value={summary.totalOrders} />
        <StatCard label="Bank Transfers" value={summary.bankOrders} accent="teal" />
        <StatCard
          label="Total Amount"
          value={`${formatCurrency(summary.totalIDR, "IDR")} / ${formatCurrency(summary.totalINR, "INR")}`}
        />
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
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Transfers</p>
              <p className="mt-2 text-lg font-semibold text-white">{todaySummary.bankOrders}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Amount</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatCurrency(todaySummary.totalIDR, "IDR")} / {formatCurrency(todaySummary.totalINR, "INR")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">Recent Orders</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Latest activity</h2>
          </div>
          <Link href="/history" className="inline-flex items-center gap-2 text-sm text-gold-light">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {recentOrders.map((order) => (
            <OrderCard key={`${order.type}-${order.id}`} order={order} href={`/receipt/${order.orderNo}`} />
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
