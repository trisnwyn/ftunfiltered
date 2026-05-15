import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/* GET /api/settings — fetch (or create) the current user's settings row */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();

  // Try to fetch existing row
  let { data: settings } = await admin
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Create default row if it doesn't exist
  if (!settings) {
    const { data: created, error: insertErr } = await admin
      .from("user_settings")
      .insert({ user_id: user.id })
      .select()
      .single();
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
    settings = created;
  }

  return NextResponse.json({
    settings,
    account: { email: user.email, joined: user.created_at },
  });
}

/* PATCH /api/settings — update settings */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.accept_letters_globally === "boolean") {
    updates.accept_letters_globally = body.accept_letters_globally;
  }
  if (typeof body.email_notifications === "boolean") {
    updates.email_notifications = body.email_notifications;
  }

  const admin = createAdminClient();

  // Upsert (insert default row if missing, then update)
  const { error } = await admin
    .from("user_settings")
    .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
