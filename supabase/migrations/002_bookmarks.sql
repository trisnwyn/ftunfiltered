-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: Bookmarks
-- Run in Supabase SQL Editor after 001_search.sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookmarks (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    UUID        NOT NULL REFERENCES posts(id)      ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_bookmarks_user  ON bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post  ON bookmarks (post_id);

-- RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can read only their own bookmarks
CREATE POLICY "bookmarks_select_own"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own bookmarks
CREATE POLICY "bookmarks_insert_own"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "bookmarks_delete_own"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);
