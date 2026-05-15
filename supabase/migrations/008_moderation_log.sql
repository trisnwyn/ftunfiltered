-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 008: Moderation rate-limit log
-- Run in Supabase SQL Editor after 007_fix_storage_policy_names.sql
--
-- Replaces the in-memory per-instance Map in /api/moderation/route.ts with a
-- tiny Postgres table so the rate limit:
--   • survives cold starts
--   • works correctly across multiple server instances / edge deployments
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.moderation_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index: rate-limit queries always filter by (user_id, created_at)
CREATE INDEX IF NOT EXISTS moderation_log_user_time_idx
  ON public.moderation_log (user_id, created_at DESC);

ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;

-- Users can log their own calls
CREATE POLICY "moderation_log_insert_own"
  ON public.moderation_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can COUNT their own recent entries
CREATE POLICY "moderation_log_select_own"
  ON public.moderation_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can prune their own old entries (keeps the table tidy)
CREATE POLICY "moderation_log_delete_own"
  ON public.moderation_log FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
