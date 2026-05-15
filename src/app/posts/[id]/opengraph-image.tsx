import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const size    = { width: 1200, height: 630 };
export const contentType = "image/png";

const TYPE_META: Record<string, { label: string; accent: string }> = {
  confession: { label: "Confession",  accent: "#7C5C3E" },
  letter:     { label: "Letter",      accent: "#7C5C3E" },
  shoutout:   { label: "Shoutout",    accent: "#7C5C3E" },
  rant:       { label: "Rant",        accent: "#7C5C3E" },
};

/** Strip HTML tags and collapse whitespace */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

export default async function PostOGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("type, content, template, hearts_count")
    .eq("id", id)
    .eq("status", "approved")
    .single();

  const type    = (post?.type as string) || "confession";
  const meta    = TYPE_META[type] || TYPE_META.confession;
  const raw     = post ? stripHtml(post.content) : "Something was shared here.";
  const excerpt = truncate(raw, 220);
  const hearts  = post?.hearts_count ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F6F3ED",
          fontFamily: "Georgia, serif",
          padding: "0",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div style={{
          width: "100%", height: "6px",
          backgroundColor: meta.accent,
          display: "flex",
        }} />

        {/* Main content area */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px 56px",
        }}>
          {/* Type label */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              fontSize: "13px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: meta.accent,
              fontFamily: "Georgia, serif",
            }}>
              {meta.label}
            </div>
            <div style={{
              width: "32px", height: "1px",
              backgroundColor: "rgba(124,92,62,0.3)",
            }} />
            <div style={{
              fontSize: "13px",
              color: "rgba(90,75,60,0.5)",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
            }}>
              FTUnfiltered
            </div>
          </div>

          {/* Quote */}
          <div style={{
            fontSize: raw.length > 120 ? "32px" : "40px",
            lineHeight: "1.45",
            color: "#1A1512",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            maxWidth: "900px",
          }}>
            &ldquo;{excerpt}&rdquo;
          </div>

          {/* Footer row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{
              fontSize: "15px",
              color: "rgba(90,75,60,0.55)",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
            }}>
              — a stranger
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "15px",
              color: "rgba(90,75,60,0.55)",
              fontFamily: "Georgia, serif",
            }}>
              <span>♡</span>
              <span>{hearts}</span>
            </div>
          </div>
        </div>

        {/* Bottom ruled line */}
        <div style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          right: "0",
          height: "4px",
          backgroundColor: "rgba(180,167,147,0.25)",
          display: "flex",
        }} />

        {/* Corner quotation mark watermark */}
        <div style={{
          position: "absolute",
          bottom: "24px",
          right: "56px",
          fontSize: "120px",
          color: "rgba(180,167,147,0.10)",
          fontFamily: "Georgia, serif",
          lineHeight: "1",
        }}>
          &rdquo;
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
