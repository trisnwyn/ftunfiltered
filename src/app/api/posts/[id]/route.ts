import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/* GET /api/posts/[id] — public post detail (approved only) */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select("*, post_photos(*)")
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (error || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const { post_photos, ...rest } = post as any;
  const normalized = { ...rest, photos: post_photos ?? [] };

  // Hydrate hearts + bookmarks for the logged-in user
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const [{ data: heart }, { data: bookmark }] = await Promise.all([
      supabase.from("hearts").select("id")
        .eq("post_id", id).eq("user_id", user.id).maybeSingle(),
      supabase.from("bookmarks").select("id")
        .eq("post_id", id).eq("user_id", user.id).maybeSingle(),
    ]);
    normalized.hearted_by_user    = !!heart;
    normalized.bookmarked_by_user = !!bookmark;
  }

  return NextResponse.json({ post: normalized });
}

/* DELETE /api/posts/[id] — author or admin can delete (any status) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // RLS hides non-approved rows from the normal client, so we look up
  // ownership via the service-role client.
  const admin = createAdminClient();
  const { data: post, error: lookupErr } = await admin
    .from("posts")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (lookupErr) return NextResponse.json({ error: lookupErr.message }, { status: 500 });
  if (!post)     return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const isAdmin = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .includes(user.email || "");

  if (post.user_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // posts has a DELETE policy of auth.uid() = user_id, which would block
  // admin deletes — use the service-role client to bypass.
  const { error } = await admin.from("posts").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Post deleted" });
}
