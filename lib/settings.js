import prisma from "@/lib/prisma";

const GLOBAL_SETTINGS_ID = 1;

const defaultSettingsData = {
  rate1: 195,
  rate2: 198,
  service1: 2,
  service2: 3
};

export async function getGlobalSettings() {
  return prisma.settings.upsert({
    where: { id: GLOBAL_SETTINGS_ID },
    update: {},
    create: {
      id: GLOBAL_SETTINGS_ID,
      ...defaultSettingsData
    }
  });
}

export async function updateGlobalSettings(data) {
  return prisma.settings.upsert({
    where: { id: GLOBAL_SETTINGS_ID },
    update: data,
    create: {
      id: GLOBAL_SETTINGS_ID,
      ...defaultSettingsData,
      ...data
    }
  });
}

export { defaultSettingsData };
