import HistoryPage from "@/components/history/HistoryPage";
import { getCachedOrdersPage, getCachedOrgStores } from "@/lib/cache";
import { requireSession } from "@/lib/session";

const HISTORY_PAGE_SIZE = 5;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrdersHistoryPage({ searchParams }) {
  const session = await requireSession();
  const resolvedSearchParams = await searchParams;
  const stores = session.user.role === "admin" ? await getCachedOrgStores() : [];
  const requestedStoreCode =
    session.user.role === "admin" && typeof resolvedSearchParams?.storeCode === "string"
      ? resolvedSearchParams.storeCode.toUpperCase()
      : "all";
  const activeStore = stores.find((store) => store.storeCode === requestedStoreCode);
  const initialStoreCode = activeStore?.storeCode || "all";
  const initialStoreName = activeStore?.storeName || "";
  const requestedStatus = typeof resolvedSearchParams?.status === "string" ? resolvedSearchParams.status : "all";
  const initialStatus = ["pending", "failed", "done"].includes(requestedStatus) ? requestedStatus : "all";

  const initialOrdersPage = await getCachedOrdersPage(
    session.user.role,
    session.user.id,
    {
      from: "",
      to: "",
      status: initialStatus,
      storeCode: initialStoreCode,
      country: "all"
    },
    1,
    HISTORY_PAGE_SIZE
  );

  return (
    <HistoryPage
      key={`${session.user.role}-${initialStoreCode}-${initialStatus}`}
      isAdmin={session.user.role === "admin"}
      stores={stores}
      initialStoreCode={initialStoreCode}
      initialStoreName={initialStoreName}
      initialStatus={initialStatus}
      initialOrders={initialOrdersPage.items}
      initialSummary={initialOrdersPage.summary}
      initialHasMore={initialOrdersPage.hasMore}
      initialTotalCount={initialOrdersPage.totalCount}
      initialPage={initialOrdersPage.page}
    />
  );
}
