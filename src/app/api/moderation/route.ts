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
 *   - Per-user in-memory rate limit (20 calls / 60s)
 *   - Caps input length to 4000 chars
 */

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX        = 20;
const callLog = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now    = Date.now();
  const window = callLog.get(userId)?.filter((t) => now - t < RATE_LIMIT_WINDOW_MS) ?? [];
  if (window.length >= RATE_LIMIT_MAX) {
    callLog.set(userId, window);
    return true;
  }
  window.push(now);
  callLog.set(userId, window);
  return false;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (isRateLimited(user.id)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

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
