import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { useState, useMemo, Fragment } from "react";
import {
  Tag,
  Plus,
  Search,
  Copy,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  XCircle,
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
  usedAt: string; // ISO date
};

type PromoCode = {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchase: number;
  maxUsage: number | null;
  startDate: string;
  endDate: string;
  status: PromoStatus;
  usages: PromoUsage[];
  odooId: string;
};

// ── Mock data (simulating Odoo sync) ─────────────────────────────────────────

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
        <CheckCircle2 className="h-2.5 w-2.5" /> Aktif
      </span>
    );
  if (status === "expired")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-300">
        <XCircle className="h-2.5 w-2.5" /> Kedaluwarsa
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      <Clock className="h-2.5 w-2.5" /> Belum Aktif
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function PromoCodesPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | PromoStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastSync] = useState("6 Jul 2026, 09:15");

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

  return (
    <AppShell
      title="Promo Codes"
      subtitle="Kelola dan lacak kode promo yang tersinkron dari Odoo"
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Buat Promo
        </button>
      }
    >
      {/* Sync info */}
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-1.5 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Tersinkron dari Odoo · {lastSync}
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          {(["all", "active", "inactive", "expired"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                filterStatus === s
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
            >
              {s === "all" ? "Semua" : s === "active" ? "Aktif" : s === "inactive" ? "Belum Aktif" : "Kedaluwarsa"}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kode, nama, atau deskripsi promo..."
          className="w-full h-9 rounded-md border border-border bg-card/40 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card/60">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Kode</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Nama Promo</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Diskon</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Periode</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Dipakai</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Tidak ada promo code yang ditemukan.
                </td>
              </tr>
            )}
            {filtered.map((promo) => {
              const isExpanded = expandedId === promo.id;
              return (
                <Fragment key={promo.id}>
                  <tr onClick={() => setExpandedId(isExpanded ? null : promo.id)}
                    className="cursor-pointer hover:bg-white/[0.025] transition-colors"
                  >
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
                            toast.success("Kode disalin");
                          }}
                          className="h-5 w-5 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
                          title="Salin kode"
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

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Edit"
                          onClick={() => toast.info("Edit promo (coming soon)")}
                          className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Hapus"
                          onClick={() => toast.error("Hapus promo (coming soon)")}
                          className="h-7 w-7 grid place-items-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
                          title={isExpanded ? "Tutup" : "Lihat detail pemakaian"}
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded: usage history */}
                  {isExpanded && (
                    <tr key={`${promo.id}-detail`}>
                      <td colSpan={7} className="px-4 pb-4 pt-0 bg-white/[0.015]">
                        <div className="rounded-lg border border-border bg-card/40 p-4">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                            Riwayat Pemakaian ({promo.usages.length})
                          </div>
                          {promo.usages.length === 0 ? (
                            <p className="text-[12px] text-muted-foreground italic">Belum digunakan di template atau broadcast manapun.</p>
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
        Menampilkan {filtered.length} dari {MOCK_PROMOS.length} promo code
      </div>
    </AppShell>
  );
}
