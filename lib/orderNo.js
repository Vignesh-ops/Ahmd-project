function formatOrderDateKey(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

export async function generateOrderNo(type, storeCode, prismaClient, date = new Date()) {
  return generateCurrencyOrderNo(type, storeCode, prismaClient, "IDR", date);
}

export async function generateCurrencyOrderNo(type, storeCode, prismaClient, currency = "IDR", date = new Date()) {
  const safeType = type === "H" ? "H" : "B";
  const safeStoreCode = storeCode || "S0";
  const safeCurrency = String(currency).toLowerCase() === "inr" ? "inr" : "idr";
  const prefix = `${safeType}-${safeStoreCode}-${formatOrderDateKey(date)}-${safeCurrency}-`;
  const rows =
    safeType === "B"
      ? await prismaClient.$queryRaw`
          SELECT COALESCE(MAX((regexp_match("orderNo", '([0-9]+)$'))[1]::int), 0) AS "lastCounter"
          FROM "BankOrder"
          WHERE "orderNo" LIKE ${`${prefix}%`}
        `
      : await prismaClient.$queryRaw`
          SELECT COALESCE(MAX((regexp_match("orderNo", '([0-9]+)$'))[1]::int), 0) AS "lastCounter"
          FROM "HomeOrder"
          WHERE "orderNo" LIKE ${`${prefix}%`}
        `;

  const lastCounter = Number(rows?.[0]?.lastCounter || 0);
  const nextCounter = (lastCounter + 1).toString().padStart(4, "0");

  return `${prefix}${nextCounter}`;
}
