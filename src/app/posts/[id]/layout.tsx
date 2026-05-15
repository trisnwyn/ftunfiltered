import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

const TYPE_LABELS: Record<string, string> = {
  confession: "Confession",
  letter:     "Letter",
  shoutout:   "Shoutout",
  rant:       "Rant",
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("type, content")
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (!post) {
    return { title: "Post not found — FTUnfiltered" };
  }

  const typeLabel = TYPE_LABELS[post.type] || "Post";
  const plain     = stripHtml(post.content);
  const excerpt   = plain.length > 100 ? plain.slice(0, 99) + "…" : plain;

  return {
    title:       `An anonymous ${typeLabel} — FTUnfiltered`,
    description: excerpt,
    openGraph: {
      title:       `An anonymous ${typeLabel} — FTUnfiltered`,
      description: excerpt,
      siteName:    "FTUnfiltered",
      type:        "article",
    },
    twitter: {
      card:        "summary_large_image",
      title:       `An anonymous ${typeLabel} — FTUnfiltered`,
      description: excerpt,
    },
  };
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
