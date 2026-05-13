import Hero from "@/components/Hero";
import Feed from "@/components/Feed";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Hero />
      <Feed />

      {/* Support CTA */}
      <section className="mx-auto max-w-6xl px-8 pb-24">
        <div className="relative">
          <div className="tape tape-md tape-center" />
          <div className="paper rounded-sm mt-2 px-8 py-10 text-center">
            <div className="paper-inner px-8 py-8">
              <p className="section-label mb-3 justify-center">Keep it going</p>
              <h2 className="font-serif text-3xl text-ink mb-3">
                FTUnfiltered runs on heart &mdash; and a little help.
              </h2>
              <p className="font-serif text-[15px] italic text-ink-light mb-6 max-w-md mx-auto">
                No ads, no data selling. Just a student project that needs your
                support to stay alive and grow.
              </p>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-sm bg-earth px-7 py-3 text-sm font-medium text-cream-light transition-colors hover:bg-earth-light"
              >
                <span>&#9825;</span>
                Support this project
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
