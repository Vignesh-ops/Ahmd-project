-- Speed up the new Country filter on History and Admin dashboards.
CREATE INDEX IF NOT EXISTS "BankOrder_country_date_idx" ON "BankOrder"("country", "date");
