import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Run queries in parallel
  const [
    { data: posts, error },
    { data: typeCounts },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("*, post_photos(*)")
      .eq("status", "approved")
      .gte("created_at", since)
      .order("hearts_count", { ascending: false }),
    supabase
      .from("posts")
      .select("type")
      .eq("status", "approved")
      .gte("created_at", since),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allPosts = posts ?? [];

  // Normalize photos
  const normalized = allPosts.map(({ post_photos, ...rest }: any) => ({
    ...rest,
    photos: post_photos ?? [],
  }));

  // Top 3 by hearts
  const highlights = normalized.slice(0, 3);

  // Most posted type
  const typeFreq: Record<string, number> = {};
  (typeCounts ?? []).forEach(({ type }: any) => {
    typeFreq[type] = (typeFreq[type] || 0) + 1;
  });
  const topType = Object.entries(typeFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "confession";

  // Total hearts across all posts this week
  const totalHearts = normalized.reduce((sum: number, p: any) => sum + (p.hearts_count || 0), 0);

  // Week label
  const now  = new Date();
  const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekLabel = `${fmt(start)} – ${fmt(now)}`;

  // Hydrate hearts + bookmarks for logged-in users
  const { data: { user } } = await supabase.auth.getUser();
  let finalPosts = normalized;
  if (user && normalized.length > 0) {
    const ids = normalized.map((p: any) => p.id);
    const [{ data: userHearts }, { data: userBookmarks }] = await Promise.all([
      supabase.from("hearts").select("post_id").eq("user_id", user.id).in("post_id", ids),
      supabase.from("bookmarks").select("post_id").eq("user_id", user.id).in("post_id", ids),
    ]);
    const heartedIds    = new Set(userHearts?.map((h: any) => h.post_id) || []);
    const bookmarkedIds = new Set(userBookmarks?.map((b: any) => b.post_id) || []);
    finalPosts = normalized.map((p: any) => ({
      ...p,
      hearted_by_user:    heartedIds.has(p.id),
      bookmarked_by_user: bookmarkedIds.has(p.id),
    }));
  }

  return NextResponse.json({
    week_label: weekLabel,
    stats: {
      posts:    finalPosts.length,
      hearts:   totalHearts,
      top_type: topType,
      type_freq: typeFreq,
    },
    highlights: finalPosts.slice(0, 3),
    recent:     finalPosts.slice(3, 15),
  });
}
