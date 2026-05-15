import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q     = (searchParams.get("q") || "").trim();
  const type  = searchParams.get("type") || "all";
  const page  = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const offset = (page - 1) * limit;

  if (!q) {
    return NextResponse.json({ posts: [], total: 0, page, totalPages: 0 });
  }

  const supabase = await createClient();

  // Strip HTML tags from content for matching, then rank by relevance.
  // Uses Postgres `simple` text-search config (language-agnostic — works for
  // both English and Vietnamese without dictionary stemming).
  //
  // websearch_to_tsquery supports: "exact phrase", word -exclusion, word|or
  // Falls back to plainto_tsquery on parse errors (e.g. lone special chars).
  const rpcResult = await supabase.rpc("search_posts", {
    search_query: q,
    post_type:    type === "all" ? null : type,
    page_limit:   limit,
    page_offset:  offset,
  });

  if (rpcResult.error) {
    // Supabase RPC not set up yet — fall back to ilike
    let query = supabase
      .from("posts")
      .select("*, post_photos(*)", { count: "exact" })
      .eq("status", "approved")
      .ilike("content", `%${q}%`);

    if (type !== "all") query = query.eq("type", type);

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let normalized = (posts as any[]).map(({ post_photos, ...rest }) => ({
      ...rest,
      photos: post_photos ?? [],
    }));

    // Hydrate hearts + bookmarks for logged-in users
    const { data: { user } } = await supabase.auth.getUser();
    if (user && normalized.length > 0) {
      const ids = normalized.map((p) => p.id);
      const [{ data: userHearts }, { data: userBookmarks }] = await Promise.all([
        supabase.from("hearts").select("post_id").eq("user_id", user.id).in("post_id", ids),
        supabase.from("bookmarks").select("post_id").eq("user_id", user.id).in("post_id", ids),
      ]);
      const heartedIds    = new Set(userHearts?.map((h) => h.post_id) || []);
      const bookmarkedIds = new Set(userBookmarks?.map((b) => b.post_id) || []);
      normalized = normalized.map((p) => ({
        ...p,
        hearted_by_user:    heartedIds.has(p.id),
        bookmarked_by_user: bookmarkedIds.has(p.id),
      }));
    }

    return NextResponse.json({
      posts: normalized,
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  }

  // RPC succeeded — results already ranked by relevance
  const rows: any[] = rpcResult.data || [];

  // Attach post_photos via a second query for matched IDs
  const ids = rows.map((r: any) => r.id);
  let postsWithPhotos: any[] = rows.map((r: any) => ({ ...r, photos: [] }));

  if (ids.length > 0) {
    const { data: photos } = await supabase
      .from("post_photos")
      .select("*")
      .in("post_id", ids);

    if (photos) {
      postsWithPhotos = rows.map((r: any) => ({
        ...r,
        photos: photos.filter((p: any) => p.post_id === r.id),
      }));
    }
  }

  // Hydrate hearts + bookmarks for logged-in users
  const { data: { user } } = await supabase.auth.getUser();
  if (user && ids.length > 0) {
    const [{ data: userHearts }, { data: userBookmarks }] = await Promise.all([
      supabase.from("hearts").select("post_id").eq("user_id", user.id).in("post_id", ids),
      supabase.from("bookmarks").select("post_id").eq("user_id", user.id).in("post_id", ids),
    ]);
    const heartedIds    = new Set(userHearts?.map((h: any) => h.post_id) || []);
    const bookmarkedIds = new Set(userBookmarks?.map((b: any) => b.post_id) || []);
    postsWithPhotos = postsWithPhotos.map((p: any) => ({
      ...p,
      hearted_by_user:    heartedIds.has(p.id),
      bookmarked_by_user: bookmarkedIds.has(p.id),
    }));
  }

  const total = rows[0]?.total_count ?? rows.length;

  return NextResponse.json({
    posts: postsWithPhotos,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
