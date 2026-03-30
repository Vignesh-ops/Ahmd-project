import SettingsForm from "@/components/forms/SettingsForm";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function SettingsPage() {
  const session = await requireSession();
  const settings = await prisma.settings.upsert({
    where: {
      userId: Number(session.user.id)
    },
    update: {},
    create: {
      userId: Number(session.user.id)
    }
  });

  return (
    <div className="page-fade">
      <SettingsForm settings={settings} storeName={session.user.storeName || session.user.username} />
    </div>
  );
}

