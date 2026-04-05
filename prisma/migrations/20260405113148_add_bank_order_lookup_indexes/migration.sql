-- CreateIndex
CREATE INDEX "BankOrder_senderMobile_date_idx" ON "BankOrder"("senderMobile", "date");

-- CreateIndex
CREATE INDEX "BankOrder_userId_senderMobile_date_idx" ON "BankOrder"("userId", "senderMobile", "date");
