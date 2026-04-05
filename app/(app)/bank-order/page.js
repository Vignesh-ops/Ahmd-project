import BankOrderForm from "@/components/forms/BankOrderForm";
import { generateOrderNo } from "@/lib/orderNo";
import { getGlobalSettings } from "@/lib/settings";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function BankOrderPage() {
  const session = await requireSession();
  const [settings, initialOrderNo] = await Promise.all([
    getGlobalSettings(),
    generateOrderNo("B", session.user.storeCode, prisma)
  ]);

  return <BankOrderForm initialOrderNo={initialOrderNo} settings={settings} />;
}
