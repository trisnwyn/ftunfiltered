import { createClient } from "@/lib/supabase/server";
import { moderateContent } from "@/lib/moderation";
import { NextResponse } from "next/server";

/**
 * /api/moderation
 *
 * Authenticated endpoint kept for testing / future client-side checks.
 * The app's own posts and letters APIs call `moderateContent()` directly
 * (in-process) so this route is NOT a hot path and not a public proxy.
 *
 * Defenses:
 *   - Requires a signed-in user
 *   - Per-user DB-backed rate limit (20 calls / 60s) — survives cold starts
 *     and works across multiple server instances
 *   - Caps input length to 4000 chars
 */

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX        = 20;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/** Returns true when the user has hit the rate limit. Fail-open on DB error. */
async function isRateLimited(userId: string, supabase: SupabaseClient): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error } = await supabase
    .from("moderation_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", windowStart);

  if (error) return false; // fail open — don't block on a missing table
  return (count ?? 0) >= RATE_LIMIT_MAX;
}

/** Inserts a log entry and prunes entries older than 24 h (fire-and-forget). */
async function logCall(userId: string, supabase: SupabaseClient): Promise<void> {
  await supabase.from("moderation_log").insert({ user_id: userId });

  // Best-effort cleanup — don't await so we don't delay the response
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  supabase.from("moderation_log")
    .delete()
    .eq("user_id", userId)
    .lt("created_at", cutoff);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (await isRateLimited(user.id, supabase)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  await logCall(user.id, supabase);

  const { text } = await request.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: "Text too long" }, { status: 413 });
  }

  const result = await moderateContent(text);
  return NextResponse.json(result);
}
