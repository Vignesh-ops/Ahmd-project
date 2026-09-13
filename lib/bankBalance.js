import prisma from "./prisma";
import { endOfDay, startOfDay } from "./utils";

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function serializeAdjustment(transaction) {
  return {
    id: `adjustment-${transaction.id}`,
    date: transaction.createdAt,
    type: "Adjustment",
    description: transaction.description,
    amount: transaction.amount,
    balance: transaction.balanceAfter,
    updatedBy: transaction.updatedBy?.username || "Admin"
  };
}

export async function getBankBalanceData({ client = prisma } = {}) {
  const [balance, rpOrders] = await Promise.all([
    client.bankBalance.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, manualBalance: 0 },
      include: {
        transactions: {
          include: { updatedBy: { select: { username: true } } },
          orderBy: { createdAt: "desc" },
          take: 100
        }
      }
    }),
    client.bankOrder.findMany({
      where: { country: 1, date: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) } },
      select: { date: true, depositAmount: true, rate: true, serviceCharge: true, totalPayableAmount: true },
      orderBy: { date: "desc" }
    })
  ]);

  const totalRpAmount = rpOrders.reduce((sum, order) => sum + toNumber(order.depositAmount), 0);
  const manualBalance = toNumber(balance.manualBalance);

  const rpTransactions = totalRpAmount > 0 ? [{
    id: `rp-${startOfDay(new Date()).toISOString()}`,
    date: new Date(),
    type: "RP Amount",
    description: "Today’s Indonesia RP orders",
    amount: -totalRpAmount,
    balance: manualBalance - totalRpAmount,
    updatedBy: "System"
  }] : [];

  const history = [...balance.transactions.map(serializeAdjustment), ...rpTransactions]
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 100);

  return {
    manualBalance,
    totalRpAmount,
    availableBalance: manualBalance - totalRpAmount,
    updatedAt: balance.updatedAt,
    history
  };
}

export async function adjustBankBalance({ amount, reason, userId, client = prisma }) {
  const normalizedAmount = toNumber(amount);
  if (normalizedAmount < 0) {
    throw new Error("Today's bank balance is required.");
  }

  return client.$transaction(async (transactionClient) => {
    const balance = await transactionClient.bankBalance.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, manualBalance: 0 }
    });
    const nextManualBalance = normalizedAmount;
    const rpTotal = await transactionClient.bankOrder.aggregate({
      where: { country: 1 },
      _sum: { depositAmount: true }
    });

    await transactionClient.bankBalance.update({
      where: { id: 1 },
      data: { manualBalance: nextManualBalance }
    });

    return transactionClient.bankBalanceTransaction.create({
      data: {
        balanceId: 1,
        type: "opening",
        description: reason?.trim() || "Daily bank balance entry",
        amount: nextManualBalance - toNumber(balance.manualBalance),
        balanceAfter: nextManualBalance - toNumber(rpTotal._sum.depositAmount),
        updatedById: Number(userId)
      }
    });
  });
}
