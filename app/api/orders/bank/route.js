import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOrderNo } from "@/lib/orderNo";
import { normalizeBankOrder } from "@/lib/orders";
import {
  badRequest,
  cleanString,
  getApiSession,
  guardAdminStoreAccess,
  isValidMobile,
  unauthorized
} from "@/lib/api";
import { calculateTotalPayable, digitsOnly } from "@/lib/utils";

export async function GET(request) {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const preview = searchParams.get("preview");
  const storeId = searchParams.get("storeId");
  const storeCode = searchParams.get("storeCode");

  const scopeError = guardAdminStoreAccess(session.user, { storeId, storeCode });
  if (scopeError) {
    return scopeError;
  }

  if (preview === "true") {
    const orderNo = await generateOrderNo("B", session.user.storeCode, prisma);
    return NextResponse.json({ orderNo });
  }

  const where =
    session.user.role === "admin" && storeId
      ? { userId: Number(storeId) }
      : session.user.role === "admin"
        ? {}
        : { userId: Number(session.user.id) };

  const orders = await prisma.bankOrder.findMany({
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
    },
    orderBy: {
      date: "desc"
    }
  });

  return NextResponse.json(orders.map(normalizeBankOrder));
}

export async function POST(request) {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  const body = await request.json();
  const senderName = cleanString(body.senderName);
  const accountName = cleanString(body.accountName);
  const accountNo = cleanString(body.accountNo);
  const bank = cleanString(body.bank);
  const branch = cleanString(body.branch) || null;
  const ifscCode = cleanString(body.ifscCode) || null;
  const senderMobile = digitsOnly(cleanString(body.senderMobile));
  const notes = cleanString(body.notes) || null;
  const country = Number(body.country || 1);
  const depositAmount = Number(body.depositAmount || 0);
  const rate = Number(body.rate || 0);
  const serviceCharge = Number(body.serviceCharge || 0);

  if (!senderName || !accountName || !accountNo || !bank || !senderMobile) {
    return badRequest("Please fill all required bank order fields.");
  }

  if (![1, 2].includes(country)) {
    return badRequest("Invalid country selection.");
  }

  if (!isValidMobile(senderMobile)) {
    return badRequest("Sender mobile must be at least 10 digits.");
  }

  if (depositAmount <= 0) {
    return badRequest("Deposit amount must be greater than zero.");
  }

  if (!Number.isFinite(rate) || rate <= 0) {
    return badRequest("Rate must be greater than zero.");
  }

  if (!Number.isFinite(serviceCharge) || serviceCharge < 0) {
    return badRequest("Service charge must be zero or greater.");
  }

  const totalPayableAmount = calculateTotalPayable({
    depositAmount,
    rate,
    serviceCharge
  });

  const orderNo = await generateOrderNo("B", session.user.storeCode, prisma);
  const order = await prisma.bankOrder.create({
    data: {
      orderNo,
      userId: Number(session.user.id),
      country,
      senderName,
      accountName,
      accountNo,
      bank,
      branch,
      ifscCode,
      depositAmount,
      rate,
      serviceCharge,
      totalPayableAmount,
      senderMobile,
      notes,
      status: "pending"
    },
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

  return NextResponse.json(normalizeBankOrder(order), { status: 201 });
}
