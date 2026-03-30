import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  return NextResponse.json({ error: "Home order feature has been removed." }, { status: 410 });
}

export async function PUT(request, { params }) {
  return NextResponse.json({ error: "Home order feature has been removed." }, { status: 410 });
}

export async function DELETE(request, { params }) {
  return NextResponse.json({ error: "Home order feature has been removed." }, { status: 410 });
}
