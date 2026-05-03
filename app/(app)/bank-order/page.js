import BankOrderForm from "@/components/forms/BankOrderForm";
import { generateOrderNo } from "@/lib/orderNo";
import { normalizeBankOrder } from "@/lib/orders";
import { getGlobalSettings } from "@/lib/settings";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function BankOrderPage({ searchParams }) {
  const session = await requireSession();
  const resolvedSearchParams = await searchParams;
  const editId = Number(resolvedSearchParams?.edit || 0);
  const [settings, initialOrderNo] = await Promise.all([
    getGlobalSettings(),
    generateOrderNo("B", session.user.storeCode, prisma)
  ]);
  let initialOrder = null;

  if (editId > 0) {
    const where =
      session.user.role === "admin"
        ? { id: editId }
        : {
            id: editId,
            userId: Number(session.user.id)
          };

    const order = await prisma.bankOrder.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            storeName: true,
            storeCode: true
          }
        }
      }
    });

    initialOrder = order ? normalizeBankOrder(order) : null;
  }

  return <BankOrderForm initialOrderNo={initialOrderNo} settings={settings} initialOrder={initialOrder} />;
}
