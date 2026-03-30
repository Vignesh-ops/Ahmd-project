import { ArrowLeft } from "lucide-react";
import UsersManager from "@/components/admin/UsersManager";
import Button from "@/components/ui/Button";
import { requireAdminPage } from "@/lib/session";

export default async function AdminUsersPage() {
  await requireAdminPage();

  return (
    <div className="page-fade space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/35">User Management</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Store operator access</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">
            Add unlimited store operators, manage secure credentials, and separate admin account access from store data.
          </p>
        </div>
        <Button href="/admin" variant="secondary" icon={ArrowLeft}>
          Back to Admin
        </Button>
      </div>
      <UsersManager />
    </div>
  );
}
