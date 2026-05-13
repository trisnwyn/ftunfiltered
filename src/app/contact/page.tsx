"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, subject, body }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="relative max-w-sm text-center">
          <div className="tape tape-md tape-center" />
          <div className="paper rounded-sm px-8 py-10 mt-2">
            <div className="paper-inner px-6 py-6">
              <h2 className="font-serif text-2xl text-ink mb-3">
                Message sent
              </h2>
              <p className="text-sm text-ink-light font-serif italic">
                We&apos;ll get back to you as soon as possible.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block text-sm text-earth hover:text-earth-light"
              >
                &larr; Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-8 py-12">
      <p className="section-label mb-1">Contact</p>
      <h1 className="font-serif text-4xl text-ink mb-2">
        Message the admin
      </h1>
      <p className="text-sm text-ink-light italic font-serif mb-10">
        Post declined? Found a bug? We&apos;re here.
      </p>

      <div className="relative">
        <div className="tape tape-md tape-center" />
        <div className="paper rounded-sm px-6 py-6 mt-2">
          <div className="paper-inner px-5 py-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-warm">
                  Your email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="so we can reply"
                  required
                  className="w-full rounded-sm border border-border bg-cream-light px-4 py-2.5 text-sm text-ink placeholder:text-warm-light focus:border-earth focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-warm">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What's this about?"
                  required
                  maxLength={200}
                  className="w-full rounded-sm border border-border bg-cream-light px-4 py-2.5 text-sm text-ink placeholder:text-warm-light focus:border-earth focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-warm">
                  Message
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Tell us more..."
                  required
                  maxLength={2000}
                  rows={5}
                  className="w-full resize-none rounded-sm border border-border bg-cream-light px-4 py-2.5 text-sm text-ink placeholder:text-warm-light focus:border-earth focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-sm text-earth font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-sm bg-earth px-4 py-2.5 text-sm font-medium text-cream-light transition-colors hover:bg-earth-light disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
