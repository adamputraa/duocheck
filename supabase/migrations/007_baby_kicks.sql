-- Migration 007: Baby kicks
CREATE TABLE IF NOT EXISTS baby_kicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Index for querying kicks for a couple
CREATE INDEX IF NOT EXISTS idx_baby_kicks_couple ON baby_kicks(couple_id);

-- Enable RLS
ALTER TABLE baby_kicks ENABLE ROW LEVEL SECURITY;

-- Policy for couple members
CREATE POLICY "Users can manage kicks in their couple" 
ON baby_kicks FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM couple_members 
    WHERE couple_id = baby_kicks.couple_id 
    AND user_id = auth.uid()
  )
);

-- Enable realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'baby_kicks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE baby_kicks;
  END IF;
END $$;
