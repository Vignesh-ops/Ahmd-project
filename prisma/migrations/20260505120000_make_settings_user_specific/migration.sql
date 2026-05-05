ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "userId" INTEGER;

UPDATE "Settings"
SET "userId" = "Settings"."id"
WHERE "userId" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "User"
    WHERE "User"."id" = "Settings"."id"
  );

WITH defaults AS (
  SELECT
    COALESCE(MAX("rate1"), 195) AS "rate1",
    COALESCE(MAX("rate2"), 198) AS "rate2",
    COALESCE(MAX("service1"), 2) AS "service1",
    COALESCE(MAX("service2"), 3) AS "service2"
  FROM "Settings"
)
INSERT INTO "Settings" ("id", "userId", "rate1", "rate2", "service1", "service2")
SELECT "User"."id", "User"."id", defaults."rate1", defaults."rate2", defaults."service1", defaults."service2"
FROM "User"
CROSS JOIN defaults
WHERE NOT EXISTS (
  SELECT 1
  FROM "Settings"
  WHERE "Settings"."userId" = "User"."id"
);

DELETE FROM "Settings"
WHERE "userId" IS NULL;

ALTER TABLE "Settings" ALTER COLUMN "userId" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Settings_userId_key" ON "Settings"("userId");
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
