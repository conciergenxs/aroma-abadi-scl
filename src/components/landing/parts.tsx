import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/* Page furniture for the public company page.
 *
 * The page is an annotated document: a narrow column names the subject, a
 * wider one carries the content. Type and colour are the LMS house set —
 * Playfair Display over Montserrat, #710014 on cream — and the only thing
 * allowed to break the rhythm is the step where the customer pays.
 *
 * Motion is tied to reading: a block settles as it comes into view, once,
 * and the numerals of the transaction flow fill in as a reader reaches
 * them. Nothing loops except the hero, and nothing moves for anyone who
 * asked their system to minimise motion. */

export type Tone = "white" | "cream" | "maroon";

const GROUND: Record<Tone, string> = {
  white: "bg-white",
  cream: "bg-[#F3F0EC]",
  maroon: "lp-dark bg-[#4A000D]",
};
const TITLE: Record<Tone, string> = {
  white: "text-[#710014]",
  cream: "text-[#710014]",
  maroon: "text-[#FBFAF8]",
};
const BODY: Record<Tone, string> = {
  white: "text-[#55504B]",
  cream: "text-[#55504B]",
  maroon: "text-[#F3F0EC]/75",
};
const LABEL: Record<Tone, string> = {
  white: "text-[#8A6246]",
  cream: "text-[#8A6246]",
  maroon: "text-[#E7CF95]",
};
const VALUE: Record<Tone, string> = {
  white: "text-[#161616]",
  cream: "text-[#161616]",
  maroon: "text-[#FBFAF8]",
};
const RULE: Record<Tone, string> = {
  white: "border-[#E6D8CD]",
  cream: "border-[#E0D4C8]",
  maroon: "border-[#F3F0EC]/15",
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
  bleed,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
  /** Rendered outside the reading column, edge to edge. */
  bleed?: ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-[76px] ${GROUND[tone]} ${className}`}>
      <div
        className={`mx-auto w-full max-w-[1180px] px-6 pt-12 md:px-10 md:pt-16 ${
          bleed ? "pb-8 md:pb-10" : "pb-12 md:pb-16"
        }`}
      >
        {children}
      </div>
      {bleed ? <div className="pb-10 md:pb-14">{bleed}</div> : null}
    </section>
  );
}

/** Title and standfirst on the left, content on the right. */
export function Split({
  tone = "white",
  icon: Icon,
  title,
  lede,
  aside,
  children,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  title: string;
  lede: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-x-10 gap-y-7 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <Reveal className="self-start md:sticky md:top-[92px]">
        {Icon ? (
          <span
            className={`mb-4 grid h-[38px] w-[38px] place-items-center rounded-full ${
              tone === "maroon" ? "bg-[#E7CF95]/15 text-[#E7CF95]" : "bg-[#710014]/7 text-[#710014]"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </span>
        ) : null}
        <h2
          className={`lp-display text-[clamp(1.6rem,1.05rem+1.5vw,2.2rem)] leading-[1.14] ${TITLE[tone]}`}
        >
          {title}
        </h2>
        <span
          className={`mt-3 block h-px w-10 ${tone === "maroon" ? "bg-[#E7CF95]/45" : "bg-[#BF9877]"}`}
        />
        <p className={`mt-3 max-w-[30ch] text-pretty text-[14.5px] leading-[1.58] ${BODY[tone]}`}>
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
    <div className={`max-w-[62ch] space-y-3 text-pretty text-[15.5px] leading-[1.62] ${BODY[tone]}`}>
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
  items: { label: string; value: ReactNode; icon?: LucideIcon; iconNode?: ReactNode }[];
  cols?: 1 | 2;
}) {
  const two = cols === 2;
  return (
    <dl className={`grid border-t ${RULE[tone]} ${two ? "sm:grid-cols-2 sm:gap-x-12" : ""}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className={`group border-b py-[10px] transition-colors duration-200 ${RULE[tone]} ${
            two ? "px-1" : "grid gap-1 px-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-5"
          } ${tone === "maroon" ? "hover:bg-white/[0.04]" : "hover:bg-[#710014]/[0.03]"}`}
        >
          <dt className={`flex items-center gap-2 text-[12.5px] leading-[1.5] ${LABEL[tone]}`}>
            {item.iconNode ??
              (item.icon ? <item.icon className="h-[14px] w-[14px]" strokeWidth={1.7} /> : null)}
            {item.label}
          </dt>
          <dd className={`${two ? "mt-[5px] " : ""}text-[14.5px] leading-[1.55] ${VALUE[tone]}`}>
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

/** The same facts as <Facts>, but given weight: a hairline grid of tiles,
 * each led by its own mark. For the handful of statements a reviewer is
 * actually looking for. */
export function FactTiles({
  items,
}: {
  items: { icon: LucideIcon; label: string; value: string }[];
}) {
  return (
    <div className="grid gap-px overflow-hidden rounded-[16px] border border-[#E6D8CD] bg-[#E6D8CD] sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="group bg-white p-4 transition-colors duration-300 hover:bg-[#F3F0EC]"
        >
          <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#710014]/7 text-[#710014] transition-colors duration-300 group-hover:bg-[#710014] group-hover:text-white">
            <item.icon className="h-[16px] w-[16px]" strokeWidth={1.7} />
          </span>
          <p className="mt-3 text-[12.5px] leading-[1.4] text-[#8A6246]">{item.label}</p>
          <p className="mt-[4px] text-pretty text-[14px] font-medium leading-[1.45] text-[#161616]">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Equal cells, whatever the copy length — pair with `auto-rows-fr` so every
 * panel in the grid is the same height as well as the same width. */
export function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="group flex h-full flex-col rounded-[14px] border border-[#E6D8CD] bg-white p-5 transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:border-[#710014]/30 hover:shadow-[0_18px_40px_-24px_rgba(113,0,20,0.4)]">
      <span className="grid h-[36px] w-[36px] place-items-center rounded-full bg-[#710014]/7 text-[#710014] transition-colors duration-300 group-hover:bg-[#710014] group-hover:text-white">
        <Icon className="h-[17px] w-[17px]" strokeWidth={1.6} />
      </span>
      <h3 className="mt-3 text-[15.5px] font-semibold leading-snug text-[#161616]">{title}</h3>
      <p className="mt-[7px] text-pretty text-[14.5px] leading-[1.6] text-[#55504B]">{children}</p>
    </div>
  );
}

/** Marks a value Aroma Abadi still has to supply — deliberately the loudest
 * thing on a quiet page, so none of them ships unfilled. */
export function Pending({ field, tone = "white" }: { field: string; tone?: Tone }) {
  return (
    <span
      title="Not filled in yet — complete this before the page goes to Xendit."
      className={`inline-flex items-center gap-[7px] rounded-[5px] border border-dashed px-[8px] py-[2px] align-middle text-[13.5px] ${
        tone === "maroon"
          ? "border-[#E7CF95]/55 bg-[#E7CF95]/10 text-[#E7CF95]"
          : "border-[#B07A1F]/55 bg-[#B07A1F]/8 text-[#8A5E12]"
      }`}
    >
      <span
        className={`h-[5px] w-[5px] rounded-full ${tone === "maroon" ? "bg-[#E7CF95]" : "bg-[#B07A1F]"}`}
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
  points?: { label: string; value: string; icon?: LucideIcon }[];
  screen?: ReactNode;
  highlight?: boolean;
  last?: boolean;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="relative pb-9 pl-10 last:pb-0 sm:pl-14">
      {!last ? (
        <span
          aria-hidden
          className="absolute bottom-0 left-[14px] top-[32px] w-px bg-[#161616]/12 sm:left-[17px] sm:top-[36px]"
        />
      ) : null}
      <span
        className={`lp-display absolute left-0 top-0 grid h-[28px] w-[28px] place-items-center rounded-full border text-[14px] transition-[background-color,color,border-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:h-[34px] sm:w-[34px] sm:text-[16px] ${
          inView
            ? "border-[#710014] bg-[#710014] text-white"
            : "scale-90 border-[#E6D8CD] bg-white text-[#8A6246]"
        }`}
      >
        {n}
      </span>

      <div
        className={`lp-reveal ${inView ? "is-in" : ""} ${
          highlight
            ? "rounded-[18px] border border-[#710014]/20 bg-white p-5 shadow-[0_26px_60px_-34px_rgba(113,0,20,0.45)] sm:p-6"
            : ""
        }`}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_282px] lg:items-start lg:gap-10">
          <div className="min-w-0">
            {highlight ? (
              <p className="mb-4 inline-flex items-center gap-[8px] rounded-full bg-[#710014]/8 px-[11px] py-[4px] text-[12.5px] font-medium text-[#710014]">
                <span className="lp-ping h-[6px] w-[6px] rounded-full bg-[#710014]" />
                Titik integrasi Xendit
              </p>
            ) : null}
            <h3 className="text-[16.5px] font-semibold leading-snug text-[#161616]">{title}</h3>
            <p className="mt-[9px] max-w-[56ch] text-pretty text-[14.5px] leading-[1.62] text-[#55504B]">
              {body}
            </p>
            {points ? (
              <dl className="mt-5 max-w-[46ch] overflow-hidden rounded-[12px] border border-[#E6D8CD] bg-[#F3F0EC]">
                {points.map((point, index) => (
                  <div
                    key={point.label}
                    className={`px-4 py-[10px] ${index ? "border-t border-[#E0D4C8]" : ""}`}
                  >
                    <dt className="flex items-center gap-2 text-[12.5px] leading-[1.5] text-[#8A6246]">
                      {point.icon ? (
                        <point.icon className="h-[14px] w-[14px]" strokeWidth={1.7} />
                      ) : null}
                      {point.label}
                    </dt>
                    <dd className="mt-[4px] text-[13.5px] leading-[1.5] text-[#161616]">
                      {point.value}
                    </dd>
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
