-- Shrink invite_code from 8 digits to 6, per the updated spec. Every guest
-- gets a freshly reassigned 6-digit code, using the same collision-free
-- technique as the original backfill (see
-- 20260918122121_add_guest_invite_code/migration.sql): a random starting
-- offset plus a per-row sequential number, not independent per-row random
-- draws, so uniqueness holds by construction rather than by probability.
-- No intermediate collisions with the old 8-digit values are possible
-- either, since those are always 8 characters and the new codes are 6.
DO $$
DECLARE
  guest_count BIGINT;
  start_offset BIGINT;
BEGIN
  SELECT COUNT(*) INTO guest_count FROM "guests";
  start_offset := 100000 + floor(random() * GREATEST(1, (900000 - guest_count)))::bigint;

  WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 AS rn
    FROM "guests"
  )
  UPDATE "guests" g
  SET invite_code = LPAD((start_offset + numbered.rn)::text, 6, '0')
  FROM numbered
  WHERE g.id = numbered.id;
END $$;
