import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

type Supporter = {
  id: string;
  name: string;
  note: string | null;
  created_at: string;
};

export default async function SupportPage() {
  const supabase = await createClient();

  const { data: supporters } = await supabase
    .from("supporters")
    .select("id, name, note, created_at")
    .order("created_at", { ascending: true });

  const list: Supporter[] = supporters ?? [];

  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      {/* Header */}
      <p className="section-label mb-1">Support Us</p>
      <h1 className="font-serif text-4xl text-ink mb-2">
        Keep the board alive
      </h1>
      <p className="text-sm text-ink-light italic font-serif mb-12">
        FTUnfiltered runs on goodwill and small contributions from people who
        believe in it.
      </p>

      {/* Why section */}
      <div className="relative mb-12">
        <div className="tape tape-md tape-center" />
        <div className="paper rounded-sm px-6 py-6 mt-2">
          <div className="paper-inner px-6 py-6">
            <h2 className="font-serif text-2xl text-ink mb-4">
              Why we need your help
            </h2>
            <div className="space-y-3 font-serif text-[15px] leading-relaxed text-ink/80">
              <p>
                FTUnfiltered started as a passion project &mdash; a quiet corner
                for the FTU community to breathe. It has no ads, no data selling,
                no corporate backing. Just a student who wanted to build something
                meaningful.
              </p>
              <p>
                As the community grows, so do the costs: server hosting, database
                storage, domain renewal, and eventually, events that bring
                FTU-ers together in the real world. Your support &mdash; no
                matter how small &mdash; is what makes all of that possible.
              </p>
              <p className="text-earth italic">
                &ldquo;You&apos;re not donating to a product. You&apos;re keeping
                a feeling alive.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <div className="mb-4">
        <p className="section-label mb-6">How to support</p>
        <div className="grid gap-8 sm:grid-cols-2">

          {/* Banking QR */}
          <div className="relative rotate-[-0.8deg]">
            <div className="pin" />
            <div className="paper rounded-sm px-5 py-5 mt-2">
              <div className="paper-inner px-4 py-4">
                <p className="text-[10px] tracking-[0.2em] uppercase text-earth mb-3">
                  Online Banking
                </p>
                <div className="mx-auto mb-4 h-44 w-44 rounded-sm bg-cream-dark border border-border flex items-center justify-center">
                  <span className="text-xs text-warm italic font-serif text-center px-2">
                    QR code<br />coming soon
                  </span>
                </div>
                <div className="space-y-1.5 text-[13px] font-serif text-ink/80">
                  <div className="flex justify-between">
                    <span className="text-warm">Bank</span>
                    <span className="font-medium">Vietcombank</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm">Account</span>
                    <span className="font-medium">0123 4567 890</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm">Name</span>
                    <span className="font-medium">NGUYEN VAN A</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Momo */}
          <div className="relative rotate-[1deg]">
            <div className="pin" />
            <div className="paper rounded-sm px-5 py-5 mt-2">
              <div className="paper-inner px-4 py-4">
                <p className="text-[10px] tracking-[0.2em] uppercase text-earth mb-3">
                  Momo
                </p>
                <div className="mx-auto mb-4 h-44 w-44 rounded-sm bg-cream-dark border border-border flex items-center justify-center">
                  <span className="text-xs text-warm italic font-serif text-center px-2">
                    QR code<br />coming soon
                  </span>
                </div>
                <div className="space-y-1.5 text-[13px] font-serif text-ink/80">
                  <div className="flex justify-between">
                    <span className="text-warm">Phone</span>
                    <span className="font-medium">0912 345 678</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm">Name</span>
                    <span className="font-medium">NGUYEN VAN A</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-warm italic font-serif">
          After transferring, drop a message to{" "}
          <Link href="/contact" className="text-earth hover:text-earth-light transition-colors">
            the admin
          </Link>{" "}
          with your name so we can thank you properly.
        </p>
      </div>

      <hr className="dashed-line my-12" />

      {/* Supporters wall */}
      <div className="relative">
        <div className="tape tape-lg tape-center" />
        <div className="paper rounded-sm px-6 py-6 mt-2">
          <div className="paper-inner px-6 py-6">
            <h2 className="font-serif text-2xl text-ink mb-1">
              Thank you
            </h2>
            <p className="text-sm text-warm italic font-serif mb-6">
              To everyone who believed in this before it was anything.
            </p>

            {list.length === 0 ? (
              <p className="font-serif text-[15px] italic text-ink/50 text-center py-6">
                Be the first name on this wall.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {list.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-start gap-3 rounded-sm border border-border/50 bg-cream px-4 py-3"
                  >
                    <span className="mt-0.5 text-earth text-base leading-none">&#9825;</span>
                    <div>
                      <p className="font-serif font-medium text-ink text-[14px]">
                        {s.name}
                      </p>
                      {s.note && (
                        <p className="text-[12px] italic text-ink-light font-serif mt-0.5">
                          &ldquo;{s.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
