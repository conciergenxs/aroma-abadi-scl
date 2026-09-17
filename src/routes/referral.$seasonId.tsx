import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, Ticket, Wallet, Percent, Search } from "lucide-react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { fmtDateEN, fmtDateTimeEN, fmtIDR, fmtNum } from "@/lib/fmt";
import { useReferralStore, getSeasonStatus, seasonReport } from "@/components/scl/referral-store";
import { usePromoStore, describePromoRule } from "@/components/scl/promo-store";
import { SeasonStatusBadge, StatTile } from "./referral.index";

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

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function SeasonReportPage() {
  const { seasonId } = useParams({ from: "/referral/$seasonId" });
  const { seasons } = useReferralStore();
  const { promos } = usePromoStore();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const season = seasons.find((s) => s.id === seasonId);
  const promo = promos.find((p) => p.id === season?.promoId) ?? null;
  const report = useMemo(() => (season ? seasonReport(season) : null), [season]);

  // Searching narrows the list, so a page number from the old list can point
  // past the end of the new one.
  useEffect(() => setPage(1), [query, pageSize]);

  const filtered = useMemo(() => {
    const rows = [...(season?.uses ?? [])].sort(
      (a, b) => +new Date(b.usedAt) - +new Date(a.usedAt),
    );
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) =>
      [u.referrerName, u.referredName, u.code, u.invoice, ...u.items]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [season, query]);

  if (!season || !report) {
    return (
      <AppShell backTo="/referral" title="Referral Season">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground gap-3">
          <div>Referral season not found.</div>
        </div>
      </AppShell>
    );
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <AppShell backTo="/referral" title={season.name}>
      <div className="max-w-5xl space-y-6 stagger">
        {/* What this season does */}
        <div className="rounded-xl border border-border bg-card/40 p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-foreground">{season.name}</h2>
            <SeasonStatusBadge status={getSeasonStatus(season)} />
          </div>

          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
              Applies to every customer
            </div>
            <div className="text-sm font-medium text-foreground">
              {promo ? (
                <>
                  A referred customer redeems{" "}
                  <Link
                    to="/promo-codes/$promoId"
                    params={{ promoId: promo.id }}
                    className="font-mono text-primary hover:underline"
                  >
                    {promo.code}
                  </Link>{" "}
                  — {describePromoRule(promo.rule)}
                </>
              ) : (
                <span className="text-muted-foreground italic">
                  The promo linked to this season no longer exists.
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
            <MetaField label="Period">
              {fmtDateEN(season.startDate)} — {fmtDateEN(season.endDate)}
            </MetaField>
            <MetaField label="Referral Codes">Permanent, one per customer</MetaField>
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
          <StatTile label="Discount Given" icon={Percent} value={fmtIDR(report.discountGiven)} />
        </div>

        {/* Who used a referral, on what */}
        <SectionCard
          title={`Referral Usage (${season.uses.length})`}
          description="Who referred whom, and the purchase it drove"
          action={
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, code, invoice or item…"
                className="h-8 w-[280px] rounded-md border border-border bg-card pl-8 pr-3 text-[13px] transition-all duration-200 focus:w-[320px] focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40"
              />
            </div>
          }
        >
          {filtered.length === 0 ? (
            <p className="p-5 text-[12px] text-muted-foreground italic animate-fade-in">
              {season.uses.length === 0
                ? "Nobody has used a referral code in this season yet."
                : `No referral matches "${query}".`}
            </p>
          ) : (
            <>
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
                        <td className="px-5 py-2.5 text-[13px]">{u.referredName}</td>
                        <td className="px-5 py-2.5">
                          <div className="text-[12px] font-mono text-foreground/90">
                            {u.invoice}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            −{fmtIDR(u.discountValue)} off
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-[12px] text-muted-foreground max-w-[260px]">
                          {u.items.join(", ")}
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

              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-border">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
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
                  <span>
                    {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}{" "}
                    of {filtered.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage(Math.max(1, safePage - 1))}
                      disabled={safePage <= 1}
                      className="press h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                      disabled={safePage >= totalPages}
                      className="press h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
