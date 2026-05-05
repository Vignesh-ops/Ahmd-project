import prisma from "@/lib/prisma";

const defaultSettingsData = {
  rate1: 195,
  rate2: 198,
  service1: 2,
  service2: 3
};

export async function getUserSettings(userId) {
  const numericUserId = Number(userId);

  return prisma.settings.upsert({
    where: { userId: numericUserId },
    update: {},
    create: {
      id: numericUserId,
      userId: numericUserId,
      ...defaultSettingsData
    }
  });
}

export async function updateUserSettings(userId, data) {
  const numericUserId = Number(userId);

  return prisma.settings.upsert({
    where: { userId: numericUserId },
    update: data,
    create: {
      id: numericUserId,
      userId: numericUserId,
      ...defaultSettingsData,
      ...data
    }
  });
}

export { defaultSettingsData };
