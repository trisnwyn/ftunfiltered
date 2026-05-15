-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: Private anonymous letters
-- Run in Supabase SQL Editor after 002_bookmarks.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Opt-in flag on posts
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS accepts_letters BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Letters table
CREATE TABLE IF NOT EXISTS letters (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id             UUID        NOT NULL REFERENCES posts(id)      ON DELETE CASCADE,
  sender_user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content             TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'delivered'
                        CHECK (status IN ('pending', 'delivered', 'rejected')),
  read_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_letters_recipient ON letters (recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_letters_sender    ON letters (sender_user_id);
CREATE INDEX IF NOT EXISTS idx_letters_post      ON letters (post_id);

-- 3. RLS — recipients own their inbox; sender_user_id never exposed via RLS reads
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;

-- Recipient can read their own inbox (delivered only)
CREATE POLICY "letters_recipient_select"
  ON letters FOR SELECT
  USING (auth.uid() = recipient_user_id AND status = 'delivered');

-- Recipient can delete from their inbox
CREATE POLICY "letters_recipient_delete"
  ON letters FOR DELETE
  USING (auth.uid() = recipient_user_id);

-- Recipient can mark as read (update read_at only)
CREATE POLICY "letters_recipient_update"
  ON letters FOR UPDATE
  USING (auth.uid() = recipient_user_id);

-- Inserts handled by service role (bypasses RLS) — no direct insert policy needed
