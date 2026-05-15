"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import PostCard from "@/components/PostCard";
import type { Post } from "@/lib/types";

const STATUS_META: Record<string, { label: string; color: string; note: string }> = {
  approved: {
    label: "Live",
    color: "bg-earth-pale/40 text-earth",
    note: "Visible on the feed",
  },
  pending: {
    label: "Pending review",
    color: "bg-amber-100/60 text-amber-800",
    note: "Flagged by moderation — waiting for admin review",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100/60 text-red-700",
    note: "Removed by moderators",
  },
};

export default function MyPostsPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchMine() {
    setLoading(true);
    try {
      const res = await fetch("/api/posts/mine");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) fetchMine();
  }, [user]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this post? This can't be undone.")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((p) => p.filter((post) => post.id !== id));
    } else {
      alert("Failed to delete. Try again.");
    }
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="relative max-w-sm text-center">
          <div className="tape tape-md tape-center" />
          <div className="paper rounded-sm px-8 py-10 mt-2">
            <div className="paper-inner px-6 py-6">
              <h2 className="font-serif text-2xl text-ink mb-3">Sign in to see your posts</h2>
              <p className="text-sm text-ink-light mb-6 font-serif italic">
                Your posts are still anonymous on the feed — only you can see them here.
              </p>
              <Link
                href="/login"
                className="inline-block rounded-sm bg-earth px-6 py-2.5 text-sm font-medium text-cream-light transition-colors hover:bg-earth-light"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-12">
      <p className="section-label mb-1">Your posts</p>
      <h1 className="font-serif text-4xl text-ink mb-2">A private log of what you&apos;ve shared</h1>
      <p className="text-sm text-ink-light italic font-serif mb-10">
        No one else can see this page. Only you can see what you&apos;ve written.
      </p>

      {loading ? (
        <p className="py-20 text-center text-sm text-warm italic font-serif">
          Loading your posts...
        </p>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-xl text-ink-light italic mb-6">
            You haven&apos;t shared anything yet.
          </p>
          <Link
            href="/write"
            className="inline-block rounded-sm bg-earth px-6 py-2.5 text-sm font-medium text-cream-light transition-colors hover:bg-earth-light"
          >
            Write your first post &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => {
            const meta = STATUS_META[post.status] ?? STATUS_META.approved;
            return (
              <div key={post.id} className="relative">
                {/* Status badge */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium ${meta.color}`}>
                    {meta.label}
                  </span>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-[11px] text-warm/70 hover:text-earth transition-colors font-serif italic"
                  >
                    Delete
                  </button>
                </div>

                <PostCard post={post} index={i} />

                <p className="mt-2 text-[10px] italic font-serif text-warm">
                  {meta.note}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
