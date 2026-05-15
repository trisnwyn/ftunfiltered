-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 007: Fix surviving permissive policies + posts author visibility
-- Run in Supabase SQL Editor after 006_security_hardening.sql
--
-- Fixes:
--   A. 006 dropped policy names that never existed — the ACTUAL old permissive
--      policies ("Authenticated users can upload post photos", etc.) are still
--      active, making the stricter 006 policies redundant.
--   B. The storage ownership CHECK in 006 does an EXISTS on public.posts.
--      But posts RLS only exposes *approved* posts — so uploading photos for a
--      brand-new (pending) post fails because the post isn't visible.
--      Fix: add a SELECT policy that lets authors see their own posts regardless
--      of status.
-- ─────────────────────────────────────────────────────────────────────────────


-- ════════════════════════════════════════════════════════════════════════════
-- A. Drop the ACTUAL old permissive storage / reports policies by their real
--    names (the names created in the original schema, not the guesses in 006).
-- ════════════════════════════════════════════════════════════════════════════

-- Storage — these were the bucket policies from the original setup wizard:
DROP POLICY IF EXISTS "Authenticated users can upload post photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos"                ON storage.objects;

-- Reports — original open insert:
DROP POLICY IF EXISTS "Authenticated users can report"             ON reports;

-- Belt-and-suspenders: also drop any other common variants that may exist
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_0"  ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_1"  ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01fe_2"  ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads"                ON storage.objects;
DROP POLICY IF EXISTS "Allow public read"                          ON storage.objects;


-- ════════════════════════════════════════════════════════════════════════════
-- B. Let post authors see their own posts regardless of status.
--    This is required so the storage INSERT policy's EXISTS(...) sub-query can
--    find a newly-created pending post when the author uploads photos.
-- ════════════════════════════════════════════════════════════════════════════

-- Idempotent: drop first in case an earlier partial run created it
DROP POLICY IF EXISTS "posts_author_select_own" ON public.posts;

CREATE POLICY "posts_author_select_own"
  ON public.posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Note: this is ADDITIVE — the existing "Anyone can view approved posts"
-- (or equivalent) policy stays in place.  PostgreSQL RLS policies are ORed,
-- so a user can see (approved posts) OR (own posts of any status).
