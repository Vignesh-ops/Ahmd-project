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

  const limit = Number(filters.limit || 0);
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
    },
    ...(limit > 0 ? { take: limit } : {})
  });

  return bankOrders.map(normalizeBankOrder);
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

export async function getOrderSummary({ sessionUser, filters = {}, client = prisma }) {
  const where = buildBankWhere(sessionUser, filters);
  const [totalOrders, idrTotal, inrTotal] = await Promise.all([
    client.bankOrder.count({ where }),
    client.bankOrder.aggregate({
      where: {
        ...where,
        country: 1
      },
      _sum: {
        depositAmount: true
      }
    }),
    client.bankOrder.aggregate({
      where: {
        ...where,
        country: 2
      },
      _sum: {
        depositAmount: true
      }
    })
  ]);

  return {
    totalOrders,
    bankOrders: totalOrders,
    totalIDR: Number(idrTotal._sum.depositAmount || 0),
    totalINR: Number(inrTotal._sum.depositAmount || 0)
  };
}

export async function getStoreOrderSummary({ filters = {}, client = prisma }) {
  const where = buildBankWhere({ role: "admin" }, filters);
  const groupedOrders = await client.bankOrder.groupBy({
    by: ["userId", "country"],
    where,
    _count: {
      _all: true
    },
    _sum: {
      depositAmount: true
    }
  });

  return groupedOrders.reduce(
    (summary, item) => {
      const key = String(item.userId);

      if (!summary.byStore[key]) {
        summary.byStore[key] = {
          count: 0,
          totalIDR: 0,
          totalINR: 0
        };
      }

      summary.totalOrders += item._count._all;
      summary.byStore[key].count += item._count._all;

      if (item.country === 1) {
        summary.byStore[key].totalIDR += Number(item._sum.depositAmount || 0);
      } else if (item.country === 2) {
        summary.byStore[key].totalINR += Number(item._sum.depositAmount || 0);
      }

      return summary;
    },
    {
      totalOrders: 0,
      byStore: {}
    }
  );
}
