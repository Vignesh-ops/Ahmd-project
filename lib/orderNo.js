export async function generateOrderNo(type, storeCode, prismaClient) {
  const safeType = type === "H" ? "H" : "B";
  const safeStoreCode = storeCode || "S0";
  const prefix = `${safeType}-${safeStoreCode}-`;
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
