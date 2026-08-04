import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { SclSelect, type SclSelectOption } from "./scl-select";
import type { Contact } from "./mock-data";
import { formatIDR, type Transaction } from "./transactions-store";

const TOTAL_SPEND_OPTIONS: SclSelectOption[] = [
  { value: "0", label: "Any" },
  { value: "500000", label: "Above Rp 500K" },
  { value: "1000000", label: "Above Rp 1M" },
  { value: "2500000", label: "Above Rp 2.5M" },
  { value: "5000000", label: "Above Rp 5M" },
];

const MONTHLY_SPEND_OPTIONS: SclSelectOption[] = [
  { value: "0", label: "Any" },
  { value: "200000", label: "Above Rp 200K/mo" },
  { value: "500000", label: "Above Rp 500K/mo" },
  { value: "1000000", label: "Above Rp 1M/mo" },
];

const FREQUENCY_OPTIONS: SclSelectOption[] = [
  { value: "0", label: "Any" },
  { value: "1", label: "At least 1x/month" },
  { value: "2", label: "At least 2x/month" },
  { value: "4", label: "At least 4x/month" },
];

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

type ContactStats = {
  totalSpend: number;
  avgMonthlySpend: number;
  brands: Set<string>;
  frequencyPerMonth: number;
  orderCount: number;
};

function computeStats(contactId: string, transactions: Transaction[]): ContactStats {
  const txs = transactions.filter((t) => t.customerId === contactId && t.status !== "Cancelled");
  const brands = new Set<string>();
  for (const t of txs) {
    for (const b of t.brandNames?.length ? t.brandNames : [t.brandName]) brands.add(b);
  }
  const totalSpend = txs.reduce((sum, t) => sum + t.total, 0);
  if (txs.length === 0) {
    return { totalSpend: 0, avgMonthlySpend: 0, brands, frequencyPerMonth: 0, orderCount: 0 };
  }
  const firstPurchase = Math.min(...txs.map((t) => new Date(t.date).getTime()));
  const monthsActive = Math.max(1, (Date.now() - firstPurchase) / (1000 * 60 * 60 * 24 * 30));
  return {
    totalSpend,
    avgMonthlySpend: totalSpend / monthsActive,
    brands,
    frequencyPerMonth: txs.length / monthsActive,
    orderCount: txs.length,
  };
}

function BrandChips({ brands }: { brands: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (brands.length === 0) return <span className="text-[10px] text-muted-foreground italic">No purchases yet</span>;
  const shown = expanded ? brands : brands.slice(0, 3);
  const hiddenCount = brands.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((b) => (
        <span key={b} className="inline-flex items-center rounded-full border border-border bg-card px-1.5 py-0.5 text-[10px] text-foreground">{b}</span>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(true); }}
          className="text-[10px] text-primary hover:underline transition-colors duration-150"
        >
          &amp; {hiddenCount} other{hiddenCount === 1 ? "" : "s"}
        </button>
      )}
    </div>
  );
}

function Pager({
  page, setPage, pageSize, setPageSize, total,
}: { page: number; setPage: (p: number) => void; pageSize: number; setPageSize: (n: number) => void; total: number }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-border">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="h-6 rounded border border-border bg-card px-1 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>{total === 0 ? "0 of 0" : `${start}–${end} of ${total}`}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
            className="h-6 w-6 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors text-[11px]">‹</button>
          <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
            className="h-6 w-6 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors text-[11px]">›</button>
        </div>
      </div>
    </div>
  );
}

