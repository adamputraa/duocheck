-- Migration 003: Fix RLS infinite recursion and add missing columns
-- This migration fixes the critical RLS recursion bug and other database issues.

-- =====================================================
-- STEP 1: Create SECURITY DEFINER helper functions
-- These functions bypass RLS when checking membership,
-- preventing the infinite recursion in couple_members policies.
-- =====================================================

-- Function to check if a user is a member of a couple
CREATE OR REPLACE FUNCTION is_couple_member(couple_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM couple_members
    WHERE couple_members.couple_id = is_couple_member.couple_id
      AND couple_members.user_id = is_couple_member.user_id
  )
$$;

-- Function to check if two users are in the same couple
CREATE OR REPLACE FUNCTION are_couple_partners(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM couple_members cm1
    JOIN couple_members cm2 ON cm1.couple_id = cm2.couple_id
    WHERE cm1.user_id = are_couple_partners.user1_id
      AND cm2.user_id = are_couple_partners.user2_id
      AND cm1.user_id != cm2.user_id
  )
$$;

-- Function to count members in a couple
CREATE OR REPLACE FUNCTION couple_member_count(couple_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*) FROM couple_members
  WHERE couple_members.couple_id = couple_member_count.couple_id
$$;

-- =====================================================
-- STEP 2: Drop and recreate ALL RLS policies
-- =====================================================

-- 8.1 Profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their partner's profile" ON profiles;

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
  USING (are_couple_partners(auth.uid(), profiles.id));

-- 8.2 Couples
DROP POLICY IF EXISTS "Authenticated users can create a couple" ON couples;
DROP POLICY IF EXISTS "Users can view couples they belong to" ON couples;
DROP POLICY IF EXISTS "Anyone can look up a couple by invite code" ON couples;
DROP POLICY IF EXISTS "Creator can update their couple" ON couples;

CREATE POLICY "Authenticated users can create a couple"
  ON couples FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view couples they belong to"
  ON couples FOR SELECT
  USING (is_couple_member(couples.id, auth.uid()));

CREATE POLICY "Anyone can look up a couple by invite code"
  ON couples FOR SELECT
  USING (invite_code IS NOT NULL);

CREATE POLICY "Couple members can update their couple"
  ON couples FOR UPDATE
  USING (is_couple_member(couples.id, auth.uid()));

-- 8.3 Couple Members (THE CRITICAL FIX)
DROP POLICY IF EXISTS "Users can view members of their couple" ON couple_members;
DROP POLICY IF EXISTS "Users can insert themselves into a couple" ON couple_members;

CREATE POLICY "Users can view members of their couple"
  ON couple_members FOR SELECT
  USING (is_couple_member(couple_members.couple_id, auth.uid()));

CREATE POLICY "Users can insert themselves into a couple"
  ON couple_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    couple_member_count(couple_members.couple_id) < 2
  );

-- 8.4 Location Updates
DROP POLICY IF EXISTS "Users can view location updates from their couple" ON location_updates;
DROP POLICY IF EXISTS "Users can insert their own location updates" ON location_updates;
DROP POLICY IF EXISTS "Users can delete their own location updates" ON location_updates;

CREATE POLICY "Users can view location updates from their couple"
  ON location_updates FOR SELECT
  USING (is_couple_member(location_updates.couple_id, auth.uid()));

CREATE POLICY "Users can insert their own location updates"
  ON location_updates FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    is_couple_member(location_updates.couple_id, auth.uid())
  );

CREATE POLICY "Users can delete their own location updates"
  ON location_updates FOR DELETE
  USING (auth.uid() = user_id);

-- 8.5 Sharing Settings
DROP POLICY IF EXISTS "Users can insert their own sharing settings" ON sharing_settings;
DROP POLICY IF EXISTS "Users can view their own sharing settings" ON sharing_settings;
DROP POLICY IF EXISTS "Users can update their own sharing settings" ON sharing_settings;
DROP POLICY IF EXISTS "Users can view their partner's sharing settings" ON sharing_settings;

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
  USING (are_couple_partners(auth.uid(), sharing_settings.user_id));

-- 8.6 SOS Events
DROP POLICY IF EXISTS "Users can view SOS events from their couple" ON sos_events;
DROP POLICY IF EXISTS "Users can insert their own SOS events" ON sos_events;
DROP POLICY IF EXISTS "Users can update their own SOS events" ON sos_events;

CREATE POLICY "Users can view SOS events from their couple"
  ON sos_events FOR SELECT
  USING (is_couple_member(sos_events.couple_id, auth.uid()));

CREATE POLICY "Users can insert their own SOS events"
  ON sos_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SOS events"
  ON sos_events FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- STEP 3: Add missing accuracy column to sos_events
-- =====================================================
ALTER TABLE sos_events ADD COLUMN IF NOT EXISTS accuracy double precision;
