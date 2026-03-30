import prisma from "./prisma";
import { calculateTotalPayable, endOfDay, startOfDay } from "./utils";

function buildDateWhere(filters = {}) {
  if (filters.today) {
    return {
      date: {
        gte: startOfDay(new Date()),
        lte: endOfDay(new Date())
      }
    };
  }

  const range = {};

  if (filters.from) {
    range.gte = startOfDay(new Date(filters.from));
  }

  if (filters.to) {
    range.lte = endOfDay(new Date(filters.to));
  }

  return Object.keys(range).length ? { date: range } : {};
}

function buildScope(sessionUser, filters = {}) {
  if (sessionUser.role !== "admin") {
    return {
      userId: Number(sessionUser.id)
    };
  }

  if (filters.storeId) {
    return {
      userId: Number(filters.storeId)
    };
  }

  if (filters.storeCode && filters.storeCode !== "all") {
    return {
      user: {
        storeCode: filters.storeCode
      }
    };
  }

  return {};
}

function buildCommonWhere(sessionUser, filters = {}) {
  const where = {
    ...buildDateWhere(filters),
    ...buildScope(sessionUser, filters)
  };

  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters.orderNo) {
    where.orderNo = filters.orderNo;
  }

  return where;
}

function buildBankWhere(sessionUser, filters = {}) {
  return buildCommonWhere(sessionUser, filters);
}

export function normalizeBankOrder(order) {
  const totalPayableAmount =
    Number(order.totalPayableAmount || 0) ||
    calculateTotalPayable({
      depositAmount: order.depositAmount,
      rate: order.rate,
      serviceCharge: order.serviceCharge
    });

  return {
    id: order.id,
    type: "bank",
    typeLabel: "Bank Transfer",
    orderNo: order.orderNo,
    userId: order.userId,
    storeName: order.user?.storeName || "Store",
    storeCode: order.user?.storeCode || "",
    username: order.user?.username || "",
    country: order.country,
    currency: order.country === 2 ? "INR" : "IDR",
    date: order.date,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    status: order.status,
    senderName: order.senderName,
    amount: order.depositAmount,
    depositAmount: order.depositAmount,
    rate: order.rate,
    serviceCharge: order.serviceCharge,
    totalPayableAmount,
    accountName: order.accountName,
    accountNo: order.accountNo,
    bank: order.bank,
    branch: order.branch,
    ifscCode: order.ifscCode,
    senderMobile: order.senderMobile,
    notes: order.notes,
    customerName: order.senderName || order.accountName,
    bankOrAddress: [order.accountName, order.bank, order.branch, order.ifscCode].filter(Boolean).join(" · ")
  };
}

export async function getCombinedOrders({ sessionUser, filters = {}, client = prisma }) {
  if (filters.type === "home") {
    return [];
  }

  const include = {
    user: {
      select: {
        id: true,
        username: true,
        storeName: true,
        storeCode: true
      }
    }
  };

  const bankOrders = await client.bankOrder.findMany({
    where: buildBankWhere(sessionUser, filters),
    include,
    orderBy: {
      date: "desc"
    }
  });

  const combined = bankOrders
    .map(normalizeBankOrder)
    .sort((left, right) => new Date(right.date) - new Date(left.date));

  const limit = Number(filters.limit || 0);
  return limit > 0 ? combined.slice(0, limit) : combined;
}

export async function getOrderByOrderNo(orderNo, sessionUser, client = prisma) {
  if (!orderNo) {
    return null;
  }

  const scope = buildScope(sessionUser, {});
  const include = {
    user: {
      select: {
        id: true,
        username: true,
        storeName: true,
        storeCode: true
      }
    }
  };

  if (orderNo.startsWith("B-")) {
    const order = await client.bankOrder.findFirst({
      where: {
        orderNo,
        ...scope
      },
      include
    });

    return order ? normalizeBankOrder(order) : null;
  }

  return null;
}

export function summarizeOrders(orders = []) {
  const bankOrders = orders.filter((order) => order.type === "bank");
  const totalIDR = bankOrders
    .filter((order) => order.currency === "IDR")
    .reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const totalINR = bankOrders
    .filter((order) => order.currency === "INR")
    .reduce((sum, order) => sum + Number(order.amount || 0), 0);

  return {
    totalOrders: orders.length,
    bankOrders: bankOrders.length,
    totalIDR,
    totalINR
  };
}
