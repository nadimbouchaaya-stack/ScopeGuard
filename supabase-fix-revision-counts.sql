-- ============================================
-- ScopeGuard: Fix existing revision counts
-- Run this in the Supabase SQL Editor
-- ============================================
--
-- Some projects have approved CRs but revisions_used = 0
-- because the increment was missing from approval logic.
-- This migration fixes the counts to match actual approved CRs.

UPDATE projects SET revisions_used = (
  SELECT COUNT(*) FROM change_requests
  WHERE project_id = projects.id
  AND (status = 'Approved' OR status = 'approved')
)
WHERE user_id IS NOT NULL;
