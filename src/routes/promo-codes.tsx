import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
    name: "20% Off All Brands",
    description: "20% discount across all brands. Code shared via broadcast or template.",
    usageType: "one-to-many",
    maxUsage: 500,
    startDate: "2026-06-01",
    endDate: "2026-07-31",
    status: "active",
    odooId: "PC-2026-001",
    usages: [
      { sourceType: "template", sourceName: "June Flash Sale", usedAt: "2026-06-10T10:30:00Z" },
      { sourceType: "broadcast", sourceName: "VIP Customer Blast", usedAt: "2026-06-15T14:00:00Z" },
      { sourceType: "template", sourceName: "End of Month Promo", usedAt: "2026-06-28T09:00:00Z" },
    ],
  },
  {
    id: "promo-2",
    code: "SISLEY150K",
    name: "Sisley Rp150k Off",
    description: "Rp150,000 off Sisley products. Single-use code issued per customer.",
    usageType: "one-to-one",
    maxUsage: 200,
    startDate: "2026-07-01",
    endDate: "2026-07-15",
    status: "active",
    odooId: "PC-2026-002",
    usages: [
      { sourceType: "broadcast", sourceName: "Sisley Summer Sale", usedAt: "2026-07-01T08:00:00Z" },
      { sourceType: "template", sourceName: "Abandoned Cart Reminder", usedAt: "2026-07-03T12:00:00Z" },
    ],
  },
  {
    id: "promo-3",
    code: "BEAUTY10",
    name: "10% Off New Arrivals",
    description: "10% discount on new arrival products. No minimum purchase required.",
    usageType: "one-to-many",
    maxUsage: null,
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    status: "expired",
    odooId: "PC-2026-003",
    usages: [
      { sourceType: "template", sourceName: "New Arrival May", usedAt: "2026-05-03T09:30:00Z" },
      { sourceType: "broadcast", sourceName: "All Contacts Blast", usedAt: "2026-05-07T10:00:00Z" },
      { sourceType: "broadcast", sourceName: "Mid-May Reminder", usedAt: "2026-05-16T13:00:00Z" },
      { sourceType: "template", sourceName: "May Closing Sale", usedAt: "2026-05-30T15:00:00Z" },
    ],
  },
  {
    id: "promo-4",
    code: "RIMMEL50K",
    name: "Rimmel Rp50k Cashback",
    description: "Rp50,000 cashback on Rimmel London products.",
    usageType: "one-to-one",
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
    name: "D&G VIP 25% Off",
    description: "Exclusive 25% discount for VIP customers of Dolce & Gabbana Beauty.",
    usageType: "one-to-one",
    maxUsage: 100,
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    status: "active",
    odooId: "PC-2026-005",
    usages: [
      { sourceType: "broadcast", sourceName: "D&G VIP Exclusive", usedAt: "2026-07-02T11:00:00Z" },
    ],
  },
  {
    id: "promo-6",
    code: "BIRTHDAY30",
    name: "Birthday Special 30%",
    description: "30% discount for customers celebrating their birthday this month.",
    usageType: "one-to-many",
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: PromoStatus }) {
  if (status === "active")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700 bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white">
        <CheckCircle2 className="h-2.5 w-2.5" /> Active
      </span>
    );
  if (status === "expired")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-700 bg-rose-600 px-2 py-0.5 text-[10px] font-medium text-white">
        <XCircle className="h-2.5 w-2.5" /> Expired
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-600 px-2 py-0.5 text-[10px] font-medium text-white">
      <Clock className="h-2.5 w-2.5" /> Inactive
    </span>
  );
}

// ── Three-dot action menu ─────────────────────────────────────────────────────

function ActionMenu({ promo, onSeeDetails, onNavigateDetails }: { promo: PromoCode; onSeeDetails: () => void; onNavigateDetails: () => void }) {
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
        className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground hover:text-foreground transition-colors"
        title="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 min-w-[140px] rounded-lg border border-border bg-card shadow-xl py-1">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); toast.info("Edit promo (coming soon)"); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[12px] hover:bg-gray-50 text-left"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onNavigateDetails(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[12px] hover:bg-gray-50 text-left"
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
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | PromoStatus>("all");
const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const paged = filtered.slice(pageStart, pageStart + pageSize);

  const visibleIds = paged.map((p) => p.id);
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
          onClick={() => navigate({ to: "/promo-codes/new" })}
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
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Usage Type</th>
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
            {paged.map((promo) => {
              const isExpanded = expandedId === promo.id;
              return (
                <Fragment key={promo.id}>
                  <tr
                    onClick={() => navigate({ to: "/promo-codes/$promoId", params: { promoId: promo.id } })}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
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
                          className="h-5 w-5 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors"
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

                    {/* Usage Type */}
                    <td className="px-4 py-3">
                      {promo.usageType === "one-to-one" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-sky-700 bg-sky-600 px-2.5 py-0.5 text-[10px] font-medium text-white">
                          1-to-1
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-700 bg-violet-600 px-2.5 py-0.5 text-[10px] font-medium text-white">
                          1-to-Many
                        </span>
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
                          onSeeDetails={() => navigate({ to: "/promo-codes/$promoId", params: { promoId: promo.id } })}
                          onNavigateDetails={() => navigate({ to: "/promo-codes/$promoId", params: { promoId: promo.id } })}
                        />
                      </div>
                    </td>
                  </tr>

                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Showing {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + pageSize, filtered.length)} of {filtered.length} promo codes</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="h-7 rounded border border-border bg-card/40 px-1.5 text-[11px] focus:outline-none"
          >
            {[5, 10, 25].map((n) => <option key={n} value={n}>{n} rows</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="h-7 px-2 rounded border border-border bg-card/40 disabled:opacity-40 hover:bg-card"
          >‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-7 w-7 rounded border text-[11px] ${p === page ? "border-primary/40 bg-primary/15 text-foreground" : "border-border bg-card/40 hover:bg-card"}`}
            >{p}</button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="h-7 px-2 rounded border border-border bg-card/40 disabled:opacity-40 hover:bg-card"
          >›</button>
        </div>
      </div>
    </AppShell>
  );
}
