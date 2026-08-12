import { useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search as SearchIcon } from "lucide-react";
import { FloatingMenu } from "./floating-menu";

export type SclSelectOption = {
  value: string;
  label: string;
  description?: string;
  /** Tailwind class for a small colored dot (e.g. "bg-emerald-400"). */
  dot?: string;
  /** Optional leading icon (replaces dot when provided). */
  icon?: ReactNode;
  /** Optional trailing label e.g. handle / hint. */
  trailing?: string;
};

type Props = {
  value: string | null | undefined;
  options: SclSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  size?: "sm" | "md";
  width?: number;
  /** Inline width on the trigger (e.g. "w-40"). */
  className?: string;
  searchable?: boolean;
  ariaLabel?: string;
};

/**
 * Standardized SCL dropdown.
 * - Portal-rendered via FloatingMenu so it escapes scroll/overflow containers.
 * - Single visual language across the platform — do not roll your own.
 */
export function SclSelect({
  value,
  options,
  onChange,
  placeholder = "Select…",
  size = "md",
  width,
  className = "",
  searchable = false,
  ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;
  const hClass = size === "sm" ? "h-8 text-[12px] px-2.5" : "h-9 text-[13px] px-3";

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex w-full items-center justify-between gap-2 rounded-md border border-border bg-card/60 hover:bg-card focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 transition-colors ${hClass}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected?.icon ? (
            <span className="shrink-0">{selected.icon}</span>
          ) : selected?.dot ? (
            <span className={`h-2 w-2 rounded-full shrink-0 ${selected.dot}`} />
          ) : null}
          <span className={`truncate ${selected ? "text-foreground" : "text-muted-foreground"}`}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>

      <FloatingMenu
        anchorRef={btnRef}
        open={open}
        onClose={() => {
          setOpen(false);
          setQuery("");
        }}
        width={width}
      >
        <div className="rounded-md border border-border bg-popover shadow-xl overflow-hidden">
          {searchable && (
            <div className="relative border-b border-border">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full h-9 bg-transparent pl-8 pr-3 text-[12px] focus:outline-none"
              />
            </div>
          )}
          <div className="max-h-[280px] overflow-auto scl-scroll p-1">
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                No matches
              </div>
            )}
            {filtered.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-[12px] transition ${
                    active ? "bg-primary/10 text-foreground" : "text-foreground/90 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {o.icon ? (
                      <span className="shrink-0">{o.icon}</span>
                    ) : o.dot ? (
                      <span className={`h-2 w-2 rounded-full shrink-0 ${o.dot}`} />
                    ) : null}
                    <span className="truncate">{o.label}</span>
                    {o.trailing && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        {o.trailing}
                      </span>
                    )}
                  </span>
                  {active && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </FloatingMenu>
    </div>
  );
}
