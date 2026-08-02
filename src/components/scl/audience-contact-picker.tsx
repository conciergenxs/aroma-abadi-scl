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

const PAGE_SIZE = 8;

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

function Pager({ page, setPage, total }: { page: number; setPage: (p: number) => void; total: number }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-2 border-t border-border">
      <span className="text-[10px] text-muted-foreground">Page {page} of {totalPages}</span>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
          className="h-6 w-6 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors text-[11px]">‹</button>
        <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
          className="h-6 w-6 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors text-[11px]">›</button>
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
  const [stagedPage, setStagedPage] = useState(1);

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

  const pagedEligible = eligible.slice((browsePage - 1) * PAGE_SIZE, browsePage * PAGE_SIZE);

  const stagedContacts = nonBa.filter((c) => staged.has(c.id));
  const pagedStaged = stagedContacts.slice((stagedPage - 1) * PAGE_SIZE, stagedPage * PAGE_SIZE);

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

      <div className="grid grid-cols-[1fr_300px] gap-4">
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
                    <label key={c.id} className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors ${checked ? "bg-primary/8" : ""}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(c.id)}
                        className="accent-[oklch(0.62_0.17_40)] h-3.5 w-3.5 shrink-0"
                      />
                      <span className="h-7 w-7 rounded-full bg-muted border border-border grid place-items-center text-[10px] font-semibold shrink-0">{c.avatar}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium truncate">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{c.phone}</div>
                      </div>
                      <div className="text-[11px] text-muted-foreground text-right shrink-0">{formatIDR(stats.totalSpend)}</div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div className="px-3">
            <Pager page={browsePage} setPage={setBrowsePage} total={eligible.length} />
          </div>
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
                    <button type="button" onClick={() => onToggle(c.id)} className="h-5 w-5 shrink-0 grid place-items-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-3">
            <Pager page={stagedPage} setPage={setStagedPage} total={stagedContacts.length} />
          </div>
        </div>
      </div>
    </div>
  );
}
