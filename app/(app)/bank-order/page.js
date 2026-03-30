import BankOrderForm from "@/components/forms/BankOrderForm";
import { generateOrderNo } from "@/lib/orderNo";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function BankOrderPage() {
  const session = await requireSession();
  const [settings, initialOrderNo] = await Promise.all([
    prisma.settings.upsert({
      where: {
        userId: Number(session.user.id)
      },
      update: {},
      create: {
        userId: Number(session.user.id)
      }
    }),
    generateOrderNo("B", session.user.storeCode, prisma)
  ]);

  return <BankOrderForm initialOrderNo={initialOrderNo} settings={settings} />;
}

