import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Hero() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("key, value")
    .in("key", ["hero_prompt", "hero_tagline"]);

  if (error) console.error("[Hero] site_content fetch failed:", error.message);

  const content = Object.fromEntries(
    (data ?? []).map((r: { key: string; value: string }) => [r.key, r.value])
  );

  const prompt = content.hero_prompt ?? "What would you say if they could hear you?";
  const tagline = content.hero_tagline ?? "dear stranger,";
  return (
    <section className="relative mx-auto max-w-6xl px-8 pt-16 pb-20 overflow-hidden">
      {/* Decorative scattered elements */}
      <div className="pointer-events-none absolute top-8 left-[6%] font-serif text-7xl text-warm/15 rotate-[-12deg] select-none">
        &ldquo;
      </div>
      <div className="pointer-events-none absolute top-24 right-[5%] font-serif text-5xl text-warm/10 rotate-[8deg] select-none">
        &rdquo;
      </div>
      <div className="pointer-events-none absolute bottom-40 right-[20%] w-20 h-px bg-warm/10 rotate-[20deg]" />
      <div className="pointer-events-none absolute top-[60%] left-[8%] w-16 h-px bg-warm/10 rotate-[-30deg]" />

      <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16 items-start">
        {/* Left: Text */}
        <div className="pt-8">
          <p className="text-sm text-warm italic font-serif mb-4">
            {tagline}
          </p>

          <h1 className="font-serif text-6xl leading-[1.08] tracking-tight sm:text-7xl md:text-8xl font-normal text-ink">
            Some words
            <br />
            are too heavy
            <br />
            to keep.
          </h1>

          <p className="mt-4 font-serif text-2xl italic sm:text-3xl">
            <span className="underline-red text-earth">leave them here.</span>
          </p>

          <p className="mt-10 max-w-md text-[15px] leading-relaxed text-ink-light">
            A small printed-feeling corner of the internet for the confessions,
            letters, and thoughts you never shared &mdash; for the FTU community.
          </p>

          <div className="mt-10 flex items-center gap-6">
            <Link
              href="/write"
              className="inline-flex items-center gap-2.5 bg-earth px-7 py-3.5 text-sm font-medium text-cream-light tracking-wide transition-all hover:bg-earth-light shadow-sm"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              Start writing
            </Link>
            <a
              href="#feed"
              className="inline-flex items-center gap-2 text-sm text-ink-light transition-colors hover:text-earth group"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-y-0.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
              Read the archive
            </a>
          </div>
        </div>

        {/* Right: Decorative cards */}
        <div className="hidden lg:flex flex-col gap-10 pt-4">
          {/* Today's prompt card */}
          <div className="relative rotate-[2deg]">
            <div className="tape tape-md tape-center" />
            <div className="paper rounded-sm px-7 py-6 mt-2">
              <div className="paper-inner px-5 py-5">
                <p className="section-label mb-3 text-[10px]">Today&apos;s prompt</p>
                <p className="font-serif text-xl italic leading-snug text-ink">
                  &ldquo;{prompt}&rdquo;
                </p>
                <hr className="dashed-line my-4" />
                <Link
                  href="/write"
                  className="text-sm text-earth hover:text-earth-light transition-colors"
                >
                  Answer it in the writing room &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* What this is card */}
          <div className="relative rotate-[-1.5deg]">
            <div className="tape tape-md tape-center" />
            <div className="paper rounded-sm px-7 py-6 mt-2">
              <div className="paper-inner px-5 py-5">
                <p className="section-label mb-4 text-[10px]">What this is</p>
                <ul className="space-y-2.5 text-[14px] text-ink-light font-serif italic">
                  <li>&middot; It is not therapy.</li>
                  <li>&middot; It is not a social network.</li>
                  <li>
                    &middot; It is a{" "}
                    <span className="highlight-red text-ink not-italic font-medium">
                      quiet drawer
                    </span>{" "}
                    for the words you never said.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative hearts/marks at bottom */}
      <div className="pointer-events-none mt-16 flex justify-center gap-3 select-none">
        <span className="text-warm/20 text-lg">&#9825;</span>
        <span className="text-warm/15 text-sm mt-1">&#9825;</span>
      </div>
    </section>
  );
}
