-- 8.1 Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view their partner's profile"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couple_members cm1
      JOIN couple_members cm2 ON cm1.couple_id = cm2.couple_id
      WHERE cm1.user_id = auth.uid()
        AND cm2.user_id = profiles.id
        AND cm1.user_id != cm2.user_id
    )
  );

-- 8.2 Couples
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create a couple"
  ON couples FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view couples they belong to"
  ON couples FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couple_members
      WHERE couple_members.couple_id = couples.id
        AND couple_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can look up a couple by invite code"
  ON couples FOR SELECT
  USING (invite_code IS NOT NULL);

CREATE POLICY "Creator can update their couple"
  ON couples FOR UPDATE
  USING (auth.uid() = created_by);

-- 8.3 Couple Members
ALTER TABLE couple_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their couple"
  ON couple_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couple_members AS my_membership
      WHERE my_membership.couple_id = couple_members.couple_id
        AND my_membership.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert themselves into a couple"
  ON couple_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (
      SELECT COUNT(*) FROM couple_members
      WHERE couple_id = couple_members.couple_id
    ) < 2
  );

-- 8.4 Location Updates
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view location updates from their couple"
  ON location_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couple_members
      WHERE couple_members.couple_id = location_updates.couple_id
        AND couple_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own location updates"
  ON location_updates FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM couple_members
      WHERE couple_members.couple_id = location_updates.couple_id
        AND couple_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own location updates"
  ON location_updates FOR DELETE
  USING (auth.uid() = user_id);

-- 8.5 Sharing Settings
ALTER TABLE sharing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own sharing settings"
  ON sharing_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sharing settings"
  ON sharing_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sharing settings"
  ON sharing_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their partner's sharing settings"
  ON sharing_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couple_members cm1
      JOIN couple_members cm2 ON cm1.couple_id = cm2.couple_id
      WHERE cm1.user_id = auth.uid()
        AND cm2.user_id = sharing_settings.user_id
        AND cm1.user_id != cm2.user_id
    )
  );

-- 8.6 SOS Events
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view SOS events from their couple"
  ON sos_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couple_members
      WHERE couple_members.couple_id = sos_events.couple_id
        AND couple_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own SOS events"
  ON sos_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SOS events"
  ON sos_events FOR UPDATE
  USING (auth.uid() = user_id);
