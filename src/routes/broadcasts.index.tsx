import { AppShell, SectionCard, ChannelDot, StatusPill } from "@/components/scl/app-shell";
import {
  useBroadcastsStore,
  broadcastsStore,
  broadcastKind,
  lifecycleStatus,
  activationBlockedReason,
  deleteBlockedReason,
  type BroadcastKind,
  type LifecycleStatus,
} from "@/components/scl/broadcasts-store";
import { ConfirmDialog } from "@/components/scl/confirm-dialog";
import { useMemo, useState } from "react";
import { fmtNum } from "@/lib/fmt";
import {
  Plus,
  Search,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Play,
  Pause,
} from "lucide-react";
import type { Broadcast } from "@/components/scl/mock-data";
import { useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/broadcasts/")({
  head: () => ({ meta: [{ title: "Broadcasts — SCL" }] }),
  component: BroadcastListPage,
});

/* The list is read one kind at a time: a one-off send, a scheduled send and a
 * recurring series answer different questions and end in different states, so
 * each tab carries its own columns and its own set of statuses. */
const KIND_TABS: { id: BroadcastKind; label: string }[] = [
  { id: "one-time", label: "One Time" },
  { id: "scheduled", label: "By Scheduler" },
  { id: "recurring", label: "By Recurring" },
];

const KIND_STATUSES: Record<BroadcastKind, LifecycleStatus[]> = {
  // A draft keeps the send mode it was saved with, so it lands in that mode's
  // tab and has to be filterable there too.
  "one-time": ["Sent", "Draft"],
  scheduled: ["Active", "Inactive", "Blocked", "Sent", "Draft"],
  recurring: ["Active", "Inactive", "Draft"],
};

const STATUS_TONE: Record<LifecycleStatus, "positive" | "warning" | "neutral" | "danger"> = {
  Sent: "positive",
  Active: "positive",
  Inactive: "neutral",
  Blocked: "danger",
  Draft: "neutral",
};

type StatusFilter = "All" | LifecycleStatus;

