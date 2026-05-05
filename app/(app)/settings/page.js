import SettingsForm from "@/components/forms/SettingsForm";
import { getUserSettings } from "@/lib/settings";
import { requireSession } from "@/lib/session";

export default async function SettingsPage() {
  const session = await requireSession();
  const settings = await getUserSettings(session.user.id);

  return (
    <div className="page-fade">
      <SettingsForm
        settings={settings}
        storeName={session.user.storeName || session.user.username || "Your Account"}
      />
    </div>
  );
}
