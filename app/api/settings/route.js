import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { badRequest, forbidden, getApiSession, unauthorized } from "@/lib/api";
import { getGlobalSettings, updateGlobalSettings } from "@/lib/settings";

export async function GET() {
  const session = await getApiSession();

  if (!session?.user) {
    return unauthorized();
  }

  const settings = await getGlobalSettings();

  return NextResponse.json(settings);
}

export async function PUT(request) {
  try {
    const session = await getApiSession();

    if (!session?.user) {
      return unauthorized();
    }

    if (session.user.role !== "admin") {
      return forbidden("Only admin users can update settings.");
    }

    const body = await request.json();
    const rate1 = Number(body.rate1);
    const rate2 = Number(body.rate2);
    const service1 = Number(body.service1);
    const service2 = Number(body.service2);

    if (![rate1, rate2, service1, service2].every((value) => Number.isFinite(value) && value >= 0)) {
      return badRequest("Rate and service charge values must be valid numbers.");
    }

    const settings = await updateGlobalSettings({
      rate1,
      rate2,
      service1,
      service2
    });

    revalidatePath("/settings");
    revalidatePath("/bank-order");

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update global settings:", error);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
