-- Migration 004: Fix cascade deletes for user deletion
-- Problem: couples.created_by references auth.users(id) without ON DELETE CASCADE,
-- which prevents deleting users from the Supabase Dashboard when they've created a couple.
-- Solution: Change the foreign key to ON DELETE SET NULL so couples persist even if
-- the creator is deleted, allowing user deletion to succeed.

-- First, drop the existing foreign key constraint on couples.created_by
ALTER TABLE couples
  DROP CONSTRAINT couples_created_by_fkey;

-- Re-add it with ON DELETE SET NULL
ALTER TABLE couples
  ADD CONSTRAINT couples_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
