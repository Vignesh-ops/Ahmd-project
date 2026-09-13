CREATE TABLE "BankBalance" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "manualBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankBalance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BankBalanceTransaction" (
    "id" SERIAL NOT NULL,
    "balanceId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "updatedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankBalanceTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BankBalanceTransaction_balanceId_createdAt_idx" ON "BankBalanceTransaction"("balanceId", "createdAt");
CREATE INDEX "BankBalanceTransaction_updatedById_idx" ON "BankBalanceTransaction"("updatedById");

ALTER TABLE "BankBalanceTransaction" ADD CONSTRAINT "BankBalanceTransaction_balanceId_fkey"
  FOREIGN KEY ("balanceId") REFERENCES "BankBalance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankBalanceTransaction" ADD CONSTRAINT "BankBalanceTransaction_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
