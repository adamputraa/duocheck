-- Migration 006: DuoCare RLS policies for all new/modified tables

-- Privacy settings
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own privacy settings"
  ON privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own privacy settings"
  ON privacy_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own privacy settings"
  ON privacy_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Partner can view privacy settings"
  ON privacy_settings FOR SELECT
  USING (are_couple_partners(auth.uid(), privacy_settings.user_id));

-- Pregnancy profiles
ALTER TABLE pregnancy_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view pregnancy profile"
  ON pregnancy_profiles FOR SELECT
  USING (is_couple_member(pregnancy_profiles.couple_id, auth.uid()));
CREATE POLICY "Couple members can insert pregnancy profile"
  ON pregnancy_profiles FOR INSERT
  WITH CHECK (is_couple_member(pregnancy_profiles.couple_id, auth.uid()));
CREATE POLICY "Couple members can update pregnancy profile"
  ON pregnancy_profiles FOR UPDATE
  USING (is_couple_member(pregnancy_profiles.couple_id, auth.uid()));

-- Pregnancy check-ins
ALTER TABLE pregnancy_checkins ENABLE ROW LEVEL SECURITY;

-- Helper function: check if wife allows status sharing
CREATE OR REPLACE FUNCTION wife_shares_status(p_couple_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT COALESCE(
    (SELECT ps.share_status_with_partner
     FROM privacy_settings ps
     JOIN couple_members cm ON cm.user_id = ps.user_id
     WHERE cm.couple_id = p_couple_id AND cm.role = 'wife'
     LIMIT 1),
    true
  )
$$;

CREATE POLICY "Wife can insert check-ins"
  ON pregnancy_checkins FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_couple_member(pregnancy_checkins.couple_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM couple_members
      WHERE couple_members.couple_id = pregnancy_checkins.couple_id
        AND couple_members.user_id = auth.uid()
        AND couple_members.role = 'wife'
    )
  );

CREATE POLICY "Wife can view own check-ins"
  ON pregnancy_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Husband can view check-ins if sharing enabled"
  ON pregnancy_checkins FOR SELECT
  USING (
    is_couple_member(pregnancy_checkins.couple_id, auth.uid())
    AND wife_shares_status(pregnancy_checkins.couple_id)
  );

-- Appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view appointments"
  ON appointments FOR SELECT
  USING (is_couple_member(appointments.couple_id, auth.uid()));
CREATE POLICY "Couple members can insert appointments"
  ON appointments FOR INSERT
  WITH CHECK (is_couple_member(appointments.couple_id, auth.uid()));
CREATE POLICY "Couple members can update appointments"
  ON appointments FOR UPDATE
  USING (is_couple_member(appointments.couple_id, auth.uid()));
CREATE POLICY "Couple members can delete appointments"
  ON appointments FOR DELETE
  USING (is_couple_member(appointments.couple_id, auth.uid()));

-- Care tasks
ALTER TABLE care_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view tasks"
  ON care_tasks FOR SELECT
  USING (is_couple_member(care_tasks.couple_id, auth.uid()));
CREATE POLICY "Couple members can insert tasks"
  ON care_tasks FOR INSERT
  WITH CHECK (is_couple_member(care_tasks.couple_id, auth.uid()));
CREATE POLICY "Couple members can update tasks"
  ON care_tasks FOR UPDATE
  USING (is_couple_member(care_tasks.couple_id, auth.uid()));
CREATE POLICY "Couple members can delete tasks"
  ON care_tasks FOR DELETE
  USING (is_couple_member(care_tasks.couple_id, auth.uid()));

-- Hospital bag items
ALTER TABLE hospital_bag_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view bag items"
  ON hospital_bag_items FOR SELECT
  USING (is_couple_member(hospital_bag_items.couple_id, auth.uid()));
CREATE POLICY "Couple members can insert bag items"
  ON hospital_bag_items FOR INSERT
  WITH CHECK (is_couple_member(hospital_bag_items.couple_id, auth.uid()));
CREATE POLICY "Couple members can update bag items"
  ON hospital_bag_items FOR UPDATE
  USING (is_couple_member(hospital_bag_items.couple_id, auth.uid()));
CREATE POLICY "Couple members can delete bag items"
  ON hospital_bag_items FOR DELETE
  USING (is_couple_member(hospital_bag_items.couple_id, auth.uid()));

-- Emergency contacts
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view emergency contacts"
  ON emergency_contacts FOR SELECT
  USING (is_couple_member(emergency_contacts.couple_id, auth.uid()));
CREATE POLICY "Couple members can insert emergency contacts"
  ON emergency_contacts FOR INSERT
  WITH CHECK (is_couple_member(emergency_contacts.couple_id, auth.uid()));
CREATE POLICY "Couple members can update emergency contacts"
  ON emergency_contacts FOR UPDATE
  USING (is_couple_member(emergency_contacts.couple_id, auth.uid()));
CREATE POLICY "Couple members can delete emergency contacts"
  ON emergency_contacts FOR DELETE
  USING (is_couple_member(emergency_contacts.couple_id, auth.uid()));

-- Emergency events
ALTER TABLE emergency_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view emergency events"
  ON emergency_events FOR SELECT
  USING (is_couple_member(emergency_events.couple_id, auth.uid()));
CREATE POLICY "Users can insert emergency events"
  ON emergency_events FOR INSERT
  WITH CHECK (auth.uid() = triggered_by AND is_couple_member(emergency_events.couple_id, auth.uid()));
CREATE POLICY "Sender can update emergency events"
  ON emergency_events FOR UPDATE
  USING (auth.uid() = triggered_by);
