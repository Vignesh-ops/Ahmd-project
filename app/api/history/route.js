import { NextResponse } from "next/server";
import { getCombinedOrders } from "@/lib/orders";
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

  const scopeError = guardAdminStoreAccess(session.user, filters);
  if (scopeError) {
    return scopeError;
  }

  const orders = await getCombinedOrders({
    sessionUser: session.user,
    filters
  });

  return NextResponse.json(orders);
}
