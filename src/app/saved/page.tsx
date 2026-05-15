"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import PostCard from "@/components/PostCard";
import type { Post } from "@/lib/types";

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch("/api/bookmarks");
        const data = await res.json();
        setPosts(data.posts || []);
      } catch {
        setPosts([]);
      }
      setLoading(false);
    })();
  }, [user]);

  function handleUnbookmark(id: string) {
    setPosts((p) => p.filter((post) => post.id !== id));
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="relative max-w-sm text-center">
          <div className="tape tape-md tape-center" />
          <div className="paper rounded-sm px-8 py-10 mt-2">
            <div className="paper-inner px-6 py-6">
              <h2 className="font-serif text-2xl text-ink mb-3">Sign in to see saved posts</h2>
              <p className="text-sm text-ink-light mb-6 font-serif italic">
                Bookmarks are private and only visible to you.
              </p>
              <Link href="/login"
                className="inline-block rounded-sm bg-earth px-6 py-2.5 text-sm font-medium text-cream-light transition-colors hover:bg-earth-light">
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
      <p className="section-label mb-1">Saved</p>
      <h1 className="font-serif text-4xl text-ink mb-2">Posts that stayed with you</h1>
      <p className="text-sm text-ink-light italic font-serif mb-10">
        Private to you. Bookmark any post with the 🔖 icon.
      </p>

      {loading ? (
        <p className="py-20 text-center text-sm text-warm italic font-serif">Loading saved posts...</p>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-xl text-ink-light italic mb-6">
            Nothing saved yet.
          </p>
          <Link href="/#feed"
            className="inline-block rounded-sm bg-earth px-6 py-2.5 text-sm font-medium text-cream-light transition-colors hover:bg-earth-light">
            Browse the feed &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <SavedCard
              key={post.id}
              post={post}
              index={i}
              onUnbookmark={handleUnbookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* Wraps PostCard with an unbookmark button above */
function SavedCard({
  post, index, onUnbookmark,
}: {
  post: Post;
  index: number;
  onUnbookmark: (id: string) => void;
}) {
  async function handleUnbookmark() {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id }),
    });
    if (res.ok) onUnbookmark(post.id);
  }

  return (
    <div className="relative">
      <div className="mb-2 flex justify-end">
        <button
          onClick={handleUnbookmark}
          className="text-[11px] text-warm/70 hover:text-earth transition-colors font-serif italic"
        >
          Remove
        </button>
      </div>
      <PostCard post={post} index={index} />
    </div>
  );
}
