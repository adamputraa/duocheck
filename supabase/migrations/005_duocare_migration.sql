-- Migration 005: DuoCare schema changes
-- Adds role to profiles, creates new pregnancy-related tables

-- 1. Modify profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('wife', 'husband'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Modify couple_members role
ALTER TABLE couple_members DROP CONSTRAINT IF EXISTS couple_members_role_check;
ALTER TABLE couple_members ALTER COLUMN role DROP DEFAULT;

-- Update any existing rows to valid values before applying the constraint
UPDATE couple_members SET role = 'wife' WHERE role NOT IN ('wife', 'husband') OR role IS NULL;

ALTER TABLE couple_members ADD CONSTRAINT couple_members_role_check CHECK (role IN ('wife', 'husband'));

-- 3. Privacy settings (replaces sharing_settings)
CREATE TABLE IF NOT EXISTS privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  share_status_with_partner boolean DEFAULT true,
  email_alerts_enabled boolean DEFAULT true,
  shortcut_token text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO privacy_settings (user_id, share_status_with_partner, email_alerts_enabled, shortcut_token)
SELECT user_id, sharing_enabled, true, shortcut_token FROM sharing_settings
ON CONFLICT (user_id) DO NOTHING;

-- 4. Pregnancy profiles
CREATE TABLE IF NOT EXISTS pregnancy_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  last_menstrual_period date,
  pregnancy_type text DEFAULT 'unknown' CHECK (pregnancy_type IN ('single', 'twins', 'unknown')),
  hospital_name text, clinic_name text,
  doctor_name text, doctor_phone text,
  emergency_contact_name text, emergency_contact_phone text,
  blood_type text, risk_notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(couple_id)
);

-- 5. Pregnancy check-ins
CREATE TABLE IF NOT EXISTS pregnancy_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_feeling text CHECK (overall_feeling IN ('good','okay','tired','unwell')),
  mood text CHECK (mood IN ('happy','calm','anxious','emotional','irritated','sad')),
  energy_level text CHECK (energy_level IN ('high','medium','low')),
  nausea_level text CHECK (nausea_level IN ('none','mild','moderate','severe')),
  pain_type text CHECK (pain_type IN ('none','back_pain','cramp','pelvic_pain','headache','other')),
  pain_note text,
  swelling text CHECK (swelling IN ('none','feet','hands','face')),
  baby_movement text CHECK (baby_movement IN ('normal','less_than_usual','not_sure','not_applicable')),
  appetite text CHECK (appetite IN ('normal','low','craving','cannot_eat')),
  sleep_quality text CHECK (sleep_quality IN ('good','okay','poor')),
  needs_from_husband text CHECK (needs_from_husband IN ('none','food','drink','massage','pickup','rest_support','call_me','hospital','other')),
  note text, is_urgent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 6. Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
  title text NOT NULL,
  appointment_type text CHECK (appointment_type IN ('checkup','scan','blood_test','mgtt','vaccination','follow_up','other')),
  appointment_date date NOT NULL, appointment_time time,
  location text, doctor_name text, notes text,
  husband_attending boolean DEFAULT false,
  reminder_enabled boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Care tasks
CREATE TABLE IF NOT EXISTS care_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  title text NOT NULL, description text,
  category text CHECK (category IN ('food','medicine','transport','home','baby_prep','appointment','other')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','cancelled')),
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. Hospital bag items
CREATE TABLE IF NOT EXISTS hospital_bag_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  category text CHECK (category IN ('wife','baby','husband','documents','other')),
  is_checked boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. Emergency contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
  name text NOT NULL, phone text NOT NULL,
  relationship text,
  contact_type text CHECK (contact_type IN ('husband','doctor','clinic','hospital','family','other')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10. Emergency events
CREATE TABLE IF NOT EXISTS emergency_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
  triggered_by uuid REFERENCES auth.users(id),
  message text,
  include_location boolean DEFAULT false,
  latitude double precision, longitude double precision,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 11. Indexes
CREATE INDEX IF NOT EXISTS idx_pregnancy_checkins_couple ON pregnancy_checkins(couple_id);
CREATE INDEX IF NOT EXISTS idx_pregnancy_checkins_created ON pregnancy_checkins(created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_couple ON appointments(couple_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_care_tasks_couple ON care_tasks(couple_id);
CREATE INDEX IF NOT EXISTS idx_emergency_events_couple ON emergency_events(couple_id);

-- 12. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE pregnancy_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE emergency_events;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE care_tasks;
