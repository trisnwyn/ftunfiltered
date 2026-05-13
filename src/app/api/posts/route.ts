import { createClient } from "@/lib/supabase/server";
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

  let postsWithHearts = posts;
  if (user) {
    const { data: userHearts } = await supabase
      .from("hearts")
      .select("post_id")
      .eq("user_id", user.id)
      .in(
        "post_id",
        posts.map((p) => p.id)
      );

    const heartedIds = new Set(userHearts?.map((h) => h.post_id) || []);
    postsWithHearts = posts.map((p) => ({
      ...p,
      hearted_by_user: heartedIds.has(p.id),
    }));
  }

  return NextResponse.json({
    posts: postsWithHearts,
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

  const { type, content, template, styles } = await request.json();

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

  // AI moderation check
  let status: "approved" | "pending" = "approved";
  try {
    const modResult = await fetch(
      `${new URL(request.url).origin}/api/moderation`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      }
    );
    const modData = await modResult.json();
    if (modData.flagged) {
      status = "pending";
    }
  } catch {
    status = "pending";
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      type,
      content,
      template: template || "minimal",
      styles: styles || {},
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
