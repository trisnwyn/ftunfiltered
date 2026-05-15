"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/* ── Small chevron icon ──────────────────────── */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="9" height="9" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ── Dropdown menu ───────────────────────────── */
function Dropdown({
  label,
  badge = 0,
  items,
}: {
  label: string;
  badge?: number;
  items: { href?: string; label: string; badge?: number; onClick?: () => void; danger?: boolean }[];
}) {
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);
  const pathname          = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative inline-flex items-center gap-1.5 text-sm transition-colors ${
          open ? "text-earth" : "text-ink-light hover:text-earth"
        }`}
      >
        {label}
        <Chevron open={open} />
        {badge > 0 && !open && (
          <span className="absolute -top-1.5 -right-3 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-earth text-[9px] font-medium text-cream-light">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-48 paper rounded-sm py-2 z-50">
          {items.map((item, i) =>
            item.href ? (
              <Link
                key={i}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                  item.danger
                    ? "text-ink-light hover:bg-earth/10 hover:text-earth"
                    : "text-ink-light hover:bg-earth/10 hover:text-earth"
                }`}
              >
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-earth text-[9px] font-medium text-cream-light">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </Link>
            ) : (
              <button
                key={i}
                onClick={() => { item.onClick?.(); setOpen(false); }}
                className={`flex w-full items-center px-4 py-2 text-left text-sm transition-colors ${
                  item.danger
                    ? "text-earth hover:bg-earth/10"
                    : "text-ink-light hover:bg-earth/10 hover:text-earth"
                }`}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Navbar ─────────────────────────────── */
export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Inbox unread count polling */
  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let cancelled = false;
    async function fetchCount() {
      try {
        const res  = await fetch("/api/letters/count");
        const data = await res.json();
        if (!cancelled) setUnread(data.unread ?? 0);
      } catch { /* ignore */ }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  /* Active link helper */
  const isActive = (href: string) => {
    if (href === "/" || href === "/#feed") return pathname === "/";
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const linkClass = (href: string) =>
    `text-sm transition-colors ${
      isActive(href) ? "text-earth font-medium" : "text-ink-light hover:text-earth"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 sm:px-8 py-3">

        {/* Logo */}
        <Link href="/" className="font-serif text-lg text-ink hover:text-earth transition-colors">
          FTUnfiltered
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/#feed"   className={linkClass("/#feed")}>Read</Link>
          <Link href="/write"   className={linkClass("/write")}>Write</Link>
          <Link href="/weekly"  className={linkClass("/weekly")}>This week</Link>

          {/* More menu */}
          <Dropdown
            label="More"
            items={[
              { href: "/about",   label: "About" },
              { href: "/support", label: "Support us" },
              { href: "/contact", label: "Contact" },
            ]}
          />

          {/* User menu (signed in) or Sign in button */}
          {!loading && (user ? (
            <Dropdown
              label="You"
              badge={unread}
              items={[
                { href: "/my-posts", label: "My posts" },
                { href: "/saved",    label: "Saved" },
                { href: "/inbox",    label: "Inbox", badge: unread },
                { href: "/settings", label: "Settings" },
                { onClick: signOut,  label: "Sign out", danger: true },
              ]}
            />
          ) : (
            <Link
              href="/login"
              className="rounded-sm bg-earth px-4 py-1.5 text-sm font-medium text-cream-light transition-colors hover:bg-earth-light"
            >
              Sign in
            </Link>
          ))}
        </div>

        {/* ── Mobile menu button ── */}
        <button
          className="md:hidden relative flex h-9 w-9 items-center justify-center rounded-sm text-ink-light hover:text-earth hover:bg-earth/10 transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
          {user && unread > 0 && !mobileOpen && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-earth" />
          )}
        </button>
      </div>

      {/* ── Mobile menu panel ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-cream-light/95 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col gap-1">
            <MobileLink href="/#feed"  label="Read"       active={isActive("/#feed")} />
            <MobileLink href="/write"  label="Write"      active={isActive("/write")} />
            <MobileLink href="/weekly" label="This week"  active={isActive("/weekly")} />

            {user && (
              <>
                <div className="my-2 border-t border-border/50" />
                <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-warm">You</p>
                <MobileLink href="/my-posts" label="My posts" active={isActive("/my-posts")} />
                <MobileLink href="/saved"    label="Saved"    active={isActive("/saved")} />
                <MobileLink href="/inbox"    label="Inbox"    active={isActive("/inbox")} badge={unread} />
                <MobileLink href="/settings" label="Settings" active={isActive("/settings")} />
              </>
            )}

            <div className="my-2 border-t border-border/50" />
            <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-warm">More</p>
            <MobileLink href="/about"   label="About"      active={isActive("/about")} />
            <MobileLink href="/support" label="Support us" active={isActive("/support")} />
            <MobileLink href="/contact" label="Contact"    active={isActive("/contact")} />

            <div className="my-2 border-t border-border/50" />
            {!loading && (user ? (
              <button
                onClick={signOut}
                className="px-3 py-2 text-left text-sm text-earth hover:bg-earth/10 rounded-sm transition-colors"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="mt-1 inline-block rounded-sm bg-earth px-4 py-2 text-center text-sm font-medium text-cream-light transition-colors hover:bg-earth-light"
              >
                Sign in
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function MobileLink({
  href, label, active, badge = 0,
}: {
  href: string; label: string; active: boolean; badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-3 py-2 rounded-sm text-sm transition-colors ${
        active ? "bg-earth/10 text-earth font-medium" : "text-ink-light hover:bg-earth/10 hover:text-earth"
      }`}
    >
      <span>{label}</span>
      {badge > 0 && (
        <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-earth text-[9px] font-medium text-cream-light">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}
