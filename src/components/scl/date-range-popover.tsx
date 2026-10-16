import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import type { DateRange } from "@/components/scl/overview-metrics";

/* Date window control, same shape as the one on Overview: presets first, a
 * custom from/to pair underneath, and both inputs clamped to the bounds the
 * caller passes so a filter can never reach outside the data it filters. */

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Works on the "YYYY-MM-DD" parts directly: `new Date(iso)` reads as UTC or
 * local depending on whether a time is present, which can shift the day. */
export function fmtShortDate(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS_SHORT[m - 1]}`;
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export type RangePreset = { label: string; range: DateRange };

/** The presets every lifetime-scoped filter starts from: the whole span first,
 * then the usual trailing windows, each clamped so it can't start before the
 * data does. */
export function lifetimePresets(bounds: DateRange): RangePreset[] {
  const clampStart = (iso: string) => (iso < bounds.start ? bounds.start : iso);
  return [
    { label: "Program Lifetime", range: bounds },
    {
      label: "Last 7 Days",
      range: { start: clampStart(addDaysIso(bounds.end, -6)), end: bounds.end },
    },
    {
      label: "Last 30 Days",
      range: { start: clampStart(addDaysIso(bounds.end, -29)), end: bounds.end },
    },
  ];
}

export function DateRangePopover({
  range,
  bounds,
  presets,
  selectedLabel,
  onChange,
}: {
  range: DateRange;
  /** Earliest and latest date the filter may reach. */
  bounds: DateRange;
  presets: RangePreset[];
  /** Which preset the caller last applied — presets can clamp to identical
   * ranges, so matching by value alone would mislabel them. */
  selectedLabel: string | null;
  onChange: (range: DateRange, presetLabel: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const label = selectedLabel ?? `${fmtShortDate(range.start)} – ${fmtShortDate(range.end)}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 h-9 rounded-md border border-border bg-card/60 px-3 text-[13px] text-muted-foreground hover:text-foreground hover:bg-card transition-colors duration-150"
      >
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span className="max-w-[160px] truncate">{label}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-border bg-popover shadow-xl p-2 animate-scale-in origin-top-right">
          <div className="space-y-0.5">
            {presets.map((p) => {
              const active = selectedLabel === p.label;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    onChange(p.range, p.label);
                    setOpen(false);
                  }}
                  className={`w-full text-left h-8 px-3 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                    active
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="my-2 border-t border-border" />
          <div className="px-1 pb-1 space-y-1.5">
            <div className="text-[12px] uppercase tracking-wider text-muted-foreground px-2">
              Custom Range
            </div>
            <input
              type="date"
              value={range.start}
              min={bounds.start}
              max={range.end}
              onChange={(e) => {
                if (e.target.value) onChange({ start: e.target.value, end: range.end }, null);
              }}
              aria-label="From date"
              className="h-8 w-full rounded-md border border-border bg-card px-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer scl-date-input"
            />
            <input
              type="date"
              value={range.end}
              min={range.start}
              max={bounds.end}
              onChange={(e) => {
                if (e.target.value) onChange({ start: range.start, end: e.target.value }, null);
              }}
              aria-label="To date"
              className="h-8 w-full rounded-md border border-border bg-card px-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer scl-date-input"
            />
          </div>
        </div>
      )}
    </div>
  );
}
