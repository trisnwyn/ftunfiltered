import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { moderateContent } from "@/lib/moderation";
import { NextResponse } from "next/server";

const MAX_LENGTH      = 1000;
const RATE_LIMIT_DAY  = 5;   // max letters sent per sender per day
const RATE_LIMIT_RECV = 3;   // max letters received per post per day

/* GET /api/letters — inbox for the logged-in user */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: letters, error } = await supabase
    .from("letters")
    .select(`
      id, post_id, content, status, read_at, created_at,
      post:posts ( id, type, content, template )
    `)
    .eq("recipient_user_id", user.id)
    .eq("status", "delivered")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ letters: letters || [] });
}

/* POST /api/letters — send a letter */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { post_id, content } = await request.json();

  if (!post_id || !content?.trim()) {
    return NextResponse.json({ error: "post_id and content are required" }, { status: 400 });
  }
  if (content.trim().length > MAX_LENGTH) {
    return NextResponse.json(
      { error: `Letters must be under ${MAX_LENGTH} characters.` },
      { status: 400 }
    );
  }

  // Fetch the post — verify it exists, is approved, and accepts letters
  const { data: post } = await supabase
    .from("posts")
    .select("id, user_id, accepts_letters, status")
    .eq("id", post_id)
    .single();

  if (!post || post.status !== "approved") {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  if (!post.accepts_letters) {
    return NextResponse.json({ error: "This post doesn't accept letters." }, { status: 403 });
  }
  if (post.user_id === user.id) {
    return NextResponse.json({ error: "You can't write to yourself." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Check recipient's global letter setting (defaults to true if no row)
  const { data: recipientSettings } = await admin
    .from("user_settings")
    .select("accept_letters_globally")
    .eq("user_id", post.user_id)
    .maybeSingle();

  if (recipientSettings && recipientSettings.accept_letters_globally === false) {
    return NextResponse.json(
      { error: "This person isn't accepting letters right now." },
      { status: 403 }
    );
  }

  // Rate limit: sender — 5 letters per 24h
  const yesterday = new Date(Date.now() - 86_400_000).toISOString();

  const { count: sentCount } = await admin
    .from("letters")
    .select("id", { count: "exact", head: true })
    .eq("sender_user_id", user.id)
    .gte("created_at", yesterday);

  if ((sentCount ?? 0) >= RATE_LIMIT_DAY) {
    return NextResponse.json(
      { error: "You've sent too many letters today. Try again tomorrow." },
      { status: 429 }
    );
  }

  // Rate limit: recipient — 3 letters per post per 24h
  const { count: recvCount } = await admin
    .from("letters")
    .select("id", { count: "exact", head: true })
    .eq("post_id", post_id)
    .gte("created_at", yesterday);

  if ((recvCount ?? 0) >= RATE_LIMIT_RECV) {
    return NextResponse.json(
      { error: "This post has received too many letters today." },
      { status: 429 }
    );
  }

  // AI moderation (in-process)
  const modResult = await moderateContent(content);
  const status: "delivered" | "pending" = modResult.flagged ? "pending" : "delivered";

  // Insert via admin client (bypasses RLS)
  const { error: insertErr } = await admin.from("letters").insert({
    post_id,
    sender_user_id:    user.id,
    recipient_user_id: post.user_id,
    content:           content.trim(),
    status,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    moderated: status === "pending",
    message: status === "pending"
      ? "Your letter is under review and will be delivered once approved."
      : "Letter sent anonymously.",
  });
}
