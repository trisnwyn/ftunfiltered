-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004: Content warnings on posts
-- Run in Supabase SQL Editor after 003_letters.sql
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS content_warnings TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_posts_content_warnings
  ON posts USING GIN (content_warnings);
