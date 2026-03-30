import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { badRequest, forbidden, generateTemporaryPassword, getApiSession, parseRouteId, unauthorized } from "@/lib/api";

export async function POST(request, { params }) {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  if (session.user.role !== "admin") {
    return forbidden();
  }

  const id = parseRouteId(params.id);

  if (!id) {
    return badRequest("Invalid user id.");
  }

  const user = await prisma.user.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      username: true,
      role: true,
      storeName: true,
      storeCode: true,
      isActive: true
    }
  });

  if (!user) {
    return badRequest("User not found.");
  }

  if (user.role === "admin") {
    return forbidden("Admin account cannot be reset here.");
  }

  const temporaryPassword = generateTemporaryPassword();
  const password = await bcrypt.hash(temporaryPassword, 10);

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      password
    }
  });

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      storeName: user.storeName,
      storeCode: user.storeCode
    },
    temporaryPassword
  });
}
