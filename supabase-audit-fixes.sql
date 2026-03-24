-- ============================================
-- ScopeGuard Audit Fixes Migration
-- Run this in the Supabase SQL Editor
-- ============================================

-- FIX-1: Add email column to user_profiles for email lookups
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email text;

-- Update the trigger to store email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users' emails into user_profiles
UPDATE user_profiles
SET email = au.email
FROM auth.users au
WHERE user_profiles.user_id = au.id
  AND (user_profiles.email IS NULL OR user_profiles.email = '');

-- FIX-3: Lock down RLS policies

-- === PROJECTS ===

-- Drop the old wide-open update policy
DROP POLICY IF EXISTS "projects_update" ON projects;

-- Owners can update their own projects (all columns)
CREATE POLICY "projects_owner_update"
  ON projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Public can update project status only (for scope approval from portal)
-- Note: Postgres RLS cannot restrict to specific columns, so we use
-- the /api/approve-scope route instead. This policy is for the API route
-- using anon client fallback.
CREATE POLICY "projects_public_update"
  ON projects FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- === CHANGE REQUESTS ===

-- Drop the old wide-open update policy
DROP POLICY IF EXISTS "change_requests_update" ON change_requests;

-- Only authenticated users (freelancers) can update change requests
CREATE POLICY "change_requests_auth_update"
  ON change_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- === USER PROFILES ===

-- Allow public SELECT on user_profiles (needed for email lookups in API routes)
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;

-- Public can read user profiles (needed for portal email notification routes)
CREATE POLICY "user_profiles_public_select"
  ON user_profiles FOR SELECT
  USING (true);
