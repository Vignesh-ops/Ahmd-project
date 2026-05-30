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
  const safeCurrency = String(currency).toUpperCase() === "INR" ? "INR" : "IDR";
  const prefix = `${safeType}-${safeStoreCode}-${formatOrderDateKey(date)}-${safeCurrency}-`;
  const upperBound = `${prefix.slice(0, -1)}${String.fromCharCode(prefix.charCodeAt(prefix.length - 1) + 1)}`;

  // The orderNo unique index can satisfy this range/order lookup quickly.
  // It avoids casting every matching order number just to find today's latest suffix.
  const rows =
    safeType === "B"
      ? await prismaClient.$queryRaw`
          SELECT "orderNo"
          FROM "BankOrder"
          WHERE "orderNo" >= ${prefix}
            AND "orderNo" < ${upperBound}
          ORDER BY "orderNo" DESC
          LIMIT 1
        `
      : await prismaClient.$queryRaw`
          SELECT "orderNo"
          FROM "HomeOrder"
          WHERE "orderNo" >= ${prefix}
            AND "orderNo" < ${upperBound}
          ORDER BY "orderNo" DESC
          LIMIT 1
        `;

  const latestOrderNo = rows?.[0]?.orderNo || "";
  const lastCounter = Number(latestOrderNo.slice(-4) || 0);
  const nextCounter = (lastCounter + 1).toString().padStart(4, "0");

  return `${prefix}${nextCounter}`;
}
