import SettingsForm from "@/components/forms/SettingsForm";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function SettingsPage() {
  const session = await requireSession();
  let settings = await prisma.settings.findUnique({
    where: {
      userId: Number(session.user.id)
    }
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        userId: Number(session.user.id)
      }
    });
  }

  return (
    <div className="page-fade">
      <SettingsForm
        settings={settings}
        storeName={session.user.storeName || session.user.username}
        isAdmin={session.user.role === "admin"}
      />
    </div>
  );
}
