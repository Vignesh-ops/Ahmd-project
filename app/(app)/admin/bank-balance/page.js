import { ArrowLeft, CalendarDays, Landmark } from "lucide-react";
import BankBalanceManager from "@/components/admin/BankBalanceManager";
import Button from "@/components/ui/Button";
import { getBankBalanceData } from "@/lib/bankBalance";
import { requireAdminPage } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BankBalancePage() {
  await requireAdminPage();
  const balance = await getBankBalanceData();

  return (
    <div className="page-fade space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10 text-gold-light">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.24em] text-white/35">Finance Dashboard</p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal"><CalendarDays className="h-3 w-3" />Today</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-white">Indonesia Bank Balance Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">Monitor today&apos;s bank position, RP order deductions, and manual balance entries in one place.</p>
          </div>
        </div>
        <Button href="/admin" variant="secondary" icon={ArrowLeft}>Back to Admin</Button>
      </div>

      <BankBalanceManager initialData={balance} />
    </div>
  );
}
