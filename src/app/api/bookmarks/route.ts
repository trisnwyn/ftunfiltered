import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/* GET /api/bookmarks — returns all bookmarked posts for the logged-in user */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: bookmarkRows, error: bErr } = await supabase
    .from("bookmarks")
    .select("post_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });
  if (!bookmarkRows || bookmarkRows.length === 0) {
    return NextResponse.json({ posts: [] });
  }

  const ids = bookmarkRows.map((b) => b.post_id);

  const { data: posts, error: pErr } = await supabase
    .from("posts")
    .select("*, post_photos(*)")
    .in("id", ids)
    .eq("status", "approved");

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  // Remap post_photos → photos, preserve bookmark order
  const postsById = Object.fromEntries(
    (posts as any[]).map(({ post_photos, ...rest }) => [
      rest.id,
      { ...rest, photos: post_photos ?? [], bookmarked_by_user: true },
    ])
  );
  const ordered = ids
    .map((id) => postsById[id])
    .filter(Boolean);

  return NextResponse.json({ posts: ordered });
}

/* POST /api/bookmarks — toggle bookmark for { post_id } */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { post_id } = await request.json();
  if (!post_id) return NextResponse.json({ error: "post_id required" }, { status: 400 });

  // Check if already bookmarked
  const { data: existing, error: lookupErr } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", post_id)
    .maybeSingle();

  if (lookupErr) {
    return NextResponse.json({ error: lookupErr.message }, { status: 500 });
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", existing.id);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }
    return NextResponse.json({ bookmarked: false });
  } else {
    const { error: insErr } = await supabase
      .from("bookmarks")
      .insert({ user_id: user.id, post_id });
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
    return NextResponse.json({ bookmarked: true });
  }
}
