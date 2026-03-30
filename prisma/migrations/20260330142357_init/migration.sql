-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'store',
    "storeName" TEXT,
    "storeCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankOrder" (
    "id" SERIAL NOT NULL,
    "orderNo" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "country" INTEGER NOT NULL DEFAULT 1,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderName" TEXT NOT NULL DEFAULT '',
    "accountName" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "branch" TEXT,
    "ifscCode" TEXT,
    "depositAmount" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "serviceCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPayableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "senderMobile" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeOrder" (
    "id" SERIAL NOT NULL,
    "orderNo" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderMobile" TEXT NOT NULL,
    "forAmount" DOUBLE PRECISION NOT NULL,
    "exRate" DOUBLE PRECISION NOT NULL,
    "localAmount" DOUBLE PRECISION NOT NULL,
    "benName" TEXT NOT NULL,
    "benAddress" TEXT NOT NULL,
    "benMobile" TEXT NOT NULL,
    "accountName" TEXT,
    "accountNo" TEXT,
    "bank" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "rate1" DOUBLE PRECISION NOT NULL DEFAULT 195,
    "rate2" DOUBLE PRECISION NOT NULL DEFAULT 198,
    "service1" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "service2" DOUBLE PRECISION NOT NULL DEFAULT 3,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_storeCode_idx" ON "User"("storeCode");

-- CreateIndex
CREATE UNIQUE INDEX "BankOrder_orderNo_key" ON "BankOrder"("orderNo");

-- CreateIndex
CREATE INDEX "BankOrder_userId_date_idx" ON "BankOrder"("userId", "date");

-- CreateIndex
CREATE INDEX "BankOrder_status_idx" ON "BankOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HomeOrder_orderNo_key" ON "HomeOrder"("orderNo");

-- CreateIndex
CREATE INDEX "HomeOrder_userId_date_idx" ON "HomeOrder"("userId", "date");

-- CreateIndex
CREATE INDEX "HomeOrder_status_idx" ON "HomeOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- AddForeignKey
ALTER TABLE "BankOrder" ADD CONSTRAINT "BankOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeOrder" ADD CONSTRAINT "HomeOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
