import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  badRequest,
  cleanString,
  forbidden,
  getApiSession,
  validateSecurePassword,
  unauthorized
} from "@/lib/api";

const safeUserSelect = {
  id: true,
  username: true,
  role: true,
  storeName: true,
  storeCode: true,
  isActive: true,
  createdAt: true,
  settings: {
    select: {
      rate1: true,
      rate2: true,
      service1: true,
      service2: true
    }
  }
};

function toStorePayload(body) {
  return {
    username: cleanString(body.username),
    password: cleanString(body.password),
    storeName: cleanString(body.storeName),
    storeCode: cleanString(body.storeCode).toUpperCase()
  };
}

export async function GET() {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  if (session.user.role !== "admin") {
    return forbidden();
  }

  const users = await prisma.user.findMany({
    where: {
      role: "store"
    },
    select: safeUserSelect,
    orderBy: {
      createdAt: "asc"
    }
  });

  return NextResponse.json(users);
}

export async function POST(request) {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  if (session.user.role !== "admin") {
    return forbidden();
  }

  const body = await request.json();
  const payload = toStorePayload(body);

  if (!payload.username || !payload.password || !payload.storeName || !payload.storeCode) {
    return badRequest("Username, password, store name, and store code are required.");
  }

  const passwordError = validateSecurePassword(payload.password);

  if (passwordError) {
    return badRequest(passwordError);
  }

  const existing = await prisma.user.findUnique({
    where: {
      username: payload.username
    }
  });

  if (existing) {
    return badRequest("Username already exists.");
  }

  const existingStoreCode = await prisma.user.findFirst({
    where: {
      storeCode: payload.storeCode
    },
    select: {
      id: true
    }
  });

  if (existingStoreCode) {
    return badRequest("Store code already exists.");
  }

  const password = await bcrypt.hash(payload.password, 10);
  const user = await prisma.user.create({
    data: {
      username: payload.username,
      password,
      role: "store",
      storeName: payload.storeName,
      storeCode: payload.storeCode,
      isActive: true,
      settings: {
        create: {
          rate1: 195,
          rate2: 198,
          service1: 2,
          service2: 3
        }
      }
    },
    select: safeUserSelect
  });

  return NextResponse.json(user, { status: 201 });
}
