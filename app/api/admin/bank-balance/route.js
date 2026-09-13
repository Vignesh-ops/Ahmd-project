import { NextResponse } from "next/server";
import { adjustBankBalance, getBankBalanceData } from "@/lib/bankBalance";
import { badRequest, forbidden, getApiSession, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function requireAdmin() {
  const session = await getApiSession();
  if (!session?.user) return { response: unauthorized() };
  if (session.user.role !== "admin") return { response: forbidden() };
  return { session };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  return NextResponse.json(await getBankBalanceData(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    await adjustBankBalance({ ...body, userId: auth.session.user.id });
    return NextResponse.json(await getBankBalanceData(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return badRequest(error.message || "Unable to adjust bank balance.");
  }
}
