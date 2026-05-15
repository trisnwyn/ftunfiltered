import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { moderateContent } from "@/lib/moderation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*, post_photos(*)", { count: "exact" })
    .eq("status", "approved");

  if (type && type !== "all") {
    query = query.eq("type", type);
  }

  if (sort === "trending") {
    query = query.order("hearts_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data: posts, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Remap post_photos → photos to match Post type
  const normalized = (posts as any[]).map(({ post_photos, ...rest }) => ({
    ...rest,
    photos: post_photos ?? [],
  }));

  let postsWithMeta = normalized;
  if (user) {
    const postIds = normalized.map((p) => p.id);

    const [{ data: userHearts }, { data: userBookmarks }] = await Promise.all([
      supabase.from("hearts").select("post_id").eq("user_id", user.id).in("post_id", postIds),
      supabase.from("bookmarks").select("post_id").eq("user_id", user.id).in("post_id", postIds),
    ]);

    const heartedIds    = new Set(userHearts?.map((h) => h.post_id) || []);
    const bookmarkedIds = new Set(userBookmarks?.map((b) => b.post_id) || []);

    postsWithMeta = normalized.map((p) => ({
      ...p,
      hearted_by_user:    heartedIds.has(p.id),
      bookmarked_by_user: bookmarkedIds.has(p.id),
    }));
  }

  return NextResponse.json({
    posts: postsWithMeta,
    total: count,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { type, content, template, styles, accepts_letters, content_warnings } = await request.json();

  if (!type || !content) {
    return NextResponse.json(
      { error: "Type and content are required" },
      { status: 400 }
    );
  }

  if (content.length > 2000) {
    return NextResponse.json(
      { error: "Content must be under 2000 characters" },
      { status: 400 }
    );
  }

  const validTypes = ["confession", "letter", "shoutout", "rant"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid post type" }, { status: 400 });
  }

  // AI moderation check (in-process; no public HTTP proxy)
  const modResult = await moderateContent(content);
  const status: "approved" | "pending" = modResult.flagged ? "pending" : "approved";

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("posts")
    .insert({
      user_id: user.id,
      type,
      content,
      template:        template || "default",
      styles:          styles || {},
      accepts_letters:  accepts_letters === true,
      content_warnings: Array.isArray(content_warnings) ? content_warnings : [],
      status,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    post: data,
    moderated: status === "pending",
    message:
      status === "pending"
        ? "Your post is under review and will appear once approved."
        : "Post published!",
  });
}
