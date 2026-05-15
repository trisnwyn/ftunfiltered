-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001: Full-text search for posts
-- Run this once in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add a generated tsvector column (strips HTML tags, language-agnostic 'simple' config)
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS content_tsv tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'simple',
      regexp_replace(content, '<[^>]+>', ' ', 'g')
    )
  ) STORED;

-- 2. Index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_posts_content_tsv
  ON posts USING GIN (content_tsv);

-- 3. Composite index for status + type filtering alongside search
CREATE INDEX IF NOT EXISTS idx_posts_status_type
  ON posts (status, type);

-- 4. RPC function: ranked full-text search
--    Returns approved posts ranked by ts_rank (relevance).
--    Falls back gracefully if websearch_to_tsquery fails on special chars.
CREATE OR REPLACE FUNCTION search_posts(
  search_query  text,
  post_type     text    DEFAULT NULL,
  page_limit    integer DEFAULT 12,
  page_offset   integer DEFAULT 0
)
RETURNS TABLE (
  id            uuid,
  user_id       uuid,
  type          text,
  content       text,
  template      text,
  styles        jsonb,
  hearts_count  integer,
  status        text,
  created_at    timestamptz,
  accepts_letters boolean,
  rank          real,
  total_count   bigint
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  tsq tsquery;
BEGIN
  -- Try websearch_to_tsquery first (supports "phrases", -exclusions, OR)
  BEGIN
    tsq := websearch_to_tsquery('simple', search_query);
  EXCEPTION WHEN OTHERS THEN
    -- Fall back to plain query on parse error
    tsq := plainto_tsquery('simple', search_query);
  END;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.type::text,
    p.content,
    p.template,
    p.styles,
    p.hearts_count,
    p.status::text,
    p.created_at,
    p.accepts_letters,
    ts_rank(p.content_tsv, tsq)                          AS rank,
    COUNT(*) OVER ()                                     AS total_count
  FROM posts p
  WHERE
    p.status = 'approved'
    AND p.content_tsv @@ tsq
    AND (post_type IS NULL OR p.type::text = post_type)
  ORDER BY
    ts_rank(p.content_tsv, tsq) DESC,
    p.hearts_count DESC,
    p.created_at DESC
  LIMIT  page_limit
  OFFSET page_offset;
END;
$$;

-- Grant execute to anon and authenticated roles (Supabase PostgREST needs this)
GRANT EXECUTE ON FUNCTION search_posts(text, text, integer, integer)
  TO anon, authenticated;
