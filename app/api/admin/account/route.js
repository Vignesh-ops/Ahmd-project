import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  badRequest,
  cleanString,
  forbidden,
  getApiSession,
  unauthorized,
  validateSecurePassword
} from "@/lib/api";

export async function GET() {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  if (session.user.role !== "admin") {
    return forbidden();
  }

  const adminUser = await prisma.user.findUnique({
    where: {
      id: Number(session.user.id)
    },
    select: {
      id: true,
      username: true,
      storeName: true,
      storeCode: true,
      role: true
    }
  });

  if (!adminUser || adminUser.role !== "admin") {
    return forbidden();
  }

  return NextResponse.json(adminUser);
}

export async function PUT(request) {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  if (session.user.role !== "admin") {
    return forbidden();
  }

  const body = await request.json();
  const username = cleanString(body.username);
  const currentPassword = cleanString(body.currentPassword);
  const newPassword = cleanString(body.newPassword);

  if (!currentPassword) {
    return badRequest("Current password is required.");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: Number(session.user.id)
    }
  });

  if (!user || user.role !== "admin") {
    return forbidden();
  }

  const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);

  if (!isValidCurrentPassword) {
    return badRequest("Current admin password is incorrect.");
  }

  const data = {};

  if (!username) {
    return badRequest("Admin username is required.");
  }

  if (username !== user.username) {
    const usernameTaken = await prisma.user.findUnique({
      where: {
        username
      }
    });

    if (usernameTaken) {
      return badRequest("Username already exists.");
    }

    data.username = username;
  }

  if (newPassword) {
    const passwordError = validateSecurePassword(newPassword);

    if (passwordError) {
      return badRequest(passwordError);
    }

    data.password = await bcrypt.hash(newPassword, 10);
  }

  if (!Object.keys(data).length) {
    return badRequest("Change the username or enter a new secure password.");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id
    },
    data,
    select: {
      id: true,
      username: true,
      storeName: true,
      storeCode: true,
      role: true
    }
  });

  return NextResponse.json({
    success: true,
    user: updatedUser
  });
}
