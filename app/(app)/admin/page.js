import { Landmark, Settings2, Shield, UserCog } from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import BankBalanceQuickEntry from "@/components/admin/BankBalanceQuickEntry";
import Button from "@/components/ui/Button";
import { getCachedAdminSummary, getCachedDailyOrderTrend, getCachedOrdersPage, getCachedOrgStores } from "@/lib/cache";
import { requireAdminPage } from "@/lib/session";
import { getBankBalanceData } from "@/lib/bankBalance";
import { formatCurrency } from "@/lib/utils";

const ADMIN_ORDERS_PAGE_SIZE = 5;
const TREND_DAYS = 14;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const session = await requireAdminPage();

  const [stores, initialSummary, initialOrdersPage, initialTrend, bankBalance] = await Promise.all([
    getCachedOrgStores(),
    getCachedAdminSummary({ today: true }),
    getCachedOrdersPage(
      session.user.role,
      session.user.id,
      { storeCode: "all", from: "", to: "", status: "all", country: "all" },
      1,
      ADMIN_ORDERS_PAGE_SIZE
    ),
    getCachedDailyOrderTrend(TREND_DAYS),
    getBankBalanceData()
  ]);

  return (
    <div className="page-fade space-y-6">
      <div className="admin-screen-only flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gold-light">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/35">Admin Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Network-wide order oversight</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Review store activity, export filtered order data, and manage receipts across all operators.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/admin/settings" variant="secondary" icon={Settings2}>
            Manage Rates
          </Button>
          <Button href="/admin/users" variant="secondary" icon={UserCog}>
            Manage Users
          </Button>
          <Button href="/admin/bank-balance" variant="secondary" icon={Landmark}>
            Manage Balance
          </Button>
        </div>
      </div>
      <section className="glass-panel relative isolate flex flex-col gap-3 overflow-hidden rounded-[28px] border border-gold/15 bg-gradient-to-br from-gold/10 via-transparent to-teal/10 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:flex-row sm:items-center sm:justify-between">
        <div className="pointer-events-none absolute -right-10 -top-16 -z-10 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
        <div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-gold/15 bg-gold/10 px-3.5 py-2.5 text-gold-light shadow-[0_8px_24px_rgba(212,168,67,0.08)]">
            <Landmark className="h-4 w-4" />
            <p className="text-sm font-bold tracking-wide">Indonesia Bank Balance</p>
          </div>
          <p className={`mt-2 font-mono text-2xl font-bold ${bankBalance.availableBalance < 0 ? "text-red-300" : "text-white"}`}>{formatCurrency(bankBalance.availableBalance, "IDR")}</p>
          <p className="mt-1 text-xs text-white/45">Live balance, updated with every order</p>
        </div>
      </section>
      <AdminDashboard
        stores={stores}
        initialSummary={initialSummary}
        initialOrders={initialOrdersPage.items}
        initialFilteredSummary={initialOrdersPage.summary}
        initialHasMore={initialOrdersPage.hasMore}
        initialTotalCount={initialOrdersPage.totalCount}
        initialPage={initialOrdersPage.page}
        initialTrend={initialTrend}
      />
      <BankBalanceQuickEntry initialData={bankBalance} />
    </div>
  );
}
