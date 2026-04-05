import SettingsForm from "@/components/forms/SettingsForm";
import { getGlobalSettings } from "@/lib/settings";
import { requireSession } from "@/lib/session";

export default async function SettingsPage() {
  const session = await requireSession();
  const settings = await getGlobalSettings();

  return (
    <div className="page-fade">
      <SettingsForm
        settings={settings}
        storeName={session.user.role === "admin" ? "Global Settings" : "Global Settings (View Only)"}
        isAdmin={session.user.role === "admin"}
      />
    </div>
  );
}
