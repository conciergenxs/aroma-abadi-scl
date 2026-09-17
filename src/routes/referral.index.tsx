import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Users,
  Gift,
  Percent,
  Wallet,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { fmtDateEN, fmtIDR, fmtNum } from "@/lib/fmt";
import {
  useReferralStore,
  referralStore,
  describeBenefit,
  getSeasonStatus,
  seasonReport,
  emptySeason,
  type ReferralBenefit,
  type ReferralSeason,
  type ReferralStatus,
} from "@/components/scl/referral-store";
import { CODE_INITIALS_TOKEN } from "@/components/scl/promo-store";
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

export const Route = createFileRoute("/referral/")({
  head: () => ({ meta: [{ title: "Referral — Aroma Abadi" }] }),
  component: ReferralPage,
});

export function SeasonStatusBadge({ status }: { status: ReferralStatus }) {
  if (status === "active")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700 bg-emerald-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
        <CheckCircle2 className="h-3 w-3" /> Active
      </span>
    );
  if (status === "ended")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-700 bg-rose-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
        <XCircle className="h-3 w-3" /> Ended
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
      <Clock className="h-3 w-3" /> Scheduled
    </span>
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

function ReferralPage() {
  const navigate = useNavigate();
  const { seasons } = useReferralStore();
  const [editing, setEditing] = useState<ReferralSeason | "new" | null>(null);
  const [deleting, setDeleting] = useState<ReferralSeason | null>(null);

  const active = seasons.find((s) => getSeasonStatus(s) === "active") ?? null;
  const activeReport = useMemo(() => (active ? seasonReport(active) : null), [active]);

  return (
    <AppShell
      title="Referral"
      subtitle="One programme, one set of rules — every customer gets their own code"
      actions={
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> New Season
        </button>
      }
    >
      <div className="max-w-5xl space-y-6 stagger">
        {/* What's live right now */}
        {active && activeReport ? (
          <div className="rounded-xl border border-border bg-card/40 p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-foreground truncate">{active.name}</h2>
                  <SeasonStatusBadge status="active" />
                </div>
                <div className="mt-1 text-[12px] text-muted-foreground">
                  {fmtDateEN(active.startDate)} — {fmtDateEN(active.endDate)}
                </div>
              </div>
              <Link
                to="/referral/$seasonId"
                params={{ seasonId: active.id }}
                className="shrink-0 rounded-md border border-border px-4 h-9 inline-flex items-center text-[14px] hover:bg-muted transition-colors"
              >
                View report
              </Link>
            </div>

            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                How it works
              </div>
              <div className="text-sm font-medium text-foreground">
                A friend buys with a customer's code → the friend gets{" "}
                {describeBenefit(active.referredBenefit)}, the customer who referred them gets{" "}
                {describeBenefit(active.referrerBenefit)}
                {active.minSpend ? ` on baskets from ${fmtIDR(active.minSpend)}` : ""}.
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
              <StatTile label="Invites" icon={Users} value={fmtNum(activeReport.invited)} />
              <StatTile label="Converted" icon={Gift} value={fmtNum(activeReport.converted)} />
              <StatTile
                label="Conversion"
                icon={Percent}
                value={`${activeReport.conversionRate}%`}
              />
              <StatTile label="Revenue" icon={Wallet} value={fmtIDR(activeReport.revenue)} />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/20 px-5 py-8 text-center">
            <p className="text-sm font-medium text-foreground">No referral season is running</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Start a season to switch referral on — every customer's code works for as long as it
              runs.
            </p>
          </div>
        )}

        {/* Every season, past and planned */}
        <SectionCard
          title={`Seasons (${seasons.length})`}
          description="Each season sets the rules for the period it covers"
        >
          {seasons.length === 0 ? (
            <p className="p-5 text-[12px] text-muted-foreground italic">No seasons yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Season", "Period", "Friend gets", "Referrer gets", "Referrals", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {h}
                        </th>
                      ),
                    )}
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 stagger">
                  {seasons.map((s) => {
                    const report = seasonReport(s);
                    return (
                      <tr
                        key={s.id}
                        onClick={() =>
                          navigate({ to: "/referral/$seasonId", params: { seasonId: s.id } })
                        }
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-2.5">
                          <div className="text-[13px] font-medium text-foreground">{s.name}</div>
                          <code className="text-[11px] text-muted-foreground font-mono">
                            {s.codeFormat}
                          </code>
                        </td>
                        <td className="px-5 py-2.5 text-[12px] text-muted-foreground whitespace-nowrap">
                          {fmtDateEN(s.startDate)} — {fmtDateEN(s.endDate)}
                        </td>
                        <td className="px-5 py-2.5 text-[12px]">
                          {describeBenefit(s.referredBenefit)}
                        </td>
                        <td className="px-5 py-2.5 text-[12px]">
                          {describeBenefit(s.referrerBenefit)}
                        </td>
                        <td className="px-5 py-2.5 text-[12px]">
                          {fmtNum(report.converted)} / {fmtNum(report.invited)}
                        </td>
                        <td className="px-5 py-2.5">
                          <SeasonStatusBadge status={getSeasonStatus(s)} />
                        </td>
                        <td className="px-5 py-2.5 text-right whitespace-nowrap">
                          <button
                            title="Edit season"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing(s);
                            }}
                            className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Delete season"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleting(s);
                            }}
                            className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {editing && (
        <SeasonFormModal
          season={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this referral season?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.name}" and its report will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) referralStore.deleteSeason(deleting.id);
                toast.success("Season deleted");
                setDeleting(null);
              }}
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

// ── Season form ───────────────────────────────────────────────────────────────

const inputCls =
  "h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";
const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1";

function BenefitEditor({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: ReferralBenefit;
  onChange: (b: ReferralBenefit) => void;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex items-center gap-2">
        <div className="inline-flex h-9 items-center rounded-md border border-border bg-muted/40 p-0.5 gap-0.5 shrink-0">
          {(
            [
              { kind: "percent", label: "%" },
              { kind: "amount", label: "Rp" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.kind}
              type="button"
              onClick={() =>
                onChange(
                  opt.kind === "percent"
                    ? { kind: "percent", percent: 10, maxDiscount: null }
                    : { kind: "amount", amount: 50000 },
                )
              }
              className={`px-3 h-7 text-[12px] font-medium rounded transition-colors ${
                value.kind === opt.kind
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {value.kind === "percent" ? (
          <input
            type="number"
            min={1}
            max={100}
            value={value.percent}
            onChange={(e) => onChange({ ...value, percent: Number(e.target.value) || 0 })}
            className={inputCls}
          />
        ) : (
          <input
            type="number"
            min={0}
            value={value.amount}
            onChange={(e) => onChange({ kind: "amount", amount: Number(e.target.value) || 0 })}
            className={inputCls}
          />
        )}
      </div>
      <p className="mt-1 text-[10.5px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function SeasonFormModal({ season, onClose }: { season: ReferralSeason | null; onClose: () => void }) {
  const [form, setForm] = useState(() =>
    season
      ? {
          name: season.name,
          startDate: season.startDate,
          endDate: season.endDate,
          codeFormat: season.codeFormat,
          referrerBenefit: season.referrerBenefit,
          referredBenefit: season.referredBenefit,
          minSpend: season.minSpend?.toString() ?? "",
          maxUsesPerReferrer: season.maxUsesPerReferrer?.toString() ?? "",
          maxTotalUses: season.maxTotalUses?.toString() ?? "",
          notes: season.notes ?? "",
        }
      : (() => {
          const e = emptySeason();
          return {
            name: e.name,
            startDate: e.startDate,
            endDate: e.endDate,
            codeFormat: e.codeFormat,
            referrerBenefit: e.referrerBenefit,
            referredBenefit: e.referredBenefit,
            minSpend: e.minSpend?.toString() ?? "",
            maxUsesPerReferrer: e.maxUsesPerReferrer?.toString() ?? "",
            maxTotalUses: e.maxTotalUses?.toString() ?? "",
            notes: e.notes ?? "",
          };
        })(),
  );

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm({ ...form, [key]: val });

  const submit = () => {
    if (!form.name.trim()) return toast.error("Season name is required");
    if (!form.startDate || !form.endDate) return toast.error("Start and End dates are required");
    const payload = {
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      codeFormat: form.codeFormat.trim().toUpperCase() || `AROMA-${CODE_INITIALS_TOKEN}`,
      referrerBenefit: form.referrerBenefit,
      referredBenefit: form.referredBenefit,
      minSpend: form.minSpend ? Number(form.minSpend) : null,
      maxUsesPerReferrer: form.maxUsesPerReferrer ? Number(form.maxUsesPerReferrer) : null,
      maxTotalUses: form.maxTotalUses ? Number(form.maxTotalUses) : null,
      notes: form.notes.trim() || undefined,
    };
    if (season) {
      referralStore.updateSeason(season.id, payload);
      toast.success("Season updated");
    } else {
      referralStore.addSeason({
        ...payload,
        createdBy: { name: "Aria Kapoor", jobTitle: "Workspace Owner" },
      });
      toast.success("Season created");
    }
    onClose();
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-card border border-border rounded-xl shadow-2xl modal-content">
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {season ? "Edit Referral Season" : "New Referral Season"}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              These rules apply to every customer's referral code while the season runs.
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground transition-colors duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className={labelCls}>Season Name</label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Beauty Club Referral — Q3"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Starts</label>
              <input
                type="datetime-local"
                value={form.startDate}
                max={form.endDate || undefined}
                onChange={(e) => set("startDate", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Ends</label>
              <input
                type="datetime-local"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => set("endDate", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <BenefitEditor
              label="Friend gets"
              hint="Applied to the friend's first purchase."
              value={form.referredBenefit}
              onChange={(b) => set("referredBenefit", b)}
            />
            <BenefitEditor
              label="Referrer gets"
              hint="Credited once the friend has paid."
              value={form.referrerBenefit}
              onChange={(b) => set("referrerBenefit", b)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Minimum Spend</label>
              <input
                type="number"
                min={0}
                value={form.minSpend}
                onChange={(e) => set("minSpend", e.target.value)}
                placeholder="No minimum"
                className={inputCls}
              />
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                Basket size before a referral counts.
              </p>
            </div>
            <div>
              <label className={labelCls}>Max Per Referrer</label>
              <input
                type="number"
                min={1}
                value={form.maxUsesPerReferrer}
                onChange={(e) => set("maxUsesPerReferrer", e.target.value)}
                placeholder="Unlimited"
                className={inputCls}
              />
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                Rewarded referrals per customer.
              </p>
            </div>
            <div>
              <label className={labelCls}>Max This Season</label>
              <input
                type="number"
                min={1}
                value={form.maxTotalUses}
                onChange={(e) => set("maxTotalUses", e.target.value)}
                placeholder="Unlimited"
                className={inputCls}
              />
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                Ceiling across everyone.
              </p>
            </div>
          </div>

          <div>
            <label className={labelCls}>Code Format</label>
            <input
              value={form.codeFormat}
              onChange={(e) => set("codeFormat", e.target.value.toUpperCase())}
              placeholder={`AROMA-${CODE_INITIALS_TOKEN}`}
              className={`${inputCls} font-mono tracking-wide`}
            />
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              Every customer gets their own code from this pattern —{" "}
              <code className="font-mono font-semibold text-primary bg-primary/10 border border-primary/20 rounded px-1">
                {CODE_INITIALS_TOKEN}
              </code>{" "}
              becomes their initials.
            </p>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Anything the team should know about this season..."
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="p-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-border text-[14px] text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 transition-colors"
          >
            {season ? "Save Changes" : "Create Season"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
