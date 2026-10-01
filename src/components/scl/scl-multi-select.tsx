import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search as SearchIcon } from "lucide-react";
import { FloatingMenu } from "./floating-menu";
import type { SclSelectOption } from "./scl-select";

/**
 * Checklist dropdown: several options can be ticked at once, and the list
 * pages rather than growing a long scroller.
 *
 * The trigger sizes to its own label instead of taking a fixed column width —
 * a long name like "Customer Service" wraps onto a second line and the control
 * stays only as wide as the words need.
 */
export function SclMultiSelect({
  values,
  options,
  onChange,
  allLabel,
  pageSize = 8,
  searchable = false,
  searchPlaceholder = "Search…",
  ariaLabel,
  menuWidth,
}: {
  values: string[];
  options: SclSelectOption[];
  onChange: (values: string[]) => void;
  /** Shown on the trigger while nothing is ticked. */
  allLabel: string;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  ariaLabel?: string;
  menuWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const btnRef = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // A narrowed search can leave the viewer on a page that no longer exists.
  useEffect(() => {
    setPage(1);
  }, [query, options.length]);

  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);

  const picked = options.filter((o) => values.includes(o.value));
  const triggerLabel =
    picked.length === 0
      ? allLabel
      : picked.length === 1
        ? picked[0].label
        : `${picked.length} selected`;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex min-h-9 max-w-[11rem] items-center justify-between gap-2 rounded-md border bg-card/60 px-3 py-1.5 text-[13px] hover:bg-card focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 transition-colors ${
          picked.length > 0 ? "border-primary/40 bg-primary/5" : "border-border"
        }`}
      >
        <span className="flex items-center gap-2 text-left">
          {picked.length === 1 && picked[0].dot ? (
            <span className={`h-2 w-2 rounded-full shrink-0 ${picked[0].dot}`} />
          ) : null}
          <span
            className={`leading-snug ${picked.length ? "text-foreground" : "text-muted-foreground"}`}
          >
            {triggerLabel}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <FloatingMenu
        anchorRef={btnRef}
        open={open}
        onClose={() => {
          setOpen(false);
          setQuery("");
        }}
        width={menuWidth}
      >
        <div className="rounded-md border border-border bg-popover shadow-xl overflow-hidden animate-scale-in origin-top">
          {searchable && (
            <div className="relative border-b border-border">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-9 bg-transparent pl-8 pr-3 text-[12px] focus:outline-none"
              />
            </div>
          )}

          <div className="p-1">
            {paged.length === 0 && (
              <div className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                No matches
              </div>
            )}
            {paged.map((o) => {
              const on = values.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  className="press w-full flex items-start gap-2 rounded px-2 py-1.5 text-left text-[12px] text-foreground/90 hover:bg-gray-50 transition-colors"
                >
                  <span
                    className={`mt-[1px] grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[3px] border transition-colors ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-white"
                    }`}
                  >
                    {on && (
                      <svg
                        viewBox="0 0 10 8"
                        className="h-2 w-2 fill-none stroke-current stroke-[1.8]"
                      >
                        <path
                          d="M1 4.2 3.5 6.7 9 1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {o.icon ? (
                    <span className="mt-[1px] shrink-0">{o.icon}</span>
                  ) : o.dot ? (
                    <span className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${o.dot}`} />
                  ) : null}
                  {/* No flex-1: the label block is only as wide as its words, so a
                      long name wraps instead of stretching across the menu. */}
                  <span className="leading-snug break-words">{o.label}</span>
                </button>
              );
            })}
          </div>

          {/* Always rendered, disabled at a single page — same rule as the
              transactions footer, so the menu keeps its shape as a search
              narrows the list instead of the footer appearing and vanishing. */}
          <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-1.5 text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              aria-label="Previous page"
              className="press grid h-6 w-6 place-items-center rounded border border-border bg-card/40 enabled:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <span className="tabular-nums">
              {safePage} / {totalPages} · {filtered.length} entr
              {filtered.length === 1 ? "y" : "ies"}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              aria-label="Next page"
              className="press grid h-6 w-6 place-items-center rounded border border-border bg-card/40 enabled:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {values.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="press w-full border-t border-border px-3 py-2 text-left text-[12px] text-muted-foreground hover:bg-gray-50 hover:text-foreground transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>
      </FloatingMenu>
    </div>
  );
}
