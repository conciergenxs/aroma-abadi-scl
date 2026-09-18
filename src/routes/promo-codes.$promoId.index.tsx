import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { fmtDateTimeEN, fmtNum, fmtIDR } from "@/lib/fmt";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { useMemo, useState } from "react";
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
  Gift,
  Truck,
  Sparkles,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  usePromoStore,
  promoStore,
  describePromoRule,
  getPromoStatus,
  downloadAssignedCodesCsv,
  downloadRedemptionsCsv,
  defaultCodeFormat,
  rewardSummary,
  type AssignedCode,
  type PromoStatus,
} from "@/components/scl/promo-store";
import { REWARD_ICONS } from "@/components/scl/reward-icons";
import { TransactionPeek, TransactionCell } from "@/components/scl/transaction-peek";
import { useTransactionsStore, type Transaction } from "@/components/scl/transactions-store";
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
  title,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  title?: string;
}) {
  return (
    <div
      title={title}
      className="card-hover rounded-xl border border-border bg-card/40 p-4 transition-all duration-300"
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold text-foreground stat-value">{value}</div>
    </div>
  );
}

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
  const { transactions } = useTransactionsStore();
  const [peekTx, setPeekTx] = useState<Transaction | null>(null);
  const txById = useMemo(() => new Map(transactions.map((t) => [t.id, t])), [transactions]);

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
  const isOneToOne = promo.usageType === "one-to-one";
  const assignedCodes: AssignedCode[] = promo.assignedCodes ?? [];
  // 1-to-1 has no usage cap — its denominator is how many recipients a
  // Broadcast has actually sent codes to.
  const usageDenominator = isOneToOne ? assignedCodes.length || null : promo.maxUsage;
  const usageRate = usageDenominator
    ? Math.round((redemptions.length / usageDenominator) * 100)
    : null;

  // 1-to-1 exports its individual codes; 1-to-Many has only one shared code,
  // so its exportable artefact is the redemption log instead.
  const canDownload = isOneToOne ? assignedCodes.length > 0 : redemptions.length > 0;

  const rewardMetric = rewardSummary(promo.rule, redemptions.length, totalDiscountValue);

  const pagedRedemptions = redemptions.slice(
    (redemptionPage - 1) * redemptionPageSize,
    redemptionPage * redemptionPageSize,
  );
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
              {canDownload && (
                <>
                  <button
                    onClick={() =>
                      isOneToOne
                        ? downloadAssignedCodesCsv(promo.code, assignedCodes)
                        : downloadRedemptionsCsv(promo.code, redemptions)
                    }
                    title={
                      isOneToOne ? "Download every recipient's code" : "Download the redemption log"
                    }
                    className="press icon-pop inline-flex items-center gap-1.5 rounded-md border border-emerald-700 bg-emerald-600 px-4 h-9 text-[14px] font-medium text-white hover:bg-emerald-700 transition-colors"
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
                className="press icon-pop inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => setConfirmingDelete(true)}
                className="press icon-pop inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-4 h-9 text-[14px] text-destructive hover:bg-destructive/10 transition-colors"
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

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-1">
            <div className="sm:col-span-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Period
              </div>
              <div className="text-[13px]">
                {promo.startDate ? fmtDateTimeEN(promo.startDate) : "—"} —{" "}
                {promo.endDate ? fmtDateTimeEN(promo.endDate) : "—"}
              </div>
            </div>
            {isOneToOne ? (
              <div className="sm:col-span-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  Code Format
                </div>
                <div className="text-[13px] font-mono">
                  {promo.codeFormat ?? defaultCodeFormat(promo.code)}
                </div>
              </div>
            ) : (
              <>
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
                    Limit Per User
                  </div>
                  <div className="text-[13px]">
                    {promo.limitPerUser == null
                      ? "Unlimited"
                      : `${fmtNum(promo.limitPerUser)} ${promo.limitPerUser === 1 ? "use" : "uses"}`}
                  </div>
                </div>
              </>
            )}
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Created
              </div>
              <div className="text-[13px]">{fmtDateTimeEN(promo.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Insight tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatTile
            label="Redemptions"
            icon={Ticket}
            value={
              isOneToOne
                ? `${fmtNum(redemptions.length)}${assignedCodes.length ? ` / ${fmtNum(assignedCodes.length)}` : ""}`
                : `${fmtNum(redemptions.length)}${promo.maxUsage ? ` / ${fmtNum(promo.maxUsage)}` : ""}`
            }
          />
          <StatTile
            label={rewardMetric.label}
            icon={REWARD_ICONS[rewardMetric.kind]}
            value={rewardMetric.value}
            title={rewardMetric.title}
          />
          <StatTile label="Unique Customers" icon={Users} value={fmtNum(uniqueCustomers)} />
          <StatTile
            label="Usage Rate"
            icon={Percent}
            value={usageRate == null ? "Unlimited" : `${usageRate}%`}
          />
        </div>

        {/* Redemption Log */}
        <SectionCard
          title={`Redemption Log (${redemptions.length})`}
          description="Who redeemed this code, what they bought, and what they spent"
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
                        Items
                      </th>
                      <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Order Total
                      </th>
                      <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Discount
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    key={`${redemptionPage}-${redemptionPageSize}`}
                    className="divide-y divide-border/60 stagger"
                  >
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
                          <TransactionCell
                            invoice={r.invoice}
                            date={txById.get(r.transactionId)?.date ?? r.redeemedAt}
                            disabled={!txById.has(r.transactionId)}
                            onOpen={() => setPeekTx(txById.get(r.transactionId) ?? null)}
                          />
                        </td>
                        <td className="px-5 py-2.5 text-[12px] text-muted-foreground max-w-[260px]">
                          {txById
                            .get(r.transactionId)
                            ?.items.map((i) => `${i.qty}× ${i.skuName}`)
                            .join(", ") ?? "—"}
                        </td>
                        <td className="px-5 py-2.5 text-right text-[13px] whitespace-nowrap">
                          {(() => {
                            const tx = txById.get(r.transactionId);
                            return tx ? fmtIDR(tx.total) : "—";
                          })()}
                        </td>
                        <td className="px-5 py-2.5 text-right text-[13px] font-medium text-foreground whitespace-nowrap">
                          −{fmtIDR(r.discountValue)}
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

        {/* Recipients — 1-to-1 promos only. Populated by Broadcast, never here. */}
        {isOneToOne && (
          <SectionCard
            title={`Recipients (${assignedCodes.length})`}
            description="Every code this promo has issued, who received it, and whether they've used it"
          >
            {assignedCodes.length === 0 ? (
              <div className="p-5 text-[12px] text-muted-foreground animate-fade-in">
                <p className="italic">No codes issued yet.</p>
                <p className="mt-1.5 not-italic">
                  Put{" "}
                  <code className="font-mono text-foreground bg-muted border border-border rounded px-1">
                    {`{{promo-${promo.code}}}`}
                  </code>{" "}
                  in a{" "}
                  <Link to="/templates/new" className="text-primary hover:underline">
                    Template
                  </Link>
                  , then send it as a{" "}
                  <Link to="/broadcasts/new" className="text-primary hover:underline">
                    Broadcast
                  </Link>{" "}
                  — recipients and their codes show up here.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Code
                        </th>
                        <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Recipient
                        </th>
                        <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Status
                        </th>
                        <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Redeemed
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      key={`${codesPage}-${codesPageSize}`}
                      className="divide-y divide-border/60 stagger"
                    >
                      {pagedCodes.map((a) => (
                        // A hand-edited code could collide across broadcasts;
                        // the person it belongs to can't.
                        <tr
                          key={`${a.contactId ?? "unassigned"}-${a.code}`}
                          className="hover:bg-muted/30 transition-colors"
                        >
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
              </>
            )}
          </SectionCard>
        )}
      </div>

      {peekTx && <TransactionPeek tx={peekTx} onClose={() => setPeekTx(null)} />}

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
