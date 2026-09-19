import prisma from "./prisma";
import { endOfDay, startOfDay } from "./utils";

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

const TRANSACTION_TYPE_LABELS = {
  opening: "Balance Entry",
  topup: "Top Up",
  deduct: "External Order",
  order: "Order"
};

function serializeAdjustment(transaction) {
  return {
    id: `adjustment-${transaction.id}`,
    date: transaction.createdAt,
    type: TRANSACTION_TYPE_LABELS[transaction.type] || "Adjustment",
    description: transaction.description,
    amount: transaction.amount,
    balance: transaction.balanceAfter,
    updatedBy: transaction.updatedBy?.username || "Admin"
  };
}

export function isBankOrderCounted(order) {
  return Number(order.country) === 1 && order.status !== "failed";
}

export async function getBankBalanceData({ client = prisma } = {}) {
  const balance = await client.bankBalance.upsert({
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
  });

  const manualBalance = toNumber(balance.manualBalance);

  const todayRpTotal = toNumber(
    (
      await client.bankOrder.aggregate({
        where: {
          country: 1,
          status: { not: "failed" },
          date: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) }
        },
        _sum: { depositAmount: true }
      })
    )._sum.depositAmount
  );

  const history = balance.transactions.map(serializeAdjustment).slice(0, 100);

  return {
    manualBalance,
    totalRpAmount: todayRpTotal,
    availableBalance: manualBalance,
    updatedAt: balance.updatedAt,
    history
  };
}

export async function adjustBankBalance({ amount, mode = "set", reason, userId, client = prisma }) {
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
    const previousManualBalance = toNumber(balance.manualBalance);
    const nextManualBalance =
      mode === "topup"
        ? previousManualBalance + normalizedAmount
        : mode === "deduct"
          ? previousManualBalance - normalizedAmount
          : normalizedAmount;

    await transactionClient.bankBalance.update({
      where: { id: 1 },
      data: { manualBalance: nextManualBalance }
    });

    const defaultDescriptions = {
      topup: "Balance top-up",
      deduct: "Order placed outside the app",
      set: "Manual balance correction"
    };

    return transactionClient.bankBalanceTransaction.create({
      data: {
        balanceId: 1,
        type: mode === "topup" ? "topup" : mode === "deduct" ? "deduct" : "opening",
        description: reason?.trim() || defaultDescriptions[mode] || defaultDescriptions.set,
        amount: nextManualBalance - previousManualBalance,
        balanceAfter: nextManualBalance,
        updatedById: Number(userId)
      }
    });
  });
}

/**
 * Keeps BankBalance.manualBalance as a live running ledger whenever a bank order is
 * created, edited, has its status/country changed, or is deleted. `wasCounted`/
 * `willBeCounted` reflect isBankOrderCounted() before/after the change so a single
 * call correctly handles amount edits, failed<->active status flips, and country
 * changes in or out of the Indonesia (country 1) balance tracking.
 */
export async function adjustBalanceForOrderChange({
  transactionClient,
  oldAmount = 0,
  wasCounted = false,
  newAmount = 0,
  willBeCounted = false,
  userId,
  description
}) {
  const creditBack = wasCounted ? toNumber(oldAmount) : 0;
  const newDebit = willBeCounted ? toNumber(newAmount) : 0;
  const netChange = creditBack - newDebit;

  if (netChange === 0) {
    return null;
  }

  const balance = await transactionClient.bankBalance.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, manualBalance: 0 }
  });
  const previousManualBalance = toNumber(balance.manualBalance);

  if (netChange < 0 && previousManualBalance + netChange < 0) {
    throw new Error("Insufficient bank balance. Please contact admin.");
  }

  const nextManualBalance = previousManualBalance + netChange;

  await transactionClient.bankBalance.update({
    where: { id: 1 },
    data: { manualBalance: nextManualBalance }
  });

  return transactionClient.bankBalanceTransaction.create({
    data: {
      balanceId: 1,
      type: "order",
      description,
      amount: netChange,
      balanceAfter: nextManualBalance,
      updatedById: Number(userId)
    }
  });
}
