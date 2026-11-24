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

/** Opens the native calendar for a field the user clicked the icon of. Kept
 * off the field itself: a click inside the text is how you reach the year
 * segment to type into it, and a picker that opens there takes the field away
 * just as you aim at it. */
function openDatePicker(e: React.MouseEvent<HTMLElement>) {
  const input = (e.currentTarget as HTMLElement).querySelector("input");
  try {
    (input as HTMLInputElement | null)?.showPicker?.();
  } catch {
    /* the field is still typeable */
  }
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
 */
export function BoundedDateInput({
  value,
  min,
  max,
  label,
  onCommit,
}: {
  /** The committed date, or "" when nothing is chosen yet. */
  value: string;
  min: string;
  max: string;
  label: string;
  onCommit: (iso: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (iso: string) => (iso < min ? min : iso > max ? max : iso);

  const settle = () => {
    const typed = draft;
    setDraft(null);
    if (!typed) return;
    const next = clamp(typed);
    if (next !== value) onCommit(next);
  };

  return (
    <div className="relative" onClick={openDatePicker}>
      <input
        type="date"
        value={draft ?? value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(e) => {
          const next = e.target.value;
          if (next && next === clamp(next)) {
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
        className="h-8 w-full rounded-md border border-border bg-card px-2 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-text scl-date-input"
      />
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
