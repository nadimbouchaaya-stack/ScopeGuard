-- ============================================
-- ScopeGuard Auth Migration
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Add user_id column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 2. Add user_id column to change_requests table
ALTER TABLE change_requests
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 3. Drop ALL existing RLS policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('projects', 'change_requests')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 4. Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROJECTS POLICIES
-- ============================================

-- SELECT: anyone can read (portal needs public access by project ID)
CREATE POLICY "projects_select"
  ON projects FOR SELECT
  USING (true);

-- INSERT: authenticated users can insert their own
CREATE POLICY "projects_insert"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: owner can update anything, OR anyone can update (for portal approve flow)
CREATE POLICY "projects_update"
  ON projects FOR UPDATE
  USING (true);

-- DELETE: only owner can delete
CREATE POLICY "projects_delete"
  ON projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- CHANGE_REQUESTS POLICIES
-- ============================================

-- SELECT: anyone can read (portal needs access)
CREATE POLICY "change_requests_select"
  ON change_requests FOR SELECT
  USING (true);

-- INSERT: authenticated users can insert their own
CREATE POLICY "change_requests_insert"
  ON change_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: anyone can update (portal approve/decline)
CREATE POLICY "change_requests_update"
  ON change_requests FOR UPDATE
  USING (true);

-- DELETE: only owner can delete
CREATE POLICY "change_requests_delete"
  ON change_requests FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
