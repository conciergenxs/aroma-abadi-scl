import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { fmtDateEN, fmtNum } from "@/lib/fmt";
import {
  useReferralStore,
  getSeasonStatus,
  type ReferralSeason,
} from "@/components/scl/referral-store";
import { describePromoRule } from "@/components/scl/promo-store";
import { SeasonReportView } from "@/components/scl/referral-report";
import {
  SeasonStatusBadge,
  TableSearch,
  TablePager,
  clampPage,
  DeleteSeasonDialog,
} from "@/components/scl/referral-ui";

export const Route = createFileRoute("/referral/")({
  head: () => ({ meta: [{ title: "Referral — Aroma Abadi" }] }),
  component: ReferralPage,
});

type SeasonTab = "ongoing" | "upcoming" | "past";

function ReferralPage() {
  const { seasons } = useReferralStore();
  const [deleting, setDeleting] = useState<ReferralSeason | null>(null);
  const [tab, setTab] = useState<SeasonTab>("ongoing");

  const ongoing = seasons.find((s) => getSeasonStatus(s) === "active") ?? null;
  const upcoming = seasons
    .filter((s) => getSeasonStatus(s) === "scheduled")
    .sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate));
  const past = seasons
    .filter((s) => getSeasonStatus(s) === "ended")
    .sort((a, b) => +new Date(b.endDate) - +new Date(a.endDate));

  // Ongoing is always at most one season, so a count there says nothing.
  const tabs: { key: SeasonTab; label: string; count?: number }[] = [
    { key: "ongoing", label: "Ongoing" },
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "past", label: "Past", count: past.length },
  ];

  return (
    <AppShell
      title="Referral"
      subtitle="Every customer has a permanent referral code — seasons decide when it works and what it gives"
      actions={
        <Link
          to="/referral/new"
          className="press icon-pop inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> New Season
        </Link>
      }
    >
      <div className="max-w-5xl space-y-5">
        <div className="flex items-center gap-1 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`press relative -mb-px inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.key === "ongoing" && ongoing && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-dot" />
              )}
              {t.label}
              {t.count !== undefined && (
                <span className="inline-grid h-5 min-w-5 place-items-center rounded-full bg-primary/15 px-1.5 text-[10.5px] font-semibold text-primary tabular-nums">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "ongoing" &&
          (ongoing ? (
            <div key={ongoing.id} className="space-y-6 animate-fade-in">
              <OngoingCard season={ongoing} onDelete={() => setDeleting(ongoing)} />
              <SeasonReportView season={ongoing} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/20 px-5 py-10 text-center animate-fade-in">
              <p className="text-sm font-medium text-foreground">No referral season is running</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Referral codes only earn something while a season is on. Start one to switch it on
                for every customer at once.
              </p>
            </div>
          ))}

        {tab === "upcoming" && (
          <div className="animate-fade-in">
            <SeasonTable
              seasons={upcoming}
              empty="Nothing scheduled yet."
              onDelete={setDeleting}
              editable
            />
          </div>
        )}

        {tab === "past" && (
          <div className="animate-fade-in">
            <SeasonTable
              seasons={past}
              empty="No season has ended yet."
              onDelete={setDeleting}
              editable={false}
            />
          </div>
        )}
      </div>

      <DeleteSeasonDialog season={deleting} onClose={() => setDeleting(null)} />
    </AppShell>
  );
}

function OngoingCard({ season, onDelete }: { season: ReferralSeason; onDelete: () => void }) {
  return (
    <div className="rounded-xl border-2 border-emerald-500/40 bg-card/60 p-5 space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-foreground truncate">{season.name}</h3>
            <SeasonStatusBadge status="active" />
          </div>
          <div className="mt-1 text-[12px] text-muted-foreground">
            {fmtDateEN(season.startDate)} — {fmtDateEN(season.endDate)}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/referral/edit/$seasonId"
            params={{ seasonId: season.id }}
            search={{ from: "list" }}
            className="press icon-pop inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
          <button
            type="button"
            onClick={onDelete}
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
        <div className="text-sm font-medium text-foreground">{describePromoRule(season.rule)}</div>
      </div>
    </div>
  );
}

function SeasonTable({
  seasons,
  empty,
  onDelete,
  editable,
}: {
  seasons: ReferralSeason[];
  empty: string;
  onDelete: (s: ReferralSeason) => void;
  /** Past seasons are history — they can only be deleted. */
  editable: boolean;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return seasons;
    return seasons.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || describePromoRule(s.rule).toLowerCase().includes(q),
    );
  }, [seasons, query]);
  const safePage = clampPage(page, filtered.length, pageSize);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <SectionCard>
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border">
        <span className="text-[12px] text-muted-foreground">
          {seasons.length} season{seasons.length === 1 ? "" : "s"}
        </span>
        <TableSearch
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Search season or reward…"
        />
      </div>
      {paged.length === 0 ? (
        <p className="p-5 text-[12px] text-muted-foreground italic animate-fade-in">
          {seasons.length === 0 ? empty : `No season matches "${query}".`}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Season", "Period", "Every referral gets", "Referrals", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody key={`${safePage}-${pageSize}`} className="divide-y divide-border/60 stagger">
              {paged.map((s) => (
                <tr
                  key={s.id}
                  onClick={() =>
                    navigate({ to: "/referral/$seasonId", params: { seasonId: s.id } })
                  }
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-2.5 text-[13px] font-medium text-foreground">{s.name}</td>
                  <td className="px-5 py-2.5 text-[12px] text-muted-foreground whitespace-nowrap">
                    {fmtDateEN(s.startDate)} — {fmtDateEN(s.endDate)}
                  </td>
                  <td className="px-5 py-2.5 text-[12px] max-w-[280px]">
                    {describePromoRule(s.rule)}
                  </td>
                  <td className="px-5 py-2.5 text-[13px] tabular-nums">{fmtNum(s.uses.length)}</td>
                  <td className="px-5 py-2.5">
                    <SeasonStatusBadge status={getSeasonStatus(s)} />
                  </td>
                  <td className="px-5 py-2.5 text-right whitespace-nowrap">
                    {editable && (
                      <Link
                        to="/referral/edit/$seasonId"
                        params={{ seasonId: s.id }}
                        search={{ from: "list" }}
                        onClick={(e) => e.stopPropagation()}
                        title="Edit season"
                        className="press inline-grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    <button
                      type="button"
                      title="Delete season"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(s);
                      }}
                      className="press inline-grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {seasons.length > 0 && (
        <TablePager
          page={safePage}
          pageSize={pageSize}
          total={filtered.length}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      )}
    </SectionCard>
  );
}
