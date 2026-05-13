"use client";

import { useState, useMemo } from "react";
import DOMPurify from "dompurify";
import type { Post } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

const TYPE_CONFIG = {
  confession: { label: "Confession" },
  letter: { label: "Letter" },
  shoutout: { label: "Shoutout" },
  rant: { label: "Rant" },
} as const;

const TILTS = [
  "rotate-[-1.5deg]",
  "rotate-[1.2deg]",
  "rotate-[-0.8deg]",
  "rotate-[2deg]",
  "rotate-[-2deg]",
  "rotate-[0.8deg]",
  "rotate-[1.8deg]",
  "rotate-[-1.2deg]",
  "rotate-[0.3deg]",
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

export default function PostCard({
  post,
  index = 0,
  onHeartChange,
}: {
  post: Post;
  index?: number;
  onHeartChange?: () => void;
}) {
  const { user } = useAuth();
  const [hearts, setHearts] = useState(post.hearts_count);
  const [hearted, setHearted] = useState(post.hearted_by_user || false);
  const [busy, setBusy] = useState(false);
  const config = TYPE_CONFIG[post.type];

  const tilt = TILTS[index % TILTS.length];
  const usePin = index % 3 !== 0;

  const sanitized = useMemo(
    () => DOMPurify.sanitize(post.content, { ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "s", "p", "br", "h2", "h3", "blockquote", "span"], ALLOWED_ATTR: ["style"] }),
    [post.content]
  );

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
      onHeartChange?.();
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
      className={`paper relative rounded-sm pt-3 transition-all duration-300 hover:shadow-lg hover:rotate-0 hover:z-10 ${tilt}`}
    >
      {usePin ? (
        <div className="pin" />
      ) : (
        <div className="tape tape-md tape-center" />
      )}

      <div className="paper-inner mx-4 mb-4 mt-3 px-5 py-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-warm mb-0.5">
              N&#x2070;{String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="font-serif text-lg font-medium text-ink">
              {config.label}
            </h3>
          </div>
          <span className="text-[11px] text-warm italic font-serif mt-1">
            {timeAgo(post.created_at)}
          </span>
        </div>

        <div
          className="post-content font-serif text-[15px] leading-relaxed text-ink/80"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />

        <hr className="dashed-line my-4" />

        <div className="flex items-center justify-between">
          <button
            onClick={toggleHeart}
            disabled={!user || busy}
            className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
              hearted
                ? "text-earth font-medium"
                : "text-ink-light hover:text-earth"
            } disabled:opacity-40`}
          >
            {hearted ? "❤️" : "♡"} {hearts}
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-[0.15em] uppercase text-warm/60 italic">
              &mdash; a stranger
            </span>
            <button
              onClick={reportPost}
              disabled={!user}
              className="text-warm/40 transition-colors hover:text-earth disabled:opacity-30"
              title="Report"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
