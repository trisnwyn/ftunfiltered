import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/* DELETE /api/account — permanently delete the current user + all their data */
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  // Cascading FKs handle posts, bookmarks, letters, user_settings, etc.
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sign out the now-orphaned session
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
