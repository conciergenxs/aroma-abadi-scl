import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SectionCard } from "@/components/scl/app-shell";
import sclIconAsset from "@/assets/aroma-abadi-icon-sand.png";

/* Terms and Privacy are the same object: a dated document with numbered
 * clauses that someone opens to find one clause and leave. They are built in
 * the dashboard's own language — Inter throughout, SectionCard for each
 * clause, and the Settings rail for the index — so a reader who has seen the
 * workspace recognises where they are. They cannot use AppShell itself: both
 * are linked from the sign-in page and have to open without a session. */

export type Clause = {
  /** Short enough to sit in the rail without wrapping twice. */
  heading: string;
  /** The one sentence that answers the clause before the detail does. */
  lead: string;
  body: string[];
};

export function LegalDocument({
  title,
  summary,
  effective,
  clauses,
  other,
}: {
  title: string;
  summary: string;
  effective: string;
  clauses: Clause[];
  other: { label: string; to: string };
}) {
  const [active, setActive] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // The rail follows the reader rather than the scrollbar: the active clause
  // is the last one whose card has passed the top third of the viewport.
  useEffect(() => {
    const onScroll = () => {
      const mark = window.innerHeight / 3;
      let current = 0;
      sectionRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= mark) current = i;
      });
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1140px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <img src={sclIconAsset} alt="" className="h-7 w-auto shrink-0 object-contain" />
            <div className="flex min-w-0 flex-col">
              <h1 className="text-base font-semibold leading-tight tracking-tight">{title}</h1>
              <p className="truncate text-xs text-muted-foreground">In effect from {effective}</p>
            </div>
          </div>
          <Link
            to="/auth"
            className="press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 text-[13px] font-medium transition-colors hover:bg-card"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1140px] px-4 pt-4 pb-[60px] sm:px-6 sm:pt-6">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="glass sticky top-20 h-fit self-start rounded-xl border border-border bg-card/60 p-2">
            <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55">
              Clauses
            </div>
            <nav className="space-y-0.5">
              {clauses.map((c, i) => (
                <a
                  key={c.heading}
                  href={`#clause-${i + 1}`}
                  className={`flex w-full items-center gap-2 rounded-md border px-3 py-1.5 text-left text-sm transition ${
                    active === i
                      ? "border-primary/30 bg-primary/15 text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                  }`}
                >
                  <span className="w-3 shrink-0 text-xs tabular-nums text-muted-foreground/60">
                    {i + 1}
                  </span>
                  <span className="min-w-0">{c.heading}</span>
                </a>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 space-y-6 self-start">
            <SectionCard>
              <p className="max-w-[72ch] px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                {summary}
              </p>
            </SectionCard>

            {clauses.map((c, i) => (
              <section
                key={c.heading}
                id={`clause-${i + 1}`}
                ref={(el) => {
                  sectionRefs.current[i] = el;
                }}
                className="scroll-mt-20"
              >
                <SectionCard title={`${i + 1}. ${c.heading}`}>
                  <div className="px-5 py-4">
                    <p className="max-w-[72ch] text-sm font-medium leading-relaxed">{c.lead}</p>
                    {c.body.map((para) => (
                      <p
                        key={para.slice(0, 40)}
                        className="mt-3 max-w-[72ch] text-sm leading-relaxed text-muted-foreground"
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                </SectionCard>
              </section>
            ))}

            <SectionCard>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 text-sm">
                <Link
                  to={other.to}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {other.label}
                </Link>
                <Link
                  to="/auth"
                  className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    </div>
  );
}
