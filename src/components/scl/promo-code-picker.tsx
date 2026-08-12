import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, X as XIcon, Tag, ExternalLink, CheckCircle2, Clock, XCircle } from "lucide-react";
import { fmtDateEN } from "@/lib/fmt";
import {
  usePromoStore,
  describePromoRule,
  getPromoStatus,
  type PromoCode,
  type PromoStatus,
} from "@/components/scl/promo-store";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (promo: PromoCode) => void;
};

const PAGE_SIZE = 5;

function StatusBadge({ status }: { status: PromoStatus }) {
  if (status === "active")
    return (
      <span className="badge-animate inline-flex items-center gap-1 rounded-full border border-emerald-700 bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white">
        <CheckCircle2 className="h-2.5 w-2.5" /> Active
      </span>
    );
  if (status === "expired")
    return (
      <span className="badge-animate inline-flex items-center gap-1 rounded-full border border-rose-700 bg-rose-600 px-2 py-0.5 text-[10px] font-medium text-white">
        <XCircle className="h-2.5 w-2.5" /> Expired
      </span>
    );
  return (
    <span className="badge-animate inline-flex items-center gap-1 rounded-full border border-slate-400 bg-slate-500 px-2 py-0.5 text-[10px] font-medium text-white">
      <Clock className="h-2.5 w-2.5" /> Scheduled
    </span>
  );
}

/**
 * Large "select2-style" promo code picker — replaces the old cramped
 * inline popup. Reads live from promo-store.ts (the same data the real
 * Promo Codes page manages) instead of a hardcoded mock list, so any promo
 * code created there shows up here too. Search filters by code/name/rule;
 * paginated since the promo list only grows over time.
 */
export function PromoCodePicker({ open, onClose, onSelect }: Props) {
  const { promos } = usePromoStore();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setPage(1);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return promos;
    return promos.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        describePromoRule(p.rule).toLowerCase().includes(q),
    );
  }, [promos, query]);

  useEffect(() => setPage(1), [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl h-[640px] max-h-[88vh] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden modal-content"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/60">
          <Tag className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Select Promo Code</h2>
          <span className="text-[11px] text-muted-foreground">
            Insert a promo code token into the message
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              to="/promo-codes"
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md border border-border hover:bg-gray-50 text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              Manage promo codes <ExternalLink className="h-3 w-3" />
            </Link>
            <button
              onClick={onClose}
              className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground transition-colors duration-150"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 pt-3.5 pb-3 border-b border-border/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by code, name or rule…"
              className="w-full h-9 rounded-md border border-border bg-background/40 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {paged.length === 0 ? (
            <div className="px-5 py-16 text-center text-[13px] text-muted-foreground">
              {query ? `No promo codes match "${query}".` : "No promo codes yet."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border">
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Code
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Name &amp; Rule
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Period
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border stagger">
                {paged.map((promo) => (
                  <tr
                    key={promo.id}
                    onClick={() => onSelect(promo)}
                    className="cursor-pointer hover:bg-muted/40 transition-colors duration-150"
                  >
                    <td className="px-5 py-3">
                      <code className="font-mono text-xs font-semibold tracking-wider bg-primary/10 border border-primary/20 rounded px-2 py-0.5 text-foreground">
                        {promo.code}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-medium text-foreground">{promo.name}</div>
                      <div className="text-[11px] text-primary/80 mt-0.5 max-w-[420px] truncate">
                        {describePromoRule(promo.rule)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {promo.usageType === "one-to-one" ? (
                        <span className="inline-flex items-center rounded-full border border-sky-600 bg-sky-600 px-2 py-0.5 text-[10px] font-medium text-white">
                          1-to-1
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-violet-600 bg-violet-600 px-2 py-0.5 text-[10px] font-medium text-white">
                          1-to-Many
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">
                      {fmtDateEN(promo.startDate)} — {fmtDateEN(promo.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={getPromoStatus(promo)} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[11px] text-primary font-medium">Select →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 text-[11px] text-muted-foreground">
            <span>
              {filtered.length} promo code{filtered.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-7 px-2 rounded border border-border bg-card/40 disabled:opacity-40 hover:bg-card transition-colors duration-150"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-7 w-7 rounded border text-[11px] transition-colors duration-150 ${p === currentPage ? "border-primary/40 bg-primary/15 text-foreground" : "border-border bg-card/40 hover:bg-card"}`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-7 px-2 rounded border border-border bg-card/40 disabled:opacity-40 hover:bg-card transition-colors duration-150"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
