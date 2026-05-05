-- Profiles Table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Couples Table
CREATE TABLE couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  invite_code text UNIQUE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Couple Members Table
CREATE TABLE couple_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  UNIQUE(couple_id, user_id)
);

-- Location Updates Table
CREATE TABLE location_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  status text,
  source text DEFAULT 'web',
  created_at timestamptz DEFAULT now()
);

-- Sharing Settings Table
CREATE TABLE sharing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  sharing_enabled boolean DEFAULT true,
  history_retention_days int DEFAULT 7,
  stale_threshold_hours int DEFAULT 3,
  shortcut_token text,
  updated_at timestamptz DEFAULT now()
);

-- SOS Events Table
CREATE TABLE sos_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude double precision,
  longitude double precision,
  message text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_location_updates_user_id ON location_updates(user_id);
CREATE INDEX idx_location_updates_couple_id ON location_updates(couple_id);
CREATE INDEX idx_location_updates_created_at ON location_updates(created_at);
CREATE INDEX idx_couple_members_couple_id ON couple_members(couple_id);
CREATE INDEX idx_couple_members_user_id ON couple_members(user_id);
CREATE INDEX idx_sos_events_couple_id ON sos_events(couple_id);
CREATE INDEX idx_sos_events_resolved_at ON sos_events(resolved_at);

-- Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sharing_settings_updated_at
  BEFORE UPDATE ON sharing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for location_updates and sos_events
ALTER PUBLICATION supabase_realtime ADD TABLE location_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE sos_events;
