"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import DOMPurify from "dompurify";
import type { Post } from "@/lib/types";

// ─── shared helpers ───────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  confession: "Confession",
  letter:     "Letter",
  shoutout:   "Shoutout",
  rant:       "Rant",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function sanitize(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "s", "p", "br", "h2", "h3", "blockquote", "span"],
    ALLOWED_ATTR: ["style"],
  });
}

// ─── moderation queue ─────────────────────────────────────────────────────────

function PostReviewCard({
  post,
  onAction,
}: {
  post: Post;
  onAction: (id: string, action: "approve" | "reject") => void;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"approve" | "reject" | null>(null);

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
        <div className="mb-3 flex items-start justify-between gap-4">
          <span className="rounded-sm bg-earth-pale px-2 py-0.5 text-[10px] uppercase tracking-widest text-earth font-medium">
            {TYPE_LABELS[post.type] ?? post.type}
          </span>
          <span className="text-[11px] text-warm italic font-serif shrink-0">
            {timeAgo(post.created_at)}
          </span>
        </div>

        <div
          className="post-content font-serif text-[14px] leading-relaxed text-ink/80 mb-4 max-h-48 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: sanitize(post.content) }}
        />

        <hr className="dashed-line mb-4" />

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

// ─── reports tab ──────────────────────────────────────────────────────────────

type ReportEntry = { id: string; reason: string; created_at: string };
type ReportGroup = { post: Post & { photos: any[] }; reports: ReportEntry[] };

const REASON_LABELS: Record<string, string> = {
  spam:         "Spam",
  harassment:   "Harassment",
  misinformation: "Misinformation",
  inappropriate: "Inappropriate",
  "":           "No reason given",
};

function ReportedPostCard({
  group,
  onAction,
}: {
  group: ReportGroup;
  onAction: (postId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"dismiss" | "remove" | null>(null);

  async function handleAction(action: "dismiss" | "remove") {
    setBusy(true);
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: group.post.id, action }),
    });
    if (res.ok) {
      setDone(action);
      setTimeout(() => onAction(group.post.id), 500);
    }
    setBusy(false);
  }

  const count = group.reports.length;
  const reasons = Array.from(new Set(group.reports.map((r) => r.reason || "")));

  return (
    <div
      className={`paper rounded-sm transition-all duration-500 ${
        done === "remove"
          ? "opacity-0 scale-95 -translate-x-4"
          : done === "dismiss"
          ? "opacity-0 scale-95 translate-x-4"
          : "opacity-100"
      }`}
    >
      <div className="paper-inner mx-4 my-4 px-5 py-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-sm bg-earth-pale px-2 py-0.5 text-[10px] uppercase tracking-widest text-earth font-medium">
              {TYPE_LABELS[group.post.type] ?? group.post.type}
            </span>
            {/* Report count badge */}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                count >= 5
                  ? "bg-red-100 text-red-700"
                  : count >= 3
                  ? "bg-orange-100 text-orange-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {count} report{count !== 1 ? "s" : ""}
            </span>
          </div>
          <span className="text-[11px] text-warm italic font-serif shrink-0">
            {timeAgo(group.reports[0].created_at)}
          </span>
        </div>

        {/* Content */}
        <div
          className="post-content font-serif text-[14px] leading-relaxed text-ink/80 mb-3 max-h-40 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: sanitize(group.post.content) }}
        />

        {/* Reasons */}
        {reasons.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {reasons.map((r) => (
              <span
                key={r}
                className="rounded-sm bg-ink/5 border border-ink/10 px-2 py-0.5 text-[10px] text-ink/60 font-medium"
              >
                {REASON_LABELS[r] ?? r}
              </span>
            ))}
          </div>
        )}

        {/* Post status indicator */}
        {group.post.status === "pending" && (
          <p className="mb-3 text-[11px] text-orange-600 font-medium italic font-serif">
            ⚠ Auto-unpublished due to reports
          </p>
        )}

        <hr className="dashed-line mb-4" />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAction("dismiss")}
            disabled={busy || !!done}
            className="flex-1 rounded-sm bg-[#4A6741]/10 border border-[#4A6741]/20 px-4 py-2 text-sm font-medium text-[#4A6741] transition-colors hover:bg-[#4A6741]/20 disabled:opacity-40"
          >
            ✓ Dismiss reports
          </button>
          <button
            onClick={() => handleAction("remove")}
            disabled={busy || !!done}
            className="flex-1 rounded-sm bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-40"
          >
            ✕ Remove post
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

