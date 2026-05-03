import prisma from "./prisma";
import { calculateProfitMYR, calculateTotalPayable, endOfDay, startOfDay } from "./utils";

const DEFAULT_HISTORY_PAGE_SIZE = 25;

function parsePositiveInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

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

export function bankCurrencyFromCountry(country) {
  return Number(country) === 2 ? "INR" : "IDR";
}

function bankCurrencyFromOrder(order) {
  const orderCurrency = String(order.orderNo || "")
    .split("-")
    .find((part) => ["idr", "inr"].includes(part.toLowerCase()));

  return orderCurrency ? orderCurrency.toUpperCase() : bankCurrencyFromCountry(order.country);
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
    currency: bankCurrencyFromOrder(order),
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

export async function getCombinedOrdersPage({
  sessionUser,
  filters = {},
  page = 1,
  pageSize = DEFAULT_HISTORY_PAGE_SIZE,
  client = prisma
}) {
  if (filters.type === "home") {
    return {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize,
      hasMore: false,
      summary: {
        totalOrders: 0,
        bankOrders: 0,
        totalIDR: 0,
        totalINR: 0,
        totalPayableMYR: 0,
        totalPayableIDRMYR: 0,
        totalPayableINRMYR: 0,
        profitIDR: 0,
        profitINR: 0,
        profitIDRMYR: 0,
        profitINRMYR: 0,
        totalProfitMYR: 0
      }
    };
  }

  const where = buildBankWhere(sessionUser, filters);
  const resolvedPage = parsePositiveInteger(page, 1);
  const resolvedPageSize = parsePositiveInteger(pageSize, DEFAULT_HISTORY_PAGE_SIZE);
  const skip = (resolvedPage - 1) * resolvedPageSize;
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

  const [totalCount, summary, bankOrders] = await Promise.all([
    client.bankOrder.count({ where }),
    getOrderSummary({ sessionUser, filters, client }),
    client.bankOrder.findMany({
      where,
      include,
      orderBy: [
        {
          date: "desc"
        },
        {
          id: "desc"
        }
      ],
      skip,
      take: resolvedPageSize
    })
  ]);

  return {
    items: bankOrders.map(normalizeBankOrder),
    totalCount,
    page: resolvedPage,
    pageSize: resolvedPageSize,
    hasMore: skip + bankOrders.length < totalCount,
    summary
  };
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
  const totalPayableIDRMYR = bankOrders
    .filter((order) => order.currency === "IDR")
    .reduce((sum, order) => sum + Number(order.totalPayableAmount || 0), 0);
  const totalPayableINRMYR = bankOrders
    .filter((order) => order.currency === "INR")
    .reduce((sum, order) => sum + Number(order.totalPayableAmount || 0), 0);
  const profitIDR = bankOrders
    .filter((order) => order.currency === "IDR")
    .reduce((sum, order) => sum + Number(order.serviceCharge || 0), 0);
  const profitINR = bankOrders
    .filter((order) => order.currency === "INR")
    .reduce((sum, order) => sum + Number(order.serviceCharge || 0), 0);
  const profitIDRMYR = bankOrders
    .filter((order) => order.currency === "IDR")
    .reduce((sum, order) => sum + calculateProfitMYR(order), 0);
  const profitINRMYR = bankOrders
    .filter((order) => order.currency === "INR")
    .reduce((sum, order) => sum + calculateProfitMYR(order), 0);

  return {
    totalOrders: orders.length,
    bankOrders: bankOrders.length,
    totalIDR,
    totalINR,
    totalPayableMYR: totalPayableIDRMYR + totalPayableINRMYR,
    totalPayableIDRMYR,
    totalPayableINRMYR,
    profitIDR,
    profitINR,
    profitIDRMYR,
    profitINRMYR,
    totalProfitMYR: profitIDRMYR + profitINRMYR
  };
}

export async function getOrderSummary({ sessionUser, filters = {}, client = prisma }) {
  const where = buildBankWhere(sessionUser, filters);
  const [groupedTotals, groupedProfitRates, missingPayableOrders] = await Promise.all([
    client.bankOrder.groupBy({
      by: ["country"],
      where,
      _count: {
        _all: true
      },
      _sum: {
        depositAmount: true,
        totalPayableAmount: true,
        serviceCharge: true
      }
    }),
    client.bankOrder.groupBy({
      by: ["country", "rate"],
      where,
      _sum: {
        serviceCharge: true
      }
    }),
    client.bankOrder.findMany({
      where: {
        ...where,
        totalPayableAmount: 0
      },
      select: {
        country: true,
        depositAmount: true,
        rate: true,
        serviceCharge: true
      }
    })
  ]);

  const totals = groupedTotals.reduce(
    (summary, item) => {
      summary.totalOrders += item._count._all;

      if (item.country === 1) {
        summary.totalIDR += Number(item._sum.depositAmount || 0);
        summary.totalPayableIDRMYR += Number(item._sum.totalPayableAmount || 0);
        summary.profitIDR += Number(item._sum.serviceCharge || 0);
      } else if (item.country === 2) {
        summary.totalINR += Number(item._sum.depositAmount || 0);
        summary.totalPayableINRMYR += Number(item._sum.totalPayableAmount || 0);
        summary.profitINR += Number(item._sum.serviceCharge || 0);
      }

      return summary;
    },
    {
      totalOrders: 0,
      totalIDR: 0,
      totalINR: 0,
      totalPayableIDRMYR: 0,
      totalPayableINRMYR: 0,
      profitIDR: 0,
      profitINR: 0,
      profitIDRMYR: 0,
      profitINRMYR: 0
    }
  );

  groupedProfitRates.forEach((item) => {
    const convertedProfit = calculateProfitMYR({
      serviceCharge: item._sum.serviceCharge,
      rate: item.rate
    });

    if (item.country === 1) {
      totals.profitIDRMYR += convertedProfit;
    } else if (item.country === 2) {
      totals.profitINRMYR += convertedProfit;
    }
  });

  missingPayableOrders.forEach((order) => {
    const fallbackPayable = calculateTotalPayable({
      depositAmount: order.depositAmount,
      rate: order.rate,
      serviceCharge: order.serviceCharge
    });

    if (order.country === 1) {
      totals.totalPayableIDRMYR += fallbackPayable;
    } else if (order.country === 2) {
      totals.totalPayableINRMYR += fallbackPayable;
    }
  });

  return {
    totalOrders: totals.totalOrders,
    bankOrders: totals.totalOrders,
    totalIDR: totals.totalIDR,
    totalINR: totals.totalINR,
    totalPayableMYR: totals.totalPayableIDRMYR + totals.totalPayableINRMYR,
    totalPayableIDRMYR: totals.totalPayableIDRMYR,
    totalPayableINRMYR: totals.totalPayableINRMYR,
    profitIDR: totals.profitIDR,
    profitINR: totals.profitINR,
    profitIDRMYR: totals.profitIDRMYR,
    profitINRMYR: totals.profitINRMYR,
    totalProfitMYR: totals.profitIDRMYR + totals.profitINRMYR
  };
}

export async function getAvailableOrderMonths({ sessionUser, client = prisma }) {
  const orders = await client.bankOrder.findMany({
    where: buildScope(sessionUser, {}),
    select: {
      date: true
    },
    orderBy: {
      date: "desc"
    }
  });

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  });
  const seen = new Set();

  return orders.reduce((months, order) => {
    const date = new Date(order.date);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!seen.has(value)) {
      seen.add(value);
      months.push({
        value,
        label: formatter.format(date)
      });
    }

    return months;
  }, []);
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
