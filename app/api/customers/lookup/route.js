import { NextResponse } from "next/server";
import { createHash } from "crypto";
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

const bankOrderLookupSelect = {
  orderNo: true,
  date: true,
  country: true,
  senderName: true,
  accountName: true,
  accountNo: true,
  bank: true,
  branch: true,
  ifscCode: true,
  user: {
    select: userSelect
  }
};

function buildBankSuggestionSignature(data) {
  const parts = [
    Number(data?.country || 1),
    cleanString(data?.accountName).toLowerCase(),
    cleanString(data?.accountNo),
    cleanString(data?.bank).toLowerCase(),
    cleanString(data?.branch).toLowerCase(),
    cleanString(data?.ifscCode).toLowerCase()
  ];

  return createHash("sha256").update(parts.join("|")).digest("hex");
}

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
    where: {
      ...scope,
      senderMobile: mobileDigits
    },
    select: bankOrderLookupSelect,
    orderBy: {
      date: "desc"
    },
    take: 100
  });

  if (!recentOrders.length) {
    return NextResponse.json({ found: false, mobile });
  }

  const matches = [];
  const seenAccounts = new Set();
  const deletedSuggestions = await prisma.customerAutofillExclusion.findMany({
    where: {
      userId: Number(session.user.id),
      type,
      mobile: mobileDigits
    },
    select: {
      signature: true
    }
  });
  const deletedSignatures = new Set(deletedSuggestions.map((item) => item.signature));

  recentOrders.forEach((order) => {
    const signature = buildBankSuggestionSignature(order);

    if (seenAccounts.has(signature) || deletedSignatures.has(signature)) {
      return;
    }

    seenAccounts.add(signature);
    matches.push({
      orderNo: order.orderNo,
      date: order.date,
      storeName: order.user?.storeName || "",
      storeCode: order.user?.storeCode || "",
      signature,
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
  });

  const latestMatch = matches[0];

  if (!latestMatch) {
    return NextResponse.json({ found: false, mobile });
  }

  return NextResponse.json({
    found: true,
    type,
    orderNo: latestMatch.orderNo,
    date: latestMatch.date,
    storeName: latestMatch.storeName,
    storeCode: latestMatch.storeCode,
    data: latestMatch.data,
    matches
  });
}

export async function DELETE(request) {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const type = cleanString(body.type).toLowerCase() || "bank";
  const mobileDigits = digitsOnly(cleanString(body.mobile));

  if (type !== "bank") {
    return badRequest("Only bank customer lookup is available.");
  }

  if (!isValidMobile(mobileDigits)) {
    return badRequest("A valid customer mobile number is required.");
  }

  const submittedSignature = cleanString(body.signature);
  const signature = submittedSignature || (body.data ? buildBankSuggestionSignature(body.data) : "");

  if (!signature) {
    return badRequest("A saved customer suggestion is required.");
  }

  await prisma.customerAutofillExclusion.upsert({
    where: {
      userId_type_mobile_signature: {
        userId: Number(session.user.id),
        type,
        mobile: mobileDigits,
        signature
      }
    },
    create: {
      userId: Number(session.user.id),
      type,
      mobile: mobileDigits,
      signature
    },
    update: {}
  });

  return NextResponse.json({ ok: true, mobile: mobileDigits, signature });
}
