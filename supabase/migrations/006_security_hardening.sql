-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 006: Security & policy hardening
-- Run in Supabase SQL Editor after 005_user_settings.sql
--
-- Fixes:
--   A. Storage policy paths didn't match upload paths (postId/... vs uid/...)
--      AND allowed any authenticated user to upload anywhere in the bucket
--   B. Reports table allowed forging arbitrary user_id (with check (true))
--   C. Letters UPDATE policy didn't restrict columns — recipients could
--      change content / sender_user_id from a direct Supabase client
-- ─────────────────────────────────────────────────────────────────────────────


-- ════════════════════════════════════════════════════════════════════════════
-- A. Storage policies for the `post-photos` bucket
-- ════════════════════════════════════════════════════════════════════════════

-- Drop any old / mismatched policies (idempotent — won't error if missing).
DROP POLICY IF EXISTS "Public can view post photos"          ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own post photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post photos" ON storage.objects;
DROP POLICY IF EXISTS "post_photos_read_public"              ON storage.objects;
DROP POLICY IF EXISTS "post_photos_insert_owner"             ON storage.objects;
DROP POLICY IF EXISTS "post_photos_delete_owner"             ON storage.objects;

-- Public read — anyone can view photos
CREATE POLICY "post_photos_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-photos');

-- Insert: must own the post whose ID is the first folder segment of `name`.
-- (uploads use path `${postId}/${timestamp}-${i}.${ext}`)
CREATE POLICY "post_photos_insert_owner"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-photos'
    AND EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = ((storage.foldername(name))[1])::uuid
        AND p.user_id = auth.uid()
    )
  );

-- Delete: same ownership check (so users can clean up their own files,
-- and a post deletion cascade is handled separately via API)
CREATE POLICY "post_photos_delete_owner"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-photos'
    AND EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = ((storage.foldername(name))[1])::uuid
        AND p.user_id = auth.uid()
    )
  );


-- ════════════════════════════════════════════════════════════════════════════
-- B. Reports — prevent forging user_id from a direct Supabase client
-- ════════════════════════════════════════════════════════════════════════════

-- Drop any open insert policies and recreate with strict check
DROP POLICY IF EXISTS "Users can insert reports"  ON reports;
DROP POLICY IF EXISTS "reports_insert"            ON reports;
DROP POLICY IF EXISTS "reports_insert_any"        ON reports;
DROP POLICY IF EXISTS "reports_insert_own"        ON reports;

CREATE POLICY "reports_insert_own"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════════════════════
-- C. Letters — restrict UPDATE to read_at column only
-- ════════════════════════════════════════════════════════════════════════════
-- Column-level privileges in PostgreSQL: revoke the table-wide UPDATE grant
-- and re-grant only on the column we want recipients to touch.
-- The existing `letters_recipient_update` RLS still restricts WHICH rows
-- recipients can update; this layer restricts WHICH columns.

REVOKE UPDATE ON public.letters FROM authenticated;
GRANT  UPDATE (read_at) ON public.letters TO authenticated;
