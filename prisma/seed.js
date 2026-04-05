const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const defaultSettingsData = {
  rate1: 195,
  rate2: 198,
  service1: 2,
  service2: 3
};

async function main() {
  const saltRounds = 10;
  const users = [
    {
      username: "admin",
      password: "Admin@12345",
      role: "admin",
      storeName: "AHMAD Enterprises Admin",
      storeCode: "ADM"
    }
  ];

  for (const user of users) {
    const password = await bcrypt.hash(user.password, saltRounds);

    const createdUser = await prisma.user.upsert({
      where: { username: user.username },
      update: {
        password,
        role: user.role,
        storeName: user.storeName,
        storeCode: user.storeCode,
        isActive: true
      },
      create: {
        username: user.username,
        password,
        role: user.role,
        storeName: user.storeName,
        storeCode: user.storeCode,
        isActive: true
      }
    });

    if (user.role === "admin") {
      await prisma.settings.upsert({
        where: { userId: createdUser.id },
        update: {},
        create: {
          userId: createdUser.id,
          ...defaultSettingsData
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
