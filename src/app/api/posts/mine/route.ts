import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Use admin client to bypass RLS (server-side anon client doesn't reliably
  // forward the JWT, so RLS sees an `anon` role — same issue as on insert)
  const admin = createAdminClient();
  const { data: posts, error } = await admin
    .from("posts")
    .select("*, post_photos(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Remap post_photos → photos
  const normalized = (posts as any[]).map(({ post_photos, ...rest }) => ({
    ...rest,
    photos: post_photos ?? [],
  }));

  return NextResponse.json({ posts: normalized });
}
