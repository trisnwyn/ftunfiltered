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

/**
 * GET /api/admin/reports
 * Returns posts that have ≥1 unresolved report, grouped with their report list,
 * sorted by report count descending.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Fetch all unresolved reports with their parent post + photos.
  // The `resolved` column requires migration 009 — if it doesn't exist yet we
  // fall back to fetching all reports (no resolution filter) so the admin can
  // at least see and act on them.
  const { data: rows, error } = await admin
    .from("reports")
    .select("id, post_id, reason, created_at, posts(*, post_photos(*))")
    .eq("resolved", false)
    .order("created_at", { ascending: true });

  let finalRows = rows;

  if (error) {
    // 42703 = undefined_column — migration 009 not yet applied
    const isMissingColumn =
      error.code === "42703" ||
      (error.message ?? "").toLowerCase().includes("resolved");

    if (!isMissingColumn) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fallback: fetch all reports, no resolved filter
    const { data: allRows, error: fallbackErr } = await admin
      .from("reports")
      .select("id, post_id, reason, created_at, posts(*, post_photos(*))")
      .order("created_at", { ascending: true });

    if (fallbackErr) {
      return NextResponse.json({ error: fallbackErr.message }, { status: 500 });
    }
    finalRows = allRows;
  }

  // Group by post
  const map = new Map<string, { post: any; reports: any[] }>();
  for (const row of (finalRows ?? []) as any[]) {
    const { posts: rawPost, id, reason, created_at } = row;
    if (!rawPost) continue; // post was deleted (cascade should have cleaned up, but be safe)

    const { post_photos, ...postRest } = rawPost;
    if (!map.has(postRest.id)) {
      map.set(postRest.id, {
        post: { ...postRest, photos: post_photos ?? [] },
        reports: [],
      });
    }
    map.get(postRest.id)!.reports.push({ id, reason, created_at });
  }

  // Sort by most-reported first
  const grouped = Array.from(map.values()).sort(
    (a, b) => b.reports.length - a.reports.length
  );

  return NextResponse.json({ reported: grouped });
}

/**
 * PATCH /api/admin/reports
 * Body: { post_id: string, action: "dismiss" | "remove" }
 *
 * dismiss — marks all unresolved reports for the post as resolved (post stays live)
 * remove  — same, plus sets post status = "rejected"
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { post_id, action } = await request.json();
  if (!post_id || !["dismiss", "remove"].includes(action)) {
    return NextResponse.json(
      { error: 'post_id and action ("dismiss" | "remove") required' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Resolve all outstanding reports for this post
  const { error: rErr } = await admin
    .from("reports")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("post_id", post_id)
    .eq("resolved", false);

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  // Remove: also reject the post so it disappears from the feed
  if (action === "remove") {
    const { error: pErr } = await admin
      .from("posts")
      .update({ status: "rejected" })
      .eq("id", post_id);

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  return NextResponse.json({
    message: action === "remove" ? "Post removed and reports resolved" : "Reports dismissed",
  });
}
