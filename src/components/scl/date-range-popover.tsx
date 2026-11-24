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

/** A bound carries its year. The custom fields are the one place a year can
 * be wrong, so anything that states a limit has to name one. */
export function fmtDateWithYear(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS_SHORT[m - 1]} ${y}`;
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

/**
 * A date field that can be typed into without the value it is bound to
 * fighting back, and that cannot leave the dates the data covers.
 *
 * A native date input fires a change for every digit of the year, so typing
 * "2025" walks through 0002, 0020 and 0202 first. A field that clamped on each
 * of those would rewrite itself to the earliest date in the data three times
 * and never let the fourth digit land — which is why typing here used to work
 * only sometimes. This one holds what is being typed, commits the moment it
 * falls inside the bounds, and on blur snaps anything still outside them to
 * the nearest date the data actually has.
 *
 * The calendar opens from its icon, not from a click anywhere in the field.
 * Opening it on any click was tried and measured: with the picker up, Chrome
 * routes the keys to the calendar, so "01/06/2025" typed into the field came
 * out as 01 Nov 2026. A click in the text is how you reach a segment to type
 * into, so the icon keeps the picker and the text keeps the caret.
 */
export function BoundedDateInput({
  value,
  min,
  max,
  label,
  onCommit,
  allowEmpty = false,
  className = "w-full",
}: {
  /** The committed date, or "" when nothing is chosen yet. */
  value: string;
  min: string;
  max: string;
  label: string;
  onCommit: (iso: string) => void;
  /** Clearing the field is a real answer — an open-ended filter. */
  allowEmpty?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (iso: string) => (iso < min ? min : iso > max ? max : iso);
  // A half-typed year is a date the data does not have, and the figures on
  // the page still answer the last good one. Saying so beats a field that
  // quietly disagrees with every tile beside it.
  const willSnapTo = draft && draft !== clamp(draft) ? clamp(draft) : null;

  const settle = () => {
    const typed = draft;
    if (typed === null) return;
    setDraft(null);
    if (!typed) return;
    const next = clamp(typed);
    if (next !== value) onCommit(next);
  };

  return (
    <div className="space-y-1">
      <input
        type="date"
        value={draft ?? value}
        min={min}
        max={max}
        aria-label={label}
        aria-invalid={willSnapTo ? true : undefined}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "") {
            // Half a date reads as "" too. badInput is what tells the two
            // apart: with segments partly filled we must not set state at
            // all, because re-rendering writes the bound value back over
            // what is being typed — which is why a field that started empty
            // could never be typed into.
            if (e.currentTarget.validity.badInput) return;
            setDraft(null);
            if (allowEmpty && value !== "") onCommit("");
            return;
          }
          if (next === clamp(next)) {
            setDraft(null);
            if (next !== value) onCommit(next);
            return;
          }
          setDraft(next);
        }}
        onBlur={settle}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          settle();
          e.currentTarget.blur();
        }}
        className={`h-8 rounded-md border bg-card px-2 text-[13px] text-foreground focus:outline-none focus:ring-1 cursor-text scl-date-input transition-colors duration-150 ${className} ${
          willSnapTo
            ? "border-amber-500/70 focus:ring-amber-500/40"
            : "border-border focus:ring-primary/40"
        }`}
      />
      {willSnapTo && (
        <p className="px-0.5 text-[12px] font-medium text-amber-700">
          Outside the data — snaps to {fmtDateWithYear(willSnapTo)}.
        </p>
      )}
    </div>
  );
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
            <BoundedDateInput
              value={range.start}
              min={bounds.start}
              max={range.end}
              label="From date"
              onCommit={(iso) => onChange({ start: iso, end: range.end }, null)}
            />
            <BoundedDateInput
              value={range.end}
              min={range.start}
              max={bounds.end}
              label="To date"
              onCommit={(iso) => onChange({ start: range.start, end: iso }, null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
