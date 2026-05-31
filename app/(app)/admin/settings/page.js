import { ArrowLeft } from "lucide-react";
import AdminStoreSettingsManager from "@/components/admin/AdminStoreSettingsManager";
import Button from "@/components/ui/Button";
import prisma from "@/lib/prisma";
import { defaultSettingsData } from "@/lib/settings";
import { requireAdminPage } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSettingsPage() {
  await requireAdminPage();

  const stores = await prisma.user.findMany({
    where: {
      role: "store"
    },
    include: {
      settings: true
    },
    orderBy: [
      {
        storeCode: "asc"
      },
      {
        id: "asc"
      }
    ]
  });
  const storesWithSettings = stores.map((store) => ({
    ...store,
    settings: store.settings || {
      id: store.id,
      userId: store.id,
      ...defaultSettingsData
    }
  }));

  return (
    <div className="page-fade space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/35">Store Pricing</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Manage shop rates and service charges</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">
            Update each store user's default Indonesia and India exchange rates and service charges.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/admin" variant="secondary" icon={ArrowLeft}>
            Back to Admin
          </Button>
          <Button href="/admin/users" variant="secondary">
            Manage Users
          </Button>
        </div>
      </div>

      <AdminStoreSettingsManager stores={storesWithSettings} />
    </div>
  );
}
