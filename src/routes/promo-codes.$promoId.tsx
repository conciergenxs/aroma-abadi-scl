import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import {
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/promo-codes/$promoId")({
  head: () => ({ meta: [{ title: "Promo Code — SCL" }] }),
  component: PromoDetailPage,
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

// ── Mock data (same as promo-codes.tsx) ──────────────────────────────────────

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
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700 bg-emerald-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
        <CheckCircle2 className="h-3 w-3" /> Active
      </span>
    );
  if (status === "expired")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-700 bg-rose-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
        <XCircle className="h-3 w-3" /> Expired
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
      <Clock className="h-3 w-3" /> Inactive
    </span>
  );
}

function UsageTypeBadge({ type }: { type: "one-to-one" | "one-to-many" }) {
  if (type === "one-to-one")
    return (
      <span className="inline-flex items-center rounded-full border border-sky-700 bg-sky-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
        1-to-1
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full border border-violet-700 bg-violet-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
      1-to-Many
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function PromoDetailPage() {
  const { promoId } = useParams({ from: "/promo-codes/$promoId" });
  const navigate = useNavigate();

  const promo = MOCK_PROMOS.find((p) => p.id === promoId);

  if (!promo) {
    return (
      <AppShell backTo="/promo-codes" title="Promo Code">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground gap-3">
          <div>Promo code not found.</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell backTo="/promo-codes" title={promo.name}>
      <div className="max-w-2xl space-y-6">
        {/* Header card */}
        <div className="rounded-xl border border-border bg-card/40 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <code className="font-mono text-base font-semibold tracking-wider text-foreground bg-primary/10 border border-primary/20 rounded px-2.5 py-0.5">
                  {promo.code}
                </code>
              </div>
              <div className="text-[11px] text-muted-foreground">Odoo: {promo.odooId}</div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={promo.status} />
              <UsageTypeBadge type={promo.usageType} />
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Description</div>
            <p className="text-sm text-foreground/90">{promo.description || "—"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Period</div>
              <div className="text-sm">{formatDate(promo.startDate)} — {formatDate(promo.endDate)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Max Usage</div>
              <div className="text-sm">{promo.maxUsage == null ? "Unlimited" : promo.maxUsage.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Used</div>
              <div className="text-sm font-semibold">{promo.usages.length}{promo.maxUsage ? <span className="font-normal text-muted-foreground"> / {promo.maxUsage}</span> : ""}</div>
            </div>
          </div>
        </div>

        {/* Usage History */}
        <div className="rounded-xl border border-border bg-card/40 p-5">
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

        {/* Attached Templates */}
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Attached Templates
          </div>
          <p className="text-[12px] text-muted-foreground italic">Template attachment management coming soon.</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info("Edit promo (coming soon)")}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => { toast.error("Promo deleted (coming soon)"); navigate({ to: "/promo-codes" }); }}
            className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-4 h-9 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </AppShell>
  );
}
