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

type ContactStats = {
  totalSpend: number;
  avgMonthlySpend: number;
  brands: Set<string>;
  frequencyPerMonth: number;
  orderCount: number;
};

function computeStats(contactId: string, transactions: Transaction[]): ContactStats {
  const txs = transactions.filter((t) => t.customerId === contactId && t.status === "Paid");
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

export function CreateAudienceModal({
  contacts,
  transactions,
  brands,
  onClose,
  onCreate,
}: {
  contacts: Contact[];
  transactions: Transaction[];
  brands: string[];
  onClose: () => void;
  onCreate: (name: string, contactIds: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [minTotalSpend, setMinTotalSpend] = useState("0");
  const [minMonthlySpend, setMinMonthlySpend] = useState("0");
  const [brandFilter, setBrandFilter] = useState("all");
  const [minFrequency, setMinFrequency] = useState("0");
  const [staged, setStaged] = useState<Set<string>>(new Set());

  const candidates = useMemo(() => contacts.filter((c) => !c.labelIds.includes("lb-ba")), [contacts]);

  const statsById = useMemo(() => {
    const map = new Map<string, ContactStats>();
    for (const c of candidates) map.set(c.id, computeStats(c.id, transactions));
    return map;
  }, [candidates, transactions]);

  const eligible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const minSpendN = Number(minTotalSpend);
    const minMonthlyN = Number(minMonthlySpend);
    const minFreqN = Number(minFrequency);
    return candidates.filter((c) => {
      const stats = statsById.get(c.id)!;
      if (stats.totalSpend < minSpendN) return false;
      if (stats.avgMonthlySpend < minMonthlyN) return false;
      if (stats.frequencyPerMonth < minFreqN) return false;
      if (brandFilter !== "all" && !stats.brands.has(brandFilter)) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.phone.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [candidates, statsById, search, minTotalSpend, minMonthlySpend, minFrequency, brandFilter]);

  const stagedContacts = candidates.filter((c) => staged.has(c.id));

  const toggle = (id: string) => {
    setStaged((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), Array.from(staged));
  };

  const brandOptions: SclSelectOption[] = [{ value: "all", label: "Any Brand" }, ...brands.map((b) => ({ value: b, label: b }))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-card border border-border rounded-xl shadow-2xl modal-content">
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Create New Audience</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Name your audience, then filter or search to bulk-add contacts</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 border-b border-border shrink-0">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Audience Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. High-Value Sisley Buyers"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Total Spend</label>
              <SclSelect size="sm" value={minTotalSpend} onChange={setMinTotalSpend} options={TOTAL_SPEND_OPTIONS} />
            </div>
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Avg. Monthly Spend</label>
              <SclSelect size="sm" value={minMonthlySpend} onChange={setMinMonthlySpend} options={MONTHLY_SPEND_OPTIONS} />
            </div>
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Brand Purchased</label>
              <SclSelect size="sm" value={brandFilter} onChange={setBrandFilter} options={brandOptions} searchable />
            </div>
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Purchase Frequency</label>
              <SclSelect size="sm" value={minFrequency} onChange={setMinFrequency} options={FREQUENCY_OPTIONS} />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full h-8 rounded-md border border-border bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {stagedContacts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {stagedContacts.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 pl-2 pr-1 h-6 text-[11px] text-foreground">
                  {c.name}
                  <button onClick={() => toggle(c.id)} className="h-4 w-4 grid place-items-center rounded-full hover:bg-primary/20">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {eligible.length === 0 ? (
            <p className="px-3 py-8 text-[13px] text-muted-foreground text-center italic">No contacts match your filters</p>
          ) : (
            <div className="stagger">
              {eligible.map((c) => {
                const checked = staged.has(c.id);
                const stats = statsById.get(c.id)!;
                return (
                  <label key={c.id} className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 cursor-pointer hover:bg-muted transition-colors ${checked ? "bg-primary/8" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(c.id)}
                      className="accent-[oklch(0.62_0.17_40)] h-3.5 w-3.5 shrink-0"
                    />
                    <span className="h-7 w-7 rounded-full bg-muted border border-border grid place-items-center text-[10px] font-semibold shrink-0">{c.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium truncate">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{c.phone}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right shrink-0">{formatIDR(stats.totalSpend)}</div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border flex items-center justify-between shrink-0">
          <span className="text-[11px] text-muted-foreground">{staged.size} contact{staged.size !== 1 ? "s" : ""} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-9 px-4 rounded-md border border-border text-[14px] text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Create Audience
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
