import { NextResponse } from "next/server";
import { getCombinedOrders, getCombinedOrdersPage } from "@/lib/orders";
import { getApiSession, guardAdminStoreAccess, unauthorized } from "@/lib/api";

export async function GET(request) {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const filters = {
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    type: searchParams.get("type") || "all",
    status: searchParams.get("status") || "all",
    limit: searchParams.get("limit") || undefined,
    storeId: searchParams.get("storeId") || undefined,
    storeCode: searchParams.get("storeCode") || undefined,
    orderNo: searchParams.get("orderNo") || undefined,
    today: searchParams.get("today") === "true"
  };
  const page = searchParams.get("page");
  const pageSize = searchParams.get("pageSize");
  const paginated = searchParams.get("paginated") === "true";

  const scopeError = guardAdminStoreAccess(session.user, filters);
  if (scopeError) {
    return scopeError;
  }

  if (paginated) {
    const result = await getCombinedOrdersPage({
      sessionUser: session.user,
      filters,
      page,
      pageSize
    });

    return NextResponse.json(result);
  }

  const orders = await getCombinedOrders({
    sessionUser: session.user,
    filters
  });

  return NextResponse.json(orders);
}
