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
export const CAPTION = "text-[11px] font-medium uppercase tracking-wide text-muted-foreground";

export function fmtPct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

// ── Reveal-on-scroll — mounts/animates content only once its section
// actually scrolls into view, instead of everything firing at page load. ──
export function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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
      className={`transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
    >
      {children}
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
          className="inline-flex text-muted-foreground/50 hover:text-primary transition-colors"
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

// ── Single-metric stat tile — `spark` optionally renders a small trend
// chart (e.g. <Sparkline/>) to the right of the value. ─────────────────────
export function MetricStat({
  icon: Icon,
  label,
  value,
  sub,
  info,
  spark,
  accent,
}: {
  icon?: React.ElementType;
  label: string;
  value: string;
  sub?: string;
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
        <div className={VALUE_LG}>{value}</div>
        {spark && <div className="shrink-0">{spark}</div>}
      </div>
      {sub && (
        <div
          className={`mt-1 text-[11px] ${accent === "up" ? "text-emerald-600" : accent === "down" ? "text-rose-600" : "text-muted-foreground"}`}
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
      <div className="inline-flex items-center gap-1 justify-end text-[10px] text-muted-foreground">
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
        const prev = i > 0 ? stages[i - 1] : null;
        const dropPct = prev && prev.value ? (s.value / prev.value) * 100 : null;
        return (
          <div key={s.label}>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-xs font-medium text-foreground">{s.label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {fmtNum(s.value)}
                {dropPct !== null && (
                  <span className="ml-1.5 text-muted-foreground/70">({dropPct.toFixed(1)}%)</span>
                )}
              </span>
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
