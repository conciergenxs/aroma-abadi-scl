import { useEffect, useRef, useState, type ReactNode } from "react";

/* Page furniture for the public company page.
 *
 * The page is an annotated document: a narrow column names the subject, a
 * wider one carries the content. The palette is the house palette — white
 * ground, merah hati for structure, brown for the quiet type — and the only
 * thing allowed to break the rhythm is the step where the customer pays.
 *
 * Motion is tied to reading: a block settles as it comes into view, once,
 * and the numerals of the transaction flow fill in as a reader reaches
 * them. Nothing loops except the hero, and nothing moves for anyone who
 * asked their system to minimise motion. */

export type Tone = "white" | "cream" | "maroon";

const GROUND: Record<Tone, string> = {
  white: "bg-white",
  cream: "bg-[#FAF5EF]",
  maroon: "lp-dark bg-[#3E1319]",
};
const TITLE: Record<Tone, string> = {
  white: "text-[#71222A]",
  cream: "text-[#71222A]",
  maroon: "text-[#FBF7F0]",
};
const BODY: Record<Tone, string> = {
  white: "text-[#5B4C44]",
  cream: "text-[#5B4C44]",
  maroon: "text-[#EADFD2]/80",
};
const LABEL: Record<Tone, string> = {
  white: "text-[#8B6B51]",
  cream: "text-[#8B6B51]",
  maroon: "text-[#D9B892]",
};
const VALUE: Record<Tone, string> = {
  white: "text-[#2B211D]",
  cream: "text-[#2B211D]",
  maroon: "text-[#FBF7F0]",
};
const RULE: Record<Tone, string> = {
  white: "border-[#2B211D]/10",
  cream: "border-[#2B211D]/10",
  maroon: "border-[#FBF7F0]/14",
};

/** Fires once, when the element first comes into view. */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  // Visible by default: the markup the server sends is already readable, and
  // only elements still below the fold are armed for the reveal.
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    setInView(false);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        io.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, inView };
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`lp-reveal ${inView ? "is-in" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Section({
  id,
  tone = "white",
  className = "",
  children,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-[86px] ${GROUND[tone]} ${className}`}>
      <div className="mx-auto w-full max-w-[1180px] px-6 py-16 md:px-10 md:py-24">{children}</div>
    </section>
  );
}

