"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PostCard from "./PostCard";
import type { Post, PostType } from "@/lib/types";

const CATEGORIES: { label: string; value: PostType; description: string }[] = [
  { label: "Confession", value: "confession", description: "for what weighs on you" },
  { label: "Letter",     value: "letter",     description: "for someone close to your heart" },
  { label: "Shoutout",   value: "shoutout",   description: "for gratitude that needs a voice" },
  { label: "Rant",       value: "rant",       description: "for frustrations unspoken" },
];

const SORTS = [
  { label: "Newest",   value: "newest" },
  { label: "Trending", value: "trending" },
] as const;

type SortValue = (typeof SORTS)[number]["value"];

const POSTS_PER_PAGE = 12;

export default function Feed() {
  const [filter, setFilter]           = useState<PostType | "all">("all");
  const [sort, setSort]               = useState<SortValue>("newest");
  const [query, setQuery]             = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [posts, setPosts]             = useState<Post[]>([]);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const sentinelRef  = useRef<HTMLDivElement | null>(null);
  const fetchTokenRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  /* ── Debounce search query 350ms ── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  /* ── Fetch a single page ── */
  const fetchPage = useCallback(
    async (pageToFetch: number, reset: boolean) => {
      const token = ++fetchTokenRef.current;
      if (reset) { setInitialLoading(true); }
      else        { setLoadingMore(true); }

      const isSearching = debouncedQuery.length > 0;
      const endpoint    = isSearching ? "/api/posts/search" : "/api/posts";

      const params = new URLSearchParams({
        type:  filter,
        page:  String(pageToFetch),
        limit: String(POSTS_PER_PAGE),
      });
      if (isSearching)       params.set("q", debouncedQuery);
      if (!isSearching)      params.set("sort", sort);

      try {
        const res  = await fetch(`${endpoint}?${params}`);
        const data = await res.json();
        if (token !== fetchTokenRef.current) return;
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        setPosts((prev) => reset ? (data.posts || []) : [...prev, ...(data.posts || [])]);
      } catch {
        if (token === fetchTokenRef.current && reset) setPosts([]);
      } finally {
        if (token === fetchTokenRef.current) {
          setInitialLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [filter, sort, debouncedQuery]
  );

  /* ── Reset & refetch when filter / sort / query change ── */
  useEffect(() => {
    setPage(1);
    setPosts([]);
    fetchPage(1, true);
  }, [filter, sort, debouncedQuery, fetchPage]);

  /* ── Infinite scroll ── */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || page >= totalPages || loadingMore || initialLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const next = page + 1;
          setPage(next);
          fetchPage(next, false);
        }
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, totalPages, loadingMore, initialLoading, fetchPage]);

  function handleFilter(value: PostType | "all") {
    setFilter(value);
    setPage(1);
  }

  function clearSearch() {
    setQuery("");
    setDebouncedQuery("");
    searchInputRef.current?.focus();
  }

  const isSearching = debouncedQuery.length > 0;

  return (
    <section id="feed" className="mx-auto w-full max-w-6xl px-8 pb-24">

      {/* ── Category cards ── */}
      <div className="mb-20">
        <div className="mb-2 flex items-center justify-between">
          <p className="section-label">By feeling</p>
          <button onClick={() => handleFilter("all")}
            className="text-sm text-ink-light hover:text-earth transition-colors">
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
          {CATEGORIES.map((cat) => {
            const selected = filter === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => handleFilter(cat.value)}
                className={`paper relative rounded-sm text-left transition-all duration-300 ${
                  selected
                    ? "rotate-0 scale-[1.04] ring-2 ring-earth shadow-xl"
                    : "rotate-[1deg] hover:rotate-0 hover:shadow-lg"
                }`}
                style={selected ? { boxShadow: "0 10px 25px rgba(139, 69, 67, 0.18), 0 0 0 1px rgba(139, 69, 67, 0.4)" } : undefined}
              >
                <div className="pin" />
                {selected && (
                  <div className="absolute -top-2 -right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-earth text-cream-light shadow-md">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
                <div className={`paper-inner mx-3 mb-3 mt-4 px-4 py-4 transition-colors ${
                  selected ? "bg-earth-pale/30" : ""
                }`}>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-earth mb-1">
                    N&#x2070;{String(CATEGORIES.indexOf(cat) + 1).padStart(2, "0")}
                  </p>
                  <h3 className={`font-serif text-xl font-medium mb-1 ${selected ? "text-earth" : "text-ink"}`}>
                    {cat.label}
                  </h3>
                  <p className={`text-xs italic font-serif mb-3 ${selected ? "text-earth/70" : "text-warm"}`}>
                    {cat.description}
                  </p>
                  <span className={`text-xs transition-colors ${selected ? "text-earth font-medium" : "text-ink-light"}`}>
                    {selected ? "Reading ✓" : "Read →"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="mb-8">
        <div className="relative">
          {/* Search icon */}
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-warm">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a feeling, a phrase, a memory..."
            className="paper w-full rounded-sm py-3 pl-10 pr-10 font-serif text-sm text-ink placeholder:text-warm/60 focus:outline-none focus:ring-2 focus:ring-earth/30 transition-all"
          />

          {/* Clear button */}
          {query && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-3 flex items-center text-warm hover:text-earth transition-colors"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Sort controls + result count ── */}
      <div className="mb-8 flex items-center justify-between">
        <p className="section-label">
          {isSearching
            ? initialLoading
              ? "Searching..."
              : `${total} result${total !== 1 ? "s" : ""} for "${debouncedQuery}"`
            : filter === "all" ? "All confessions" : filter}
        </p>

        {!isSearching && (
          <div className="flex items-center gap-1 rounded-sm border border-border bg-cream-light p-1">
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                className={`rounded-sm px-3 py-1 text-sm transition-all ${
                  sort === s.value
                    ? "bg-earth text-cream-light font-medium shadow-sm"
                    : "text-ink-light hover:bg-earth/10 hover:text-earth"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Post grid ── */}
      {initialLoading ? (
        <div className="py-20 text-center">
          <p className="text-sm text-warm italic font-serif">
            {isSearching ? `Searching for "${debouncedQuery}"...` : "Loading confessions..."}
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center">
          {isSearching ? (
            <>
              <p className="font-serif text-xl text-ink-light italic mb-2">
                Nothing found for &ldquo;{debouncedQuery}&rdquo;
              </p>
              <p className="text-sm text-warm font-serif italic">
                Try different words, or{" "}
                <button onClick={clearSearch} className="text-earth hover:underline">
                  browse everything
                </button>
              </p>
            </>
          ) : (
            <p className="font-serif text-xl text-ink-light italic">
              No confessions yet. Be the first to share.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" aria-hidden />

          {loadingMore && (
            <div className="mt-12 text-center">
              <p className="text-sm text-warm italic font-serif">Loading more...</p>
            </div>
          )}

          {!loadingMore && page >= totalPages && posts.length >= POSTS_PER_PAGE && (
            <div className="mt-16 text-center">
              <p className="text-xs italic font-serif text-warm tracking-wide">
                — that&apos;s everything for now —
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
