import { useEffect, useRef, useState, type ReactNode } from "react";
import { fmtNum } from "@/lib/fmt";
import { Info } from "lucide-react";
import { Tooltip as InfoTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Shared dashboard building blocks — chart styling constants, stat tiles,
 * reveal-on-scroll, and the step funnel. Originally lived only in
 * routes/index.tsx (the Overview page); pulled out so the CRM & Loyalty
 * Program Analytics section (loyalty-analytics-section.tsx) can reuse the
 * exact same look instead of drifting into its own visual language.
 */

// ── Shared chart styling — light surface, dark text (matches the design
// system's card/popover tokens; charts must never render dark-on-dark). ────
export const chartTooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
  padding: "8px 12px",
  boxShadow: "0 8px 24px oklch(0.2 0.02 30 / 12%)",
};
export const chartLabelStyle = { color: "var(--foreground)", fontWeight: 600, marginBottom: 3 };
export const chartItemStyle = { color: "var(--muted-foreground)", padding: 0 };
export const axisColor = "var(--muted-foreground)";
export const gridColor = "var(--border)";
export const cursorFill = "oklch(0.42 0.12 25 / 6%)";
export const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** An axis tick for a trend bucket — short, because it repeats across the axis. */
export function trendTick(bucket: string, granularity: "day" | "month" | "year"): string {
  if (granularity === "year") return bucket;
  const [y, m, d] = bucket.split("-");
  const month = MONTHS[Number(m) - 1] ?? m;
  // The year is written out for a month bucket. Abbreviated it read as a
  // day — "May 26" on a two-year axis looks like the 26th of May, which is
  // exactly how it was reported.
  return granularity === "month" ? `${month} ${y}` : `${Number(d)} ${month}`;
}

/**
 * The trend's x-axis label.
 *
 * Recharts centres a tick on its point, which hangs the first and last labels
 * off the ends of the plot — "24 Jul" started to the left of the gridlines and
 * read as belonging to the y-axis. The ends anchor inward instead, so the first
 * label begins exactly where the gridlines begin and the last one finishes with
 * them, and the row sits a few pixels lower, clear of the axis.
 */
export function TrendAxisTick({
  x,
  y,
  payload,
  index,
  visibleTicksCount,
  granularity,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  index?: number;
  visibleTicksCount?: number;
  granularity: "day" | "month" | "year";
}) {
  const last = typeof visibleTicksCount === "number" && index === visibleTicksCount - 1;
  const anchor = index === 0 ? "start" : last ? "end" : "middle";
  return (
    <text x={x} y={y} dy={14} textAnchor={anchor} fontSize={11} fill="var(--muted-foreground)">
      {trendTick(payload?.value ?? "", granularity)}
    </text>
  );
}

/** The same bucket in a tooltip, where there is room to say it in full. */
export function trendLabel(bucket: string, granularity: "day" | "month" | "year"): string {
  if (granularity === "year") return bucket;
  const [y, m, d] = bucket.split("-");
  const month = MONTHS[Number(m) - 1] ?? m;
  return granularity === "month" ? `${month} ${y}` : `${Number(d)} ${month} ${y}`;
}
export const BRAND_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// ── Type scale (kept to two sizes so every metric reads consistently) ──────
export const VALUE_LG = "text-2xl font-semibold tracking-tight stat-value"; // primary tile numbers
export const VALUE_SM = "text-xl font-semibold tracking-tight stat-value"; // header-corner badges
// Two figures where a tile normally holds one. Dropped a step so "2,970 –
// 3,180" still fits a five-across tile at 1280px without the dash wrapping
// away from the number it belongs to.
export const VALUE_RANGE = "text-xl font-semibold tracking-tight stat-value";
export const CAPTION = "text-[11px] font-medium uppercase tracking-wide text-muted-foreground";

export function fmtPct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

/** The element's own width, kept current as the window resizes. The trend
 *  axis needs it to decide how many labels it can carry. */
