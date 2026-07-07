import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { fmtDateID, fmtNum } from "@/lib/fmt";
import { AppShell } from "@/components/scl/app-shell";
import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { usePromoStore, promoStore, type PromoCode, type PromoStatus } from "@/components/scl/promo-store";

export const Route = createFileRoute("/promo-codes/$promoId")({
  head: () => ({ meta: [{ title: "Promo Code — Aroma Abadi" }] }),
  component: PromoDetailPage,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

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
      <Clock className="h-3 w-3" /> Inactive
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

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditPromoModal({ promo, onClose }: { promo: PromoCode; onClose: () => void }) {
  const [name, setName] = useState(promo.name);
  const [description, setDescription] = useState(promo.description);
  const [code, setCode] = useState(promo.code);
  const [maxUsage, setMaxUsage] = useState(promo.maxUsage?.toString() ?? "");
  const [startDate, setStartDate] = useState(promo.startDate);
  const [endDate, setEndDate] = useState(promo.endDate);
  const [status, setStatus] = useState<PromoStatus>(promo.status);
  const [odooId, setOdooId] = useState(promo.odooId);

  const inputCls = "h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40";
  const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1";

  const handleSave = () => {
    if (!name.trim()) { toast.error("Promo Name is required"); return; }
    promoStore.updatePromo(promo.id, {
      name: name.trim(),
      description: description.trim(),
      code: code.trim().toUpperCase(),
      maxUsage: maxUsage ? Number(maxUsage) : null,
      startDate,
      endDate,
      status,
      odooId: odooId.trim(),
    });
    toast.success("Promo code updated");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-background border border-border rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold">Edit Promo Code</div>
          <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className={labelCls}>Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Promo Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none" />
          </div>
          <div>
            <label className={labelCls}>Max Usage <span className="normal-case text-muted-foreground/60">(blank = unlimited)</span></label>
            <input type="number" value={maxUsage} onChange={(e) => setMaxUsage(e.target.value)} min={1} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as PromoStatus)} className={inputCls}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Odoo ID</label>
            <input value={odooId} onChange={(e) => setOdooId(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-border px-3 h-9 text-sm hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} className="rounded-md bg-primary text-primary-foreground px-4 h-9 text-sm font-medium hover:bg-primary/90 transition-colors">Save Changes</button>
        </div>
      </div>
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

  return (
    <AppShell backTo="/promo-codes" title={promo.name}>
      <div className="max-w-2xl space-y-6">
        {/* Header card */}
        <div className="rounded-xl border border-border bg-card/40 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <code className="font-mono text-base font-semibold tracking-wider text-foreground bg-primary/10 border border-primary/20 rounded px-2.5 py-0.5">
                  {promo.code}
                </code>
              </div>
              <div className="text-[11px] text-muted-foreground">Odoo: {promo.odooId || "—"}</div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={promo.status} />
              <UsageTypeBadge type={promo.usageType} />
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Description</div>
            <p className="text-sm text-foreground/90">{promo.description || "—"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Period</div>
              <div className="text-sm">{promo.startDate ? formatDate(promo.startDate) : "—"} — {promo.endDate ? formatDate(promo.endDate) : "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Max Usage</div>
              <div className="text-sm">{promo.maxUsage == null ? "Unlimited" : promo.maxUsage.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Used</div>
              <div className="text-sm font-semibold">
                {promo.usages.length}
                {promo.maxUsage ? <span className="font-normal text-muted-foreground"> / {promo.maxUsage}</span> : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Usage History */}
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Usage History ({promo.usages.length})
          </div>
          {promo.usages.length === 0 ? (
            <p className="text-[12px] text-muted-foreground italic">Not yet used in any template or broadcast.</p>
          ) : (
            <div className="space-y-2">
              {promo.usages.map((u, i) => (
                <div key={i} className="flex items-center gap-3 text-[12px]">
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium border ${
                    u.sourceType === "template"
                      ? "border-sky-700 bg-sky-600 text-white"
                      : "border-violet-700 bg-violet-600 text-white"
                  }`}>
                    {u.sourceType === "template" ? "Template" : "Broadcast"}
                  </span>
                  <span className="font-medium">{u.sourceName}</span>
                  <span className="text-muted-foreground ml-auto">{formatDate(u.usedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

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
