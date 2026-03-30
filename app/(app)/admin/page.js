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
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/35">Admin Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Network-wide order oversight</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">
            Review store activity, export filtered order data, and manage receipts across all operators.
          </p>
        </div>
        <Button href="/admin/users" variant="secondary">
          Manage Users
        </Button>
      </div>
      <AdminDashboard stores={stores} />
    </div>
  );
}
