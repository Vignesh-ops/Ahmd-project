import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { badRequest, getApiSession, unauthorized } from "@/lib/api";

export async function GET() {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  const settings = await prisma.settings.upsert({
    where: {
      userId: Number(session.user.id)
    },
    update: {},
    create: {
      userId: Number(session.user.id)
    }
  });

  return NextResponse.json(settings);
}

export async function PUT(request) {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  const body = await request.json();
  const rate1 = Number(body.rate1);
  const rate2 = Number(body.rate2);
  const service1 = Number(body.service1);
  const service2 = Number(body.service2);

  if (![rate1, rate2, service1, service2].every((value) => Number.isFinite(value) && value >= 0)) {
    return badRequest("Rate and service charge values must be valid numbers.");
  }

  const settings = await prisma.settings.upsert({
    where: {
      userId: Number(session.user.id)
    },
    update: {
      rate1,
      rate2,
      service1,
      service2
    },
    create: {
      userId: Number(session.user.id),
      rate1,
      rate2,
      service1,
      service2
    }
  });

  revalidatePath("/settings");
  revalidatePath("/bank-order");

  return NextResponse.json(settings);
}
