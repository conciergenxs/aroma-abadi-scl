import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { fmtDateEN } from "@/lib/fmt";
import { AppShell } from "@/components/scl/app-shell";
import { FloatingMenu } from "@/components/scl/floating-menu";
import { useState, useMemo, useRef } from "react";
import {
  Plus, Search, Copy, Trash2, CheckCircle2, Clock, XCircle,
  MoreVertical, Pencil, Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  usePromoStore, promoStore, describePromoRule, getPromoStatus,
  type PromoCode, type PromoStatus,
} from "@/components/scl/promo-store";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/promo-codes/")({
  head: () => ({ meta: [{ title: "Promo Codes — Aroma Abadi" }] }),
  component: PromoCodesPage,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "—";
  return fmtDateEN(iso);
}

function StatusBadge({ status }: { status: PromoStatus }) {
  if (status === "active")
    return <span key={status} className="badge-animate inline-flex items-center gap-1 rounded-full border border-emerald-700 bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white"><CheckCircle2 className="h-2.5 w-2.5" /> Active</span>;
  if (status === "expired")
    return <span key={status} className="badge-animate inline-flex items-center gap-1 rounded-full border border-rose-700 bg-rose-600 px-2 py-0.5 text-[10px] font-medium text-white"><XCircle className="h-2.5 w-2.5" /> Expired</span>;
  return <span key={status} className="badge-animate inline-flex items-center gap-1 rounded-full border border-slate-400 bg-slate-500 px-2 py-0.5 text-[10px] font-medium text-white"><Clock className="h-2.5 w-2.5" /> Scheduled</span>;
}

// ── Three-dot action menu ─────────────────────────────────────────────────────
// Portaled via FloatingMenu — table cells don't establish a stacking context,
// so a plain `absolute` dropdown here gets its clicks intercepted by sibling
// <td> content (e.g. the "Used" column) painting over it. Portaling to
// document.body sidesteps table stacking entirely.

function ActionMenu({ onSeeDetails, onEdit, onDelete }: { onSeeDetails: () => void; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      <FloatingMenu anchorRef={btnRef} open={open} onClose={() => setOpen(false)} align="end" width={148} className="rounded-lg border border-border bg-card shadow-xl py-1 animate-scale-in origin-top-right">
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
      </FloatingMenu>
    </>
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
  const [deletingPromo, setDeletingPromo] = useState<PromoCode | null>(null);

  const filtered = useMemo(() => {
    let list = promos;
    if (filterStatus !== "all") list = list.filter((p) => getPromoStatus(p) === filterStatus);
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

  const confirmDelete = () => {
    if (!deletingPromo) return;
    promoStore.deletePromo(deletingPromo.id);
    toast.success(`"${deletingPromo.name}" deleted`);
    setDeletingPromo(null);
  };

  return (
    <AppShell title="Promo Codes" subtitle="Create and manage discount codes, rules, and redemptions.">
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
              {s === "all" ? "All" : s === "inactive" ? "Scheduled" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => navigate({ to: "/promo-codes/new" })}
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
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Name &amp; Rule</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Period</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Used</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border stagger">
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
                </td>
                <td className="px-4 py-3">
                  <div className="text-[13px] font-medium text-foreground">{promo.name}</div>
                  <div className="text-[11px] text-primary/80 mt-0.5 max-w-[280px] truncate">{describePromoRule(promo.rule)}</div>
                </td>
                <td className="px-4 py-3">
                  {promo.usageType === "one-to-one"
                    ? <span className="inline-flex items-center rounded-full border border-sky-600 bg-sky-600 px-2 py-0.5 text-[10px] font-medium text-white">1-to-1</span>
                    : <span className="inline-flex items-center rounded-full border border-violet-600 bg-violet-600 px-2 py-0.5 text-[10px] font-medium text-white">1-to-Many</span>}
                </td>
                <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">
                  {formatDate(promo.startDate)} — {formatDate(promo.endDate)}
                </td>
                <td className="px-4 py-3"><StatusBadge status={getPromoStatus(promo)} /></td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[13px] font-semibold text-foreground">{promo.redemptions.length}</span>
                  {promo.maxUsage && <span className="text-[10px] text-muted-foreground"> / {promo.maxUsage}</span>}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end">
                    <ActionMenu
                      onSeeDetails={() => navigate({ to: "/promo-codes/$promoId", params: { promoId: promo.id } })}
                      onEdit={() => navigate({ to: "/promo-codes/edit/$promoId", params: { promoId: promo.id } })}
                      onDelete={() => setDeletingPromo(promo)}
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

      <AlertDialog open={!!deletingPromo} onOpenChange={(open) => !open && setDeletingPromo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this promo code?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingPromo && `"${deletingPromo.name}" (${deletingPromo.code}) will be permanently deleted. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
