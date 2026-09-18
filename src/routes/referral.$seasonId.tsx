import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Ticket, Wallet, Pencil, Trash2 } from "lucide-react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { fmtDateEN, fmtDateTimeEN, fmtIDR, fmtNum } from "@/lib/fmt";
import {
  useReferralStore,
  getSeasonStatus,
  seasonReport,
  type ReferralSeason,
} from "@/components/scl/referral-store";
import { describePromoRule, rewardSummary } from "@/components/scl/promo-store";
import { TransactionPeek, TransactionCell } from "@/components/scl/transaction-peek";
import { useTransactionsStore, type Transaction } from "@/components/scl/transactions-store";
import { REWARD_ICONS } from "@/components/scl/reward-icons";
import {
  SeasonStatusBadge,
  StatTile,
  TableSearch,
  TablePager,
  clampPage,
  DeleteSeasonDialog,
} from "@/components/scl/referral-ui";

export const Route = createFileRoute("/referral/$seasonId")({
  head: () => ({ meta: [{ title: "Referral Season — Aroma Abadi" }] }),
  component: SeasonReportPage,
});

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="text-[13px]">{children}</div>
    </div>
  );
}

function SeasonReportPage() {
  const { seasonId } = useParams({ from: "/referral/$seasonId" });
  const navigate = useNavigate();
  const { seasons } = useReferralStore();
  const [deleting, setDeleting] = useState<ReferralSeason | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { transactions } = useTransactionsStore();
  const [peekTx, setPeekTx] = useState<Transaction | null>(null);
  const txById = useMemo(() => new Map(transactions.map((t) => [t.id, t])), [transactions]);

  const season = seasons.find((s) => s.id === seasonId);

  const filtered = useMemo(() => {
    const rows = [...(season?.uses ?? [])].sort(
      (a, b) => +new Date(b.usedAt) - +new Date(a.usedAt),
    );
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) =>
      [u.referrerName, u.referredName, u.code, u.invoice, ...u.items.map((i) => i.name)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [season, query]);

  if (!season) {
    return (
      <AppShell backTo="/referral" title="Referral Season">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
          Referral season not found.
        </div>
      </AppShell>
    );
  }

  const status = getSeasonStatus(season);
  const report = seasonReport(season);
  const reward = rewardSummary(season.rule, report.uses, report.discountGiven);
  const safePage = clampPage(page, filtered.length, pageSize);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <AppShell backTo="/referral" title={season.name}>
      <div className="max-w-5xl space-y-6 stagger">
        {/* What this season does */}
        <div
          className={`rounded-xl bg-card/40 p-5 space-y-4 ${
            status === "active" ? "border-2 border-emerald-500/40" : "border border-border"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{season.name}</h2>
              <SeasonStatusBadge status={status} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/referral/edit/$seasonId"
                params={{ seasonId: season.id }}
                className="press icon-pop inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
              <button
                type="button"
                onClick={() => setDeleting(season)}
                className="press icon-pop inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-4 h-9 text-[14px] text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
              Every referral gets
            </div>
            <div className="text-sm font-medium text-foreground">
              {describePromoRule(season.rule)}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
            <MetaField label="Period">
              {fmtDateEN(season.startDate)} — {fmtDateEN(season.endDate)}
            </MetaField>
            <MetaField label="Code Used">The referrer's own permanent code</MetaField>
            <MetaField label="Created">{fmtDateEN(season.createdAt)}</MetaField>
          </div>

          {season.notes && (
            <p className="text-[12px] text-muted-foreground border-t border-border pt-3">
              {season.notes}
            </p>
          )}
        </div>

        {/* Season report */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          <StatTile label="Referrals Used" icon={Ticket} value={fmtNum(report.uses)} />
          <StatTile label="Referrers" icon={Users} value={fmtNum(report.referrers)} />
          <StatTile label="Revenue" icon={Wallet} value={fmtIDR(report.revenue)} />
          <StatTile
            label={reward.label}
            icon={REWARD_ICONS[reward.kind]}
            value={reward.value}
            title={reward.title}
          />
        </div>

        {/* Who used a referral, on which ARMA order */}
        <SectionCard
          title={`Referral Usage (${season.uses.length})`}
          description="Who referred whom, and the ARMA order it was used on"
          action={
            <TableSearch
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              placeholder="Search name, code, invoice or item…"
            />
          }
        >
          {paged.length === 0 ? (
            <p className="p-5 text-[12px] text-muted-foreground italic animate-fade-in">
              {season.uses.length === 0
                ? "Nobody has used a referral code in this season."
                : `No referral matches "${query}".`}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Referrer", "Code", "Referred", "Transaction", "Items"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Order
                    </th>
                    <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Used
                    </th>
                  </tr>
                </thead>
                <tbody
                  key={`${safePage}-${pageSize}`}
                  className="divide-y divide-border/60 stagger"
                >
                  {paged.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-2.5">
                        <Link
                          to="/contacts/$contactId"
                          params={{ contactId: u.referrerId }}
                          className="text-[13px] font-medium text-primary hover:underline transition-colors duration-150"
                        >
                          {u.referrerName}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5">
                        <code className="font-mono text-[12px] bg-muted/60 border border-border rounded px-1.5 py-0.5">
                          {u.code}
                        </code>
                      </td>
                      <td className="px-5 py-2.5">
                        <Link
                          to="/contacts/$contactId"
                          params={{ contactId: u.referredId }}
                          className="text-[13px] text-primary hover:underline transition-colors duration-150"
                        >
                          {u.referredName}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5">
                        <TransactionCell
                          invoice={u.invoice}
                          date={txById.get(u.transactionId)?.date ?? u.usedAt}
                          disabled={!txById.has(u.transactionId)}
                          onOpen={() => setPeekTx(txById.get(u.transactionId) ?? null)}
                        />
                        <div className="text-[10px] text-muted-foreground">
                          −{fmtIDR(u.discountValue)} off
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-[12px] text-muted-foreground max-w-[260px]">
                        {u.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                      </td>
                      <td className="px-5 py-2.5 text-right text-[13px] font-medium whitespace-nowrap">
                        {fmtIDR(u.orderValue)}
                      </td>
                      <td className="px-5 py-2.5 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                        {fmtDateTimeEN(u.usedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {season.uses.length > 0 && (
            <TablePager
              page={safePage}
              pageSize={pageSize}
              total={filtered.length}
              onPage={setPage}
              onPageSize={setPageSize}
            />
          )}
        </SectionCard>
      </div>

      {peekTx && <TransactionPeek tx={peekTx} onClose={() => setPeekTx(null)} />}

      <DeleteSeasonDialog
        season={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => navigate({ to: "/referral" })}
      />
    </AppShell>
  );
}
