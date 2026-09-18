import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Users, Ticket, Wallet } from "lucide-react";
import { SectionCard } from "./app-shell";
import { fmtIDR, fmtNum } from "@/lib/fmt";
import { rewardSummary } from "./promo-store";
import { REWARD_ICONS } from "./reward-icons";
import { seasonReport, type ReferralSeason } from "./referral-store";
import { StatTile, TableSearch, TablePager, clampPage } from "./referral-ui";
import { TransactionPeek, TransactionCell } from "./transaction-peek";
import { useTransactionsStore, type Transaction } from "./transactions-store";

// ── One season's numbers and the referrals behind them ───────────────────────
// Rendered inline under the ongoing season on the Referral page, and on a
// season's own page — the same report either way.

export function SeasonReportView({ season }: { season: ReferralSeason }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { transactions } = useTransactionsStore();
  const [peekTx, setPeekTx] = useState<Transaction | null>(null);
  const txById = useMemo(() => new Map(transactions.map((t) => [t.id, t])), [transactions]);

  const report = seasonReport(season);
  const reward = rewardSummary(season.rule, report.uses, report.discountGiven);

  const filtered = useMemo(() => {
    const rows = [...season.uses].sort((a, b) => +new Date(b.usedAt) - +new Date(a.usedAt));
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) =>
      [u.referrerName, u.referredName, u.code, u.invoice, ...u.items.map((i) => i.name)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [season, query]);

  const safePage = clampPage(page, filtered.length, pageSize);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
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
                    Benefit
                  </th>
                </tr>
              </thead>
              <tbody key={`${safePage}-${pageSize}`} className="divide-y divide-border/60 stagger">
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
                    </td>
                    <td className="px-5 py-2.5 text-[12px] text-muted-foreground max-w-[260px]">
                      {u.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                    </td>
                    <td className="px-5 py-2.5 text-right text-[13px] whitespace-nowrap">
                      {fmtIDR(u.orderValue)}
                    </td>
                    <td className="px-5 py-2.5 text-right text-[13px] font-medium text-foreground whitespace-nowrap">
                      −{fmtIDR(u.discountValue)}
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

      {peekTx && <TransactionPeek tx={peekTx} onClose={() => setPeekTx(null)} />}
    </div>
  );
}
