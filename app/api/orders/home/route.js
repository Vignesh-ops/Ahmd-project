import { NextResponse } from "next/server";

export async function GET(request) {
  return NextResponse.json({ error: "Home order feature has been removed." }, { status: 410 });
}

export async function POST(request) {
  return NextResponse.json({ error: "Home order feature has been removed." }, { status: 410 });
}
