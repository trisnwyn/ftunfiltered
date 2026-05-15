"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/Toaster";

interface Settings {
  accept_letters_globally: boolean;
  email_notifications:     boolean;
}

interface Account {
  email:  string;
  joined: string;
}

export default function SettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const toast  = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [account,  setAccount]  = useState<Account  | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const res  = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        setAccount(data.account);
      } else {
        toast.error(data.error || "Couldn't load settings");
      }
      setLoading(false);
    })();
  }, [user, toast]);

  async function saveSetting(key: keyof Settings, value: boolean) {
    setSaving(key);
    // Optimistic update
    setSettings((s) => s ? { ...s, [key]: value } : s);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    setSaving(null);
    if (res.ok) {
      toast.success("Saved");
    } else {
      // Revert
      setSettings((s) => s ? { ...s, [key]: !value } : s);
      toast.error("Couldn't save. Try again.");
    }
  }

  async function deleteAccount() {
    if (deleteText !== "DELETE") {
      toast.error('Type "DELETE" exactly to confirm.');
      return;
    }
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      toast.success("Account deleted.");
      await signOut();
      router.push("/");
    } else {
      toast.error("Couldn't delete account. Try again.");
    }
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="relative max-w-sm text-center">
          <div className="tape tape-md tape-center" />
          <div className="paper rounded-sm px-8 py-10 mt-2">
            <div className="paper-inner px-6 py-6">
              <h2 className="font-serif text-2xl text-ink mb-3">Sign in to manage settings</h2>
              <Link href="/login"
                className="inline-block rounded-sm bg-earth px-6 py-2.5 text-sm font-medium text-cream-light transition-colors hover:bg-earth-light">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-12">
      <p className="section-label mb-1">Settings</p>
      <h1 className="font-serif text-4xl text-ink mb-2">Your preferences</h1>
      <p className="text-sm text-ink-light italic font-serif mb-10">
        Only you can see this page.
      </p>

      {loading || !settings ? (
        <p className="py-12 text-center text-sm text-warm italic font-serif">Loading...</p>
      ) : (
        <div className="flex flex-col gap-8">

          {/* Account info */}
          <Section title="Account">
            <Row label="Email">
              <span className="text-sm font-serif text-ink-light">{account?.email}</span>
            </Row>
            <Row label="Joined">
              <span className="text-sm font-serif text-ink-light">
                {account?.joined ? new Date(account.joined).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                }) : "—"}
              </span>
            </Row>
          </Section>

          {/* Letters */}
          <Section title="Private letters">
            <Toggle
              label="Accept letters globally"
              description="When off, no one can send you letters even on posts where you enabled it. Existing letters stay in your inbox."
              checked={settings.accept_letters_globally}
              onChange={(v) => saveSetting("accept_letters_globally", v)}
              saving={saving === "accept_letters_globally"}
            />
          </Section>

          {/* Notifications */}
          <Section title="Notifications">
            <Toggle
              label="Email notifications"
              description="Get a daily digest when you have new letters waiting. The email contains a count only — never the letter contents."
              checked={settings.email_notifications}
              onChange={(v) => saveSetting("email_notifications", v)}
              saving={saving === "email_notifications"}
              comingSoon
            />
          </Section>

          {/* Danger zone */}
          <Section title="Danger zone" danger>
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-serif text-sm text-ink mb-1">Delete your account</p>
                <p className="text-xs italic font-serif text-warm">
                  Permanently removes your account, your posts, your saved items, and your inbox. This cannot be undone.
                </p>
              </div>
              {!confirming ? (
                <button
                  onClick={() => setConfirming(true)}
                  className="self-start rounded-sm border border-earth bg-cream-light px-4 py-2 text-sm font-medium text-earth transition-colors hover:bg-earth hover:text-cream-light"
                >
                  Delete my account
                </button>
              ) : (
                <div className="flex flex-col gap-3 rounded-sm border border-earth bg-earth-pale/30 p-4">
                  <p className="text-sm font-serif text-ink">
                    Type <code className="font-mono bg-cream-light px-1.5 py-0.5 text-earth">DELETE</code> to confirm:
                  </p>
                  <input
                    type="text"
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    className="rounded-sm border border-border bg-cream-light px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-earth/30"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setConfirming(false); setDeleteText(""); }}
                      className="rounded-sm border border-border bg-cream-light px-4 py-2 text-sm text-ink-light hover:text-earth hover:border-earth transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={deleteAccount}
                      disabled={deleteText !== "DELETE"}
                      className="rounded-sm bg-earth px-4 py-2 text-sm font-medium text-cream-light transition-colors hover:bg-earth-light disabled:opacity-40"
                    >
                      Delete forever
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

/* ── UI helpers ─────────────────────────────────────────────── */

function Section({
  title, children, danger = false,
}: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`paper rounded-sm px-6 py-5 ${danger ? "border-earth/40" : ""}`}>
      <p className={`section-label mb-4 ${danger ? "text-earth" : ""}`}>{title}</p>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-serif text-ink">{label}</span>
      {children}
    </div>
  );
}

function Toggle({
  label, description, checked, onChange, saving, comingSoon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  saving?: boolean;
  comingSoon?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-serif text-sm text-ink">{label}</p>
          {comingSoon && (
            <span className="rounded-sm bg-warm/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-warm">
              Coming soon
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs italic font-serif text-warm leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={!!comingSoon || !!saving}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
          checked ? "bg-earth" : "bg-border"
        } ${comingSoon ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream-light shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
