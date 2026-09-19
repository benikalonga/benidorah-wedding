-- The previous backfill (20260918123743) assigned invite_code as a random
-- starting offset plus a sequential row number — unique, but the codes
-- ended up consecutive (462726, 462727, 462728, ...), so knowing one
-- guest's code trivially reveals their neighbours'. This reassigns every
-- guest a genuinely random 6-digit code, drawn independently from the
-- full 000000-999999 range with a per-row uniqueness retry (rejection
-- sampling) — the same technique lib/inviteCode.ts already uses for new
-- guests going forward, just applied here to fix the existing rows.
DO $$
DECLARE
  g RECORD;
  candidate TEXT;
BEGIN
  FOR g IN SELECT id FROM "guests" ORDER BY created_at LOOP
    LOOP
      candidate := LPAD(floor(random() * 1000000)::text, 6, '0');
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM "guests" WHERE invite_code = candidate AND id != g.id
      );
    END LOOP;
    UPDATE "guests" SET invite_code = candidate WHERE id = g.id;
  END LOOP;
END $$;
