-- Migration 008: Remove old check-ins
-- Drops the old pregnancy_checkins table since it has been replaced by baby_kicks.

-- Remove from realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS pregnancy_checkins;
EXCEPTION WHEN OTHERS THEN
  -- Ignore if table was never published
END $$;

-- Drop table
DROP TABLE IF EXISTS pregnancy_checkins CASCADE;
