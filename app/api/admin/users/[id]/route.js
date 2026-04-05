import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  badRequest,
  cleanString,
  forbidden,
  getApiSession,
  parseRouteId,
  toBoolean,
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
  createdAt: true
};

async function requireAdminSession() {
  const session = await getApiSession();

  if (!session?.user) {
    return { error: unauthorized() };
  }

  if (session.user.role !== "admin") {
    return { error: forbidden() };
  }

  return { session };
}

export async function PUT(request, { params }) {
  const { error } = await requireAdminSession();

  if (error) {
    return error;
  }

  const id = parseRouteId(params.id);

  if (!id) {
    return badRequest("Invalid user id.");
  }

  const existing = await prisma.user.findUnique({
    where: { id }
  });

  if (!existing) {
    return badRequest("User not found.");
  }

  if (existing.role === "admin") {
    return forbidden("Admin account cannot be edited here.");
  }

  const body = await request.json();
  const nextStoreName =
    body.storeName !== undefined ? cleanString(body.storeName) : existing.storeName;
  const nextStoreCode =
    body.storeCode !== undefined
      ? cleanString(body.storeCode).toUpperCase()
      : existing.storeCode;

  if (!nextStoreName || !nextStoreCode) {
    return badRequest("Store name and store code are required.");
  }

  const data = {
    storeName: nextStoreName,
    storeCode: nextStoreCode,
    isActive: body.isActive !== undefined ? toBoolean(body.isActive) : existing.isActive
  };

  if (body.username !== undefined) {
    const username = cleanString(body.username);

    if (!username) {
      return badRequest("Username is required.");
    }

    if (username && username !== existing.username) {
      const usernameTaken = await prisma.user.findUnique({
        where: {
          username
        }
      });

      if (usernameTaken) {
        return badRequest("Username already exists.");
      }
    }

    data.username = username;
  }

  if (data.storeCode !== existing.storeCode) {
    const storeCodeTaken = await prisma.user.findFirst({
      where: {
        storeCode: data.storeCode,
        NOT: {
          id
        }
      },
      select: {
        id: true
      }
    });

    if (storeCodeTaken) {
      return badRequest("Store code already exists.");
    }
  }

  if (body.password) {
    const password = cleanString(body.password);
    const passwordError = validateSecurePassword(password);

    if (passwordError) {
      return badRequest(passwordError);
    }

    data.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: safeUserSelect
  });

  return NextResponse.json(user);
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdminSession();

  if (error) {
    return error;
  }

  const id = parseRouteId(params.id);

  if (!id) {
    return badRequest("Invalid user id.");
  }

  const existing = await prisma.user.findUnique({
    where: { id }
  });

  if (!existing) {
    return badRequest("User not found.");
  }

  if (existing.role === "admin") {
    return forbidden("Admin account cannot be deleted.");
  }

  const [bankOrderCount, homeOrderCount] = await Promise.all([
    prisma.bankOrder.count({
      where: { userId: id }
    }),
    prisma.homeOrder.count({
      where: { userId: id }
    })
  ]);

  const totalOrderCount = bankOrderCount + homeOrderCount;

  if (totalOrderCount > 0) {
    return badRequest(
      `Cannot delete this store user because ${totalOrderCount} order${totalOrderCount === 1 ? "" : "s"} still belong to this account. Delete or reassign those orders first, or mark the user inactive instead.`
    );
  }

  await prisma.user.delete({
    where: { id }
  });

  return NextResponse.json({ success: true });
}
