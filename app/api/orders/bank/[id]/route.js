import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeBankOrder } from "@/lib/orders";
import {
  badRequest,
  cleanString,
  forbidden,
  getApiSession,
  isValidMobile,
  isValidStatus,
  parseRouteId,
  unauthorized
} from "@/lib/api";
import { calculateTotalPayable, digitsOnly } from "@/lib/utils";

async function getScopedBankOrder(id, sessionUser) {
  const where =
    sessionUser.role === "admin"
      ? { id }
      : {
          id,
          userId: Number(sessionUser.id)
        };

  return prisma.bankOrder.findFirst({
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
    }
  });
}

export async function GET(request, { params }) {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  const id = parseRouteId(params.id);

  if (!id) {
    return badRequest("Invalid bank order id.");
  }

  const order = await getScopedBankOrder(id, session.user);

  if (!order) {
    return forbidden("Bank order not found.");
  }

  return NextResponse.json(normalizeBankOrder(order));
}

export async function PUT(request, { params }) {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  const id = parseRouteId(params.id);

  if (!id) {
    return badRequest("Invalid bank order id.");
  }

  const existing = await getScopedBankOrder(id, session.user);

  if (!existing) {
    return forbidden("Bank order not found.");
  }

  const body = await request.json();
  const updates = {};

  if (body.senderName !== undefined) {
    const senderName = cleanString(body.senderName);

    if (!senderName) {
      return badRequest("Sender name is required.");
    }

    updates.senderName = senderName;
  }

  if (body.accountName !== undefined) {
    updates.accountName = cleanString(body.accountName);
  }

  if (body.accountNo !== undefined) {
    updates.accountNo = cleanString(body.accountNo);
  }

  if (body.bank !== undefined) {
    updates.bank = cleanString(body.bank);
  }

  if (body.branch !== undefined) {
    updates.branch = cleanString(body.branch) || null;
  }

  if (body.ifscCode !== undefined) {
    updates.ifscCode = cleanString(body.ifscCode) || null;
  }

  if (body.senderMobile !== undefined) {
    const senderMobile = digitsOnly(cleanString(body.senderMobile));

    if (!isValidMobile(senderMobile)) {
      return badRequest("Sender mobile must be at least 10 digits.");
    }

    updates.senderMobile = senderMobile;
  }

  if (body.notes !== undefined) {
    updates.notes = cleanString(body.notes) || null;
  }

  if (body.country !== undefined) {
    const country = Number(body.country);

    if (![1, 2].includes(country)) {
      return badRequest("Invalid country selection.");
    }

    updates.country = country;
  }

  if (body.depositAmount !== undefined) {
    const depositAmount = Number(body.depositAmount);

    if (depositAmount <= 0) {
      return badRequest("Deposit amount must be greater than zero.");
    }

    updates.depositAmount = depositAmount;
  }

  if (body.rate !== undefined) {
    const rate = Number(body.rate);

    if (!Number.isFinite(rate) || rate <= 0) {
      return badRequest("Rate must be greater than zero.");
    }

    updates.rate = rate;
  }

  if (body.serviceCharge !== undefined) {
    const serviceCharge = Number(body.serviceCharge);

    if (!Number.isFinite(serviceCharge) || serviceCharge < 0) {
      return badRequest("Service charge must be zero or greater.");
    }

    updates.serviceCharge = serviceCharge;
  }

  if (body.status !== undefined) {
    const status = cleanString(body.status);

    if (!isValidStatus(status)) {
      return badRequest("Invalid order status.");
    }

    updates.status = status;
  }

  if (updates.depositAmount !== undefined || updates.rate !== undefined || updates.serviceCharge !== undefined) {
    updates.totalPayableAmount = calculateTotalPayable({
      depositAmount: updates.depositAmount ?? existing.depositAmount,
      rate: updates.rate ?? existing.rate,
      serviceCharge: updates.serviceCharge ?? existing.serviceCharge
    });
  }

  const order = await prisma.bankOrder.update({
    where: { id },
    data: updates,
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

  return NextResponse.json(normalizeBankOrder(order));
}

export async function DELETE(request, { params }) {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  const id = parseRouteId(params.id);

  if (!id) {
    return badRequest("Invalid bank order id.");
  }

  const existing = await getScopedBankOrder(id, session.user);

  if (!existing) {
    return forbidden("Bank order not found.");
  }

  await prisma.bankOrder.delete({
    where: { id }
  });

  return NextResponse.json({ success: true });
}
