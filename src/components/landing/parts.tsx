import type { ReactNode } from "react";

/* Page furniture for the public company page.
 *
 * The page is built as an annotated document: a narrow column on the left
 * names the subject, a wider column on the right carries the content. Two
 * grounds alternate — ink for the parts a reader looks at (the conversation,
 * the transaction flow), ivory for the parts a reader reads. Radius carries
 * meaning here: paper edges stay nearly square, screens keep a device radius. */

export type Tone = "light" | "dark";

const TITLE_COLOR: Record<Tone, string> = { light: "text-[#71252A]", dark: "text-[#FBF7F0]" };
const BODY_COLOR: Record<Tone, string> = { light: "text-[#50443D]", dark: "text-[#E8DCCB]/80" };
const META_COLOR: Record<Tone, string> = { light: "text-[#8A7A6D]", dark: "text-[#D9B892]" };
const RULE_COLOR: Record<Tone, string> = {
  light: "border-[#3A2F2B]/12",
  dark: "border-[#FBF7F0]/14",
};

export function Section({
  id,
  tone = "light",
  className = "",
  children,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 ${tone === "dark" ? "lp-dark bg-[#2A0D12]" : "bg-[#FBF7F0]"} ${className}`}
    >
      <div className="mx-auto w-full max-w-[1180px] px-6 py-16 md:px-10 md:py-24">{children}</div>
    </section>
  );
}

/** Title and standfirst on the left, content on the right. */
export function Split({
  tone = "light",
  title,
  lede,
  children,
}: {
  tone?: Tone;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-x-14 gap-y-9 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
      <div className="self-start md:sticky md:top-24">
        <h2
          className={`lp-display text-[clamp(1.65rem,1.1rem+1.5vw,2.3rem)] leading-[1.12] ${TITLE_COLOR[tone]}`}
        >
          {title}
        </h2>
        <p className={`mt-3 max-w-[30ch] text-[15px] leading-[1.6] ${BODY_COLOR[tone]}`}>{lede}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Prose({ tone = "light", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div className={`max-w-[62ch] space-y-4 text-[16px] leading-[1.68] ${BODY_COLOR[tone]}`}>
      {children}
    </div>
  );
}

/** A label-and-value table. Used for the things a reviewer checks line by line. */
export function Facts({
  tone = "light",
  items,
}: {
  tone?: Tone;
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className={`border-t ${RULE_COLOR[tone]}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className={`grid gap-1 border-b py-3 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-5 ${RULE_COLOR[tone]}`}
        >
          <dt className={`text-[13px] leading-[1.5] ${META_COLOR[tone]}`}>{item.label}</dt>
          <dd
            className={`text-[15px] leading-[1.55] ${tone === "dark" ? "text-[#FBF7F0]" : "text-[#3A2F2B]"}`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A block of content under its own heading, ruled rather than boxed. */
export function Block({
  tone = "light",
  title,
  children,
}: {
  tone?: Tone;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={`border-t pt-4 ${RULE_COLOR[tone]}`}>
      <h3
        className={`text-[16px] font-semibold leading-snug ${tone === "dark" ? "text-[#FBF7F0]" : "text-[#3A2F2B]"}`}
      >
        {title}
      </h3>
      <p className={`mt-2 max-w-[58ch] text-[15px] leading-[1.62] ${BODY_COLOR[tone]}`}>
        {children}
      </p>
    </div>
  );
}

/** Marks a value Aroma Abadi still has to supply. Deliberately conspicuous:
 * these are the only things on the page that are not yet true. */
export function Pending({ field, tone = "light" }: { field: string; tone?: Tone }) {
  return (
    <span
      title="Belum diisi — lengkapi sebelum halaman ini dikirim ke Xendit."
      className={`inline-flex items-center gap-[7px] rounded-[5px] border border-dashed px-[8px] py-[2px] align-middle text-[14px] ${
        tone === "dark"
          ? "border-[#E8B96A]/55 bg-[#E8B96A]/10 text-[#E8B96A]"
          : "border-[#B07A1F]/55 bg-[#B07A1F]/8 text-[#8A5E12]"
      }`}
    >
      <span
        className={`h-[5px] w-[5px] rounded-full ${tone === "dark" ? "bg-[#E8B96A]" : "bg-[#B07A1F]"}`}
      />
      {field}
    </span>
  );
}

/** One step of the transaction flow. The spine runs through the numerals, and
 * breaks open at the step where the customer leaves WhatsApp for Xendit. */
export function Step({
  n,
  title,
  body,
  points,
  screen,
  caption,
  highlight = false,
  last = false,
}: {
  n: number;
  title: string;
  body: string;
  points?: { label: string; value: string }[];
  screen?: ReactNode;
  caption?: string;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative pl-10 pb-10 last:pb-0 sm:pl-16">
      {!last ? (
        <span
          aria-hidden
          className={`absolute left-[14px] top-[34px] bottom-0 w-px sm:left-[19px] sm:top-[38px] ${
            highlight ? "bg-[#4C6FE8]/40" : "bg-[#FBF7F0]/14"
          }`}
        />
      ) : null}
      <span
        className={`lp-display absolute left-0 top-0 grid h-[28px] w-[28px] place-items-center rounded-full border text-[14px] sm:h-[38px] sm:w-[38px] sm:text-[17px] ${
          highlight
            ? "border-[#4C6FE8] bg-[#4C6FE8] text-white"
            : "border-[#D9B892]/45 text-[#D9B892]"
        }`}
      >
        {n}
      </span>

      <div
        className={
          highlight
            ? "rounded-[14px] border border-[#4C6FE8]/45 bg-[#15204A]/70 p-4 sm:p-7"
            : undefined
        }
      >
        {highlight ? (
          <p className="mb-3 inline-flex items-center gap-[7px] rounded-full border border-[#8FA8FF]/40 px-[10px] py-[3px] text-[13px] text-[#9DB4FF]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#9DB4FF]" />
            Titik integrasi Xendit
          </p>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-10">
          <div className="min-w-0">
            <h3
              className={`text-[17px] font-semibold leading-snug ${highlight ? "text-white" : "text-[#FBF7F0]"}`}
            >
              {title}
            </h3>
            <p
              className={`mt-2 max-w-[56ch] text-[15px] leading-[1.65] ${
                highlight ? "text-[#DCE3FF]/85" : "text-[#E8DCCB]/80"
              }`}
            >
              {body}
            </p>
            {points ? (
              <dl className="mt-6 border-t border-[#8FA8FF]/25">
                {points.map((point) => (
                  <div
                    key={point.label}
                    className="grid gap-1 border-b border-[#8FA8FF]/25 py-[10px] sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-5"
                  >
                    <dt className="text-[13px] leading-[1.5] text-[#9DB4FF]">{point.label}</dt>
                    <dd className="text-[14px] leading-[1.5] text-[#EEF2FF]">{point.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
          {screen ? (
            <figure className="m-0 w-full max-w-[320px] lg:max-w-none">
              {screen}
              {caption ? (
                <figcaption
                  className={`mt-3 text-[13px] leading-[1.5] ${highlight ? "text-[#9DB4FF]" : "text-[#D9B892]"}`}
                >
                  {caption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}
        </div>
      </div>
    </div>
  );
}
