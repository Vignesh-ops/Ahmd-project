import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    if (token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/bank-order/:path*",
    "/history/:path*",
    "/receipt/:path*",
    "/settings/:path*",
    "/admin/:path*"
  ]
};
