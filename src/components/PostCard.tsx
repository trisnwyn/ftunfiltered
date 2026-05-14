"use client";

import { useState, useMemo } from "react";
import DOMPurify from "dompurify";
import type { Post } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { getTemplate } from "@/lib/templates";

const TYPE_CONFIG = {
  confession: { label: "Confession" },
  letter:     { label: "Letter" },
  shoutout:   { label: "Shoutout" },
  rant:       { label: "Rant" },
} as const;

const TILTS = [
  "rotate-[-1.5deg]", "rotate-[1.2deg]",  "rotate-[-0.8deg]",
  "rotate-[2deg]",    "rotate-[-2deg]",   "rotate-[0.8deg]",
  "rotate-[1.8deg]",  "rotate-[-1.2deg]", "rotate-[0.3deg]",
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/* ── Per-template decoration layer ──────────────────────── */
function CardDecoration({ templateId, usePin }: { templateId: string; usePin: boolean }) {
  if (templateId === "dark_night") {
    return (
      <>
        {/* Moon crescent */}
        <div className="absolute top-3 right-5 opacity-40 pointer-events-none">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#C4A882">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </div>
        {/* Stars */}
        {([
          { top: "12%", left: "10%", size: 5 },
          { top: "22%", left: "78%", size: 4 },
          { top: "6%",  left: "52%", size: 3 },
          { top: "38%", left: "88%", size: 3 },
        ] as const).map((s, i) => (
          <div key={i} className="absolute opacity-25 pointer-events-none"
            style={{ top: s.top, left: s.left }}>
            <svg width={s.size + 2} height={s.size + 2} viewBox="0 0 10 10" fill="#DDD5C8">
              <polygon points="5,0 6,3.5 10,3.5 7,6 8,10 5,7.5 2,10 3,6 0,3.5 4,3.5" />
            </svg>
          </div>
        ))}
      </>
    );
  }

  if (templateId === "blush") {
    return (
      <>
        {/* Pink-tinted tape or pin */}
        {usePin ? (
          <div className="pin" style={{
            background: "radial-gradient(circle at 40% 35%, #E8B4AF 0%, #C4756E 50%, #904040 100%)",
          }} />
        ) : (
          <div className="tape tape-md tape-center" style={{
            background: "linear-gradient(180deg, rgba(230,175,170,0.9), rgba(210,150,145,0.85))",
          }} />
        )}
        {/* Botanical sprig — bottom-right */}
        <div className="absolute bottom-3 right-3 opacity-[0.18] pointer-events-none">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
            stroke="#B05C58" strokeWidth="1.3" strokeLinecap="round">
            <path d="M24 44 C24 44 24 28 24 16" />
            <path d="M24 30 C24 30 14 24 9 18" />
            <path d="M24 30 C24 30 34 24 39 18" />
            <path d="M24 22 C24 22 16 16 12 10" />
            <path d="M24 22 C24 22 32 16 36 10" />
            <ellipse cx="9"  cy="17" rx="3" ry="4.5" transform="rotate(-30 9 17)"  fill="#B05C58" opacity="0.4" stroke="none"/>
            <ellipse cx="39" cy="17" rx="3" ry="4.5" transform="rotate(30 39 17)"  fill="#B05C58" opacity="0.4" stroke="none"/>
            <ellipse cx="12" cy="9"  rx="2.5" ry="4" transform="rotate(-20 12 9)" fill="#B05C58" opacity="0.4" stroke="none"/>
            <ellipse cx="36" cy="9"  rx="2.5" ry="4" transform="rotate(20 36 9)"  fill="#B05C58" opacity="0.4" stroke="none"/>
          </svg>
        </div>
      </>
    );
  }

  if (templateId === "ocean") {
    return (
      <>
        {/* Wave bar at top */}
        <div className="absolute top-0 left-0 right-0 h-9 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 400 36" preserveAspectRatio="none"
            className="w-full h-full" style={{ opacity: 0.18 }}>
            <path d="M0,18 C40,8 80,28 120,18 S200,8 240,18 S320,28 360,18 S390,10 400,18 L400,0 L0,0 Z"
              fill="#3D6B8A" />
          </svg>
        </div>
        {/* Anchor watermark */}
        <div className="absolute bottom-4 right-4 opacity-[0.08] pointer-events-none">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
            stroke="#3D6B8A" strokeWidth="1.4" strokeLinecap="round">
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v14" />
            <path d="M7 11H5a2 2 0 0 0 0 4h2" />
            <path d="M17 11h2a2 2 0 0 1 0 4h-2" />
            <path d="M7 21c0-3.5 3-5 5-5s5 1.5 5 5" />
          </svg>
        </div>
      </>
    );
  }

  /* Default scrapbook */
  return (
    <>
      {usePin ? <div className="pin" /> : <div className="tape tape-md tape-center" />}
      {/* Quotation watermark */}
      <div className="absolute bottom-6 right-5 font-serif text-5xl pointer-events-none select-none"
        style={{ color: "rgba(180,167,147,0.10)", lineHeight: 1 }}>
        &rdquo;
      </div>
      {/* Corner fold */}
      <div className="absolute bottom-0 right-0 pointer-events-none">
        <svg width="18" height="18" viewBox="0 0 18 18">
          <polygon points="18,0 18,18 0,18" fill="rgba(180,167,147,0.18)" />
        </svg>
      </div>
    </>
  );
}

/* ── Inner paper patterns ────────────────────────────────── */
const INNER_PATTERNS: Record<string, React.CSSProperties> = {
  default: {
    backgroundImage:
      "repeating-linear-gradient(transparent, transparent 23px, rgba(180,167,147,0.11) 23px, rgba(180,167,147,0.11) 24px)",
    backgroundSize: "100% 24px",
  },
  dark_night: {
    backgroundImage:
      "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
    backgroundSize: "18px 18px",
  },
  blush: {
    backgroundImage:
      "radial-gradient(circle, rgba(180,92,88,0.10) 1px, transparent 1px)",
    backgroundSize: "16px 16px",
  },
  ocean: {
    backgroundImage:
      "linear-gradient(rgba(61,107,138,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(61,107,138,0.07) 1px, transparent 1px)",
    backgroundSize: "20px 20px",
  },
};

/* ── Main component ──────────────────────────────────────── */
export default function PostCard({
  post,
  index = 0,
}: {
  post: Post;
  index?: number;
}) {
  const { user } = useAuth();
  const [hearts, setHearts] = useState(post.hearts_count);
  const [hearted, setHearted] = useState(post.hearted_by_user || false);
  const [busy, setBusy] = useState(false);

  const config   = TYPE_CONFIG[post.type];
  const tmpl     = getTemplate(post.template);
  const tilt     = TILTS[index % TILTS.length];
  const usePin   = index % 3 !== 0;

  const sanitized = useMemo(
    () =>
      DOMPurify.sanitize(post.content, {
        ALLOWED_TAGS:  ["b","strong","i","em","u","s","p","br","h2","h3","blockquote","span"],
        ALLOWED_ATTR:  ["style"],
      }),
    [post.content]
  );

  const photos      = [...(post.photos ?? [])].sort((a, b) => a.position - b.position);
  const thumbnail   = photos[0];
  const extraPhotos = photos.slice(1);

  async function toggleHeart() {
    if (!user || busy) return;
    setBusy(true);
    const res = await fetch("/api/hearts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setHearted(data.hearted);
      setHearts((h) => (data.hearted ? h + 1 : h - 1));
    }
    setBusy(false);
  }

  async function reportPost() {
    if (!user) return;
    const reason = prompt("Why are you reporting this post?");
    if (reason === null) return;
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id, reason }),
    });
    alert("Report submitted. Thank you.");
  }

  return (
    <article
      className={`relative rounded-sm pt-3 overflow-hidden transition-all duration-300 hover:shadow-lg hover:rotate-0 hover:z-10 ${tilt}`}
      style={{
        background:  tmpl.cardBg,
        border:      `1px solid ${tmpl.cardBorder}`,
        boxShadow:   "2px 3px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Blurred photo background */}
      {thumbnail && (
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 pointer-events-none"
          style={{
            backgroundImage: `url(${thumbnail.url})`,
            opacity: 0.13,
            filter:  "blur(10px)",
          }}
        />
      )}

      {/* Template decoration */}
      <CardDecoration templateId={tmpl.id} usePin={usePin} />

      {/* Inner card */}
      <div
        className="relative mx-4 mb-4 mt-3 px-5 py-5 rounded-[2px]"
        style={{
          border:     `1px solid ${tmpl.innerBorder}`,
          ...INNER_PATTERNS[tmpl.id] ?? {},
        }}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className={`text-[10px] tracking-[0.2em] uppercase mb-0.5 ${tmpl.metaClass}`}>
              N&#x2070;{String(index + 1).padStart(2, "0")}
            </p>
            <h3 className={`font-serif text-lg font-medium ${tmpl.headingClass}`}>
              {config.label}
            </h3>
          </div>
          <span className={`text-[11px] italic font-serif mt-1 ${tmpl.metaClass}`}>
            {timeAgo(post.created_at)}
          </span>
        </div>

        {/* Content */}
        <div
          className={`post-content font-serif text-[15px] leading-relaxed ${tmpl.textClass}`}
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />

        {/* Extra photos */}
        {extraPhotos.length > 0 && (
          <div className="mt-4 flex gap-2">
            {extraPhotos.map((photo) => (
              <img
                key={photo.id}
                src={photo.url}
                alt=""
                className="h-24 w-24 rounded-sm object-cover"
                style={{ border: `1px solid ${tmpl.innerBorder}` }}
              />
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="my-4 border-t border-dashed" style={{ borderColor: tmpl.cardBorder }} />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleHeart}
            disabled={!user || busy}
            className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
              hearted ? `${tmpl.heartActive} font-medium` : tmpl.heartInactive
            } disabled:opacity-40`}
          >
            {hearted ? "❤️" : "♡"} {hearts}
          </button>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] tracking-[0.15em] uppercase italic opacity-60 ${tmpl.metaClass}`}>
              &mdash; a stranger
            </span>
            <button
              onClick={reportPost}
              disabled={!user}
              className={`transition-colors disabled:opacity-30 ${tmpl.reportClass}`}
              title="Report"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
