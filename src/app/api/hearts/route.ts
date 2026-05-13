import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { post_id } = await request.json();

  if (!post_id) {
    return NextResponse.json(
      { error: "post_id is required" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("hearts")
    .select("id")
    .eq("post_id", post_id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("hearts")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ hearted: false });
  }

  const { error } = await supabase
    .from("hearts")
    .insert({ post_id, user_id: user.id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ hearted: true });
}
