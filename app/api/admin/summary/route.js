import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCombinedOrders } from "@/lib/orders";
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

  const [orders, stores] = await Promise.all([
    getCombinedOrders({
      sessionUser: session.user,
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
    const storeOrders = orders.filter((order) => order.userId === store.id);

    return {
      storeCode: store.storeCode,
      storeName: store.storeName,
      role: store.role,
      count: storeOrders.length,
      totalIDR: storeOrders.reduce(
        (sum, order) => sum + (order.currency === "IDR" ? Number(order.amount || 0) : 0),
        0
      ),
      totalINR: storeOrders.reduce((sum, order) => {
        if (order.type === "bank" && order.currency === "INR") {
          return sum + Number(order.amount || 0);
        }

        return sum;
      }, 0)
    };
  });

  return NextResponse.json({
    totalToday: orders.length,
    bankToday: orders.filter((order) => order.type === "bank").length,
    byStore
  });
}