type Tab = "queue" | "reports";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("queue");

  const [posts,         setPosts]         = useState<Post[]>([]);
  const [fetchingQueue, setFetchingQueue] = useState(true);

  const [reportGroups,    setReportGroups]    = useState<ReportGroup[]>([]);
  const [fetchingReports, setFetchingReports] = useState(true);
  const [reportsError,    setReportsError]    = useState<string | null>(null);

  const [unauthorized, setUnauthorized] = useState(false);

  const fetchQueue = useCallback(async () => {
    setFetchingQueue(true);
    const res = await fetch("/api/admin/posts");
    if (res.status === 403) { setUnauthorized(true); setFetchingQueue(false); return; }
    const data = await res.json();
    setPosts(data.posts ?? []);
    setFetchingQueue(false);
  }, []);

  const fetchReports = useCallback(async () => {
    setFetchingReports(true);
    setReportsError(null);
    const res = await fetch("/api/admin/reports");
    if (res.status === 403) { setUnauthorized(true); setFetchingReports(false); return; }
    const data = await res.json();
    if (!res.ok) {
      setReportsError(data.error ?? "Failed to load reports");
      setFetchingReports(false);
      return;
    }
    setReportGroups(data.reported ?? []);
    setFetchingReports(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchQueue();
      fetchReports();
    }
  }, [loading, fetchQueue, fetchReports]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-serif italic text-warm">Loading…</p>
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
              <h2 className="font-serif text-2xl text-ink mb-3">Not authorized</h2>
              <p className="text-sm text-ink-light font-serif italic">
                This page is only accessible to admins.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fetching = tab === "queue" ? fetchingQueue : fetchingReports;

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="section-label mb-1">Admin</p>
          <h1 className="font-serif text-4xl text-ink">Moderation</h1>
        </div>
        <div className="text-right">
          <p className="font-serif text-3xl font-medium text-earth">
            {tab === "queue" ? posts.length : reportGroups.length}
          </p>
          <p className="text-xs text-warm uppercase tracking-widest">
            {tab === "queue" ? "pending" : "reported"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-ink/10">
        {(["queue", "reports"] as Tab[]).map((t) => {
          const label = t === "queue" ? "Moderation Queue" : "User Reports";
          const count = t === "queue" ? posts.length : reportGroups.length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
                tab === t
                  ? "text-earth after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-earth"
                  : "text-warm hover:text-ink"
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    tab === t ? "bg-earth/15 text-earth" : "bg-ink/8 text-ink/50"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {fetching ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="font-serif italic text-warm">Loading…</p>
        </div>
      ) : tab === "queue" ? (
        /* ── Moderation queue ── */
        posts.length === 0 ? (
          <div className="relative">
            <div className="tape tape-md tape-center" />
            <div className="paper rounded-sm px-6 py-12 mt-2 text-center">
              <div className="paper-inner px-6 py-8">
                <p className="font-serif text-5xl mb-4 text-warm/30">✓</p>
                <h2 className="font-serif text-xl text-ink mb-2">All clear</h2>
                <p className="text-sm italic text-warm font-serif">
                  No posts waiting for review.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-warm italic font-serif">
              Posts flagged by AI moderation — approve or reject each one.
            </p>
            {posts.map((post) => (
              <PostReviewCard
                key={post.id}
                post={post}
                onAction={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
              />
            ))}
            <div className="pt-4 text-center">
              <button
                onClick={fetchQueue}
                className="text-sm text-warm hover:text-earth transition-colors font-serif italic"
              >
                ↻ Refresh queue
              </button>
            </div>
          </div>
        )
      ) : (
        /* ── Reports tab ── */
        reportsError ? (
          <div className="paper rounded-sm px-6 py-8 text-center">
            <div className="paper-inner px-6 py-6">
              <p className="font-serif text-sm text-red-700 mb-2 font-medium">Failed to load reports</p>
              <p className="font-serif text-xs text-warm italic mb-4">{reportsError}</p>
              <button
                onClick={fetchReports}
                className="text-sm text-warm hover:text-earth transition-colors font-serif italic"
              >
                ↻ Try again
              </button>
            </div>
          </div>
        ) : reportGroups.length === 0 ? (
          <div className="relative">
            <div className="tape tape-md tape-center" />
            <div className="paper rounded-sm px-6 py-12 mt-2 text-center">
              <div className="paper-inner px-6 py-8">
                <p className="font-serif text-5xl mb-4 text-warm/30">✓</p>
                <h2 className="font-serif text-xl text-ink mb-2">No reports</h2>
                <p className="text-sm italic text-warm font-serif">
                  No unresolved reports right now.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-warm italic font-serif">
              Posts reported by users — dismiss if fine, or remove to reject from the feed.
              Posts with ≥3 reports are auto-unpublished.
            </p>
            {reportGroups.map((group) => (
              <ReportedPostCard
                key={group.post.id}
                group={group}
                onAction={(postId) =>
                  setReportGroups((prev) => prev.filter((g) => g.post.id !== postId))
                }
              />
            ))}
            <div className="pt-4 text-center">
              <button
                onClick={fetchReports}
                className="text-sm text-warm hover:text-earth transition-colors font-serif italic"
              >
                ↻ Refresh reports
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