export function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof ResizeObserver === "undefined") {
      setWidth(el.getBoundingClientRect().width);
      return;
    }
    const obs = new ResizeObserver(([entry]) => {
      // Zero readings are discarded. The reveal animation parks the card off
      // layout for a frame and the observer duly reports 0 — taking that at
      // face value wiped the real measurement and left the axis falling back
      // to Recharts' own thinning for the rest of the page's life.
      if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    obs.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => obs.disconnect();
  }, []);
  return { ref, width };
}

/**
 * Which buckets get a label — evenly stepped, anchored on the newest one.
 *
 * Recharts thins a crowded axis itself: it keeps the first and last label and
 * drops whichever others do not fit. That leaves the rhythm broken wherever
 * the drop happens to land — two years of months came out ... May 2026, Jul
 * 2026, Nov 2026, with the final gap twice the width of every other, which
 * reads as missing data rather than as a thinned axis. Choosing the ticks
 * here keeps one step the whole way across, and the step is simply the
 * smallest one the axis is wide enough to carry.
 */
/** What the value axis and the chart's own margins take off the left before
 *  any label can be drawn — measured at 93px against "320.0jt", rounded up.
 *  Over-reserving only costs a label; under-reserving overlaps them. */
const TREND_AXIS_INSET = 96;

/** Room each label needs along the axis. The label's own width, plus half a
 *  label again: the first and last are anchored inward so they stand clear of
 *  the y-axis and the right edge, which pushes them toward their neighbours by
 *  half their width. Ignoring that is what had "May 2025" and "Nov 2025"
 *  touching at 390px. */
const TREND_LABEL_PITCH = { day: 68, month: 80, year: 56 } as const;

export function trendTicks(
  buckets: string[],
  granularity: "day" | "month" | "year",
  width: number,
): string[] {
  if (buckets.length === 0 || width <= 0) return [];
  const plot = Math.max(0, width - TREND_AXIS_INSET);
  // n labels leave n-1 gaps between them, so the gaps are what the width has
  // to cover — counting labels instead loses one every time.
  const fits = Math.max(2, Math.floor(plot / TREND_LABEL_PITCH[granularity]) + 1);
  const step = Math.max(1, Math.ceil(buckets.length / fits));
  const out: string[] = [];
  for (let i = buckets.length - 1; i >= 0; i -= step) out.unshift(buckets[i]);
  return out;
}

// ── Reveal-on-scroll — mounts/animates content only once its section
// actually scrolls into view, instead of everything firing at page load. ──
export function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // No observer (older browser, print, some assistive contexts) must not
    // mean a permanently blank dashboard.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