function BroadcastListPage() {
  const navigate = useNavigate();
  const { broadcasts } = useBroadcastsStore();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<BroadcastKind>("one-time");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return broadcasts.filter((b) => {
      if (broadcastKind(b) !== kind) return false;
      if (status !== "All" && lifecycleStatus(b) !== status) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.audience.toLowerCase().includes(q) ||
        b.channel.toLowerCase().includes(q)
      );
    });
  }, [query, kind, status, broadcasts]);

  // Switching tabs clears a status that doesn't exist in the new one.
  useEffect(() => {
    setStatus((cur) =>
      cur === "All" || KIND_STATUSES[kind].includes(cur as LifecycleStatus) ? cur : "All",
    );
    setPage(1);
    setSelected([]);
  }, [kind]);

  const stats = useMemo(() => {
    const sent = broadcasts.filter((b) => b.status === "Sent");
    const totalReach = sent.reduce((a, b) => a + b.reach, 0);
    const totalDelivered = sent.reduce((a, b) => a + b.delivered, 0);
    const totalRead = sent.reduce((a, b) => a + b.read, 0);
    const scheduled = broadcasts.filter((b) => b.status === "Scheduled").length;
    return [
      { l: "Total reach (30d)", v: fmtNum(totalReach) },
      {
        l: "Delivery rate",
        v: totalReach ? `${((totalDelivered / totalReach) * 100).toFixed(1)}%` : "—",
      },
      {
        l: "Read rate",
        v: totalDelivered ? `${((totalRead / totalDelivered) * 100).toFixed(1)}%` : "—",
      },
      { l: "Scheduled", v: String(scheduled) },
    ];
  }, [broadcasts]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const fromIdx = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const toIdx = Math.min(safePage * pageSize, rows.length);

  // The rows actually on screen — selecting rows the user can't see and then
  // offering to delete "all 50" is how people lose data they never saw.
  const visibleIds = paged.map((r) => r.id);
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
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  const clearSelection = () => setSelected([]);

  const doDuplicate = () => {
    if (selected.length !== 1) return;
    broadcastsStore.duplicate(selected[0]);
    toast.success("Broadcast duplicated");
    setSelected([]);
  };
  const doDelete = () => {
    // A live recurring series is switched off before it can be deleted — the
    // bulk path can't be a way around that.
    const blocked = broadcasts.filter(
      (b) => selected.includes(b.id) && deleteBlockedReason(b) !== "",
    );
    const deletable = selected.filter((id) => !blocked.some((b) => b.id === id));
    if (deletable.length > 0) broadcastsStore.deleteMany(deletable);
    if (deletable.length > 0) {
      toast.success(`${deletable.length} broadcast${deletable.length === 1 ? "" : "s"} deleted`);
    }
    if (blocked.length > 0) {
      toast.error(
        `${blocked.length} recurring broadcast${blocked.length === 1 ? " was" : "s were"} skipped — deactivate ${blocked.length === 1 ? "it" : "them"} first.`,
      );
    }
    setSelected([]);
  };

  return (
    <AppShell title="Broadcasts" subtitle="Send and track WhatsApp campaigns to your contacts.">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 stagger">
          {stats.map((s) => (
            <div
              key={s.l}
              className="card-hover rounded-xl border border-border bg-card/60 p-5 glass transition-all duration-300"
            >
              <div className="text-xs text-muted-foreground">{s.l}</div>
              <div className="mt-2 text-2xl font-semibold">{s.v}</div>
            </div>
          ))}
        </div>

        <SectionCard>
          {/* Card header carries the primary action; the row under it is for
              narrowing what the table shows. */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
            <div>
              <h3 className="text-[14px] font-medium">All Broadcasts</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Search, filter, and manage campaigns.
              </p>
            </div>
            <Link
              to="/broadcasts/new"
              className="press inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
            >
              <Plus className="h-3.5 w-3.5" /> Create Broadcast
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-border">
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
              {(["All", ...KIND_STATUSES[kind]] as StatusFilter[]).map((s) => {
                const sel = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`tap inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium border transition ${
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
            {/* Kept at the right edge rather than centred over the table. */}
            <div className="ml-auto flex items-center gap-3">
              <div
                role="group"
                aria-label="Broadcast type"
                className="inline-flex items-center rounded-md border border-border bg-card/60 p-0.5"
              >
                {KIND_TABS.map((t) => {
                  const active = kind === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setKind(t.id)}
                      aria-pressed={active}
                      className={`h-8 rounded px-3 text-[13px] font-medium transition-colors duration-150 ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 border-b border-border bg-primary/5 text-[11px]">
              <span className="text-muted-foreground">{selected.length} selected</span>
              <button
                onClick={doDuplicate}
                disabled={selected.length !== 1}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 hover:bg-card px-2.5 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                title={selected.length === 1 ? "" : "Select a single broadcast to duplicate"}
              >
                <Copy className="h-3 w-3" /> Duplicate Broadcast
              </button>
              <button
                onClick={() => setBulkDeleteOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-destructive/40 text-destructive px-2.5 py-1.5 hover:bg-destructive/10 transition-colors duration-150"
              >
                <Trash2 className="h-3 w-3" /> Delete Broadcast
              </button>
              <button
                onClick={clearSelection}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors duration-150"
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
                  {kind === "recurring" && (
                    <th className="px-4 py-3 text-left font-medium">Recurring</th>
                  )}
                  <th className="px-4 py-3 text-left font-medium">Audience</th>
                  <th className="px-4 py-3 text-left font-medium">Reach</th>
                  <th className="px-4 py-3 text-left font-medium">Delivered</th>
                  <th className="px-4 py-3 text-left font-medium">Read</th>
                  <th className="px-4 py-3 text-left font-medium">
                    {kind === "one-time" ? "Sent" : kind === "scheduled" ? "Schedule" : "Next Send"}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody key={`${safePage}-${pageSize}`} className="divide-y divide-border stagger">
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
                    <td className="px-4 py-3">
                      <ChannelDot channel={b.channel} />
                    </td>
                    {kind === "recurring" && (
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border border-border bg-white/[0.04] px-2.5 py-0.5 text-[12px] text-muted-foreground">
                          {b.recurrence?.summary ?? "—"}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-[13px]">{b.audience}</td>
                    <td className="px-4 py-3 text-[13px] tabular-nums">{fmtNum(b.reach)}</td>
                    <td className="px-4 py-3 text-[13px] tabular-nums">{fmtNum(b.delivered)}</td>
                    <td className="px-4 py-3 text-[13px] tabular-nums">{fmtNum(b.read)}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                      {kind === "recurring"
                        ? (b.recurrence?.nextRunAt ?? "—")
                        : kind === "scheduled"
                          ? [b.scheduleDate, b.scheduleTime].filter(Boolean).join(" · ")
                          : b.sentAt}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={STATUS_TONE[lifecycleStatus(b)]}>
                        {lifecycleStatus(b)}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <BroadcastRowMenu broadcast={b} />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={kind === "recurring" ? 11 : 10}
                      className="px-4 py-10 text-center text-xs text-muted-foreground"
                    >
                      {broadcasts.length === 0 ? (
                        <>
                          No broadcasts yet.{" "}
                          <Link to="/broadcasts/new" className="text-primary hover:underline">
                            Create your first one
                          </Link>
                          .
                        </>
                      ) : (
                        "No broadcast matches these filters."
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>
                {rows.length === 0 ? "0" : `${fromIdx}–${toIdx}`} of {rows.length} broadcast
                {rows.length !== 1 ? "s" : ""}
              </span>
              <label className="flex items-center gap-1">
                Rows
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-7 rounded-md border border-gray-200 bg-white pl-2 pr-6 text-xs scl-native-select ml-1"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="tap h-7 w-7 grid place-items-center rounded border border-border hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  const p =
                    totalPages <= 7
                      ? i + 1
                      : safePage <= 4
                        ? i + 1
                        : safePage >= totalPages - 3
                          ? totalPages - 6 + i
                          : safePage - 3 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`tap h-7 w-7 grid place-items-center rounded border text-[11px] font-medium transition-colors ${p === safePage ? "border-primary/40 bg-primary/15 text-foreground" : "border-border hover:bg-white text-muted-foreground"}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="tap h-7 w-7 grid place-items-center rounded border border-border hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
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

/* Per-row actions. What is offered depends on where the broadcast is in its
 * own lifecycle: a scheduled send can be switched off until its time passes,
 * a recurring series can be switched off and on for as long as it runs, and a
 * live series has to be switched off before it can be deleted. */
function BroadcastRowMenu({ broadcast }: { broadcast: Broadcast }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const kind = broadcastKind(broadcast);
  const state = lifecycleStatus(broadcast);
  const canToggle = kind !== "one-time" && state !== "Sent" && state !== "Draft";
  const isActive = state === "Active";
  const activationReason = activationBlockedReason(broadcast);
  const deleteReason = deleteBlockedReason(broadcast);

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Actions for ${broadcast.name}`}
        className="h-8 w-8 grid place-items-center rounded-md border border-border hover:bg-gray-50 transition-colors duration-150"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-56 rounded-lg border border-border bg-white shadow-lg py-1 animate-fade-in">
          {canToggle && (
            <button
              type="button"
              disabled={!isActive && activationReason !== ""}
              title={!isActive ? activationReason || undefined : undefined}
              onClick={() => {
                broadcastsStore.setActivation(broadcast.id, isActive ? "inactive" : "active");
                toast.success(isActive ? "Broadcast deactivated" : "Broadcast activated");
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isActive ? "Deactivate" : "Activate"}
            </button>
          )}
          <button
            type="button"
            disabled={deleteReason !== ""}
            title={deleteReason || undefined}
            onClick={() => {
              setConfirmDelete(true);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          {(activationReason || deleteReason) && (
            <p className="px-3 pt-1 pb-2 text-[12px] text-amber-600">
              {deleteReason || activationReason}
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${broadcast.name}"?`}
        description="This broadcast and its send history will be removed. This can't be undone."
        confirmLabel="Delete Broadcast"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          broadcastsStore.deleteMany([broadcast.id]);
          toast.success("Broadcast deleted");
          setConfirmDelete(false);
        }}
      />
    </div>
  );
}