/** Title and standfirst on the left, content on the right. */
export function Split({
  tone = "white",
  title,
  lede,
  aside,
  children,
}: {
  tone?: Tone;
  title: string;
  lede: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-x-14 gap-y-9 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
      <Reveal className="self-start md:sticky md:top-[104px]">
        <h2
          className={`lp-display text-balance text-[clamp(1.7rem,1.1rem+1.6vw,2.35rem)] leading-[1.1] ${TITLE[tone]}`}
        >
          {title}
        </h2>
        <span className="mt-4 block h-px w-10 bg-[#8B6B51]/40" />
        <p className={`mt-4 max-w-[30ch] text-pretty text-[15px] leading-[1.6] ${BODY[tone]}`}>
          {lede}
        </p>
        {aside}
      </Reveal>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Prose({ tone = "white", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div className={`max-w-[62ch] space-y-4 text-pretty text-[16px] leading-[1.68] ${BODY[tone]}`}>
      {children}
    </div>
  );
}

/** A label-and-value table: the things a reviewer checks line by line. */
export function Facts({
  tone = "white",
  items,
  cols = 1,
}: {
  tone?: Tone;
  items: { label: string; value: ReactNode }[];
  cols?: 1 | 2;
}) {
  const two = cols === 2;
  return (
    <dl className={`grid border-t ${RULE[tone]} ${two ? "sm:grid-cols-2 sm:gap-x-12" : ""}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className={`group border-b py-[13px] transition-colors duration-200 ${RULE[tone]} ${
            two ? "px-1" : "grid gap-1 px-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-5"
          } ${tone === "maroon" ? "hover:bg-white/[0.04]" : "hover:bg-[#71222A]/[0.035]"}`}
        >
          <dt className={`text-[12.5px] leading-[1.5] ${LABEL[tone]}`}>{item.label}</dt>
          <dd className={`${two ? "mt-[5px] " : ""}text-[15px] leading-[1.55] ${VALUE[tone]}`}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A row of marks that drifts on its own, doubled so the loop never shows a
 * seam, and pausing when a reader points at it. */
export function Marquee({ children }: { children: ReactNode }) {
  return (
    <div className="lp-marquee group relative overflow-hidden">
      <div className="lp-marquee-track flex w-max items-center">
        <div className="flex shrink-0 items-center">{children}</div>
        <div aria-hidden className="flex shrink-0 items-center">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Equal cells, whatever the copy length — pair with `auto-rows-fr` so every
 * panel in the grid is the same height as well as the same width. */
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="group flex h-full flex-col rounded-[14px] border border-[#2B211D]/10 bg-white p-6 transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:border-[#71222A]/25 hover:shadow-[0_18px_40px_-24px_rgba(62,19,25,0.4)]">
      <h3 className="flex items-baseline gap-[10px] text-[16px] font-semibold leading-snug text-[#2B211D]">
        <span className="h-[6px] w-[6px] shrink-0 translate-y-[-2px] rounded-full bg-[#71222A] transition-transform duration-300 group-hover:scale-150" />
        {title}
      </h3>
      <p className="mt-[10px] text-pretty text-[15px] leading-[1.62] text-[#5B4C44]">{children}</p>
    </div>
  );
}

/** Marks a value Aroma Abadi still has to supply — deliberately the loudest
 * thing on a quiet page, so none of them ships unfilled. */
export function Pending({ field, tone = "white" }: { field: string; tone?: Tone }) {
  return (
    <span
      title="Belum diisi — lengkapi sebelum halaman ini dikirim ke Xendit."
      className={`inline-flex items-center gap-[7px] rounded-[5px] border border-dashed px-[8px] py-[2px] align-middle text-[14px] ${
        tone === "maroon"
          ? "border-[#E8B96A]/55 bg-[#E8B96A]/10 text-[#E8B96A]"
          : "border-[#B07A1F]/55 bg-[#B07A1F]/8 text-[#8A5E12]"
      }`}
    >
      <span
        className={`h-[5px] w-[5px] rounded-full ${tone === "maroon" ? "bg-[#E8B96A]" : "bg-[#B07A1F]"}`}
      />
      {field}
    </span>
  );
}

/** One step of the transaction flow. The spine runs through the numerals and
 * fills in as a reader arrives; the payment step lifts off the page. */
export function Step({
  n,
  title,
  body,
  points,
  screen,
  highlight = false,
  last = false,
}: {
  n: number;
  title: string;
  body: string;
  points?: { label: string; value: string }[];
  screen?: ReactNode;
  highlight?: boolean;
  last?: boolean;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="relative pb-12 pl-11 last:pb-0 sm:pl-16">
      {!last ? (
        <span
          aria-hidden
          className="absolute bottom-0 left-[15px] top-[34px] w-px bg-[#2B211D]/12 sm:left-[19px] sm:top-[38px]"
        />
      ) : null}
      <span
        className={`lp-display absolute left-0 top-0 grid h-[30px] w-[30px] place-items-center rounded-full border text-[14px] transition-[background-color,color,border-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:h-[38px] sm:w-[38px] sm:text-[17px] ${
          inView
            ? "border-[#71222A] bg-[#71222A] text-white"
            : "scale-90 border-[#2B211D]/20 bg-white text-[#8B6B51]"
        }`}
      >
        {n}
      </span>

      <div
        className={`lp-reveal ${inView ? "is-in" : ""} ${
          highlight
            ? "rounded-[18px] border border-[#71222A]/22 bg-white p-5 shadow-[0_26px_60px_-34px_rgba(62,19,25,0.5)] sm:p-8"
            : ""
        }`}
      >
        {highlight ? (
          <p className="mb-4 inline-flex items-center gap-[8px] rounded-full bg-[#71222A]/8 px-[11px] py-[4px] text-[13px] font-medium text-[#71222A]">
            <span className="lp-ping h-[6px] w-[6px] rounded-full bg-[#71222A]" />
            Titik integrasi Xendit
          </p>
        ) : null}
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_288px] lg:items-start lg:gap-12">
          <div className="min-w-0">
            <h3 className="text-[17px] font-semibold leading-snug text-[#2B211D]">{title}</h3>
            <p className="mt-[10px] max-w-[56ch] text-pretty text-[15px] leading-[1.65] text-[#5B4C44]">
              {body}
            </p>
            {points ? (
              <dl className="mt-5 overflow-hidden rounded-[12px] border border-[#2B211D]/10 bg-[#FAF5EF]">
                {points.map((point, index) => (
                  <div
                    key={point.label}
                    className={`grid gap-[3px] px-4 py-[11px] sm:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)] sm:gap-4 ${
                      index ? "border-t border-[#2B211D]/8" : ""
                    }`}
                  >
                    <dt className="text-[12.5px] leading-[1.5] text-[#8B6B51]">{point.label}</dt>
                    <dd className="text-[14px] leading-[1.5] text-[#2B211D]">{point.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
          {screen ? <div className="w-full max-w-[300px] lg:max-w-none">{screen}</div> : null}
        </div>
      </div>
    </div>
  );
}
