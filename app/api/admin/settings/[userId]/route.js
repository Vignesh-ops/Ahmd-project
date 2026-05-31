import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { badRequest, forbidden, getApiSession, parseRouteId, unauthorized } from "@/lib/api";
import { getUserSettings, updateUserSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getStoreUser(userId) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "store"
    },
    select: {
      id: true,
      username: true,
      storeName: true,
      storeCode: true
    }
  });
}

function parseSettings(body) {
  const rate1 = Number(body.rate1);
  const rate2 = Number(body.rate2);
  const service1 = Number(body.service1);
  const service2 = Number(body.service2);
  const values = [rate1, rate2, service1, service2];

  if (!values.every((value) => Number.isFinite(value) && value >= 0)) {
    return null;
  }

  return {
    rate1,
    rate2,
    service1,
    service2
  };
}

export async function GET(request, { params }) {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  if (session.user.role !== "admin") {
    return forbidden();
  }

  const resolvedParams = await params;
  const userId = parseRouteId(resolvedParams.userId);

  if (!userId) {
    return badRequest("Invalid store user id.");
  }

  const user = await getStoreUser(userId);

  if (!user) {
    return forbidden("Store user not found.");
  }

  const settings = await getUserSettings(userId);

  return NextResponse.json(
    {
      user,
      settings
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function PUT(request, { params }) {
  try {
    const session = await getApiSession();

    if (!session?.user) {
      return unauthorized();
    }

    if (session.user.role !== "admin") {
      return forbidden();
    }

    const resolvedParams = await params;
    const userId = parseRouteId(resolvedParams.userId);

    if (!userId) {
      return badRequest("Invalid store user id.");
    }

    const user = await getStoreUser(userId);

    if (!user) {
      return forbidden("Store user not found.");
    }

    const body = await request.json();
    const data = parseSettings(body);

    if (!data) {
      return badRequest("Rate and service charge values must be valid numbers.");
    }

    const settings = await updateUserSettings(userId, data);

    revalidatePath("/admin/settings");
    revalidatePath("/bank-order");
    revalidatePath("/settings");

    return NextResponse.json(
      {
        user,
        settings
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("Failed to update admin store settings:", error);
    return NextResponse.json({ error: "Failed to save store settings." }, { status: 500 });
  }
}
