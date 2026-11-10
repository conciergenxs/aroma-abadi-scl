import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import sclIconAsset from "@/assets/aroma-abadi-icon-sand.png";

/* The two legal documents — Terms and Privacy — are the same object: a dated
 * document with numbered clauses that someone lands on to find one clause and
 * leave. So they are built as a document rather than a page: a masthead that
 * says what this is and who it binds, an index that tracks where you are, and
 * one measured column of prose. No cards, no hero.
 *
 * The clause numbers are real structure, not decoration — a clause is cited by
 * its number, which is why they are set in the serif and repeated in the
 * index. */

export type Clause = {
  /** Short enough to sit in the index without wrapping twice. */
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

  // The index follows the reader rather than the scrollbar: the active clause
  // is the last one whose heading has passed the top third of the viewport.
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
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Link to="/auth" className="inline-flex items-center gap-2.5">
            <img src={sclIconAsset} alt="" className="h-7 w-auto object-contain" />
            <span className="text-[13px] font-medium tracking-tight">Aroma Abadi</span>
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-4 pb-24 sm:px-8">
        <div className="border-b border-border py-12 sm:py-16">
          <h1
            className="lp-display text-[2.25rem] leading-[1.1] tracking-tight sm:text-[3rem]"
            style={{ color: "var(--primary)" }}
          >
            {title}
          </h1>
          <p className="mt-5 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">
            {summary}
          </p>
          <p className="mt-6 text-[13px] text-muted-foreground">In effect from {effective}</p>
        </div>

        <div className="lg:flex lg:gap-14">
          <nav aria-label="Clauses" className="hidden w-[232px] shrink-0 lg:block">
            <ol className="sticky top-10 space-y-0.5 py-12">
              {clauses.map((c, i) => (
                <li key={c.heading}>
                  <a
                    href={`#clause-${i + 1}`}
                    className={`flex gap-2.5 rounded px-2 py-1.5 text-[13px] leading-snug transition-colors ${
                      active === i
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="lp-display w-4 shrink-0 tabular-nums opacity-60">{i + 1}</span>
                    <span>{c.heading}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="min-w-0 flex-1 py-12">
            {clauses.map((c, i) => (
              <section
                key={c.heading}
                id={`clause-${i + 1}`}
                ref={(el) => {
                  sectionRefs.current[i] = el;
                }}
                className="scroll-mt-10 border-b border-border pb-10 last:border-0 [&+section]:pt-10"
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className="lp-display text-[15px] tabular-nums"
                    style={{ color: "var(--accent-foreground)", opacity: 0.5 }}
                  >
                    {i + 1}
                  </span>
                  <h2 className="lp-display text-[1.5rem] leading-tight tracking-tight">
                    {c.heading}
                  </h2>
                </div>
                <p className="mt-3 max-w-[68ch] text-[15px] font-medium leading-relaxed">
                  {c.lead}
                </p>
                {c.body.map((para) => (
                  <p
                    key={para.slice(0, 40)}
                    className="mt-3 max-w-[68ch] text-[15px] leading-[1.75] text-muted-foreground"
                  >
                    {para}
                  </p>
                ))}
              </section>
            ))}

            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-8 text-[14px]">
              <Link
                to={other.to}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {other.label}
              </Link>
              <Link
                to="/auth"
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
