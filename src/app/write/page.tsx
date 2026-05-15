"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";
import PostCard from "@/components/PostCard";
import type { PostType, Post } from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";
import { CONTENT_WARNINGS } from "@/lib/content-warnings";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toaster";

const POST_TYPES: {
  value: PostType;
  emoji: string;
  label: string;
  tagline: string;
}[] = [
  { value: "confession", emoji: "\u{1F92B}", label: "Confession", tagline: "for what weighs on you" },
  { value: "letter",     emoji: "\u{1F48C}", label: "Letter",     tagline: "for someone who may never read it" },
  { value: "shoutout",   emoji: "\u{1F4E3}", label: "Shoutout",   tagline: "for gratitude that needs a voice" },
  { value: "rant",       emoji: "\u{1F624}", label: "Rant",       tagline: "for frustrations unspoken" },
];

export default function WritePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toast  = useToast();

  const [type, setType]             = useState<PostType>("confession");
  const [template, setTemplate]     = useState("default");
  const [content, setContent]       = useState("");
  const [acceptsLetters, setAcceptsLetters] = useState(false);
  const [warnings, setWarnings]     = useState<string[]>([]);
  const [photos, setPhotos]         = useState<File[]>([]);
  const [previews, setPreviews]     = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState<{ message: string; moderated: boolean } | null>(null);
  const [error, setError]           = useState("");
  const fileInputRef                = useRef<HTMLInputElement>(null);

  /* ── Live preview post object ── */
  const previewPost = useMemo<Post>(() => ({
    id:           "preview",
    user_id:      "preview",
    type,
    template,
    styles:       {},
    content:      content.trim()
      ? content
      : "<p><em style='opacity:0.4'>Your words will appear here...</em></p>",
    hearts_count: 0,
    status:       "approved",
    created_at:   new Date().toISOString(),
    content_warnings: warnings,
    photos: previews.map((url, i) => ({
      id:      `prev-${i}`,
      post_id: "preview",
      url,
      position: i,
    })),
  }), [type, template, content, previews, warnings]);

  function getPlainTextLength(html: string): number {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return (tmp.textContent || "").length;
  }

  function addPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || photos.length >= 3) return;
    setPhotos((prev) => [...prev, file]);
    setPreviews((prev) => [...prev, URL.createObjectURL(file)]);
    e.target.value = "";
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(previews[i]);
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  /** Returns the number of photos that failed (upload OR DB insert). */
  async function uploadPhotos(postId: string, files: File[]): Promise<number> {
    const supabase = createClient();
    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext  = file.name.split(".").pop() ?? "jpg";
      const path = `${postId}/${Date.now()}-${i}.${ext}`;
      const { data, error: upErr } = await supabase.storage
        .from("post-photos")
        .upload(path, file);
      if (upErr || !data) {
        failed++;
        continue;
      }
      const { data: urlData } = supabase.storage
        .from("post-photos")
        .getPublicUrl(data.path);
      const { error: insErr } = await supabase.from("post_photos").insert({
        post_id:  postId,
        url:      urlData.publicUrl,
        position: i,
      });
      if (insErr) failed++;
    }
    return failed;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    const len = getPlainTextLength(content);
    if (len === 0)  { setError("Write something first!"); return; }
    if (len > 2000) { setError("Content must be under 2000 characters."); return; }

    setSubmitting(true);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type, content, template,
        accepts_letters: acceptsLetters,
        content_warnings: warnings,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setSubmitting(false);
      setError(data.error);
      return;
    }

    if (photos.length > 0 && data.post?.id) {
      const failed = await uploadPhotos(data.post.id, photos);
      if (failed > 0) {
        toast.error(
          failed === photos.length
            ? "Post saved, but no photos could be uploaded."
            : `Post saved, but ${failed} of ${photos.length} photos failed to upload.`
        );
      }
    }

    setSubmitting(false);
    setResult({ message: data.message, moderated: data.moderated });
    setContent("");
    setPhotos([]);
    setPreviews([]);
    setTemplate("default");
    setAcceptsLetters(false);
    setWarnings([]);
  }

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="relative max-w-sm text-center">
          <div className="tape tape-md tape-center" />
          <div className="paper rounded-sm px-8 py-10 mt-2">
            <div className="paper-inner px-6 py-6">
              <h2 className="font-serif text-2xl text-ink mb-3">Sign in to write</h2>
              <p className="text-sm text-ink-light mb-6 font-serif italic">
                You need a verified FTU email to post. Your identity stays anonymous.
              </p>
              <Link href="/login" className="inline-block rounded-sm bg-earth px-6 py-2.5 text-sm font-medium text-cream-light transition-colors hover:bg-earth-light">
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
      <p className="section-label mb-1">Write</p>
      <h1 className="font-serif text-4xl text-ink mb-2">What&apos;s on your mind?</h1>
      <p className="text-sm text-ink-light italic font-serif mb-10">
        No one will know it&apos;s you. Promise.
      </p>

      <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:gap-10 items-start">

        {/* ── Left: Form ── */}
        <form onSubmit={handleSubmit}>

          {/* Post type */}
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
                        ? "rotate-0 scale-[1.05] ring-2 ring-earth"
                        : "rotate-[1.5deg] hover:rotate-0 hover:shadow-md"
                    }`}
                    style={
                      isSelected
                        ? { boxShadow: "0 10px 25px rgba(139, 69, 67, 0.2), 0 0 0 1px rgba(139, 69, 67, 0.5)" }
                        : undefined
                    }
                  >
                    <div className="pin" />
                    {/* Checkmark badge */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-earth text-cream-light shadow-md">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                    {/* Tinted background when selected */}
                    {isSelected && (
                      <div className="absolute inset-2 -z-0 rounded-sm bg-earth-pale/40 pointer-events-none" />
                    )}
                    <div className="relative">
                      <span className="text-3xl">{pt.emoji}</span>
                      <p className={`relative mt-2 inline-block font-serif text-base font-medium transition-all duration-300 ${isSelected ? "text-earth" : "text-ink"}`}>
                        {pt.label}
                      </p>
                      <p className={`mt-0.5 text-[11px] italic font-serif transition-colors duration-300 ${isSelected ? "text-earth/80" : "text-warm"}`}>
                        {pt.tagline}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card template */}
          <div className="mb-8">
            <label className="mb-3 block text-xs uppercase tracking-wider text-warm">
              Card style
            </label>
            <div className="grid grid-cols-4 gap-3">
              {TEMPLATES.map((t) => {
                const isSelected = template === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`relative rounded-sm px-3 py-4 text-center transition-all duration-200 ${
                      isSelected
                        ? "ring-2 ring-earth scale-[1.06]"
                        : "hover:scale-[1.02] hover:shadow-sm opacity-75 hover:opacity-100"
                    }`}
                    style={{
                      background: t.cardBg,
                      border: `1px solid ${t.cardBorder}`,
                      boxShadow: isSelected
                        ? "0 8px 20px rgba(139, 69, 67, 0.2), 0 0 0 1px rgba(139, 69, 67, 0.5)"
                        : undefined,
                    }}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-earth text-cream-light shadow-md">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                    <p className="font-serif text-sm font-medium mb-1" style={{ color: t.previewText }}>
                      {t.label}
                    </p>
                    <p className="font-serif text-[10px] italic opacity-60" style={{ color: t.previewText }}>
                      Aa
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rich text */}
          <div className="relative mb-6">
            <div className="tape tape-lg tape-center" />
            <div className="paper rounded-sm px-6 py-6 mt-2">
              <div className="paper-inner px-5 py-5">
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Start writing your thoughts..."
                />
                <div className="mt-3 flex items-center justify-between text-xs text-warm-light">
                  <span className="italic font-serif">Format your text with the toolbar above</span>
                  <span>{getPlainTextLength(content)}/2000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Photo upload */}
          <div className="mb-8">
            <label className="mb-3 block text-xs uppercase tracking-wider text-warm">
              Add photos <span className="normal-case italic font-sans">(optional, up to 3)</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {previews.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="h-24 w-24 rounded-sm object-cover border border-border" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-earth text-cream-light text-xs hover:bg-earth-light transition-colors"
                  >✕</button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded-sm bg-ink/60 px-1 text-[9px] text-cream-light">
                      cover
                    </span>
                  )}
                </div>
              ))}
              {photos.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-24 w-24 rounded-sm border border-dashed border-border bg-cream-dark/50 text-warm hover:border-earth hover:text-earth transition-colors flex flex-col items-center justify-center gap-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  <span className="text-[10px]">Add photo</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={addPhoto} />
            {photos.length > 0 && (
              <p className="mt-2 text-[11px] italic text-warm font-serif">
                First photo is the card&apos;s blurred background. Others shown at the bottom.
              </p>
            )}
          </div>

          {/* Content warnings */}
          <div className="mb-6">
            <label className="mb-2 block text-xs uppercase tracking-wider text-warm">
              Content warnings <span className="normal-case italic font-sans text-warm/70">(optional — for heavy content)</span>
            </label>
            <p className="text-xs italic font-serif text-ink-light mb-3">
              Selected warnings will hide your post behind a click-to-reveal layer. Helps readers who might be triggered.
            </p>
            <div className="flex flex-wrap gap-2">
              {CONTENT_WARNINGS.map((cw) => {
                const active = warnings.includes(cw.id);
                return (
                  <button
                    key={cw.id}
                    type="button"
                    onClick={() => setWarnings((w) =>
                      active ? w.filter((id) => id !== cw.id) : [...w, cw.id]
                    )}
                    title={cw.description}
                    className={`rounded-full border px-3 py-1 text-xs font-serif transition-all ${
                      active
                        ? "border-earth bg-earth text-cream-light font-medium"
                        : "border-border bg-cream-light text-ink-light hover:border-earth hover:text-earth"
                    }`}
                  >
                    {active && "✓ "}{cw.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accept letters toggle */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={acceptsLetters}
                  onChange={(e) => setAcceptsLetters(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`h-4 w-4 rounded-sm border transition-colors ${
                  acceptsLetters
                    ? "bg-earth border-earth"
                    : "bg-cream border-border group-hover:border-earth/50"
                }`}>
                  {acceptsLetters && (
                    <svg className="absolute inset-0 h-4 w-4 text-cream-light" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-ink">
                  Let people write to me anonymously about this post
                </p>
                <p className="text-xs italic text-warm font-serif mt-0.5">
                  Replies stay private — only you can read them in your inbox. Off by default.
                </p>
              </div>
            </label>
          </div>

          {error && <p className="mb-4 text-sm text-earth font-medium">{error}</p>}

          {result && (
            <div className={`mb-4 rounded-sm p-4 text-sm ${result.moderated ? "bg-earth-pale/30 text-ink-light" : "bg-earth-pale/20 text-ink"}`}>
              <p className="font-medium">{result.message}</p>
              {!result.moderated && (
                <Link href="/" className="mt-2 inline-block text-earth hover:text-earth-light">
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
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
            </svg>
            {submitting ? "Posting..." : "Post anonymously"}
          </button>
        </form>

        {/* ── Right: Live preview ── */}
        <div className="hidden lg:block lg:sticky lg:top-24">
          <p className="section-label mb-4">Live preview</p>
          <div className="pointer-events-none select-none">
            <PostCard post={previewPost} index={0} />
          </div>
          <p className="mt-3 text-center text-[11px] italic text-warm font-serif">
            Updates as you write
          </p>
        </div>

      </div>
    </div>
  );
}
