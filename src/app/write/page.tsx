"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";
import PostCard from "@/components/PostCard";
import type { PostType, Post } from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";
import { createClient } from "@/lib/supabase/client";

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

  const [type, setType]         = useState<PostType>("confession");
  const [template, setTemplate] = useState("default");
  const [content, setContent]   = useState("");
  const [photos, setPhotos]     = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]     = useState<{ message: string; moderated: boolean } | null>(null);
  const [error, setError]       = useState("");
  const fileInputRef            = useRef<HTMLInputElement>(null);

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
    photos: previews.map((url, i) => ({
      id:      `prev-${i}`,
      post_id: "preview",
      url,
      position: i,
    })),
  }), [type, template, content, previews]);

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

  async function uploadPhotos(postId: string, files: File[]) {
    const supabase = createClient();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext  = file.name.split(".").pop() ?? "jpg";
      const path = `${postId}/${Date.now()}-${i}.${ext}`;
      const { data, error: upErr } = await supabase.storage
        .from("post-photos")
        .upload(path, file);
      if (!upErr && data) {
        const { data: urlData } = supabase.storage
          .from("post-photos")
          .getPublicUrl(data.path);
        await supabase.from("post_photos").insert({
          post_id:  postId,
          url:      urlData.publicUrl,
          position: i,
        });
      }
    }
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
      body: JSON.stringify({ type, content, template }),
    });

    const data = await res.json();

    if (!res.ok) {
      setSubmitting(false);
      setError(data.error);
      return;
    }

    if (photos.length > 0 && data.post?.id) {
      await uploadPhotos(data.post.id, photos);
    }

    setSubmitting(false);
    setResult({ message: data.message, moderated: data.moderated });
    setContent("");
    setPhotos([]);
    setPreviews([]);
    setTemplate("default");
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
                        ? "rotate-0 shadow-lg ring-2 ring-earth/30 scale-[1.03]"
                        : "rotate-[1.5deg] hover:rotate-0 hover:shadow-md"
                    }`}
                  >
                    <div className="pin" />
                    <span className="text-3xl">{pt.emoji}</span>
                    <p className={`relative mt-2 inline-block font-serif text-base font-medium text-ink transition-all duration-300 ${isSelected ? "text-earth" : ""}`}>
                      {isSelected && (
                        <span className="absolute inset-x-[-4px] bottom-[1px] h-[40%] bg-earth/15 -z-10 rounded-sm"
                          style={{ transform: "rotate(-0.5deg)" }} />
                      )}
                      {pt.label}
                    </p>
                    <p className={`mt-0.5 text-[11px] italic font-serif transition-colors duration-300 ${isSelected ? "text-earth/70" : "text-warm"}`}>
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

          {/* Card template */}
          <div className="mb-8">
            <label className="mb-3 block text-xs uppercase tracking-wider text-warm">
              Card style
            </label>
            <div className="grid grid-cols-4 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={`rounded-sm px-3 py-4 text-center transition-all duration-200 ${
                    template === t.id
                      ? "ring-2 ring-earth/40 scale-[1.04] shadow-md"
                      : "hover:scale-[1.02] hover:shadow-sm"
                  }`}
                  style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}
                >
                  <p className="font-serif text-sm font-medium mb-1" style={{ color: t.previewText }}>
                    {t.label}
                  </p>
                  <p className="font-serif text-[10px] italic opacity-60" style={{ color: t.previewText }}>
                    Aa
                  </p>
                </button>
              ))}
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
