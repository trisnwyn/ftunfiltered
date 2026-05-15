import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/* GET /api/letters/count — unread count for navbar badge */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ unread: 0 });

  const { count, error } = await supabase
    .from("letters")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", user.id)
    .eq("status", "delivered")
    .is("read_at", null);

  if (error) return NextResponse.json({ unread: 0 });
  return NextResponse.json({ unread: count ?? 0 });
}
