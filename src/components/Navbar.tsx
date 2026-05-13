"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, loading, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-cream/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-3">
        <Link href="/" className="font-serif text-lg text-ink hover:text-earth transition-colors">
          FTUnfiltered
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/#feed"
            className="text-sm text-ink-light hover:text-earth transition-colors"
          >
            Read
          </Link>
          <Link
            href="/write"
            className="text-sm text-ink-light hover:text-earth transition-colors"
          >
            Write
          </Link>
          <Link
            href="/about"
            className="text-sm text-ink-light hover:text-earth transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm text-ink-light hover:text-earth transition-colors"
          >
            Contact
          </Link>

          {!loading && (
            <>
              {user ? (
                <button
                  onClick={signOut}
                  className="rounded-sm border border-border bg-card px-4 py-1.5 text-sm text-ink-light transition-colors hover:border-earth hover:text-earth"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="rounded-sm bg-earth px-4 py-1.5 text-sm text-cream-light transition-colors hover:bg-earth-light"
                >
                  Sign in
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
