import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { forbidden, generateTemporaryPassword, getApiSession, unauthorized } from "@/lib/api";

export async function POST() {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  if (session.user.role !== "admin") {
    return forbidden();
  }

  const user = await prisma.user.findUnique({
    where: {
      id: Number(session.user.id)
    },
    select: {
      id: true,
      username: true,
      role: true,
      storeName: true,
      storeCode: true
    }
  });

  if (!user || user.role !== "admin") {
    return forbidden();
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
    user,
    temporaryPassword
  });
}
