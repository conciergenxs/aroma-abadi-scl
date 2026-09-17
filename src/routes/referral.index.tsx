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
  Ticket,
  Wallet,
  Percent,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { fmtDateEN, fmtIDR, fmtNum } from "@/lib/fmt";
import {
  useReferralStore,
  referralStore,
  getSeasonStatus,
  seasonReport,
  emptySeason,
  type ReferralSeason,
  type ReferralStatus,
} from "@/components/scl/referral-store";
import {
  usePromoStore,
  describePromoRule,
  type PromoCode,
} from "@/components/scl/promo-store";
import { PromoCodePicker } from "@/components/scl/promo-code-picker";
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

export function StatTile({
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
  const { promos } = usePromoStore();
  const [editing, setEditing] = useState<ReferralSeason | "new" | null>(null);
  const [deleting, setDeleting] = useState<ReferralSeason | null>(null);

  const promoOf = (id: string) => promos.find((p) => p.id === id) ?? null;
  const active = seasons.find((s) => getSeasonStatus(s) === "active") ?? null;
  const activeReport = useMemo(() => (active ? seasonReport(active) : null), [active]);
  const activePromo = active ? promoOf(active.promoId) : null;

  return (
    <AppShell
      title="Referral"
      subtitle="Every customer already has a permanent referral code — this decides when it works, and what it gives"
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
                Applies to every customer
              </div>
              <div className="text-sm font-medium text-foreground">
                {activePromo ? (
                  <>
                    A referred customer redeems{" "}
                    <Link
                      to="/promo-codes/$promoId"
                      params={{ promoId: activePromo.id }}
                      className="font-mono text-primary hover:underline"
                    >
                      {activePromo.code}
                    </Link>{" "}
                    — {describePromoRule(activePromo.rule)}
                  </>
                ) : (
                  <span className="text-muted-foreground italic">
                    No promo linked to this season yet.
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
              <StatTile label="Referrals Used" icon={Ticket} value={fmtNum(activeReport.uses)} />
              <StatTile label="Referrers" icon={Users} value={fmtNum(activeReport.referrers)} />
              <StatTile label="Revenue" icon={Wallet} value={fmtIDR(activeReport.revenue)} />
              <StatTile
                label="Discount Given"
                icon={Percent}
                value={fmtIDR(activeReport.discountGiven)}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/20 px-5 py-8 text-center">
            <p className="text-sm font-medium text-foreground">No referral season is running</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Referral codes only earn something while a season is active. Start one to switch the
              programme on for every customer at once.
            </p>
          </div>
        )}

        {/* Every season, past and planned */}
        <SectionCard
          title={`Seasons (${seasons.length})`}
          description="When referral runs, and which promo a referred customer gets"
        >
          {seasons.length === 0 ? (
            <p className="p-5 text-[12px] text-muted-foreground italic">No seasons yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Season", "Period", "Promo", "Referrals Used", "Status"].map((h) => (
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
                <tbody className="divide-y divide-border/60 stagger">
                  {seasons.map((s) => {
                    const promo = promoOf(s.promoId);
                    return (
                      <tr
                        key={s.id}
                        onClick={() =>
                          navigate({ to: "/referral/$seasonId", params: { seasonId: s.id } })
                        }
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-2.5 text-[13px] font-medium text-foreground">
                          {s.name}
                        </td>
                        <td className="px-5 py-2.5 text-[12px] text-muted-foreground whitespace-nowrap">
                          {fmtDateEN(s.startDate)} — {fmtDateEN(s.endDate)}
                        </td>
                        <td className="px-5 py-2.5">
                          {promo ? (
                            <>
                              <code className="font-mono text-[12px] bg-muted/60 border border-border rounded px-1.5 py-0.5">
                                {promo.code}
                              </code>
                              <div className="mt-0.5 text-[11px] text-muted-foreground truncate max-w-[260px]">
                                {describePromoRule(promo.rule)}
                              </div>
                            </>
                          ) : (
                            <span className="text-[12px] text-muted-foreground italic">—</span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-[13px]">{fmtNum(s.uses.length)}</td>
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

// ── Season form — period + the promo it hands out, nothing else ───────────────

const inputCls =
  "h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";
const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1";

function SeasonFormModal({
  season,
  onClose,
}: {
  season: ReferralSeason | null;
  onClose: () => void;
}) {
  const { promos } = usePromoStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [form, setForm] = useState(() => {
    const base = season ?? emptySeason();
    return {
      name: base.name,
      startDate: base.startDate,
      endDate: base.endDate,
      promoId: base.promoId,
      notes: base.notes ?? "",
    };
  });

  const promo = promos.find((p) => p.id === form.promoId) ?? null;
  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm({ ...form, [key]: val });

  const submit = () => {
    if (!form.name.trim()) return toast.error("Season name is required");
    if (!form.startDate || !form.endDate) return toast.error("Start and End dates are required");
    if (new Date(form.endDate) < new Date(form.startDate))
      return toast.error("End date must be after the start date");
    if (!form.promoId) return toast.error("Choose the promo a referral gives");
    const payload = {
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      promoId: form.promoId,
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
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 modal-backdrop"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="w-full max-w-lg max-h-[88vh] flex flex-col bg-card border border-border rounded-xl shadow-2xl modal-content">
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {season ? "Edit Referral Season" : "New Referral Season"}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Applies to every customer's referral code the moment it starts.
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

            <div>
              <label className={labelCls}>Promo a referral gives</label>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="w-full rounded-md border border-border bg-card px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
              >
                {promo ? (
                  <>
                    <code className="font-mono text-[13px] font-semibold">{promo.code}</code>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {describePromoRule(promo.rule)}
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Choose a promo code…</span>
                )}
              </button>
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                What the referred customer redeems while this season runs.
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
      </div>

      <PromoCodePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(p: PromoCode) => {
          set("promoId", p.id);
          setPickerOpen(false);
        }}
      />
    </>,
    document.body,
  );
}
