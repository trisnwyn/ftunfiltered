import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      {/* Header */}
      <p className="section-label mb-1">About</p>
      <h1 className="font-serif text-4xl text-ink mb-2">
        Why FTUnfiltered exists
      </h1>
      <p className="text-sm text-ink-light italic font-serif mb-12">
        A place for feelings that deserve to be heard.
      </p>

      {/* Mission section */}
      <div className="relative mb-16">
        <div className="tape tape-md tape-center" />
        <div className="paper rounded-sm px-6 py-6 mt-2">
          <div className="paper-inner px-6 py-6">
            <h2 className="font-serif text-2xl text-ink mb-4">
              Our Mission
            </h2>
            <div className="space-y-4 font-serif text-[15px] leading-relaxed text-ink/80">
              <p>
                FTUnfiltered was born from a simple idea: every FTU-er carries
                things they wish they could say out loud &mdash; confessions that
                weigh on them, letters to people who may never read them, shoutouts
                to strangers who made their day, rants about things that just
                aren&apos;t fair.
              </p>
              <p>
                We built this space so those words have somewhere to go. No
                judgement, no profiles, no followers. Just honest, unfiltered
                thoughts pinned to a shared board where the only currency is a
                heart.
              </p>
              <p>
                This isn&apos;t social media. There are no likes to chase, no
                algorithms deciding what you see, no influencers. It&apos;s a
                quiet corner of the internet where FTU students can be
                genuinely, anonymously human.
              </p>
              <p className="text-earth italic">
                &ldquo;Write what you feel. We&apos;ll keep it safe.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Anonymity section */}
      <div className="relative mb-16">
        <div className="pin" />
        <div className="paper rounded-sm px-6 py-6 mt-2 rotate-[-0.5deg]">
          <div className="paper-inner px-6 py-6">
            <h2 className="font-serif text-2xl text-ink mb-4">
              Your Anonymity, Explained
            </h2>
            <div className="space-y-4 font-serif text-[15px] leading-relaxed text-ink/80">
              <p>
                We take anonymity seriously. It&apos;s not an afterthought
                &mdash; it&apos;s the foundation of everything here. Here&apos;s
                exactly how we protect you:
              </p>

              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-ink mb-1">
                    We don&apos;t store your name or identity
                  </h3>
                  <p>
                    Posts are stored with zero connection to your account. The
                    database has no author field, no user ID linking back to you.
                    Once your post is submitted, there is no technical way for
                    anyone &mdash; including us &mdash; to trace it back to the
                    person who wrote it.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-ink mb-1">
                    Email is only for verification
                  </h3>
                  <p>
                    We require an FTU email address solely to verify you&apos;re
                    part of the community. Your email is used for login
                    authentication and nothing else. It is never displayed, never
                    attached to posts, and never shared.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-ink mb-1">
                    Passwords are hashed, never stored in plain text
                  </h3>
                  <p>
                    We use Supabase Auth, which hashes passwords with bcrypt
                    before storing them. This means even if someone accessed the
                    database, they would see scrambled hashes &mdash; not your
                    actual password. We literally cannot read it.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-ink mb-1">
                    No tracking, no analytics, no cookies
                  </h3>
                  <p>
                    We don&apos;t use Google Analytics, Facebook Pixel, or any
                    third-party tracker. There are no advertising cookies, no
                    fingerprinting scripts, no behavioral tracking. Your browsing
                    here stays here.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-ink mb-1">
                    AI moderation is content-only
                  </h3>
                  <p>
                    Posts go through a lightweight AI check to filter harmful
                    content (hate speech, threats, etc.). The AI only sees the
                    text of the post &mdash; it receives no information about who
                    wrote it. Flagged posts go to a human review queue where
                    admins see only the content, never the author.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical details */}
      <div className="relative mb-16">
        <div className="tape tape-lg tape-center" />
        <div className="paper rounded-sm px-6 py-6 mt-2 rotate-[0.3deg]">
          <div className="paper-inner px-6 py-6">
            <h2 className="font-serif text-2xl text-ink mb-4">
              Under the Hood
            </h2>
            <div className="space-y-4 font-serif text-[15px] leading-relaxed text-ink/80">
              <p>
                For the technically curious, here&apos;s how the system works:
              </p>

              <ul className="space-y-3 list-none">
                <li className="flex gap-3">
                  <span className="text-earth mt-0.5 shrink-0">&bull;</span>
                  <span>
                    <strong className="text-ink">Authentication</strong> is
                    handled by Supabase Auth with email + password. Sessions use
                    secure HTTP-only cookies. Passwords are bcrypt-hashed with a
                    cost factor of 10.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-earth mt-0.5 shrink-0">&bull;</span>
                  <span>
                    <strong className="text-ink">Post storage</strong> uses
                    PostgreSQL with Row Level Security (RLS). The posts table
                    contains content, type, and timestamps &mdash; no foreign
                    key to the users table. This is by design.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-earth mt-0.5 shrink-0">&bull;</span>
                  <span>
                    <strong className="text-ink">Content moderation</strong>{" "}
                    runs through Groq&apos;s Llama 3.1 model. The API receives
                    only the post text. No metadata, no IP addresses, no user
                    identifiers are sent to the moderation service.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-earth mt-0.5 shrink-0">&bull;</span>
                  <span>
                    <strong className="text-ink">Hearts</strong> are the only
                    interaction. They&apos;re tied to a user session for
                    toggle functionality, but the association is minimal and
                    doesn&apos;t reveal who posted what.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-earth mt-0.5 shrink-0">&bull;</span>
                  <span>
                    <strong className="text-ink">Domain gating</strong> ensures
                    only <code className="text-earth text-sm">@ftu.edu.vn</code>{" "}
                    and{" "}
                    <code className="text-earth text-sm">
                      @student.ftu.edu.vn
                    </code>{" "}
                    emails can register. This keeps the community within FTU
                    without requiring real names.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <hr className="dashed-line mb-10" />
        <p className="font-serif text-xl text-ink/70 italic mb-6">
          Ready to say what you&apos;ve been holding back?
        </p>
        <Link
          href="/write"
          className="inline-flex items-center gap-2 rounded-sm bg-earth px-7 py-3 text-sm font-medium text-cream-light transition-colors hover:bg-earth-light"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
          Start writing
        </Link>
      </div>
    </div>
  );
}
