import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { forbidden, generateTemporaryPassword, getApiSession, unauthorized } from "@/lib/api";

export async function POST() {
  try {
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
      }
    });

    // ...existing code...
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}