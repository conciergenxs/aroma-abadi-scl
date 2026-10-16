import { useMemo, useState } from "react";
import {
  Users,
  Send,
  CheckCheck,
  Eye,
  AlertTriangle,
  ListPlus,
  ListMinus,
  Search as SearchIcon,
  Check,
  ChevronDown,
  X as XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { fmtNum } from "@/lib/fmt";
import { useEscapeKey } from "@/lib/use-escape-key";
import { useContactsStore } from "@/components/scl/contacts-store";
import { LabelChip } from "@/components/scl/app-shell";
import type { Broadcast, BroadcastRun, ContactLabel } from "@/components/scl/mock-data";

/* How one send session performed: the five numbers for that occurrence, then
 * the contacts it reached. A recurring broadcast has one of these per run, so
 * everything here is measured over the run — never over the series. */

type ContactRowStatus = "Sent" | "Delivered" | "Read" | "Replied" | "Failed";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function BroadcastSessionAnalytics({
  broadcast,
  run,
}: {
  broadcast: Broadcast;
  run: BroadcastRun;
}) {
  const { contacts, labels } = useContactsStore();

  const kpis = [
    { l: "Audience", v: run.audience, icon: Users, color: "text-foreground" },
    { l: "Reach", v: run.reach, icon: Send, color: "text-foreground" },
    { l: "Delivered", v: run.delivered, icon: CheckCheck, color: "text-sky-300" },
    { l: "Read", v: run.read, icon: Eye, color: "text-emerald-300" },
    { l: "Failed", v: run.failed, icon: AlertTriangle, color: "text-red-300" },
  ];

  // Recipients for this run. Seeded off the run id, so each session in a
  // recurring series shows its own contacts and its own outcomes.
  const recipientRows = useMemo(() => {
    const ordered = [...contacts].sort((a, b) => hash(a.id + run.id) - hash(b.id + run.id));
    // A real send reaches far more contacts than this workspace has on file, so
    // the table shows a sample and says so in its header.
    const count = Math.min(contacts.length, Math.max(12, Math.floor(run.reach / 400) + 12));
    // Mirror the run's own delivered/read/failed split rather than a fixed
    // spread, so the table agrees with the numbers above it.
    const failRate = run.reach ? run.failed / run.reach : 0;
    const readRate = run.reach ? run.read / run.reach : 0;
    const deliveredRate = run.reach ? run.delivered / run.reach : 0;
    return ordered.slice(0, count).map((c, i) => {
      let status: ContactRowStatus;
      const r = (hash(c.id + run.id) % 1000) / 1000;
      if (r < failRate) status = "Failed";
      else if (r < failRate + readRate * 0.18) status = "Replied";
      else if (r < failRate + readRate) status = "Read";
      else if (r < failRate + deliveredRate) status = "Delivered";
      else status = "Sent";
      return { contact: c, status, i };
    });
  }, [contacts, run]);

  const [query, setQuery] = useState("");
  const matchedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipientRows;
    // Numbers are stored as "+62 812 …" but people search them the way they
    // type them locally ("0812…"), so both spellings have to match.
    const digits = (v: string) => v.replace(/\D/g, "");
    const qDigits = digits(q);
    return recipientRows.filter(({ contact }) => {
      if (contact.name.toLowerCase().includes(q)) return true;
      if (!qDigits) return false;
      const phone = digits(contact.phone);
      return phone.includes(qDigits) || phone.replace(/^62/, "0").includes(qDigits);
    });
  }, [recipientRows, query]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(matchedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = matchedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const [selected, setSelected] = useState<string[]>([]);
  const visibleIds = visibleRows.map((r) => r.contact.id);
  const allSel = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const toggleAll = () =>
    setSelected(
      allSel
        ? selected.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...selected, ...visibleIds])),
    );
  const toggleOne = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((s) => s !== id) : [...p, id]));
  const clearSelection = () => setSelected([]);

  const [addListOpen, setAddListOpen] = useState(false);
  const [removeListOpen, setRemoveListOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.l}
              className="card-hover rounded-xl border border-border bg-card/60 p-5 glass transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{k.l}</div>
                <Icon className={`h-3.5 w-3.5 ${k.color}`} />
              </div>
              <div className="stat-value mt-2 text-2xl font-semibold tabular-nums">
                {fmtNum(k.v)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card/60 glass overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-medium">Contact performance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Per-contact delivery and engagement for this send.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or phone…"
              aria-label="Search recipients"
              className="w-full h-9 rounded-md border border-border bg-background/40 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 border-b border-border bg-primary/5 text-[11px]">
            <span className="text-muted-foreground">{selected.length} selected</span>
            <button
              onClick={() => setAddListOpen(true)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 hover:bg-card px-2.5 py-1.5 transition-colors duration-150"
            >
              <ListPlus className="h-3 w-3" /> Add to List
            </button>
            <button
              onClick={() => setRemoveListOpen(true)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 hover:bg-card px-2.5 py-1.5 transition-colors duration-150"
            >
              <ListMinus className="h-3 w-3" /> Remove from List
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
          {/* Narrow screens scroll the table instead of squeezing phone
              numbers and names into stacks of fragments. */}
          <table className="w-full min-w-[780px] text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-white/[0.02]">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    className="accent-[oklch(0.62_0.17_40)]"
                    checked={allSel}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">Contact</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Labels</th>
                <th className="px-4 py-3 text-left font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleRows.map(({ contact, status }) => {
                const isSel = selected.includes(contact.id);
                const contactLabels = contact.labelIds
                  .map((lid) => labels.find((l) => l.id === lid))
                  .filter(Boolean)
                  .slice(0, 2) as ContactLabel[];
                const extraLabels = contact.labelIds.length - contactLabels.length;
                return (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="accent-[oklch(0.62_0.17_40)]"
                        checked={isSel}
                        onChange={() => toggleOne(contact.id)}
                        aria-label={`Select ${contact.name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/15 text-primary text-[11px] font-medium grid place-items-center">
                          {contact.avatar}
                        </div>
                        <span className="font-medium">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {contact.phone}
                    </td>
                    <td className="px-4 py-3">
                      <ContactStatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {contactLabels.length === 0 ? (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        ) : (
                          contactLabels.map((l) => <LabelChip key={l.id} label={l} />)
                        )}
                        {extraLabels > 0 && (
                          <span className="inline-flex items-center rounded-md border border-border bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            +{extraLabels}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {contact.lastInteraction}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {matchedRows.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">No recipients match “{query.trim()}”.</p>
            <button
              onClick={() => setQuery("")}
              className="mt-2 text-[12px] text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        <TableFooterPagination
          page={safePage}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          total={matchedRows.length}
        />
      </div>

      {addListOpen && (
        <ListPickerModal
          title="Add to List"
          confirmLabel="Add to selected lists"
          onClose={() => setAddListOpen(false)}
          onConfirm={(listIds) => {
            toast.success(
              `Added ${selected.length} contact${selected.length === 1 ? "" : "s"} to ${listIds.length} list${listIds.length === 1 ? "" : "s"}`,
            );
            setAddListOpen(false);
            clearSelection();
          }}
        />
      )}
      {removeListOpen && (
        <ListPickerModal
          title="Remove from List"
          confirmLabel="Remove from selected lists"
          assignedOnly
          assignedListIds={Array.from(
            new Set(
              recipientRows
                .filter((r) => selected.includes(r.contact.id))
                .flatMap((r) => r.contact.listIds),
            ),
          )}
          onClose={() => setRemoveListOpen(false)}
          onConfirm={(listIds) => {
            toast.success(
              `Removed ${selected.length} contact${selected.length === 1 ? "" : "s"} from ${listIds.length} list${listIds.length === 1 ? "" : "s"}`,
            );
            setRemoveListOpen(false);
            clearSelection();
          }}
        />
      )}

      {broadcast.status !== "Sent" && recipientRows.length === 0 && (
        <p className="text-xs text-muted-foreground">This send has no recipients on record.</p>
      )}
    </div>
  );
}

export function ContactStatusBadge({ status }: { status: ContactRowStatus }) {
  const map: Record<ContactRowStatus, string> = {
    Sent: "border-border bg-white/[0.04] text-muted-foreground",
    Delivered: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    Read: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    Replied: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    Failed: "border-red-500/30 bg-red-500/10 text-red-300",
  };
  return (
    <span
      className={`badge-animate inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${map[status]}`}
    >
      {status}
    </span>
  );
}

export function TableFooterPagination({
  page,
  setPage,
  pageSize,
  setPageSize,
  total,
}: {
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-border">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>Rows per page</span>
        <span className="relative inline-flex items-center">
          {/* appearance-none + our own chevron, so the gap either side of it is
           * ours to set rather than the browser's. */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-7 appearance-none rounded-md border border-border bg-card pl-2.5 pr-7 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-muted-foreground" />
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>{total === 0 ? "0 of 0" : `${start}–${end} of ${total}`}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="tap h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
            aria-label="Previous page"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="tap h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/* ----------------------------- List picker modal -------------------------- */

function ListPickerModal({
  title,
  confirmLabel,
  onClose,
  onConfirm,
  assignedOnly,
  assignedListIds,
}: {
  title: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (listIds: string[]) => void;
  assignedOnly?: boolean;
  assignedListIds?: string[];
}) {
  useEscapeKey(true, onClose);

  const { lists } = useContactsStore();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const pool = assignedOnly ? lists.filter((l) => assignedListIds?.includes(l.id)) : lists;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((l) => l.name.toLowerCase().includes(q));
  }, [pool, query]);

  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[80vh] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden modal-content"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="tap h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground transition-colors duration-150"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lists…"
              className="w-full h-9 rounded-md border border-border bg-background/40 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-10 text-center text-xs text-muted-foreground">
              {assignedOnly ? "No assigned lists." : "No lists match."}
            </div>
          ) : (
            filtered.map((l) => {
              const sel = picked.has(l.id);
              return (
                <label
                  key={l.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer ${
                    sel ? "bg-primary/10" : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sel}
                    onChange={() => toggle(l.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-[13px] font-medium flex-1 truncate">{l.name}</span>
                  {sel && <Check className="h-3.5 w-3.5 text-primary" />}
                </label>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <span className="text-[11px] text-muted-foreground">{picked.size} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center rounded-md border border-border bg-card/60 hover:bg-card px-3 h-8 text-[12px] transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={() => picked.size > 0 && onConfirm(Array.from(picked))}
              disabled={picked.size === 0}
              className="inline-flex items-center rounded-md bg-primary px-3 h-8 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors duration-150"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
