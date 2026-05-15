"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { Letter } from "@/lib/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const TYPE_LABELS: Record<string, string> = {
  confession: "Confession",
  letter: "Letter",
  shoutout: "Shoutout",
  rant: "Rant",
};

export default function InboxPage() {
  const { user, loading: authLoading } = useAuth();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch("/api/letters");
        const data = await res.json();
        setLetters(data.letters || []);
      } catch {
        setLetters([]);
      }
      setLoading(false);
    })();
  }, [user]);

  async function markRead(id: string) {
    await fetch(`/api/letters/${id}`, { method: "PATCH" });
    setLetters((prev) =>
      prev.map((l) => l.id === id ? { ...l, read_at: new Date().toISOString() } : l)
    );
  }

  async function deleteLetter(id: string) {
    await fetch(`/api/letters/${id}`, { method: "DELETE" });
    setLetters((prev) => prev.filter((l) => l.id !== id));
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="relative max-w-sm text-center">
          <div className="tape tape-md tape-center" />
          <div className="paper rounded-sm px-8 py-10 mt-2">
            <div className="paper-inner px-6 py-6">
              <h2 className="font-serif text-2xl text-ink mb-3">Sign in to read your letters</h2>
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

  const unread = letters.filter((l) => !l.read_at).length;

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      <p className="section-label mb-1">Inbox</p>
      <h1 className="font-serif text-4xl text-ink mb-2">
        Letters for you
        {unread > 0 && (
          <span className="ml-3 rounded-full bg-earth px-2.5 py-0.5 text-sm text-cream-light font-sans font-medium align-middle">
            {unread} new
          </span>
        )}
      </h1>
      <p className="text-sm text-ink-light italic font-serif mb-10">
        Anonymous messages from people who read your posts. Only you can see these.
      </p>

      {loading ? (
        <p className="py-20 text-center text-sm text-warm italic font-serif">
          Loading your letters...
        </p>
      ) : letters.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-xl text-ink-light italic mb-4">
            No letters yet.
          </p>
          <p className="text-sm text-warm font-serif italic">
            Enable "open to letters" on a post to start receiving them.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {letters.map((letter) => (
            <LetterCard
              key={letter.id}
              letter={letter}
              onRead={markRead}
              onDelete={deleteLetter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LetterCard({
  letter,
  onRead,
  onDelete,
}: {
  letter: Letter;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isUnread = !letter.read_at;
  const post = letter.post as any;

  return (
    <div
      className={`paper rounded-sm px-6 py-5 transition-all ${
        isUnread ? "ring-2 ring-earth/25" : "opacity-80"
      }`}
      onClick={() => isUnread && onRead(letter.id)}
    >
      <div className="paper-inner px-5 py-4">
        {/* Meta row */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            {isUnread && (
              <span className="inline-block mb-1.5 rounded-full bg-earth/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-earth font-medium">
                New
              </span>
            )}
            {post && (
              <p className="text-[11px] text-warm font-serif italic">
                Re: your{" "}
                <Link
                  href={`/posts/${post.id}`}
                  className="text-earth hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {TYPE_LABELS[post.type] || "post"}
                </Link>
              </p>
            )}
          </div>
          <span className="text-[11px] italic font-serif text-warm whitespace-nowrap">
            {timeAgo(letter.created_at)}
          </span>
        </div>

        {/* Content */}
        <p className="font-serif text-[15px] leading-relaxed text-ink/80 whitespace-pre-wrap">
          {letter.content}
        </p>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] tracking-[0.15em] uppercase italic opacity-50 text-warm font-serif">
            &mdash; a stranger
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(letter.id); }}
            className="text-[11px] text-warm/60 hover:text-earth transition-colors font-serif italic"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
