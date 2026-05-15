"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import type { Post } from "@/lib/types";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      try {
        const res = await fetch(`/api/posts/${params.id}`);
        if (!res.ok) {
          setNotFound(true);
        } else {
          const data = await res.json();
          setPost(data.post);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [params?.id]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-20 text-center">
        <p className="text-sm text-warm italic font-serif">Loading...</p>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-20 text-center">
        <p className="section-label mb-2">404</p>
        <h1 className="font-serif text-3xl text-ink mb-3">Post not found</h1>
        <p className="text-sm text-ink-light italic font-serif mb-6">
          It may have been removed or never existed.
        </p>
        <Link
          href="/"
          className="inline-block rounded-sm bg-earth px-6 py-2.5 text-sm font-medium text-cream-light transition-colors hover:bg-earth-light"
        >
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-12">
      {/* Top bar */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm text-ink-light hover:text-earth transition-colors font-serif"
        >
          &larr; Back
        </button>
        <button
          onClick={copyLink}
          className="text-xs text-ink-light hover:text-earth transition-colors font-serif inline-flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Link copied
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Copy link
            </>
          )}
        </button>
      </div>

      {/* The card */}
      <PostCard post={post} index={0} />

      {/* Footer note */}
      <p className="mt-10 text-center text-[11px] italic font-serif text-warm">
        Shared anonymously on FTUnfiltered
      </p>
    </div>
  );
}
