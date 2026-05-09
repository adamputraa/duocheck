-- Migration 008: Remove old check-ins
-- Drops the old pregnancy_checkins table since it has been replaced by baby_kicks.

-- Remove from realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pregnancy_checkins'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE pregnancy_checkins;
  END IF;
END $$;

-- Drop table
DROP TABLE IF EXISTS pregnancy_checkins CASCADE;
