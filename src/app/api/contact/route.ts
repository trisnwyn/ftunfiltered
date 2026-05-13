import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, subject, body } = await request.json();

  if (!email || !subject || !body) {
    return NextResponse.json(
      { error: "Email, subject, and body are required" },
      { status: 400 }
    );
  }

  if (subject.length > 200 || body.length > 2000) {
    return NextResponse.json(
      { error: "Subject or body too long" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("admin_messages")
    .insert({ email, subject, body });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Message sent to admin" });
}
