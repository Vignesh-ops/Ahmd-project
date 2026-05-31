import { Settings2, Shield, UserCog } from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import Button from "@/components/ui/Button";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/session";

export default async function AdminPage() {
  await requireAdminPage();

  const stores = (
    await prisma.user.findMany({
    where: {
      role: {
        in: ["admin", "store"]
      }
    },
    select: {
      id: true,
      role: true,
      storeName: true,
      storeCode: true
    }
    })
  ).sort((left, right) => {
    if (left.role !== right.role) {
      return left.role === "admin" ? -1 : 1;
    }

    return (left.storeCode || "").localeCompare(right.storeCode || "");
  });

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
        </div>
      </div>
      <AdminDashboard stores={stores} />
    </div>
  );
}
