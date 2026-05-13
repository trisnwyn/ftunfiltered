"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";
import type { PostType } from "@/lib/types";

const POST_TYPES: {
  value: PostType;
  emoji: string;
  label: string;
  tagline: string;
}[] = [
  { value: "confession", emoji: "\u{1F92B}", label: "Confession", tagline: "for what weighs on you" },
  { value: "letter", emoji: "\u{1F48C}", label: "Letter", tagline: "for someone who may never read it" },
  { value: "shoutout", emoji: "\u{1F4E3}", label: "Shoutout", tagline: "for gratitude that needs a voice" },
  { value: "rant", emoji: "\u{1F624}", label: "Rant", tagline: "for frustrations unspoken" },
];

export default function WritePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [type, setType] = useState<PostType>("confession");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    moderated: boolean;
  } | null>(null);
  const [error, setError] = useState("");

  function getPlainTextLength(html: string): number {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return (tmp.textContent || "").length;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    const len = getPlainTextLength(content);
    if (len === 0) {
      setError("Write something first!");
      return;
    }
    if (len > 2000) {
      setError("Content must be under 2000 characters.");
      return;
    }

    setSubmitting(true);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setResult({ message: data.message, moderated: data.moderated });
    setContent("");
  }

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="relative max-w-sm text-center">
          <div className="tape tape-md tape-center" />
          <div className="paper rounded-sm px-8 py-10 mt-2">
            <div className="paper-inner px-6 py-6">
              <h2 className="font-serif text-2xl text-ink mb-3">
                Sign in to write
              </h2>
              <p className="text-sm text-ink-light mb-6 font-serif italic">
                You need a verified FTU email to post. Your identity stays
                anonymous.
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
    <div className="mx-auto max-w-3xl px-8 py-12">
      <p className="section-label mb-1">Write</p>
      <h1 className="font-serif text-4xl text-ink mb-2">
        What&apos;s on your mind?
      </h1>
      <p className="text-sm text-ink-light italic font-serif mb-10">
        No one will know it&apos;s you. Promise.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Post type selector */}
        <div className="mb-10">
          <label className="mb-3 block text-xs uppercase tracking-wider text-warm">
            Choose a feeling
          </label>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {POST_TYPES.map((pt) => {
              const isSelected = type === pt.value;
              return (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setType(pt.value)}
                  className={`paper relative rounded-sm py-5 px-3 text-center transition-all duration-300 ${
                    isSelected
                      ? "rotate-0 shadow-lg ring-2 ring-earth/30 scale-[1.03]"
                      : "rotate-[1.5deg] hover:rotate-0 hover:shadow-md"
                  }`}
                >
                  <div className="pin" />
                  <span className="text-3xl">{pt.emoji}</span>
                  <p
                    className={`relative mt-2 inline-block font-serif text-base font-medium text-ink transition-all duration-300 ${
                      isSelected ? "text-earth" : ""
                    }`}
                  >
                    {/* Highlight pen effect */}
                    {isSelected && (
                      <span
                        className="absolute inset-x-[-4px] bottom-[1px] h-[40%] bg-earth/15 -z-10 rounded-sm"
                        style={{
                          transform: "rotate(-0.5deg)",
                        }}
                      />
                    )}
                    {pt.label}
                  </p>
                  <p
                    className={`mt-0.5 text-[11px] italic font-serif transition-colors duration-300 ${
                      isSelected ? "text-earth/70" : "text-warm"
                    }`}
                  >
                    {pt.tagline}
                  </p>
                  {isSelected && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                      <svg width="20" height="10" viewBox="0 0 20 10" className="text-earth/60">
                        <path d="M2 8 L10 2 L18 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rich text content */}
        <div className="relative mb-8">
          <div className="tape tape-lg tape-center" />
          <div className="paper rounded-sm px-6 py-6 mt-2">
            <div className="paper-inner px-5 py-5">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your thoughts..."
              />
              <div className="mt-3 flex items-center justify-between text-xs text-warm-light">
                <span className="italic font-serif">
                  Format your text with the toolbar above
                </span>
                <span>
                  {getPlainTextLength(content)}/2000
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-earth font-medium">{error}</p>}

        {result && (
          <div
            className={`mb-4 rounded-sm p-4 text-sm ${
              result.moderated
                ? "bg-earth-pale/30 text-ink-light"
                : "bg-earth-pale/20 text-ink"
            }`}
          >
            <p className="font-medium">{result.message}</p>
            {!result.moderated && (
              <Link
                href="/"
                className="mt-2 inline-block text-earth hover:text-earth-light"
              >
                View on feed &rarr;
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-sm bg-earth px-7 py-3 text-sm font-medium text-cream-light transition-colors hover:bg-earth-light disabled:opacity-50"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
          {submitting ? "Posting..." : "Post anonymously"}
        </button>
      </form>
    </div>
  );
}
