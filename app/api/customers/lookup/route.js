import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  badRequest,
  cleanString,
  getApiSession,
  isValidMobile,
  unauthorized
} from "@/lib/api";
import { digitsOnly } from "@/lib/utils";

const userSelect = {
  id: true,
  storeName: true,
  storeCode: true
};

export async function GET(request) {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const type = cleanString(searchParams.get("type")).toLowerCase() || "bank";
  const mobile = cleanString(searchParams.get("mobile"));
  const mobileDigits = digitsOnly(mobile);

  if (type !== "bank") {
    return badRequest("Only bank customer lookup is available.");
  }

  if (!isValidMobile(mobileDigits)) {
    return NextResponse.json({ found: false, mobile });
  }

  const scope = session.user.role === "admin" ? {} : { userId: Number(session.user.id) };

  const recentOrders = await prisma.bankOrder.findMany({
    where: scope,
    include: {
      user: {
        select: userSelect
      }
    },
    orderBy: {
      date: "desc"
    },
    take: 200
  });
  const order = recentOrders.find((item) => digitsOnly(item.senderMobile) === mobileDigits);

  if (!order) {
    return NextResponse.json({ found: false, mobile });
  }

  return NextResponse.json({
    found: true,
    type,
    orderNo: order.orderNo,
    date: order.date,
    storeName: order.user?.storeName || "",
    storeCode: order.user?.storeCode || "",
    data: {
      country: order.country,
      senderName: order.senderName || "",
      accountName: order.accountName,
      accountNo: order.accountNo,
      bank: order.bank,
      branch: order.branch || "",
      ifscCode: order.ifscCode || ""
    }
  });
}
