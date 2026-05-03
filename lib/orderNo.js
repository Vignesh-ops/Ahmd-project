export async function generateOrderNo(type, storeCode, prismaClient) {
  const safeType = type === "H" ? "H" : "B";
  const safeStoreCode = storeCode || "S0";
  const prefix = `${safeType}-${safeStoreCode}-`;
  const model = safeType === "B" ? prismaClient.bankOrder : prismaClient.homeOrder;

  const orders = await model.findMany({
    where: {
      orderNo: {
        startsWith: prefix
      }
    },
    select: {
      orderNo: true
    }
  });

  const lastCounter = orders.reduce((max, order) => {
    const counter = Number(order.orderNo?.split("-").pop() || 0);
    return Number.isFinite(counter) && counter > max ? counter : max;
  }, 0);
  const nextCounter = (lastCounter + 1).toString().padStart(4, "0");

  return `${prefix}${nextCounter}`;
}
