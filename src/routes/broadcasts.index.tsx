import { AppShell, SectionCard, ChannelDot } from "@/components/scl/app-shell";
import { useBroadcastsStore, broadcastsStore } from "@/components/scl/broadcasts-store";
import { ConfirmDialog } from "@/components/scl/confirm-dialog";
import { useMemo, useState } from "react";
import { fmtNum } from "@/lib/fmt";
import { Plus, Search, Copy, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/broadcasts/")({
  head: () => ({ meta: [{ title: "Broadcasts — SCL" }] }),
  component: BroadcastListPage,
});

const STATUSES = ["All", "Sent", "Scheduled", "Draft"] as const;
type StatusFilter = (typeof STATUSES)[number];

function BroadcastListPage() {
  const navigate = useNavigate();
  const { broadcasts } = useBroadcastsStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return broadcasts.filter((b) => {
      if (status !== "All" && b.status !== status) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.audience.toLowerCase().includes(q) ||
        b.channel.toLowerCase().includes(q)
      );
    });
  }, [query, status, broadcasts]);

  const stats = useMemo(() => {
    const sent = broadcasts.filter((b) => b.status === "Sent");
    const totalReach = sent.reduce((a, b) => a + b.reach, 0);
    const totalDelivered = sent.reduce((a, b) => a + b.delivered, 0);
    const totalRead = sent.reduce((a, b) => a + b.read, 0);
    const scheduled = broadcasts.filter((b) => b.status === "Scheduled").length;
    return [
      { l: "Total reach (30d)", v: fmtNum(totalReach) },
      { l: "Delivery rate", v: totalReach ? `${((totalDelivered / totalReach) * 100).toFixed(1)}%` : "—" },
      { l: "Read rate", v: totalDelivered ? `${((totalRead / totalDelivered) * 100).toFixed(1)}%` : "—" },
      { l: "Scheduled", v: String(scheduled) },
    ];
  }, [broadcasts]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const fromIdx = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const toIdx = Math.min(safePage * pageSize, rows.length);

  const visibleIds = rows.map((r) => r.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelected((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };
  const toggleOne = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  const clearSelection = () => setSelected([]);

  const doDuplicate = () => {
    if (selected.length !== 1) return;
    broadcastsStore.duplicate(selected[0]);
    toast.success("Broadcast duplicated");
    setSelected([]);
  };
  const doDelete = () => {
    const count = selected.length;
    broadcastsStore.deleteMany(selected);
    toast.success(`${count} broadcast${count === 1 ? "" : "s"} deleted`);
    setSelected([]);
  };

  return (
    <AppShell title="Broadcasts" subtitle="Send and track WhatsApp campaigns to your contacts.">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.l} className="rounded-xl border border-border bg-card/60 p-5 glass">
              <div className="text-xs text-muted-foreground">{s.l}</div>
              <div className="mt-2 text-2xl font-semibold">{s.v}</div>
            </div>
          ))}
        </div>

        <SectionCard>
          <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search broadcasts…"
                className="h-9 w-52 rounded-md border border-border bg-background/40 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {STATUSES.map((s) => {
                const sel = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium border transition ${
                      sel
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-border bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-gray-50"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <div className="ml-auto">
              <Link
                to="/broadcasts/new"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 h-9 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" /> Create Broadcast
              </Link>
            </div>
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 border-b border-border bg-primary/5 text-[11px]">
              <span className="text-muted-foreground">
                {selected.length} selected
              </span>
              <button
                onClick={doDuplicate}
                disabled={selected.length !== 1}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 hover:bg-card px-2.5 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                title={selected.length === 1 ? "" : "Select a single broadcast to duplicate"}
              >
                <Copy className="h-3 w-3" /> Duplicate Broadcast
              </button>
              <button
                onClick={() => setBulkDeleteOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-destructive/40 text-destructive px-2.5 py-1.5 hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" /> Delete Broadcast
              </button>
              <button
                onClick={clearSelection}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                Clear Selection
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-white/[0.02]">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="accent-[oklch(0.62_0.17_40)]"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Audience</th>
                  <th className="px-4 py-3 text-right font-medium">Reach</th>
                  <th className="px-4 py-3 text-right font-medium">Delivered</th>
                  <th className="px-4 py-3 text-right font-medium">Read</th>
                  <th className="px-4 py-3 text-right font-medium">Clicks</th>
                  <th className="px-4 py-3 text-left font-medium">Sent</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() =>
                      navigate({ to: "/broadcasts/$broadcastId", params: { broadcastId: b.id } })
                    }
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="accent-[oklch(0.62_0.17_40)]"
                        checked={selected.includes(b.id)}
                        onChange={() => toggleOne(b.id)}
                        aria-label={`Select ${b.name}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium">{b.name}</td>
                    <td className="px-4 py-3"><ChannelDot channel={b.channel} /></td>
                    <td className="px-4 py-3 text-[13px]">{b.audience}</td>
                    <td className="px-4 py-3 text-[13px] text-right tabular-nums">{fmtNum(b.reach)}</td>
                    <td className="px-4 py-3 text-[13px] text-right tabular-nums">{fmtNum(b.delivered)}</td>
                    <td className="px-4 py-3 text-[13px] text-right tabular-nums">{fmtNum(b.read)}</td>
                    <td className="px-4 py-3 text-[13px] text-right tabular-nums">{fmtNum(b.clicks)}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{b.sentAt}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                        b.status === "Sent" ? "border-emerald-700 bg-emerald-600 text-white" :
                        b.status === "Scheduled" ? "border-amber-700 bg-amber-600 text-white" :
                        "border-slate-600 bg-slate-500 text-white"
                      }`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-xs text-muted-foreground">
                      No broadcasts match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>{rows.length === 0 ? "0" : `${fromIdx}–${toIdx}`} of {rows.length} broadcast{rows.length !== 1 ? "s" : ""}</span>
              <label className="flex items-center gap-1">
                Rows
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="h-7 rounded-md border border-gray-200 bg-white pl-2 pr-6 text-xs appearance-none ml-1"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.35rem center", backgroundSize: "1.2em 1.2em" }}
                >
                  {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}
                  className="h-7 w-7 grid place-items-center rounded border border-border hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : safePage <= 4 ? i + 1 : safePage >= totalPages - 3 ? totalPages - 6 + i : safePage - 3 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`h-7 w-7 grid place-items-center rounded border text-[11px] font-medium transition-colors ${p === safePage ? "border-primary/40 bg-primary/15 text-foreground" : "border-border hover:bg-white text-muted-foreground"}`}
                    >{p}</button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                  className="h-7 w-7 grid place-items-center rounded border border-border hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete Broadcast"
        description={
          <>
            Are you sure you want to delete{" "}
            {selected.length === 1 ? "this broadcast" : `these ${selected.length} broadcasts`}?
            <br />
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        onConfirm={doDelete}
        onClose={() => setBulkDeleteOpen(false)}
      />
    </AppShell>
  );
}