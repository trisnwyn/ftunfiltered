"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    if (mode === "signup") {
      setMessage(data.message);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="relative w-full max-w-sm">
        <div className="tape tape-md tape-center" />
        <div className="paper rounded-sm px-8 py-10 mt-2">
          <div className="paper-inner px-6 py-6">
            <p className="section-label mb-1 text-[10px]">
              {mode === "login" ? "Welcome back" : "Join us"}
            </p>
            <h1 className="font-serif text-2xl text-ink mb-6">
              {mode === "login"
                ? "Sign in to FTUnfiltered"
                : "Create your account"}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-warm">
                  School email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@ftu.edu.vn"
                  required
                  className="w-full rounded-sm border border-border bg-cream-light px-4 py-2.5 text-sm text-ink placeholder:text-warm-light focus:border-earth focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-warm">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 6 characters" : ""}
                  required
                  minLength={6}
                  className="w-full rounded-sm border border-border bg-cream-light px-4 py-2.5 text-sm text-ink placeholder:text-warm-light focus:border-earth focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-sm text-earth font-medium">{error}</p>
              )}

              {message && (
                <div className="rounded-sm bg-earth-pale/30 p-3 text-sm text-ink-light">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-sm bg-earth px-4 py-2.5 text-sm font-medium text-cream-light transition-colors hover:bg-earth-light disabled:opacity-50"
              >
                {loading
                  ? "..."
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            <hr className="dashed-line my-5" />

            <p className="text-center text-sm text-ink-light">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <button
                    onClick={() => {
                      setMode("signup");
                      setError("");
                      setMessage("");
                    }}
                    className="text-earth hover:text-earth-light"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setMode("login");
                      setError("");
                      setMessage("");
                    }}
                    className="text-earth hover:text-earth-light"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>

            <p className="mt-4 text-center text-[11px] text-warm-light italic font-serif">
              Your identity stays anonymous. Always.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-ink-light hover:text-earth transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
