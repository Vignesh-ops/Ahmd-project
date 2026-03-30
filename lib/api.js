import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { digitsOnly } from "./utils";

export async function getApiSession() {
  return getServerSession(authOptions);
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(message = "Bad request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function parseRouteId(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateSecurePassword(value) {
  const password = typeof value === "string" ? value : "";

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return "Password must include uppercase, lowercase, number, and special character.";
  }

  return "";
}

export function generateTemporaryPassword(length = 12) {
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "@#$%&*!";
  const all = `${lower}${upper}${digits}${symbols}`;
  const chars = [
    lower[randomInt(lower.length)],
    upper[randomInt(upper.length)],
    digits[randomInt(digits.length)],
    symbols[randomInt(symbols.length)]
  ];

  while (chars.length < length) {
    chars.push(all[randomInt(all.length)]);
  }

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    const current = chars[index];
    chars[index] = chars[swapIndex];
    chars[swapIndex] = current;
  }

  return chars.join("");
}

export function isValidMobile(value) {
  return digitsOnly(value).length >= 10;
}

export function isValidStatus(value) {
  return ["pending", "done", "failed"].includes(value);
}

export function toBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function guardAdminStoreAccess(sessionUser, filters = {}) {
  if (!sessionUser || sessionUser.role === "admin") {
    return null;
  }

  const wantsCrossStoreAccess = [filters.storeId, filters.storeCode].some(
    (value) => value !== undefined && value !== null && value !== "" && value !== "all"
  );

  return wantsCrossStoreAccess ? forbidden("Only admin can access all store details.") : null;
}
