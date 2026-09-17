import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Gift, Percent, Wallet, Ticket, Trophy } from "lucide-react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { fmtDateEN, fmtDateTimeEN, fmtIDR, fmtNum } from "@/lib/fmt";
import { useContactsStore } from "@/components/scl/contacts-store";
import {
  useReferralStore,
  describeBenefit,
  getSeasonStatus,
  seasonReport,
  referralCodesFor,
} from "@/components/scl/referral-store";
import { SeasonStatusBadge } from "./referral.index";

export const Route = createFileRoute("/referral/$seasonId")({
  head: () => ({ meta: [{ title: "Referral Season — Aroma Abadi" }] }),
  component: SeasonReportPage,
});

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

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="text-[13px]">{children}</div>
    </div>
  );
}

const CODES_PAGE_SIZE = 10;

function SeasonReportPage() {
  const { seasonId } = useParams({ from: "/referral/$seasonId" });
  const { seasons } = useReferralStore();
  const { contacts } = useContactsStore();
  const [codesPage, setCodesPage] = useState(1);

  const season = seasons.find((s) => s.id === seasonId);

  // Customers only — a BA doesn't refer anyone into the programme.
  const customers = useMemo(
    () => contacts.filter((c) => !c.labelIds.includes("lb-ba") && !c.deleted),
    [contacts],
  );

  const codes = useMemo(
    () => (season ? referralCodesFor(season, customers) : new Map<string, string>()),
    [season, customers],
  );

  const report = useMemo(() => (season ? seasonReport(season) : null), [season]);

  if (!season || !report) {
    return (
      <AppShell backTo="/referral" title="Referral Season">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground gap-3">
          <div>Referral season not found.</div>
        </div>
      </AppShell>
    );
  }

  const referralsByRecency = [...season.referrals].sort(
    (a, b) => +new Date(b.invitedAt) - +new Date(a.invitedAt),
  );

  // How many people each customer actually brought in this season.
  const convertedByReferrer = new Map(report.topReferrers.map((r) => [r.id, r.converted]));
  const totalCodePages = Math.max(1, Math.ceil(customers.length / CODES_PAGE_SIZE));
  const safeCodePage = Math.min(codesPage, totalCodePages);
  const pagedCustomers = customers.slice(
    (safeCodePage - 1) * CODES_PAGE_SIZE,
    safeCodePage * CODES_PAGE_SIZE,
  );

  return (
    <AppShell backTo="/referral" title={season.name}>
      <div className="max-w-5xl space-y-6 stagger">
        {/* Rules for this season */}
        <div className="rounded-xl border border-border bg-card/40 p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{season.name}</h2>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <code className="font-mono text-[13px] font-semibold tracking-wider text-foreground bg-primary/10 border border-primary/20 rounded px-2.5 py-0.5">
                  {season.codeFormat}
                </code>
                <SeasonStatusBadge status={getSeasonStatus(season)} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
              Rule
            </div>
            <div className="text-sm font-medium text-foreground">
              Friend buys with a customer's code → friend gets{" "}
              {describeBenefit(season.referredBenefit)}, referrer gets{" "}
              {describeBenefit(season.referrerBenefit)}
              {season.minSpend ? ` on baskets from ${fmtIDR(season.minSpend)}` : ""}.
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
            <MetaField label="Period">
              {fmtDateEN(season.startDate)} — {fmtDateEN(season.endDate)}
            </MetaField>
            <MetaField label="Minimum Spend">
              {season.minSpend == null ? "No minimum" : fmtIDR(season.minSpend)}
            </MetaField>
            <MetaField label="Max Per Referrer">
              {season.maxUsesPerReferrer == null
                ? "Unlimited"
                : `${fmtNum(season.maxUsesPerReferrer)} referrals`}
            </MetaField>
            <MetaField label="Max This Season">
              {season.maxTotalUses == null ? "Unlimited" : `${fmtNum(season.maxTotalUses)} uses`}
            </MetaField>
          </div>

          {season.notes && (
            <p className="text-[12px] text-muted-foreground border-t border-border pt-3">
              {season.notes}
            </p>
          )}
        </div>

        {/* Season report */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger">
          <StatTile label="Invites" icon={Users} value={fmtNum(report.invited)} />
          <StatTile label="Converted" icon={Gift} value={fmtNum(report.converted)} />
          <StatTile label="Conversion" icon={Percent} value={`${report.conversionRate}%`} />
          <StatTile label="Revenue" icon={Wallet} value={fmtIDR(report.revenue)} />
          <StatTile label="Rewards Given" icon={Ticket} value={fmtIDR(report.rewardGiven)} />
        </div>

        {/* Who is driving it */}
        <SectionCard
          title="Top Referrers"
          description="Customers bringing the most friends in this season"
        >
          {report.topReferrers.length === 0 ? (
            <p className="p-5 text-[12px] text-muted-foreground italic">
              No referrals in this season yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Customer", "Invited", "Converted", "Reward Earned"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ${i === 0 ? "text-left" : "text-right"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 stagger">
                  {report.topReferrers.slice(0, 5).map((r, i) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-2.5">
                        <span className="inline-flex items-center gap-2">
                          {i === 0 && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                          <Link
                            to="/contacts/$contactId"
                            params={{ contactId: r.id }}
                            className="text-[13px] font-medium text-primary hover:underline transition-colors duration-150"
                          >
                            {r.name}
                          </Link>
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right text-[13px]">{fmtNum(r.invited)}</td>
                      <td className="px-5 py-2.5 text-right text-[13px]">{fmtNum(r.converted)}</td>
                      <td className="px-5 py-2.5 text-right text-[13px] font-medium">
                        {fmtIDR(r.reward)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Every referral */}
        <SectionCard
          title={`Referral Log (${season.referrals.length})`}
          description="Who invited whom, and whether it turned into a purchase"
        >
          {referralsByRecency.length === 0 ? (
            <p className="p-5 text-[12px] text-muted-foreground italic">
              Nobody has shared their code in this season yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Referrer", "Friend", "Code", "Status"].map((h) => (
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
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 stagger">
                  {referralsByRecency.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-2.5">
                        <Link
                          to="/contacts/$contactId"
                          params={{ contactId: r.referrerId }}
                          className="text-[13px] font-medium text-primary hover:underline transition-colors duration-150"
                        >
                          {r.referrerName}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5 text-[13px]">{r.referredName}</td>
                      <td className="px-5 py-2.5">
                        <code className="font-mono text-[12px] bg-muted/60 border border-border rounded px-1.5 py-0.5">
                          {r.code}
                        </code>
                      </td>
                      <td className="px-5 py-2.5">
                        {r.status === "converted" ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-700 bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white">
                            Converted
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-slate-400 bg-slate-500 px-2 py-0.5 text-[10px] font-medium text-white">
                            Invited
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right text-[13px]">
                        {r.orderValue ? fmtIDR(r.orderValue) : "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right text-[11px] text-muted-foreground whitespace-nowrap">
                        {fmtDateTimeEN(r.convertedAt ?? r.invitedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* One code per customer */}
        <SectionCard
          title={`Customer Codes (${customers.length})`}
          description="Every customer carries their own code for this season — the last four characters are their initials"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Referral Code
                  </th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Friends Brought In
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 stagger">
                {pagedCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-2.5">
                      <Link
                        to="/contacts/$contactId"
                        params={{ contactId: c.id }}
                        className="text-[13px] font-medium text-primary hover:underline transition-colors duration-150"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-5 py-2.5">
                      <code className="font-mono text-[12px] bg-muted/60 border border-border rounded px-1.5 py-0.5">
                        {codes.get(c.id)}
                      </code>
                    </td>
                    <td className="px-5 py-2.5 text-right text-[13px]">
                      {fmtNum(convertedByReferrer.get(c.id) ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border text-[11px] text-muted-foreground">
            <span>
              {customers.length === 0
                ? "0 of 0"
                : `${(safeCodePage - 1) * CODES_PAGE_SIZE + 1}–${Math.min(
                    safeCodePage * CODES_PAGE_SIZE,
                    customers.length,
                  )} of ${customers.length}`}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCodesPage(Math.max(1, safeCodePage - 1))}
                disabled={safeCodePage <= 1}
                className="h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setCodesPage(Math.min(totalCodePages, safeCodePage + 1))}
                disabled={safeCodePage >= totalCodePages}
                className="h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
              >
                ›
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
