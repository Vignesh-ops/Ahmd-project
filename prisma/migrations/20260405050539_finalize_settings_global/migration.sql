DO $$
DECLARE
  keep_id INTEGER;
BEGIN
  SELECT "id" INTO keep_id
  FROM "Settings"
  ORDER BY "id" ASC
  LIMIT 1;

  IF keep_id IS NULL THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Settings'
        AND column_name = 'userId'
    ) THEN
      INSERT INTO "Settings" ("id", "userId", "rate1", "rate2", "service1", "service2")
      SELECT 1, "id", 195, 198, 2, 3
      FROM "User"
      ORDER BY "id" ASC
      LIMIT 1;
    ELSE
      INSERT INTO "Settings" ("id", "rate1", "rate2", "service1", "service2")
      VALUES (1, 195, 198, 2, 3);
    END IF;
  ELSE
    DELETE FROM "Settings" WHERE "id" <> keep_id;

    IF keep_id <> 1 THEN
      UPDATE "Settings"
      SET "id" = 1
      WHERE "id" = keep_id;
    END IF;
  END IF;
END $$;

ALTER TABLE "Settings" DROP CONSTRAINT IF EXISTS "Settings_userId_fkey";
DROP INDEX IF EXISTS "Settings_userId_key";
ALTER TABLE "Settings" DROP COLUMN IF EXISTS "userId";
