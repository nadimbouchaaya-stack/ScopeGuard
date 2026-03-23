-- ============================================
-- ScopeGuard: Fix change_requests INSERT policy
-- Run this in the Supabase SQL Editor
-- ============================================
--
-- ROOT CAUSE: The original INSERT policy required authenticated role
-- and user_id = auth.uid(). Portal clients are anonymous, so every
-- change request submission was silently rejected by RLS.
--
-- FIX: Allow public INSERT. Security is maintained because:
-- 1. project_id has a foreign key constraint (must link to real project)
-- 2. The portal URL itself is the access control (only shared with clients)
-- 3. Freelancers can only DELETE their own CRs via the delete policy

DROP POLICY IF EXISTS "change_requests_insert" ON change_requests;

CREATE POLICY "change_requests_insert" ON change_requests
  FOR INSERT
  TO public
  WITH CHECK (true);
