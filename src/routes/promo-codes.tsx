import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus, Search, Copy, Trash2, CheckCircle2, Clock, XCircle,
  MoreVertical, Pencil, Info, X, Upload, FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { usePromoStore, promoStore, type PromoCode, type PromoStatus } from "@/components/scl/promo-store";

export const Route = createFileRoute("/promo-codes")({
  head: () => ({ meta: [{ title: "Promo Codes — Aroma Abadi" }] }),
  component: PromoCodesPage,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls = "h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";
const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1";

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: PromoStatus }) {
  if (status === "active")
    return <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700 bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white"><CheckCircle2 className="h-2.5 w-2.5" /> Active</span>;
  if (status === "expired")
    return <span className="inline-flex items-center gap-1 rounded-full border border-rose-700 bg-rose-600 px-2 py-0.5 text-[10px] font-medium text-white"><XCircle className="h-2.5 w-2.5" /> Expired</span>;
  return <span className="inline-flex items-center gap-1 rounded-full border border-slate-400 bg-slate-500 px-2 py-0.5 text-[10px] font-medium text-white"><Clock className="h-2.5 w-2.5" /> Inactive</span>;
}

// ── Three-dot action menu ─────────────────────────────────────────────────────

function ActionMenu({ onSeeDetails, onEdit, onDelete }: { onSeeDetails: () => void; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 min-w-[148px] rounded-lg border border-border bg-card shadow-xl py-1">
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[12px] hover:bg-muted text-left">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onSeeDetails(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[12px] hover:bg-muted text-left">
            <Info className="h-3.5 w-3.5 text-muted-foreground" /> See Details
          </button>
          <div className="border-t border-border my-1" />
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[12px] hover:bg-destructive/10 text-destructive text-left">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Shared form fields ────────────────────────────────────────────────────────

type PromoFormState = {
  code: string;
  codeFile: File | null;
  name: string;
  description: string;
  usageType: "one-to-many" | "one-to-one";
  maxUsage: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive" | "expired";
  odooId: string;
};

function PromoFormFields({ form, setForm }: { form: PromoFormState; setForm: (f: PromoFormState) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof PromoFormState>(key: K, val: PromoFormState[K]) =>
    setForm({ ...form, [key]: val });

  return (
    <div className="space-y-4">
      {/* Usage Type */}
      <div>
        <label className={labelCls}>Usage Type</label>
        <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 gap-0.5">
          {(["one-to-many", "one-to-one"] as const).map((t) => (
            <button key={t} type="button"
              onClick={() => setForm({ ...form, usageType: t, code: "", codeFile: null })}
              className={`px-3 h-8 text-[12px] font-medium rounded transition-colors ${form.usageType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "one-to-many" ? "1-to-Many" : "1-to-1 (unique)"}
            </button>
          ))}
        </div>
      </div>

      {/* Code */}
      {form.usageType === "one-to-many" ? (
        <div>
          <label className={labelCls}>Code</label>
          <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="e.g. SUMMER20" className={inputCls} />
        </div>
      ) : (
        <div>
          <label className={labelCls}>Upload Codes (CSV)</label>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden"
            onChange={(e) => set("codeFile", e.target.files?.[0] ?? null)} />
          {form.codeFile ? (
            <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-card text-sm">
              <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
              <span className="flex-1 truncate">{form.codeFile.name}</span>
              <button type="button" onClick={() => set("codeFile", null)} className="text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full h-16 rounded-md border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors">
              <Upload className="h-4 w-4" />
              <span className="text-xs">Click to upload CSV</span>
            </button>
          )}
        </div>
      )}

      {/* Name */}
      <div>
        <label className={labelCls}>Promo Name</label>
        <input value={form.name} onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Summer 20% Off" className={inputCls} />
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
          rows={2} placeholder="Short description..."
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none" />
      </div>

      {/* Max Usage */}
      <div>
        <label className={labelCls}>Max Usage <span className="normal-case text-muted-foreground/60">(blank = unlimited)</span></label>
        <input type="number" value={form.maxUsage} onChange={(e) => set("maxUsage", e.target.value)}
          placeholder="e.g. 500" min={1} className={inputCls} />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Start Date</label>
          <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>End Date</label>
          <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className={labelCls}>Status</label>
        <select value={form.status} onChange={(e) => set("status", e.target.value as PromoFormState["status"])} className={inputCls}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Odoo ID */}
      <div>
        <label className={labelCls}>Odoo ID</label>
        <input value={form.odooId} onChange={(e) => set("odooId", e.target.value)}
          placeholder="e.g. PC-2026-007" className={inputCls} />
      </div>
    </div>
  );
}

// ── Create Modal ──────────────────────────────────────────────────────────────

function CreatePromoModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<PromoFormState>({
    code: "", codeFile: null, name: "", description: "",
    usageType: "one-to-many", maxUsage: "", startDate: "", endDate: "",
    status: "active", odooId: "",
  });

  const handleSave = () => {
    if (form.usageType === "one-to-many" && !form.code.trim()) { toast.error("Code is required"); return; }
    if (form.usageType === "one-to-one" && !form.codeFile) { toast.error("Please upload a CSV file"); return; }
    if (!form.name.trim()) { toast.error("Promo Name is required"); return; }
    promoStore.addPromo({
      code: form.usageType === "one-to-many" ? form.code.trim().toUpperCase() : (form.codeFile?.name ?? "BULK"),
      name: form.name.trim(),
      description: form.description.trim(),
      usageType: form.usageType,
      maxUsage: form.maxUsage ? Number(form.maxUsage) : null,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      odooId: form.odooId.trim(),
    });
    toast.success("Promo code created");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 overflow-y-auto">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl mb-8">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold text-foreground">Create Promo Code</div>
          <button type="button" onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">
          <PromoFormFields form={form} setForm={setForm} />
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 h-9 text-sm text-foreground hover:bg-muted transition-colors">Cancel</button>
          <button type="button" onClick={handleSave} className="rounded-md bg-primary text-primary-foreground px-4 h-9 text-sm font-medium hover:bg-primary/90 transition-colors">Save Promo Code</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditPromoModal({ promo, onClose }: { promo: PromoCode; onClose: () => void }) {
  const [form, setForm] = useState<PromoFormState>({
    code: promo.code,
    codeFile: null,
    name: promo.name,
    description: promo.description,
    usageType: promo.usageType,
    maxUsage: promo.maxUsage?.toString() ?? "",
    startDate: promo.startDate,
    endDate: promo.endDate,
    status: promo.status,
    odooId: promo.odooId,
  });

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Promo Name is required"); return; }
    promoStore.updatePromo(promo.id, {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      usageType: form.usageType,
      maxUsage: form.maxUsage ? Number(form.maxUsage) : null,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      odooId: form.odooId.trim(),
    });
    toast.success("Promo code updated");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 overflow-y-auto">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl mb-8">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold text-foreground">Edit — {promo.code}</div>
          <button type="button" onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">
          <PromoFormFields form={form} setForm={setForm} />
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 h-9 text-sm text-foreground hover:bg-muted transition-colors">Cancel</button>
          <button type="button" onClick={handleSave} className="rounded-md bg-primary text-primary-foreground px-4 h-9 text-sm font-medium hover:bg-primary/90 transition-colors">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function PromoCodesPage() {
  const navigate = useNavigate();
  const { promos } = usePromoStore();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | PromoStatus>("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [creating, setCreating] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);

  const filtered = useMemo(() => {
    let list = promos;
    if (filterStatus !== "all") list = list.filter((p) => p.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [promos, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = (promo: PromoCode) => {
    promoStore.deletePromo(promo.id);
    toast.success(`"${promo.name}" deleted`);
  };

  return (
    <AppShell title="Promo Codes">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by code or name..."
            className="h-9 w-52 rounded-md border border-border bg-card/60 pl-9 pr-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
        </div>

        <div className="flex items-center gap-1">
          {(["all", "active", "inactive", "expired"] as const).map((s) => (
            <button key={s} type="button" onClick={() => { setFilterStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium border transition-colors ${filterStatus === s ? "border-primary/40 bg-primary/15 text-foreground" : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card"}`}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setCreating(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-3 h-9 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Create Promo
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card/60">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Code</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Period</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Used</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-muted-foreground">No promo codes found</td></tr>
            ) : paged.map((promo) => (
              <tr key={promo.id} onClick={() => navigate({ to: "/promo-codes/$promoId", params: { promoId: promo.id } })}
                className="cursor-pointer hover:bg-muted/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs font-semibold tracking-wider bg-primary/10 border border-primary/20 rounded px-2 py-0.5 text-foreground">
                      {promo.code}
                    </code>
                    <button type="button" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(promo.code); toast.success("Copied!"); }}
                      className="h-5 w-5 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Copy">
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">{promo.odooId}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-[13px] font-medium text-foreground">{promo.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px] truncate">{promo.description}</div>
                </td>
                <td className="px-4 py-3">
                  {promo.usageType === "one-to-one"
                    ? <span className="inline-flex items-center rounded-full border border-sky-600 bg-sky-600 px-2 py-0.5 text-[10px] font-medium text-white">1-to-1</span>
                    : <span className="inline-flex items-center rounded-full border border-violet-600 bg-violet-600 px-2 py-0.5 text-[10px] font-medium text-white">1-to-Many</span>}
                </td>
                <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">
                  {formatDate(promo.startDate)} — {formatDate(promo.endDate)}
                </td>
                <td className="px-4 py-3"><StatusBadge status={promo.status} /></td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[13px] font-semibold text-foreground">{promo.usages.length}</span>
                  {promo.maxUsage && <span className="text-[10px] text-muted-foreground"> / {promo.maxUsage}</span>}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end">
                    <ActionMenu
                      onSeeDetails={() => navigate({ to: "/promo-codes/$promoId", params: { promoId: promo.id } })}
                      onEdit={() => setEditingPromo(promo)}
                      onDelete={() => handleDelete(promo)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{filtered.length} promo codes</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="h-7 px-2 rounded border border-border bg-card/40 disabled:opacity-40 hover:bg-card">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} type="button" onClick={() => setPage(p)}
                className={`h-7 w-7 rounded border text-[11px] ${p === page ? "border-primary/40 bg-primary/15 text-foreground" : "border-border bg-card/40 hover:bg-card"}`}>{p}</button>
            ))}
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="h-7 px-2 rounded border border-border bg-card/40 disabled:opacity-40 hover:bg-card">›</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {creating && <CreatePromoModal onClose={() => setCreating(false)} />}
      {editingPromo && <EditPromoModal promo={editingPromo} onClose={() => setEditingPromo(null)} />}
    </AppShell>
  );
}
