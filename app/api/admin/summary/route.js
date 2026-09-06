import { NextResponse } from "next/server";
import { getCachedAdminSummary } from "@/lib/cache";
import { forbidden, getApiSession, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  if (session.user.role !== "admin") {
    return forbidden();
  }

  const { searchParams } = new URL(request.url);
  const filters = {
    today: true,
    storeId: searchParams.get("storeId") || undefined,
    storeCode: searchParams.get("storeCode") || undefined
  };

  const payload = await getCachedAdminSummary(filters);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
