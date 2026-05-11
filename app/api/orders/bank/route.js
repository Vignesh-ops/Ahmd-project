import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateCurrencyOrderNo } from "@/lib/orderNo";
import { bankCurrencyFromCountry, normalizeBankOrder } from "@/lib/orders";
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
  const previewCountry = Number(searchParams.get("country") || 1);

  const scopeError = guardAdminStoreAccess(session.user, { storeId, storeCode });
  if (scopeError) {
    return scopeError;
  }

  if (preview === "true") {
    if (![1, 2].includes(previewCountry)) {
      return badRequest("Invalid country selection.");
    }

    const orderNo = await generateCurrencyOrderNo("B", session.user.storeCode, prisma, bankCurrencyFromCountry(previewCountry));
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isScopedBankOrderNo(orderNo, storeCode, currency) {
  const safeStoreCode = storeCode || "S0";
  const safeCurrency = String(currency).toUpperCase() === "INR" ? "INR" : "IDR";
  const pattern = new RegExp(`^B-${escapeRegExp(safeStoreCode)}-\\d{8}-${safeCurrency}-\\d{4}$`);

  return pattern.test(orderNo);
}

function isUniqueOrderNoError(error) {
  return error?.code === "P2002" && String(error?.meta?.target || "").includes("orderNo");
}

function isSameBankOrder(order, expected) {
  return (
    order &&
    Number(order.userId) === Number(expected.userId) &&
    Number(order.country) === Number(expected.country) &&
    order.senderName === expected.senderName &&
    order.accountName === expected.accountName &&
    order.accountNo === expected.accountNo &&
    order.bank === expected.bank &&
    (order.branch || null) === (expected.branch || null) &&
    (order.ifscCode || null) === (expected.ifscCode || null) &&
    Number(order.depositAmount) === Number(expected.depositAmount) &&
    Number(order.rate) === Number(expected.rate) &&
    Number(order.serviceCharge) === Number(expected.serviceCharge) &&
    Number(order.totalPayableAmount) === Number(expected.totalPayableAmount) &&
    order.senderMobile === expected.senderMobile &&
    (order.notes || null) === (expected.notes || null)
  );
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
  const totalPayableAmount =
    body.totalPayableAmount !== undefined
      ? Number(body.totalPayableAmount)
      : calculateTotalPayable({
          depositAmount,
          rate,
          serviceCharge
        });

  if (!senderName || !accountName || !accountNo || !bank || !senderMobile) {
    return badRequest("Please fill all required bank order fields.");
  }

  if (![1, 2].includes(country)) {
    return badRequest("Invalid country selection.");
  }

  const currency = bankCurrencyFromCountry(country);
  const submittedOrderNo = cleanString(body.orderNo);
  const clientOrderNo = isScopedBankOrderNo(submittedOrderNo, session.user.storeCode, currency)
    ? submittedOrderNo
    : null;

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

  if (!Number.isFinite(totalPayableAmount) || totalPayableAmount < 0) {
    return badRequest("Total payable amount must be zero or greater.");
  }

  const orderData = {
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
  };
  const includeUser = {
    user: {
      select: {
        id: true,
        username: true,
        storeName: true,
        storeCode: true
      }
    }
  };

  let order = null;
  const attemptedOrderNos = new Set();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const orderNo =
      attempt === 0 && clientOrderNo
        ? clientOrderNo
        : await generateCurrencyOrderNo("B", session.user.storeCode, prisma, currency);

    if (attemptedOrderNos.has(orderNo)) {
      continue;
    }

    attemptedOrderNos.add(orderNo);

    try {
      order = await prisma.bankOrder.create({
        data: {
          orderNo,
          ...orderData
        },
        include: includeUser
      });
      break;
    } catch (error) {
      if (!isUniqueOrderNoError(error) || attempt === 3) {
        throw error;
      }

      const existingOrder = await prisma.bankOrder.findUnique({
        where: {
          orderNo
        },
        include: includeUser
      });

      if (isSameBankOrder(existingOrder, orderData)) {
        order = existingOrder;
        break;
      }
    }
  }

  if (!order) {
    throw new Error("Could not save bank order.");
  }

  return NextResponse.json(normalizeBankOrder(order), { status: 201 });
}