export function Reveal({
  innerRef,
  inView,
  children,
  className = "",
}: {
  innerRef: React.Ref<HTMLDivElement>;
  inView: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      ref={innerRef}
      className={`transition-all duration-300 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
    >
      {/* The children bring their own mount-triggered entrances — the tile
          stagger, the count-up on every number, the bars growing out from the
          left. Those fire at t=0, which used to be while this wrapper was
          still at opacity-0, so by the time the section scrolled into view the
          choreography was long over and the user saw one flat block fade.
          Keying the subtree on `inView` restarts it the moment the section is
          actually on screen. The children stay mounted either way, so the
          page height never jumps. */}
      <div key={inView ? "in" : "out"}>{children}</div>
    </div>
  );
}

// ── Info hint — hover an ⓘ next to any metric label to see its definition. ──
export function InfoHint({ text }: { text: string }) {
  return (
    <InfoTooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="tap inline-flex items-center justify-center text-muted-foreground/50 hover:text-primary transition-colors"
          aria-label="What is this metric?"
        >
          <Info className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[240px] text-center leading-snug bg-popover text-popover-foreground border border-border shadow-lg"
      >
        {text}
      </TooltipContent>
    </InfoTooltip>
  );
}

const SUB_TONE = {
  up: "text-emerald-600",
  down: "text-rose-600",
  none: "text-muted-foreground",
} as const;

// ── Single-metric stat tile — `spark` optionally renders a small trend
// chart (e.g. <Sparkline/>) to the right of the value. ─────────────────────
export function MetricStat({
  icon: Icon,
  label,
  value,
  valueRange,
  sub,
  subInline,
  subDim,
  info,
  spark,
  accent,
}: {
  icon?: React.ElementType;
  label: string;
  value: string;
  /** A standing count read over a window: where it started and where it
   *  finished. Takes the place of `value`, which is then only the fallback
   *  for a window too short to have two ends. */
  valueRange?: { from: string; to: string };
  sub?: string;
  /** Put `sub` on the value's own line, at the tile's right edge, rather than
   *  on a line of its own underneath. For a unit, not for a sentence. */
  subInline?: boolean;
  /** A quieter `sub`. For a line that qualifies the figure rather than
   *  adding to it — the window a standing count was read over, say, which
   *  repeats across a whole row and should not compete with the numbers. */
  subDim?: boolean;
  info: string;
  spark?: ReactNode;
  accent?: "up" | "down";
}) {
  return (
    <div className="card-hover rounded-xl border border-border bg-card/60 p-4 glass relative overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          {label}
          <InfoHint text={info} />
        </span>
        {Icon && (
          <div className="h-6 w-6 shrink-0 grid place-items-center rounded-md bg-white/[0.04] border border-border">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        {valueRange ? (
          // The dash is set lighter and smaller than the figures so the eye
          // reads two numbers with a span between them, rather than one
          // number that has gone wrong.
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className={VALUE_RANGE}>{valueRange.from}</span>
            <span className="text-[15px] font-normal text-muted-foreground">–</span>
            <span className={VALUE_RANGE}>{valueRange.to}</span>
          </div>
        ) : (
          <div className={VALUE_LG}>{value}</div>
        )}
        {/* subInline: a short unit that belongs to the figure — "4.4" and
            "items / transaction" read as one statement, so it rides the same
            line, pushed to the tile's edge. A caption that is its own
            sentence ("+12.4% vs previous period"), or a tile carrying a
            sparkline, keeps the line below instead. */}
        {sub && subInline && (
          <div className={`shrink-0 pb-1 text-[12px] leading-none ${SUB_TONE[accent ?? "none"]}`}>
            {sub}
          </div>
        )}
        {spark && <div className="shrink-0">{spark}</div>}
      </div>
      {sub && !subInline && (
        <div
          className={`mt-1 text-[12px] ${SUB_TONE[accent ?? "none"]} ${subDim ? "opacity-75" : ""}`}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Compact header-corner stat badge (used in SectionCard's action slot) ──
export function CornerStat({ value, label, info }: { value: string; label: string; info: string }) {
  return (
    <div className="text-right">
      <div className={VALUE_SM}>{value}</div>
      {/* 12px, not 10: this is the only name the figure above it has, and at
          10px it read as a footnote to a number nobody could place. */}
      <div className="inline-flex items-center gap-1 justify-end text-[12px] text-muted-foreground">
        {label} <InfoHint text={info} />
      </div>
    </div>
  );
}

// ── Step funnel — a sequence of proportional bars, replacing recharts'
// Funnel (whose trapezoid geometry breaks down at wide value ranges). ──────
export type FunnelStage = { label: string; value: number; color: string };
export function StepFunnel({ stages }: { stages: FunnelStage[] }) {
  const max = stages[0]?.value || 1;
  return (
    <div className="p-4 space-y-2">
      {stages.map((s, i) => {
        const widthPct = Math.max((s.value / max) * 100, 10);
        return (
          <div key={s.label}>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-xs font-medium text-foreground">{s.label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{fmtNum(s.value)}</span>
            </div>
            <div className="h-4 rounded-md bg-muted overflow-hidden">
              <div
                className="h-full rounded-md animate-grow-x"
                style={{ width: `${widthPct}%`, background: s.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
