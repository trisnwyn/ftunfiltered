import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .includes(email);
}

/* GET /api/admin/posts — pending moderation queue */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // RLS on `posts` only exposes status='approved' to authenticated readers,
  // so we need the service-role client to see pending rows.
  const admin = createAdminClient();
  const { data: posts, error } = await admin
    .from("posts")
    .select("*, post_photos(*)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const normalized = (posts as any[]).map(({ post_photos, ...rest }) => ({
    ...rest,
    photos: post_photos ?? [],
  }));

  return NextResponse.json({ posts: normalized });
}

/* PATCH /api/admin/posts — approve / reject a post */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { post_id, action } = await request.json();
  if (!post_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "post_id and action (approve/reject) required" },
      { status: 400 }
    );
  }

  const status = action === "approve" ? "approved" : "rejected";

  // posts table has no UPDATE policy — service-role client bypasses RLS.
  const admin = createAdminClient();
  const { error } = await admin
    .from("posts")
    .update({ status })
    .eq("id", post_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: `Post ${status}` });
}
