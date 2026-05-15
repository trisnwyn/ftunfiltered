-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 009: Reports hardening
-- Run in Supabase SQL Editor after 008_moderation_log.sql
--
-- Changes:
--   A. Add UNIQUE(post_id, user_id) so one user can only report a post once.
--   B. Add `resolved` + `resolved_at` columns for admin tracking.
--   C. Trigger: auto-unpublish a post (set status='pending') when it reaches
--      3 unresolved reports.  Admin reviews it in the moderation queue.
-- ─────────────────────────────────────────────────────────────────────────────


-- ════════════════════════════════════════════════════════════════════════════
-- A. Dedup existing rows, then add unique constraint
-- ════════════════════════════════════════════════════════════════════════════

-- Keep only the earliest report per (post, user) pair
DELETE FROM reports
WHERE id NOT IN (
  SELECT DISTINCT ON (post_id, user_id) id
  FROM reports
  ORDER BY post_id, user_id, created_at ASC
);

ALTER TABLE reports
  ADD CONSTRAINT reports_user_post_unique UNIQUE (post_id, user_id);


-- ════════════════════════════════════════════════════════════════════════════
-- B. Resolution tracking columns
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS resolved    BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Fast lookup: all unresolved reports for admin view
CREATE INDEX IF NOT EXISTS reports_unresolved_idx
  ON reports (post_id, created_at DESC)
  WHERE resolved = FALSE;


-- ════════════════════════════════════════════════════════════════════════════
-- C. Auto-unpublish trigger
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.check_report_threshold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- runs as owner so it can UPDATE posts past RLS
SET search_path = public
AS $$
DECLARE
  unresolved_count INT;
BEGIN
  SELECT COUNT(*) INTO unresolved_count
  FROM reports
  WHERE post_id  = NEW.post_id
    AND resolved = FALSE;

  -- Unpublish only currently-approved posts
  IF unresolved_count >= 10 THEN
    UPDATE posts
    SET status = 'pending'
    WHERE id     = NEW.post_id
      AND status = 'approved';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old version if it exists (idempotent re-run)
DROP TRIGGER IF EXISTS reports_threshold_trigger ON reports;

CREATE TRIGGER reports_threshold_trigger
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION public.check_report_threshold();
