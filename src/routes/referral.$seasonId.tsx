import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { AppShell } from "@/components/scl/app-shell";
import { fmtDateEN } from "@/lib/fmt";
import {
  useReferralStore,
  getSeasonStatus,
  type ReferralSeason,
} from "@/components/scl/referral-store";
import { describePromoRule } from "@/components/scl/promo-store";
import { SeasonReportView } from "@/components/scl/referral-report";
import { SeasonStatusBadge, DeleteSeasonDialog } from "@/components/scl/referral-ui";

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

  const season = seasons.find((s) => s.id === seasonId);

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

        <SeasonReportView season={season} />
      </div>

      <DeleteSeasonDialog
        season={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => navigate({ to: "/referral" })}
      />
    </AppShell>
  );
}
