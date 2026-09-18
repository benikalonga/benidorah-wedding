-- Add the invite_code column and backfill every existing guest with a
-- unique 8-digit code before enforcing NOT NULL + UNIQUE, so this migration
-- is safe to run against a table that already has rows (dev and prod alike).
--
-- Codes are assigned as a random starting offset plus a per-row sequential
-- number (ROW_NUMBER), not independent random draws per row — that makes
-- collisions impossible by construction instead of merely improbable,
-- since guest counts are always far below the 90,000,000-code range.
ALTER TABLE "guests" ADD COLUMN "invite_code" TEXT;

DO $$
DECLARE
  start_offset BIGINT := 10000000 + floor(random() * 89000000)::bigint;
BEGIN
  WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 AS rn
    FROM "guests"
  )
  UPDATE "guests" g
  SET invite_code = LPAD((start_offset + numbered.rn)::text, 8, '0')
  FROM numbered
  WHERE g.id = numbered.id;
END $$;

ALTER TABLE "guests" ALTER COLUMN "invite_code" SET NOT NULL;
CREATE UNIQUE INDEX "guests_invite_code_key" ON "guests"("invite_code");
