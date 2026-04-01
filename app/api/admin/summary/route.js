import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStoreOrderSummary } from "@/lib/orders";
import { forbidden, getApiSession, unauthorized } from "@/lib/api";

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

  const [summary, stores] = await Promise.all([
    getStoreOrderSummary({
      filters
    }),
    prisma.user.findMany({
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
  ]);

  const byStore = stores
    .sort((left, right) => {
      if (left.role !== right.role) {
        return left.role === "admin" ? -1 : 1;
      }

      return (left.storeCode || "").localeCompare(right.storeCode || "");
    })
    .map((store) => {
    const storeSummary = summary.byStore[String(store.id)] || {
      count: 0,
      totalIDR: 0,
      totalINR: 0
    };

    return {
      storeCode: store.storeCode,
      storeName: store.storeName,
      role: store.role,
      count: storeSummary.count,
      totalIDR: storeSummary.totalIDR,
      totalINR: storeSummary.totalINR
    };
  });

  return NextResponse.json({
    totalToday: summary.totalOrders,
    bankToday: summary.totalOrders,
    byStore
  });
}
