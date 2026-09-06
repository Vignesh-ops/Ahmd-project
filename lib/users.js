import prisma from "./prisma";

export const safeUserSelect = {
  id: true,
  username: true,
  role: true,
  storeName: true,
  storeCode: true,
  isActive: true,
  createdAt: true
};

export async function listStoreUsers(client = prisma) {
  return client.user.findMany({
    where: {
      role: "store"
    },
    select: safeUserSelect,
    orderBy: {
      createdAt: "asc"
    }
  });
}

export async function getAdminAccountSummary(adminId, client = prisma) {
  return client.user.findUnique({
    where: {
      id: Number(adminId)
    },
    select: {
      id: true,
      username: true,
      storeName: true,
      storeCode: true,
      role: true
    }
  });
}
