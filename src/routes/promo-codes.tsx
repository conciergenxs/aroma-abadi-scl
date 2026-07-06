import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { useState, useMemo, Fragment, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  Pencil,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/promo-codes")({
  head: () => ({ meta: [{ title: "Promo Codes — SCL" }] }),
  component: PromoCodesPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type PromoStatus = "active" | "expired" | "inactive";

type PromoUsage = {
  sourceType: "template" | "broadcast";
  sourceName: string;
  usedAt: string;
};

type PromoCode = {
  id: string;
  code: string;
  name: string;
  description: string;
  usageType: "one-to-one" | "one-to-many";
  maxUsage: number | null;
  startDate: string;
  endDate: string;
  status: PromoStatus;
  usages: PromoUsage[];
  odooId: string;
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_PROMOS: PromoCode[] = [
  {
    id: "promo-1",
    code: "AROMA20",
    name: "Diskon 20% All Brand",
    description: "Diskon 20% untuk semua brand, minimum pembelian Rp500.000",
    discountType: "percentage",
    discountValue: 20,
    minPurchase: 500000,
    maxUsage: 500,
    startDate: "2026-06-01",
    endDate: "2026-07-31",
    status: "active",
    odooId: "PC-2026-001",
    usages: [
      { sourceType: "template", sourceName: "Flash Sale Juni", usedAt: "2026-06-10T10:30:00Z" },
      { sourceType: "broadcast", sourceName: "Broadcast Pelanggan VIP", usedAt: "2026-06-15T14:00:00Z" },
      { sourceType: "template", sourceName: "Promo Akhir Bulan", usedAt: "2026-06-28T09:00:00Z" },
    ],
  },
  {
    id: "promo-2",
    code: "SISLEY150K",
    name: "Diskon Rp150.000 Sisley",
    description: "Potongan Rp150.000 untuk produk Sisley, minimum pembelian Rp1.000.000",
    discountType: "fixed",
    discountValue: 150000,
    minPurchase: 1000000,
    maxUsage: 200,
    startDate: "2026-07-01",
    endDate: "2026-07-15",
    status: "active",
    odooId: "PC-2026-002",
    usages: [
      { sourceType: "broadcast", sourceName: "Sisley Summer Sale", usedAt: "2026-07-01T08:00:00Z" },
      { sourceType: "template", sourceName: "Reminder Cart Abandon", usedAt: "2026-07-03T12:00:00Z" },
    ],
  },
  {
    id: "promo-3",
    code: "BEAUTY10",
    name: "Diskon 10% New Arrival",
    description: "Diskon 10% khusus produk baru, tidak ada minimum pembelian",
    discountType: "percentage",
    discountValue: 10,
    minPurchase: 0,
    maxUsage: null,
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    status: "expired",
    odooId: "PC-2026-003",
    usages: [
      { sourceType: "template", sourceName: "New Arrival May", usedAt: "2026-05-03T09:30:00Z" },
      { sourceType: "broadcast", sourceName: "Broadcast Semua Kontak", usedAt: "2026-05-07T10:00:00Z" },
      { sourceType: "broadcast", sourceName: "Reminder Mid-May", usedAt: "2026-05-16T13:00:00Z" },
      { sourceType: "template", sourceName: "Closing May Sale", usedAt: "2026-05-30T15:00:00Z" },
    ],
  },
  {
    id: "promo-4",
    code: "RIMMEL50K",
    name: "Cashback Rp50.000 Rimmel",
    description: "Cashback Rp50.000 untuk pembelian produk Rimmel London",
    discountType: "fixed",
    discountValue: 50000,
    minPurchase: 250000,
    maxUsage: 1000,
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    status: "inactive",
    odooId: "PC-2026-004",
    usages: [],
  },
  {
    id: "promo-5",
    code: "DGVIP25",
    name: "VIP D&G 25% Off",
    description: "Diskon 25% eksklusif untuk pelanggan VIP produk Dolce & Gabbana Beauty",
    discountType: "percentage",
    discountValue: 25,
    minPurchase: 2000000,
    maxUsage: 100,
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    status: "active",
    odooId: "PC-2026-005",
    usages: [
      { sourceType: "broadcast", sourceName: "DG VIP Exclusive", usedAt: "2026-07-02T11:00:00Z" },
    ],
  },
  {
    id: "promo-6",
    code: "BIRTHDAY30",
    name: "Hadiah Ulang Tahun 30%",
    description: "Diskon 30% untuk pelanggan yang berulang tahun bulan ini",
    discountType: "percentage",
    discountValue: 30,
    minPurchase: 0,
    maxUsage: null,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "active",
    odooId: "PC-2026-006",
    usages: [
      { sourceType: "template", sourceName: "Happy Birthday Template", usedAt: "2026-06-12T07:00:00Z" },
      { sourceType: "template", sourceName: "Happy Birthday Template", usedAt: "2026-07-01T07:00:00Z" },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatIDR(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: PromoStatus }) {
  if (status === "active")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
        <CheckCircle2 className="h-2.5 w-2.5" /> Active
      </span>
    );
  if (status === "expired")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-300">
        <XCircle className="h-2.5 w-2.5" /> Expired
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      <Clock className="h-2.5 w-2.5" /> Inactive
    </span>
  );
}

// ── Three-dot action menu ─────────────────────────────────────────────────────

function ActionMenu({ promo, onSeeDetails }: { promo: PromoCode; onSeeDetails: () => void }) {
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
        title="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 min-w-[140px] rounded-lg border border-border bg-card shadow-xl py-1">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); toast.info("Edit promo (coming soon)"); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/[0.05] text-left"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onSeeDetails(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/[0.05] text-left"
          >
            <Info className="h-3.5 w-3.5 text-muted-foreground" /> See Details
          </button>
          <div className="border-t border-border my-1" />
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); toast.error("Delete promo (coming soon)"); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[12px] hover:bg-destructive/10 text-destructive text-left"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function PromoCodesPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | PromoStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let list = MOCK_PROMOS;
    if (filterStatus !== "all") list = list.filter((p) => p.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, filterStatus]);

  const visibleIds = filtered.map((p) => p.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const toggleAll = () => {
    if (allSelected) setSelected((prev) => prev.filter((id) => !visibleIds.includes(id)));
    else setSelected((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };
  const toggleOne = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  return (
    <AppShell title="Promo Codes">
      {/* Toolbar: search + filter chips + create button — all one row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or promo name..."
            className="h-9 w-56 rounded-md border border-border bg-card/40 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-1">
          {(["all", "active", "inactive", "expired"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium border transition-colors ${
                filterStatus === s
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
            >
              {s === "all" ? "All" : s === "active" ? "Active" : s === "inactive" ? "Inactive" : "Expired"}
            </button>
          ))}
        </div>

        <button
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-3 h-9 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={() => toast.info("Create promo (coming soon)")}
        >
          <Plus className="h-3.5 w-3.5" /> Create Promo
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg border border-border bg-primary/5 text-[11px]">
          <span className="text-muted-foreground">{selected.length} selected</span>
          <button
            onClick={() => { toast.error(`Delete ${selected.length} promo (coming soon)`); }}
            className="inline-flex items-center gap-1 rounded-md border border-destructive/40 text-destructive px-2.5 py-1.5 hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
          <button
            onClick={() => setSelected([])}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card/60">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  className="accent-[oklch(0.62_0.17_40)]"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Code</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Promo Name</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Discount</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Period</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Used</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No promo codes found.
                </td>
              </tr>
            )}
            {filtered.map((promo) => {
              const isExpanded = expandedId === promo.id;
              return (
                <Fragment key={promo.id}>
                  <tr
                    onClick={() => setExpandedId(isExpanded ? null : promo.id)}
                    className="cursor-pointer hover:bg-white/[0.025] transition-colors"
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="accent-[oklch(0.62_0.17_40)]"
                        checked={selected.includes(promo.id)}
                        onChange={() => toggleOne(promo.id)}
                        aria-label={`Select ${promo.code}`}
                      />
                    </td>

                    {/* Code */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs font-semibold tracking-wider text-foreground bg-primary/10 border border-primary/20 rounded px-2 py-0.5">
                          {promo.code}
                        </code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(promo.code);
                            toast.success("Code copied");
                          }}
                          className="h-5 w-5 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
                          title="Copy code"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5">Odoo: {promo.odooId}</div>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-medium">{promo.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 max-w-[220px] truncate">{promo.description}</div>
                    </td>

                    {/* Discount */}
                    <td className="px-4 py-3 text-[13px]">
                      {promo.discountType === "percentage"
                        ? <span className="font-semibold text-primary">{promo.discountValue}%</span>
                        : <span className="font-semibold text-primary">{formatIDR(promo.discountValue)}</span>
                      }
                      {promo.minPurchase > 0 && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">min. {formatIDR(promo.minPurchase)}</div>
                      )}
                    </td>

                    {/* Period */}
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">
                      {formatDate(promo.startDate)} — {formatDate(promo.endDate)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={promo.status} />
                    </td>

                    {/* Usage count */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-[13px] font-semibold">{promo.usages.length}</span>
                      {promo.maxUsage && (
                        <span className="text-[10px] text-muted-foreground"> / {promo.maxUsage}</span>
                      )}
                    </td>

                    {/* Three-dot action */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end">
                        <ActionMenu
                          promo={promo}
                          onSeeDetails={() => setExpandedId(isExpanded ? null : promo.id)}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Expanded: usage history */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={8} className="px-4 pb-4 pt-0 bg-white/[0.015]">
                        <div className="rounded-lg border border-border bg-card/40 p-4">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                            Usage History ({promo.usages.length})
                          </div>
                          {promo.usages.length === 0 ? (
                            <p className="text-[12px] text-muted-foreground italic">Not yet used in any template or broadcast.</p>
                          ) : (
                            <div className="space-y-2">
                              {promo.usages.map((u, i) => (
                                <div key={i} className="flex items-center gap-3 text-[12px]">
                                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium border ${
                                    u.sourceType === "template"
                                      ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                                      : "border-violet-500/30 bg-violet-500/10 text-violet-300"
                                  }`}>
                                    {u.sourceType === "template" ? "Template" : "Broadcast"}
                                  </span>
                                  <span className="font-medium">{u.sourceName}</span>
                                  <span className="text-muted-foreground ml-auto">{formatDate(u.usedAt)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground">
        Showing {filtered.length} of {MOCK_PROMOS.length} promo codes
      </div>
    </AppShell>
  );
}
