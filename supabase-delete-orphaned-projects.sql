-- ============================================
-- ScopeGuard: Delete orphaned projects with NULL user_id
-- Run this in the Supabase SQL Editor
-- ============================================
--
-- These projects were created before user_id was properly set
-- on project creation. They have no owner and are inaccessible.

-- First delete any change_requests linked to orphaned projects
DELETE FROM change_requests
WHERE project_id IN (
  SELECT id FROM projects WHERE user_id IS NULL
);

-- Then delete the orphaned projects themselves
DELETE FROM projects WHERE user_id IS NULL;
