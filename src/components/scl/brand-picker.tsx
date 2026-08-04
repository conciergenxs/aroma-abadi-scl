import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X as XIcon, Tag } from "lucide-react";
import { useSkuStore, type Brand } from "@/components/scl/sku-store";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (brand: Brand) => void;
};

const PAGE_SIZE = 4;

/**
 * Large "select2-style" brand picker — same modal/search/pagination shell
 * as PromoCodePicker, reading live from sku-store.ts so any brand added on
 * the SKU & Knowledge page shows up here too.
 */
export function BrandPicker({ open, onClose, onSelect }: Props) {
  const { brands } = useSkuStore();
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
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, query]);

  useEffect(() => setPage(1), [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 modal-backdrop" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl h-[560px] max-h-[88vh] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden modal-content"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/60">
          <Tag className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Select Brand</h2>
          <span className="text-[11px] text-muted-foreground">Insert a brand token into the message</span>
          <button onClick={onClose} className="ml-auto h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground transition-colors duration-150">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-3.5 pb-3 border-b border-border/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brands…"
              className="w-full h-9 rounded-md border border-border bg-background/40 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          {paged.length === 0 ? (
            <div className="px-5 py-16 text-center text-[13px] text-muted-foreground">
              {query ? `No brands match "${query}".` : "No brands yet."}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 stagger">
              {paged.map((b) => {
                const skuCount = b.categories.reduce((s, c) => s + c.skus.length, 0);
                return (
                  <button
                    key={b.id}
                    onClick={() => onSelect(b)}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/40 hover:border-primary/30 transition-colors duration-150"
                  >
                    {b.logoUrl ? (
                      <img src={b.logoUrl} alt={b.name} className="h-10 w-10 rounded-md object-cover border border-border shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-primary/10 border border-border grid place-items-center shrink-0">
                        <Tag className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium truncate">{b.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {b.categories.length} categor{b.categories.length === 1 ? "y" : "ies"} · {skuCount} SKU{skuCount === 1 ? "" : "s"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 text-[11px] text-muted-foreground">
            <span>{filtered.length} brand{filtered.length === 1 ? "" : "s"}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}
                className="h-7 px-2 rounded border border-border bg-card/40 disabled:opacity-40 hover:bg-card transition-colors duration-150">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} type="button" onClick={() => setPage(p)}
                  className={`h-7 w-7 rounded border text-[11px] transition-colors duration-150 ${p === currentPage ? "border-primary/40 bg-primary/15 text-foreground" : "border-border bg-card/40 hover:bg-card"}`}>{p}</button>
              ))}
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                className="h-7 px-2 rounded border border-border bg-card/40 disabled:opacity-40 hover:bg-card transition-colors duration-150">›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
