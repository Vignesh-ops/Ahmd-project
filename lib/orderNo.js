function formatDateStamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export async function generateOrderNo(type, storeCode, prismaClient) {
  const safeType = type === "H" ? "H" : "B";
  const safeStoreCode = storeCode || "S0";
  const stamp = formatDateStamp();
  const prefix = `${safeType}-${safeStoreCode}-${stamp}-`;
  const model = safeType === "B" ? prismaClient.bankOrder : prismaClient.homeOrder;

  const lastOrder = await model.findFirst({
    where: {
      orderNo: {
        startsWith: prefix
      }
    },
    orderBy: {
      orderNo: "desc"
    },
    select: {
      orderNo: true
    }
  });

  const lastCounter = lastOrder?.orderNo?.split("-").pop();
  const nextCounter = (Number(lastCounter || 0) + 1).toString().padStart(4, "0");

  return `${prefix}${nextCounter}`;
}

