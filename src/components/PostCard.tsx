"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import DOMPurify from "dompurify";
import type { Post } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toaster";
import { getTemplate } from "@/lib/templates";
import { getCWLabels } from "@/lib/content-warnings";

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
  const toast    = useToast();
  const [hearts, setHearts]         = useState(post.hearts_count);
  const [hearted, setHearted]       = useState(post.hearted_by_user || false);
  const [bookmarked, setBookmarked] = useState(post.bookmarked_by_user || false);
  const [busy, setBusy]             = useState(false);
  const [showComposer, setShowComposer]   = useState(false);
  const [letterContent, setLetterContent] = useState("");
  const [letterSending, setLetterSending] = useState(false);
  const hasWarnings = (post.content_warnings?.length ?? 0) > 0;
  const [revealed, setRevealed] = useState(!hasWarnings);

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

  async function toggleBookmark() {
    if (!user || post.id === "preview") return;
    setBookmarked((b) => !b); // optimistic
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setBookmarked(data.bookmarked);
      toast.success(data.bookmarked ? "Saved to your bookmarks" : "Removed from bookmarks");
    } else {
      setBookmarked((b) => !b); // revert on error
      toast.error("Couldn't save. Try again.");
    }
  }

  async function sendLetter() {
    if (!letterContent.trim() || letterSending) return;
    setLetterSending(true);
    const res = await fetch("/api/letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id, content: letterContent }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message || "Letter sent anonymously.");
      setLetterContent("");
      setShowComposer(false);
    } else {
      toast.error(data.error || "Failed to send. Try again.");
    }
    setLetterSending(false);
  }

  async function reportPost() {
    if (!user) return;
    const reason = prompt("Why are you reporting this post?");
    if (reason === null) return;
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id, reason }),
    });
    if (res.ok) toast.success("Report submitted. Thank you.");
    else        toast.error("Couldn't submit report. Try again.");
  }

  return (
    <>
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

        {/* Content (with optional content-warning veil) */}
        <div className="relative">
          <div
            className={`post-content font-serif text-[15px] leading-relaxed ${tmpl.textClass} ${
              !revealed ? "blur-md select-none pointer-events-none" : ""
            }`}
            dangerouslySetInnerHTML={{ __html: sanitized }}
          />

          {/* Extra photos */}
          {extraPhotos.length > 0 && (
            <div className={`mt-4 flex gap-2 ${
              !revealed ? "blur-md select-none pointer-events-none" : ""
            }`}>
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

          {/* CW reveal overlay */}
          {!revealed && hasWarnings && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 py-6 rounded-sm"
              style={{ background: `${tmpl.cardBg}f0` }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`mb-2 ${tmpl.headingClass}`}>
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className={`text-[10px] uppercase tracking-[0.2em] mb-1 ${tmpl.metaClass}`}>
                Content warning
              </p>
              <p className={`font-serif text-sm mb-3 ${tmpl.headingClass}`}>
                {getCWLabels(post.content_warnings).join(" · ")}
              </p>
              <button
                onClick={() => setRevealed(true)}
                className="rounded-sm bg-earth px-4 py-1.5 text-xs font-medium text-cream-light transition-colors hover:bg-earth-light"
              >
                Reveal anyway
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-dashed" style={{ borderColor: tmpl.cardBorder }} />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleHeart}
              disabled={!user || busy}
              className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
                hearted ? `${tmpl.heartActive} font-medium` : tmpl.heartInactive
              } disabled:opacity-40`}
            >
              {hearted ? "❤️" : "♡"} {hearts}
            </button>
            {/* Write to them */}
            {post.id !== "preview" && post.accepts_letters && user && user.id !== post.user_id && (
              <button
                onClick={() => setShowComposer((s) => !s)}
                className={`inline-flex items-center gap-1 text-[11px] font-serif italic transition-colors ${
                  showComposer ? tmpl.heartActive : tmpl.heartInactive
                }`}
                title="Write to them anonymously"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                write to them
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] tracking-[0.15em] uppercase italic opacity-60 ${tmpl.metaClass}`}>
              &mdash; a stranger
            </span>
            {/* Bookmark */}
            {post.id !== "preview" && (
              <button
                onClick={toggleBookmark}
                disabled={!user}
                className={`transition-colors disabled:opacity-30 ${
                  bookmarked ? tmpl.heartActive : tmpl.reportClass
                }`}
                title={bookmarked ? "Remove bookmark" : "Save post"}
              >
                <svg width="11" height="11" viewBox="0 0 24 24"
                  fill={bookmarked ? "currentColor" : "none"}
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                </svg>
              </button>
            )}
            {post.id !== "preview" && (
              <Link
                href={`/posts/${post.id}`}
                className={`transition-colors ${tmpl.reportClass}`}
                title="Open post"
                aria-label="Open post"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </Link>
            )}
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

    {/* ── Letter composer ── */}
    {showComposer && post.id !== "preview" && (
      <div className="mt-2 paper rounded-sm px-5 py-4" style={{ border: `1px solid ${tmpl.cardBorder}` }}>
        <p className={`text-[10px] uppercase tracking-wider mb-2 ${tmpl.metaClass}`}>
          Write to them — anonymously
        </p>
        <textarea
          value={letterContent}
          onChange={(e) => setLetterContent(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Say what you want them to know..."
          className="w-full resize-none rounded-sm bg-transparent font-serif text-sm text-ink placeholder:text-warm/50 focus:outline-none"
          style={{ borderBottom: `1px dashed ${tmpl.innerBorder}`, paddingBottom: "8px" }}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-[10px] ${tmpl.metaClass}`}>{letterContent.length}/1000</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowComposer(false)}
              className={`text-xs transition-colors ${tmpl.reportClass}`}
            >
              Cancel
            </button>
            <button
              onClick={sendLetter}
              disabled={letterSending || !letterContent.trim()}
              className="rounded-sm bg-earth px-4 py-1.5 text-xs font-medium text-cream-light transition-colors hover:bg-earth-light disabled:opacity-40"
            >
              {letterSending ? "Sending..." : "Send anonymously"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
