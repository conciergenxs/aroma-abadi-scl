import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { fmtDateTimeID, fmtNum, fmtIDR } from "@/lib/fmt";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { useState } from "react";
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
  FileText,
  Megaphone,
  ShoppingBag,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { usePromoStore, promoStore, describePromoRule, getPromoStatus, type PromoRedemption, type PromoStatus } from "@/components/scl/promo-store";
import { EditPromoModal } from "@/routes/promo-codes.index";

export const Route = createFileRoute("/promo-codes/$promoId")({
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

const CHANNEL_META: Record<PromoRedemption["channel"], { label: string; icon: typeof FileText; badge: string }> = {
  template: { label: "Template", icon: FileText, badge: "border-sky-700 bg-sky-600 text-white" },
  broadcast: { label: "Broadcast", icon: Megaphone, badge: "border-violet-700 bg-violet-600 text-white" },
  manual: { label: "Manual", icon: Pencil, badge: "border-amber-700 bg-amber-600 text-white" },
  pos: { label: "Point of Sale", icon: ShoppingBag, badge: "border-emerald-700 bg-emerald-600 text-white" },
};

function ChannelBadge({ channel }: { channel: PromoRedemption["channel"] }) {
  const meta = CHANNEL_META[channel];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium border ${meta.badge}`}>
      <Icon className="h-2.5 w-2.5" /> {meta.label}
    </span>
  );
}

function StatTile({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold text-foreground stat-value">{value}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function PromoDetailPage() {
  const { promoId } = useParams({ from: "/promo-codes/$promoId" });
  const navigate = useNavigate();
  const { promos } = usePromoStore();
  const [editing, setEditing] = useState(false);

  const promo = promos.find((p) => p.id === promoId);

  if (!promo) {
    return (
      <AppShell backTo="/promo-codes" title="Promo Code">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground gap-3">
          <div>Promo code not found.</div>
        </div>
      </AppShell>
    );
  }

  const handleDelete = () => {
    if (!confirm(`Delete "${promo.name}"? This cannot be undone.`)) return;
    promoStore.deletePromo(promo.id);
    toast.success("Promo deleted");
    navigate({ to: "/promo-codes" });
  };

  const redemptions = [...promo.redemptions].sort((a, b) => +new Date(b.redeemedAt) - +new Date(a.redeemedAt));
  const totalDiscountValue = redemptions.reduce((sum, r) => sum + r.discountValue, 0);
  const uniqueCustomers = new Set(redemptions.map((r) => r.contactId)).size;
  const usageRate = promo.maxUsage ? Math.round((redemptions.length / promo.maxUsage) * 100) : null;

  const channelCounts = redemptions.reduce<Record<string, number>>((acc, r) => {
    acc[r.channel] = (acc[r.channel] ?? 0) + 1;
    return acc;
  }, {});
  const maxChannelCount = Math.max(1, ...Object.values(channelCounts));

  return (
    <AppShell backTo="/promo-codes" title={promo.name}>
      <div className="max-w-5xl space-y-6 stagger">
        {/* Header card */}
        <div className="rounded-xl border border-border bg-card/40 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <code className="font-mono text-base font-semibold tracking-wider text-foreground bg-primary/10 border border-primary/20 rounded px-2.5 py-0.5">
                {promo.code}
              </code>
              <UsageTypeBadge type={promo.usageType} />
            </div>
            <StatusBadge status={getPromoStatus(promo)} />
          </div>

          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Rule</div>
            <div className="text-sm font-medium text-foreground">{describePromoRule(promo.rule)}</div>
          </div>

          {promo.description && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Description</div>
              <p className="text-sm text-foreground/90">{promo.description}</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-4 pt-1">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Period</div>
              <div className="text-[13px]">{promo.startDate ? fmtDateTimeID(promo.startDate) : "—"} — {promo.endDate ? fmtDateTimeID(promo.endDate) : "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Max Usage</div>
              <div className="text-[13px]">{promo.maxUsage == null ? "Unlimited" : fmtNum(promo.maxUsage)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Owner</div>
              <div className="text-[13px] flex items-center gap-1.5">
                <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                {promo.createdBy.name}
                <span className="text-muted-foreground">· {promo.createdBy.jobTitle}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Created</div>
              <div className="text-[13px]">{fmtDateTimeID(promo.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Insight tiles */}
        <div className="grid grid-cols-4 gap-4">
          <StatTile label="Redemptions" icon={Ticket} value={`${fmtNum(redemptions.length)}${promo.maxUsage ? ` / ${fmtNum(promo.maxUsage)}` : ""}`} />
          <StatTile label="Discount Given" icon={Wallet} value={fmtIDR(totalDiscountValue)} />
          <StatTile label="Unique Customers" icon={Users} value={fmtNum(uniqueCustomers)} />
          <StatTile label="Usage Rate" icon={Percent} value={usageRate == null ? "Unlimited" : `${usageRate}%`} />
        </div>

        {/* Channel breakdown */}
        {redemptions.length > 0 && (
          <SectionCard title="Redemptions by Channel">
            <div className="p-5 space-y-2.5">
              {(Object.keys(CHANNEL_META) as PromoRedemption["channel"][])
                .filter((c) => channelCounts[c])
                .map((c) => {
                  const meta = CHANNEL_META[c];
                  const Icon = meta.icon;
                  const count = channelCounts[c];
                  return (
                    <div key={c} className="flex items-center gap-3">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[12px] w-24 shrink-0 text-foreground">{meta.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(count / maxChannelCount) * 100}%` }} />
                      </div>
                      <span className="text-[12px] font-semibold text-foreground w-6 text-right shrink-0">{count}</span>
                    </div>
                  );
                })}
            </div>
          </SectionCard>
        )}

        {/* Redemption Log */}
        <SectionCard title={`Redemption Log (${redemptions.length})`} description="Who redeemed this code, and in which transaction">
          {redemptions.length === 0 ? (
            <p className="p-5 text-[12px] text-muted-foreground italic">Not yet redeemed by any customer.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Customer</th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Transaction</th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Store</th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Channel</th>
                    <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Discount</th>
                    <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Redeemed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 stagger">
                  {redemptions.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-2.5">
                        <Link to="/contacts/$contactId" params={{ contactId: r.contactId }} className="text-[13px] font-medium text-primary hover:underline">
                          {r.contactName}
                        </Link>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="text-[12px] font-mono text-foreground/90">{r.invoice}</div>
                        <div className="text-[10px] text-muted-foreground">{r.sourceName}</div>
                      </td>
                      <td className="px-5 py-2.5 text-[12px] text-muted-foreground">{r.store}</td>
                      <td className="px-5 py-2.5"><ChannelBadge channel={r.channel} /></td>
                      <td className="px-5 py-2.5 text-right text-[13px] font-medium text-foreground">{fmtIDR(r.discountValue)}</td>
                      <td className="px-5 py-2.5 text-right text-[11px] text-muted-foreground whitespace-nowrap">{fmtDateTimeID(r.redeemedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Assigned Codes — 1-to-1 promos only */}
        {promo.usageType === "one-to-one" && promo.assignedCodes && promo.assignedCodes.length > 0 && (
          <SectionCard title={`Individual Codes (${promo.assignedCodes.length})`} description="Each unique code and who it was issued to">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Code</th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Owner</th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                    <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Redeemed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 stagger">
                  {promo.assignedCodes.map((a) => (
                    <tr key={a.code} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-2.5">
                        <code className="font-mono text-[12px] bg-muted/60 border border-border rounded px-1.5 py-0.5">{a.code}</code>
                      </td>
                      <td className="px-5 py-2.5">
                        <Link to="/contacts/$contactId" params={{ contactId: a.contactId }} className="text-[13px] font-medium text-primary hover:underline">
                          {a.contactName}
                        </Link>
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
                        {a.redeemedAt ? fmtDateTimeID(a.redeemedAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-4 h-9 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      {editing && <EditPromoModal promo={promo} onClose={() => setEditing(false)} />}
    </AppShell>
  );
}
