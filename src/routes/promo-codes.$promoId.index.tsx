import { createFileRoute, redirect, useNavigate, useParams, Link } from "@tanstack/react-router";
import { fmtDateTimeEN, fmtNum, fmtIDR } from "@/lib/fmt";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { LITE_MODE } from "@/lib/feature-flags";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Pencil,
  Trash2,
  Users,
  Wallet,
  Percent,
  Ticket,
  Instagram,
  Music2,
  MessageCircle,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  usePromoStore,
  promoStore,
  describePromoRule,
  getPromoStatus,
  downloadAssignedCodesCsv,
  type PromoRedemption,
  type AssignedCode,
  type PromoStatus,
} from "@/components/scl/promo-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/promo-codes/$promoId/")({
  beforeLoad: () => {
    if (LITE_MODE) throw redirect({ to: "/", replace: true });
  },
  head: () => ({ meta: [{ title: "Promo Code — Aroma Abadi" }] }),
  component: PromoDetailPage,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

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
      <Clock className="h-3 w-3" /> Scheduled
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

const CHANNEL_META: Record<
  PromoRedemption["channel"],
  { label: string; icon: typeof Instagram; badge: string; chartColor: string }
> = {
  instagram: {
    label: "Instagram",
    icon: Instagram,
    badge: "border-fuchsia-700 bg-fuchsia-600 text-white",
    chartColor: "var(--chart-2)",
  },
  tiktok: {
    label: "TikTok",
    icon: Music2,
    badge: "border-slate-700 bg-slate-800 text-white",
    chartColor: "var(--chart-3)",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: MessageCircle,
    badge: "border-emerald-700 bg-emerald-600 text-white",
    chartColor: "var(--chart-1)",
  },
};

function ChannelBadge({ channel }: { channel: PromoRedemption["channel"] }) {
  const meta = CHANNEL_META[channel];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium border ${meta.badge}`}
    >
      <Icon className="h-2.5 w-2.5" /> {meta.label}
    </span>
  );
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      title="Copy code"
      onClick={handleCopy}
      className={`h-6 w-6 grid place-items-center rounded transition-colors shrink-0 ${copied ? "text-emerald-500" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <div className="card-hover rounded-xl border border-border bg-card/40 p-4 transition-all duration-300">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold text-foreground stat-value">{value}</div>
    </div>
  );
}

const chartTooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
  padding: "8px 12px",
  boxShadow: "0 8px 24px oklch(0.2 0.02 30 / 12%)",
};

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

function TableFooterPagination({
  page,
  setPage,
  pageSize,
  setPageSize,
  total,
}: {
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-border">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="h-7 rounded-md border border-border bg-card px-1.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>{total === 0 ? "0 of 0" : `${start}–${end} of ${total}`}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function PromoDetailPage() {
  const { promoId } = useParams({ from: "/promo-codes/$promoId/" });
  const navigate = useNavigate();
  const { promos } = usePromoStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [redemptionPage, setRedemptionPage] = useState(1);
  const [redemptionPageSize, setRedemptionPageSize] = useState(10);
  const [codesPage, setCodesPage] = useState(1);
  const [codesPageSize, setCodesPageSize] = useState(10);
  // recharts renders differently server- vs. client-side (no ResizeObserver
  // during SSR), which throws off hydration — only mount it after the client
  // has taken over, matching the pattern already used on the Overview page.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const promo = promos.find((p) => p.id === promoId);

  if (!promo) {
    return (
      <AppShell backTo="/promo-codes" title="Promo Code Detail">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground gap-3">
          <div>Promo code not found.</div>
        </div>
      </AppShell>
    );
  }

  const handleConfirmDelete = () => {
    promoStore.deletePromo(promo.id);
    toast.success("Promo deleted");
    navigate({ to: "/promo-codes" });
  };

  const redemptions = [...promo.redemptions].sort(
    (a, b) => +new Date(b.redeemedAt) - +new Date(a.redeemedAt),
  );
  const totalDiscountValue = redemptions.reduce((sum, r) => sum + r.discountValue, 0);
  const uniqueCustomers = new Set(redemptions.map((r) => r.contactId)).size;
  const usageRate = promo.maxUsage ? Math.round((redemptions.length / promo.maxUsage) * 100) : null;

  const channelCounts = redemptions.reduce<Record<string, number>>((acc, r) => {
    acc[r.channel] = (acc[r.channel] ?? 0) + 1;
    return acc;
  }, {});
  const channelData = (Object.keys(CHANNEL_META) as PromoRedemption["channel"][])
    .filter((c) => channelCounts[c])
    .map((c) => ({
      name: CHANNEL_META[c].label,
      value: channelCounts[c],
      color: CHANNEL_META[c].chartColor,
    }));

  const pagedRedemptions = redemptions.slice(
    (redemptionPage - 1) * redemptionPageSize,
    redemptionPage * redemptionPageSize,
  );
  const assignedCodes: AssignedCode[] = promo.assignedCodes ?? [];
  const pagedCodes = assignedCodes.slice(
    (codesPage - 1) * codesPageSize,
    codesPage * codesPageSize,
  );

  return (
    <AppShell backTo="/promo-codes" title="Promo Code Detail">
      <div className="max-w-5xl space-y-6 stagger">
        {/* Header card */}
        <div className="rounded-xl border border-border bg-card/40 p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{promo.name}</h2>
              <div className="mt-2 flex items-center flex-wrap gap-2">
                <code className="font-mono text-[15px] font-semibold tracking-wider text-foreground bg-primary/10 border border-primary/20 rounded px-2.5 py-0.5">
                  {promo.code}
                </code>
                <UsageTypeBadge type={promo.usageType} />
                <StatusBadge status={getPromoStatus(promo)} />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {promo.usageType === "one-to-one" && (promo.assignedCodes?.length ?? 0) > 0 && (
                <>
                  <button
                    onClick={() => downloadAssignedCodesCsv(promo.code, promo.assignedCodes ?? [])}
                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-700 bg-emerald-600 px-4 h-9 text-[14px] font-medium text-white hover:bg-emerald-700 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Download .csv
                  </button>
                  <div className="w-px h-6 bg-border" />
                </>
              )}
              <button
                onClick={() =>
                  navigate({ to: "/promo-codes/edit/$promoId", params: { promoId: promo.id } })
                }
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => setConfirmingDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-4 h-9 text-[14px] text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
              Rule
            </div>
            <div className="text-sm font-medium text-foreground">
              {describePromoRule(promo.rule)}
            </div>
          </div>

          {promo.description && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Description
              </div>
              <p className="text-sm text-foreground/90">{promo.description}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 pt-1">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Period
              </div>
              <div className="text-[13px]">
                {promo.startDate ? fmtDateTimeEN(promo.startDate) : "—"} —{" "}
                {promo.endDate ? fmtDateTimeEN(promo.endDate) : "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Max Usage
              </div>
              <div className="text-[13px]">
                {promo.maxUsage == null ? "Unlimited" : fmtNum(promo.maxUsage)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Created
              </div>
              <div className="text-[13px]">{fmtDateTimeEN(promo.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Insight tiles + channel donut — side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <StatTile
              label="Redemptions"
              icon={Ticket}
              value={`${fmtNum(redemptions.length)}${promo.maxUsage ? ` / ${fmtNum(promo.maxUsage)}` : ""}`}
            />
            <StatTile label="Discount Given" icon={Wallet} value={fmtIDR(totalDiscountValue)} />
            <StatTile label="Unique Customers" icon={Users} value={fmtNum(uniqueCustomers)} />
            <StatTile
              label="Usage Rate"
              icon={Percent}
              value={usageRate == null ? "Unlimited" : `${usageRate}%`}
            />
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-4 flex flex-col">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Redemptions by Channel
            </div>
            {channelData.length === 0 ? (
              <div className="flex-1 grid place-items-center text-[12px] text-muted-foreground italic py-6">
                No redemptions yet
              </div>
            ) : (
              <>
                <div className="h-32">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          formatter={(v: number, n: string) => [fmtNum(Number(v)), n]}
                        />
                        <Pie
                          data={channelData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={34}
                          outerRadius={54}
                          paddingAngle={2}
                          strokeWidth={0}
                          isAnimationActive
                          animationDuration={600}
                        >
                          {channelData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {channelData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                      <span
                        className="h-2 w-2 rounded-sm shrink-0"
                        style={{ background: d.color }}
                      />
                      <span className="flex-1 text-muted-foreground truncate">{d.name}</span>
                      <span className="font-semibold text-foreground tabular-nums">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Redemption Log */}
        <SectionCard
          title={`Redemption Log (${redemptions.length})`}
          description="Who redeemed this code, and in which transaction"
        >
          {redemptions.length === 0 ? (
            <p className="p-5 text-[12px] text-muted-foreground italic">
              Not yet redeemed by any customer.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Customer
                      </th>
                      <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Transaction
                      </th>
                      <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Store
                      </th>
                      <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Channel
                      </th>
                      <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Discount
                      </th>
                      <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Redeemed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 stagger">
                    {pagedRedemptions.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-2.5">
                          <Link
                            to="/contacts/$contactId"
                            params={{ contactId: r.contactId }}
                            className="text-[13px] font-medium text-primary hover:underline transition-colors duration-150"
                          >
                            {r.contactName}
                          </Link>
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="text-[12px] font-mono text-foreground/90">
                            {r.invoice}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{r.sourceName}</div>
                        </td>
                        <td className="px-5 py-2.5 text-[12px] text-muted-foreground">{r.store}</td>
                        <td className="px-5 py-2.5">
                          <ChannelBadge channel={r.channel} />
                        </td>
                        <td className="px-5 py-2.5 text-right text-[13px] font-medium text-foreground">
                          {fmtIDR(r.discountValue)}
                        </td>
                        <td className="px-5 py-2.5 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                          {fmtDateTimeEN(r.redeemedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TableFooterPagination
                page={redemptionPage}
                setPage={setRedemptionPage}
                pageSize={redemptionPageSize}
                setPageSize={setRedemptionPageSize}
                total={redemptions.length}
              />
            </>
          )}
        </SectionCard>

        {/* Assigned Codes — 1-to-1 promos only */}
        {promo.usageType === "one-to-one" && assignedCodes.length > 0 && (
          <SectionCard
            title={`Individual Codes (${assignedCodes.length})`}
            description="Each unique code and who it was issued to"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Code
                    </th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Owner
                    </th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Redeemed
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 stagger">
                  {pagedCodes.map((a) => (
                    <tr key={a.code} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono text-[12px] bg-muted/60 border border-border rounded px-1.5 py-0.5">
                            {a.code}
                          </code>
                          <CopyCodeButton code={a.code} />
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        {a.contactId ? (
                          <Link
                            to="/contacts/$contactId"
                            params={{ contactId: a.contactId }}
                            className="text-[13px] font-medium text-primary hover:underline transition-colors duration-150"
                          >
                            {a.contactName}
                          </Link>
                        ) : (
                          <span className="text-[13px] text-muted-foreground italic">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        {a.redeemed ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700 bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Redeemed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-400 bg-slate-500 px-2 py-0.5 text-[10px] font-medium text-white">
                            <Clock className="h-2.5 w-2.5" /> Not yet
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                        {a.redeemedAt ? fmtDateTimeEN(a.redeemedAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TableFooterPagination
              page={codesPage}
              setPage={setCodesPage}
              pageSize={codesPageSize}
              setPageSize={setCodesPageSize}
              total={assignedCodes.length}
            />
          </SectionCard>
        )}
      </div>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this promo code?</AlertDialogTitle>
            <AlertDialogDescription>
              "{promo.name}" ({promo.code}) will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors duration-150"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
