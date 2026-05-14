"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import DOMPurify from "dompurify";
import type { Post } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  confession: "Confession",
  letter: "Letter",
  shoutout: "Shoutout",
  rant: "Rant",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function PostReviewCard({
  post,
  onAction,
}: {
  post: Post;
  onAction: (id: string, action: "approve" | "reject") => void;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"approve" | "reject" | null>(null);

  const sanitized = DOMPurify.sanitize(post.content, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "s", "p", "br", "h2", "h3", "blockquote", "span"],
    ALLOWED_ATTR: ["style"],
  });

  async function handleAction(action: "approve" | "reject") {
    setBusy(true);
    const res = await fetch("/api/admin/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id, action }),
    });
    if (res.ok) {
      setDone(action);
      setTimeout(() => onAction(post.id, action), 500);
    }
    setBusy(false);
  }

  return (
    <div
      className={`paper rounded-sm transition-all duration-500 ${
        done === "approve"
          ? "opacity-0 scale-95 translate-x-4"
          : done === "reject"
          ? "opacity-0 scale-95 -translate-x-4"
          : "opacity-100"
      }`}
    >
      <div className="paper-inner mx-4 my-4 px-5 py-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="rounded-sm bg-earth-pale px-2 py-0.5 text-[10px] uppercase tracking-widest text-earth font-medium">
              {TYPE_LABELS[post.type] ?? post.type}
            </span>
          </div>
          <span className="text-[11px] text-warm italic font-serif shrink-0">
            {timeAgo(post.created_at)}
          </span>
        </div>

        {/* Content */}
        <div
          className="post-content font-serif text-[14px] leading-relaxed text-ink/80 mb-4 max-h-48 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />

        <hr className="dashed-line mb-4" />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAction("approve")}
            disabled={busy || !!done}
            className="flex-1 rounded-sm bg-[#4A6741]/10 border border-[#4A6741]/20 px-4 py-2 text-sm font-medium text-[#4A6741] transition-colors hover:bg-[#4A6741]/20 disabled:opacity-40"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => handleAction("reject")}
            disabled={busy || !!done}
            className="flex-1 rounded-sm bg-earth-pale/60 border border-earth/20 px-4 py-2 text-sm font-medium text-earth transition-colors hover:bg-earth-pale disabled:opacity-40"
          >
            ✕ Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [fetching, setFetching] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const fetchQueue = useCallback(async () => {
    setFetching(true);
    const res = await fetch("/api/admin/posts");
    if (res.status === 403) {
      setUnauthorized(true);
      setFetching(false);
      return;
    }
    const data = await res.json();
    setPosts(data.posts ?? []);
    setFetching(false);
  }, []);

  useEffect(() => {
    if (!loading) fetchQueue();
  }, [loading, fetchQueue]);

  function removePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading || fetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-serif italic text-warm">Loading queue...</p>
      </div>
    );
  }

  if (!user || unauthorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="relative max-w-sm text-center">
          <div className="pin" />
          <div className="paper rounded-sm px-8 py-10 mt-2">
            <div className="paper-inner px-6 py-6">
              <h2 className="font-serif text-2xl text-ink mb-3">
                Not authorized
              </h2>
              <p className="text-sm text-ink-light font-serif italic">
                This page is only accessible to admins.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="section-label mb-1">Admin</p>
          <h1 className="font-serif text-4xl text-ink">
            Moderation Queue
          </h1>
        </div>
        <div className="text-right">
          <p className="font-serif text-3xl font-medium text-earth">
            {posts.length}
          </p>
          <p className="text-xs text-warm uppercase tracking-widest">
            pending
          </p>
        </div>
      </div>

      {posts.length === 0 ? (
        /* Empty state */
        <div className="relative">
          <div className="tape tape-md tape-center" />
          <div className="paper rounded-sm px-6 py-12 mt-2 text-center">
            <div className="paper-inner px-6 py-8">
              <p className="font-serif text-5xl mb-4 text-warm/30">✓</p>
              <h2 className="font-serif text-xl text-ink mb-2">
                All clear
              </h2>
              <p className="text-sm italic text-warm font-serif">
                No posts waiting for review. Check back later.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Queue */
        <div className="space-y-6">
          <p className="text-xs text-warm italic font-serif">
            Posts flagged by AI moderation — review and approve or reject each one.
          </p>
          {posts.map((post) => (
            <PostReviewCard
              key={post.id}
              post={post}
              onAction={(id) => removePost(id)}
            />
          ))}

          {/* Refresh */}
          <div className="pt-4 text-center">
            <button
              onClick={fetchQueue}
              className="text-sm text-warm hover:text-earth transition-colors font-serif italic"
            >
              ↻ Refresh queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