export function AudienceContactPicker({
  candidates,
  transactions,
  brands,
  staged,
  onToggle,
}: {
  candidates: Contact[];
  transactions: Transaction[];
  brands: string[];
  staged: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [minTotalSpend, setMinTotalSpend] = useState("0");
  const [minMonthlySpend, setMinMonthlySpend] = useState("0");
  const [brandFilter, setBrandFilter] = useState("all");
  const [minFrequency, setMinFrequency] = useState("0");
  const [browsePage, setBrowsePage] = useState(1);
  const [browsePageSize, setBrowsePageSize] = useState(8);
  const [stagedPage, setStagedPage] = useState(1);
  const [stagedPageSize, setStagedPageSize] = useState(8);

  const nonBa = useMemo(() => candidates.filter((c) => !c.labelIds.includes("lb-ba")), [candidates]);

  const statsById = useMemo(() => {
    const map = new Map<string, ContactStats>();
    for (const c of nonBa) map.set(c.id, computeStats(c.id, transactions));
    return map;
  }, [nonBa, transactions]);

  const eligible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const minSpendN = Number(minTotalSpend);
    const minMonthlyN = Number(minMonthlySpend);
    const minFreqN = Number(minFrequency);
    return nonBa.filter((c) => {
      const stats = statsById.get(c.id)!;
      if (stats.totalSpend < minSpendN) return false;
      if (stats.avgMonthlySpend < minMonthlyN) return false;
      if (stats.frequencyPerMonth < minFreqN) return false;
      if (brandFilter !== "all" && !stats.brands.has(brandFilter)) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.phone.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [nonBa, statsById, search, minTotalSpend, minMonthlySpend, minFrequency, brandFilter]);

  const pagedEligible = eligible.slice((browsePage - 1) * browsePageSize, browsePage * browsePageSize);

  const stagedContacts = nonBa.filter((c) => staged.has(c.id));
  const pagedStaged = stagedContacts.slice((stagedPage - 1) * stagedPageSize, stagedPage * stagedPageSize);

  const brandOptions: SclSelectOption[] = [{ value: "all", label: "Any Brand" }, ...brands.map((b) => ({ value: b, label: b }))];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Total Spend</label>
          <SclSelect value={minTotalSpend} onChange={(v) => { setMinTotalSpend(v); setBrowsePage(1); }} options={TOTAL_SPEND_OPTIONS} />
        </div>
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Avg. Monthly Spend</label>
          <SclSelect value={minMonthlySpend} onChange={(v) => { setMinMonthlySpend(v); setBrowsePage(1); }} options={MONTHLY_SPEND_OPTIONS} />
        </div>
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Brand Purchased</label>
          <SclSelect value={brandFilter} onChange={(v) => { setBrandFilter(v); setBrowsePage(1); }} options={brandOptions} searchable />
        </div>
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Purchase Frequency</label>
          <SclSelect value={minFrequency} onChange={(v) => { setMinFrequency(v); setBrowsePage(1); }} options={FREQUENCY_OPTIONS} />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-4">
        {/* LEFT: search + browse list */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="p-3 border-b border-border bg-card/40">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setBrowsePage(1); }}
                placeholder="Search by name or phone..."
                className="w-full h-9 rounded-md border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="min-h-[360px]">
            {pagedEligible.length === 0 ? (
              <p className="px-3 py-12 text-[13px] text-muted-foreground text-center italic">No contacts match your filters</p>
            ) : (
              <div className="divide-y divide-border/60">
                {pagedEligible.map((c) => {
                  const checked = staged.has(c.id);
                  const stats = statsById.get(c.id)!;
                  return (
                    <label key={c.id} className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors ${checked ? "bg-primary/8" : ""}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(c.id)}
                        className="accent-[oklch(0.62_0.17_40)] h-3.5 w-3.5 shrink-0 mt-1"
                      />
                      <span className="h-7 w-7 rounded-full bg-muted border border-border grid place-items-center text-[10px] font-semibold shrink-0">{c.avatar}</span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium truncate">{c.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{c.phone}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[11px] text-foreground font-medium">{formatIDR(stats.totalSpend)}</div>
                            <div className="text-[10px] text-muted-foreground">Avg {formatIDR(stats.avgMonthlySpend)}/mo</div>
                          </div>
                        </div>
                        <BrandChips brands={Array.from(stats.brands)} />
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <Pager page={browsePage} setPage={setBrowsePage} pageSize={browsePageSize} setPageSize={setBrowsePageSize} total={eligible.length} />
        </div>

        {/* RIGHT: staged/selected panel */}
        <div className="rounded-lg border border-border overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border bg-card/40">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Selected ({staged.size})</div>
          </div>
          <div className="min-h-[360px] flex-1">
            {pagedStaged.length === 0 ? (
              <p className="px-3 py-12 text-[12px] text-muted-foreground text-center italic">No contacts selected yet</p>
            ) : (
              <div className="divide-y divide-border/60">
                {pagedStaged.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-2">
                    <span className="h-6 w-6 rounded-full bg-primary/15 border border-primary/30 grid place-items-center text-[9px] font-semibold shrink-0">{c.avatar}</span>
                    <span className="text-[12px] font-medium truncate flex-1">{c.name}</span>
                    <button type="button" onClick={() => onToggle(c.id)} className="h-5 w-5 shrink-0 grid place-items-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Pager page={stagedPage} setPage={setStagedPage} pageSize={stagedPageSize} setPageSize={setStagedPageSize} total={stagedContacts.length} />
        </div>
      </div>
    </div>
  );
}
