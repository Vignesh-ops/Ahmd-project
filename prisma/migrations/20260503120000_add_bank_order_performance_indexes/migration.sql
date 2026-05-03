-- Speed up admin/global history filters, dashboard summaries, and status-filtered lists.
CREATE INDEX IF NOT EXISTS "BankOrder_date_idx" ON "BankOrder"("date");
CREATE INDEX IF NOT EXISTS "BankOrder_status_date_idx" ON "BankOrder"("status", "date");
CREATE INDEX IF NOT EXISTS "BankOrder_userId_status_date_idx" ON "BankOrder"("userId", "status", "date");

-- Speed up prefix scans used by incremental order number generation.
CREATE INDEX IF NOT EXISTS "BankOrder_orderNo_pattern_idx" ON "BankOrder"("orderNo" text_pattern_ops);
CREATE INDEX IF NOT EXISTS "HomeOrder_orderNo_pattern_idx" ON "HomeOrder"("orderNo" text_pattern_ops);
