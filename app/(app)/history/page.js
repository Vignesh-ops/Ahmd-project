import HistoryPage from "@/components/history/HistoryPage";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export default async function OrdersHistoryPage({ searchParams }) {
  const session = await requireSession();
  const resolvedSearchParams = await searchParams;
  const stores =
    session.user.role === "admin"
      ? (
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
        })
      : [];
  const requestedStoreCode =
    session.user.role === "admin" && typeof resolvedSearchParams?.storeCode === "string"
      ? resolvedSearchParams.storeCode.toUpperCase()
      : "all";
  const activeStore = stores.find((store) => store.storeCode === requestedStoreCode);
  const initialStoreCode = activeStore?.storeCode || "all";
  const initialStoreName = activeStore?.storeName || "";

  return (
    <HistoryPage
      key={`${session.user.role}-${initialStoreCode}`}
      isAdmin={session.user.role === "admin"}
      stores={stores}
      initialStoreCode={initialStoreCode}
      initialStoreName={initialStoreName}
    />
  );
}
