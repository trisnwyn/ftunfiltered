import Link from "next/link";

/* ── Edit your links here ─────────────────────────────────── */
const SOCIAL_LINKS = [
  {
    id: "facebook",
    label: "Facebook",
    href: "https://facebook.com/YOUR_PAGE",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://instagram.com/YOUR_HANDLE",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://tiktok.com/@YOUR_HANDLE",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
      </svg>
    ),
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://youtube.com/@YOUR_CHANNEL",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#F6F3ED" />
      </svg>
    ),
  },
  {
    id: "email",
    label: "Email",
    href: "mailto:hello@ftunfiltered.com",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
];

const NAV_LINKS = [
  { href: "/",         label: "Feed" },
  { href: "/write",    label: "Write" },
  { href: "/my-posts", label: "My posts" },
  { href: "/saved",    label: "Saved" },
  { href: "/inbox",    label: "Inbox" },
  { href: "/weekly",   label: "This week" },
  { href: "/about",    label: "About" },
  { href: "/support",  label: "Support" },
  { href: "/contact",  label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-cream-dark/40">
      <div className="mx-auto max-w-6xl px-8 py-12">
        <div className="grid gap-10 sm:grid-cols-[1fr_auto]">

          {/* Left — brand blurb */}
          <div className="max-w-xs">
            <p className="font-serif text-xl font-semibold text-ink tracking-tight mb-2">
              FTUnfiltered
            </p>
            <p className="text-sm italic font-serif text-ink-light leading-relaxed">
              FTU qua lăng kính trong suốt, 
              nơi bạn có thể nói thứ mình không thể
            </p>
          </div>

          {/* Right — nav + socials */}
          <div className="flex flex-col gap-6 sm:items-end">

            {/* Page links */}
            <nav className="flex flex-wrap gap-x-5 gap-y-2 sm:justify-end">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-ink-light hover:text-earth transition-colors font-serif"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.id}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="flex h-8 w-8 items-center justify-center rounded-sm text-warm hover:text-earth hover:bg-earth/8 transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-border pt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-warm font-serif italic">
          <span>© {new Date().getFullYear()} FTUnfiltered - By FTU, For FTU</span>
          <span className="opacity-60">bí mật của bạn KHÔNG ai biết. Kể cả chúng mình.</span>
        </div>
      </div>
    </footer>
  );
}
