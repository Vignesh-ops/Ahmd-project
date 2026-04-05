import prisma from "@/lib/prisma";

const defaultSettingsData = {
  rate1: 195,
  rate2: 198,
  service1: 2,
  service2: 3
};

async function getAdminUser() {
  return prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true }
  });
}

export async function getGlobalSettings() {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    throw new Error("Admin user not found. Create an admin account before loading settings.");
  }

  return prisma.settings.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      ...defaultSettingsData
    }
  });
}

export async function updateGlobalSettings(data) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    throw new Error("Admin user not found. Create an admin account before updating settings.");
  }

  return prisma.settings.upsert({
    where: { userId: adminUser.id },
    update: data,
    create: {
      userId: adminUser.id,
      ...defaultSettingsData,
      ...data
    }
  });
}

export { defaultSettingsData };
