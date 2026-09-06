import { revalidateTag, unstable_cache } from "next/cache";
import prisma from "./prisma";
import { getAdminSummary, getCombinedOrdersPage, getOrderByOrderNo } from "./orders";
import { getAdminAccountSummary, listStoreUsers } from "./users";
import { defaultSettingsData } from "./settings";

export const CACHE_TAGS = {
  orders: "orders",
  users: "users",
  settings: "settings"
};

const SHORT_TTL_SECONDS = 15;

export const getCachedOrdersPage = unstable_cache(
  async (role, userId, filters, page, pageSize) =>
    getCombinedOrdersPage({ sessionUser: { role, id: userId }, filters, page, pageSize }),
  ["orders-page"],
  { tags: [CACHE_TAGS.orders], revalidate: SHORT_TTL_SECONDS }
);

export const getCachedOrderByOrderNo = unstable_cache(
  async (orderNo, role, userId) => getOrderByOrderNo(orderNo, { role, id: userId }),
  ["order-by-order-no"],
  { tags: [CACHE_TAGS.orders], revalidate: SHORT_TTL_SECONDS }
);

export const getCachedAdminSummary = unstable_cache(
  async (filters) => getAdminSummary({ filters }),
  ["admin-summary"],
  { tags: [CACHE_TAGS.orders], revalidate: SHORT_TTL_SECONDS }
);

export const getCachedStoreUsers = unstable_cache(
  async () => listStoreUsers(),
  ["store-users"],
  { tags: [CACHE_TAGS.users], revalidate: SHORT_TTL_SECONDS }
);

export const getCachedAdminAccount = unstable_cache(
  async (adminId) => getAdminAccountSummary(adminId),
  ["admin-account"],
  { tags: [CACHE_TAGS.users], revalidate: SHORT_TTL_SECONDS }
);

export const getCachedOrgStores = unstable_cache(
  async () => {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ["admin", "store"] },
        OR: [{ role: "admin" }, { isActive: true }]
      },
      select: {
        id: true,
        role: true,
        storeName: true,
        storeCode: true
      }
    });

    return users.sort((left, right) => {
      if (left.role !== right.role) {
        return left.role === "admin" ? -1 : 1;
      }

      return (left.storeCode || "").localeCompare(right.storeCode || "");
    });
  },
  ["org-stores"],
  { tags: [CACHE_TAGS.users], revalidate: SHORT_TTL_SECONDS }
);

export const getCachedStoreSettingsList = unstable_cache(
  async () => {
    const stores = await prisma.user.findMany({
      where: {
        role: "store"
      },
      include: {
        settings: true
      },
      orderBy: [{ storeCode: "asc" }, { id: "asc" }]
    });

    return stores.map((store) => ({
      ...store,
      settings: store.settings || {
        id: store.id,
        userId: store.id,
        ...defaultSettingsData
      }
    }));
  },
  ["store-settings-list"],
  { tags: [CACHE_TAGS.users, CACHE_TAGS.settings], revalidate: SHORT_TTL_SECONDS }
);

export function invalidateOrdersCache() {
  revalidateTag(CACHE_TAGS.orders);
}

export function invalidateUsersCache() {
  revalidateTag(CACHE_TAGS.users);
}

export function invalidateSettingsCache() {
  revalidateTag(CACHE_TAGS.settings);
}
