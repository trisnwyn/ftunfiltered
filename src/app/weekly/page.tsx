"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/PostCard";
import type { Post } from "@/lib/types";

const TYPE_EMOJI: Record<string, string> = {
  confession: "🤫",
  letter:     "💌",
  shoutout:   "📣",
  rant:       "😤",
};

const TYPE_LABEL: Record<string, string> = {
  confession: "Confessions",
  letter:     "Letters",
  shoutout:   "Shoutouts",
  rant:       "Rants",
};

interface WeeklyData {
  week_label: string;
  stats: {
    posts: number;
    hearts: number;
    top_type: string;
    type_freq: Record<string, number>;
  };
  highlights: Post[];
  recent: Post[];
}

export default function WeeklyPage() {
  const [data, setData]       = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/weekly");
        setData(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-8 py-20 text-center">
        <p className="text-sm text-warm italic font-serif">Curating the week...</p>
      </div>
    );
  }

  if (!data || data.stats.posts === 0) {
    return (
      <div className="mx-auto max-w-6xl px-8 py-20 text-center">
        <p className="section-label mb-2">This week</p>
        <h1 className="font-serif text-4xl text-ink mb-4">Nothing yet this week</h1>
        <p className="text-sm text-ink-light italic font-serif">
          Check back soon — or be the first to share something.
        </p>
      </div>
    );
  }

  const { week_label, stats, highlights, recent } = data;

  return (
    <div className="mx-auto max-w-6xl px-8 py-12">

      {/* Header */}
      <p className="section-label mb-1">This week</p>
      <h1 className="font-serif text-4xl text-ink mb-1">FTUnfiltered Digest</h1>
      <p className="text-sm text-warm italic font-serif mb-10">{week_label}</p>

      {/* Stats row */}
      <div className="mb-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          value={stats.posts}
          label="posts shared"
          note="this week"
        />
        <StatCard
          value={stats.hearts}
          label="hearts given"
          note="collective warmth"
        />
        <StatCard
          value={`${TYPE_EMOJI[stats.top_type] ?? "✍️"} ${TYPE_LABEL[stats.top_type] ?? stats.top_type}`}
          label="most popular"
          note="feeling of the week"
          isText
        />
        <StatCard
          value={Object.values(stats.type_freq).reduce((a, b) => a + b, 0)}
          label="voices heard"
          note="anonymous"
        />
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="mb-16">
          <div className="mb-6">
            <p className="section-label mb-1">Top this week</p>
            <h2 className="font-serif text-3xl text-ink">Posts that resonated most</h2>
          </div>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <div className="mb-6">
            <p className="section-label mb-1">Also this week</p>
            <h2 className="font-serif text-3xl text-ink">More from the community</h2>
          </div>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((post, i) => (
              <PostCard key={post.id} post={post} index={highlights.length + i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  value,
  label,
  note,
  isText = false,
}: {
  value: number | string;
  label: string;
  note: string;
  isText?: boolean;
}) {
  return (
    <div className="paper rounded-sm px-5 py-5">
      <div className="paper-inner px-4 py-4">
        <p className={`font-serif font-semibold text-ink mb-0.5 ${isText ? "text-xl" : "text-3xl"}`}>
          {value}
        </p>
        <p className="text-sm text-ink-light font-serif">{label}</p>
        <p className="text-[11px] italic text-warm font-serif mt-0.5">{note}</p>
      </div>
    </div>
  );
}
