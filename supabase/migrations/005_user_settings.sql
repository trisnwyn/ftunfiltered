-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 005: User-level settings
-- Run in Supabase SQL Editor after 004_content_warnings.sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_settings (
  user_id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  accept_letters_globally  BOOLEAN     NOT NULL DEFAULT TRUE,
  email_notifications      BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can read their own settings
CREATE POLICY "user_settings_select_own"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own settings row
CREATE POLICY "user_settings_insert_own"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "user_settings_update_own"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
