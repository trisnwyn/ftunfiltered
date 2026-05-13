import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { text } = await request.json();

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ flagged: false, reason: "moderation_disabled" });
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `You are a content moderator for a school confession board. Flag content that contains:
- Hate speech, slurs, or targeted harassment
- Explicit sexual content
- Threats of violence or self-harm
- Doxxing or sharing personal information (full names, phone numbers, addresses)
- Spam or advertisements

Do NOT flag: mild profanity, venting/ranting, relationship confessions, school complaints, anonymous shoutouts.

Respond with ONLY a JSON object: {"flagged": true/false, "reason": "brief reason or empty string"}`,
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0,
          max_tokens: 100,
        }),
      }
    );

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ flagged: false, reason: "parse_error" });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      flagged: !!result.flagged,
      reason: result.reason || "",
    });
  } catch {
    return NextResponse.json({ flagged: false, reason: "api_error" });
  }
}
