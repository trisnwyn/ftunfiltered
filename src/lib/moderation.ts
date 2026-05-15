/**
 * Groq-based content moderation (server-only).
 *
 * Imported directly by /api/posts and /api/letters so the moderation logic
 * is NOT exposed as a public HTTP proxy that anyone could spam.
 */

const MODERATION_PROMPT = `You are a bilingual content moderator (English + Vietnamese) for an anonymous school confession board at FTU (Foreign Trade University, Vietnam). Posts may be written in English, Vietnamese, or a mix of both ("Tiếng Việt", with or without diacritics — "teen code" like "địt", "đm", "đmm", "vcl", "vl", "đb", "cc", "loz" etc.).

FLAG content that contains:
- Hate speech, slurs, or targeted harassment toward a person, ethnicity, religion, gender, or sexual orientation (English or Vietnamese — e.g. racial slurs, "bê đê" used as a slur, "con đĩ", "thằng chó")
- Explicit sexual content / pornographic descriptions (English or Vietnamese — e.g. detailed sex acts, "địt nhau", "làm tình" with explicit detail)
- Credible threats of violence or self-harm (suicide notes, "tôi muốn chết", "I want to kill ___")
- Doxxing: full real names with identifying info, phone numbers, exact addresses, ID numbers, student IDs
- Spam, advertisements, links to external services
- Naming specific FTU students/staff in a defamatory or sexually explicit context

Do NOT flag (these are ALLOWED):
- Mild profanity used as emphasis, not as an attack: "đm", "vcl", "vl", "đmm", "cc", "fuck", "shit", "damn"
- Venting, ranting, frustration about school, professors, exams, life
- Relationship confessions, crushes, breakups, heartbreak (even with first names only)
- Anonymous shoutouts and gratitude
- Sad or melancholic content that isn't a credible self-harm threat
- Vietnamese internet slang and teen code that isn't a slur

When in doubt, lean toward NOT flagging — this is a venting space. Only flag content that is clearly harmful.

Respond with ONLY a JSON object: {"flagged": true/false, "reason": "brief reason in English or empty string"}`;

export interface ModerationResult {
  flagged: boolean;
  reason: string;
}

/**
 * Returns `{flagged: false}` (fail-open) if no Groq key is configured,
 * to avoid blocking posts on dev machines or misconfigured deploys.
 * For unknown errors during the API call, returns `{flagged: true, reason: "api_error"}`
 * so the caller can hold the post for manual review.
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { flagged: false, reason: "moderation_disabled" };

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
            { role: "system", content: MODERATION_PROMPT },
            { role: "user",   content: text },
          ],
          temperature: 0,
          max_tokens: 100,
        }),
      }
    );

    if (!response.ok) {
      return { flagged: true, reason: "api_error" };
    }

    const data    = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { flagged: true, reason: "parse_error" };

    const result = JSON.parse(jsonMatch[0]);
    return {
      flagged: !!result.flagged,
      reason:  typeof result.reason === "string" ? result.reason : "",
    };
  } catch {
    return { flagged: true, reason: "api_error" };
  }
}
