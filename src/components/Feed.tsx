"use client";

import { useState, useEffect, useCallback } from "react";
import PostCard from "./PostCard";
import type { Post, PostType } from "@/lib/types";

const CATEGORIES: {
  label: string;
  value: PostType;
  description: string;
}[] = [
  { label: "Confession", value: "confession", description: "for what weighs on you" },
  { label: "Letter", value: "letter", description: "for someone close to your heart" },
  { label: "Shoutout", value: "shoutout", description: "for gratitude that needs a voice" },
  { label: "Rant", value: "rant", description: "for frustrations unspoken" },
];

const SORTS = [
  { label: "Newest", value: "newest" },
  { label: "Trending", value: "trending" },
] as const;

type SortValue = (typeof SORTS)[number]["value"];

const POSTS_PER_PAGE = 12;

export default function Feed() {
  const [filter, setFilter] = useState<PostType | "all">("all");
  const [sort, setSort] = useState<SortValue>("newest");
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      type: filter,
      sort,
      page: String(page),
      limit: String(POSTS_PER_PAGE),
    });

    try {
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setPosts([]);
    }
    setLoading(false);
  }, [filter, sort, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  function handleFilter(value: PostType | "all") {
    setFilter(value);
    setPage(1);
  }

  return (
    <section id="feed" className="mx-auto w-full max-w-6xl px-8 pb-24">
      {/* Category cards */}
      <div className="mb-20">
        <div className="mb-2 flex items-center justify-between">
          <p className="section-label">By feeling</p>
          <button
            onClick={() => handleFilter("all")}
            className="text-sm text-ink-light hover:text-earth transition-colors"
          >
            Browse everything &rarr;
          </button>
        </div>
        <h2 className="font-serif text-4xl text-ink mb-2 sm:text-5xl">
          Where do you want to start?
        </h2>
        <p className="mt-1 text-sm text-ink-light italic font-serif mb-8">
          Pick the feeling that matches today.
        </p>

        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleFilter(cat.value)}
              className={`paper relative rounded-sm text-left transition-all duration-300 hover:shadow-lg hover:rotate-0 ${
                filter === cat.value ? "ring-2 ring-earth/30 rotate-0" : "rotate-[1deg]"
              }`}
            >
              <div className="pin" />
              <div className="paper-inner mx-3 mb-3 mt-4 px-4 py-4">
                <p className="text-[10px] tracking-[0.2em] uppercase text-earth mb-1">
                  N&#x2070;{String(CATEGORIES.indexOf(cat) + 1).padStart(2, "0")}
                </p>
                <h3 className="font-serif text-xl font-medium text-ink mb-1">
                  {cat.label}
                </h3>
                <p className="text-xs italic text-warm font-serif mb-3">
                  {cat.description}
                </p>
                <span className="text-xs text-ink-light hover:text-earth transition-colors">
                  Read &rarr;
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sort controls */}
      <div className="mb-8 flex items-center justify-between">
        <p className="section-label">
          {filter === "all" ? "All confessions" : filter}
        </p>
        <div className="flex items-center gap-1">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setSort(s.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-sm transition-colors ${
                sort === s.value
                  ? "text-earth font-medium"
                  : "text-ink-light hover:text-earth"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Post grid */}
      {loading ? (
        <div className="py-20 text-center">
          <p className="text-sm text-warm italic font-serif">
            Loading confessions...
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-xl text-ink-light italic">
            No confessions yet. Be the first to share.
          </p>
        </div>
      ) : (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              index={i + (page - 1) * POSTS_PER_PAGE}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-16 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="paper rounded-sm px-4 py-2 text-sm text-ink-light transition-colors hover:text-earth disabled:opacity-30"
          >
            &larr; Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`paper h-10 w-10 rounded-sm text-sm font-serif transition-all ${
                page === p
                  ? "bg-earth text-cream-light shadow-sm"
                  : "text-ink-light hover:text-earth"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="paper rounded-sm px-4 py-2 text-sm text-ink-light transition-colors hover:text-earth disabled:opacity-30"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </section>
  );
}
