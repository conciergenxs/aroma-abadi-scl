import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, SectionCard, ChannelDot } from "@/components/scl/app-shell";
import { SclSelect } from "@/components/scl/scl-select";
import { ChannelIcon } from "@/components/scl/channel-badge";
import {
  templatesStore,
  useTemplatesStore,
  TEMPLATE_GROUP_DOT,
  TEMPLATE_GROUP_BADGE,
} from "@/components/scl/templates-store";
import {
  TEMPLATE_LANGUAGES,
  type Template,
  type TemplateGroup,
} from "@/components/scl/mock-data";
import {
  Plus,
  Search,
  Tags,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  Check,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  Hourglass,
  FileText,
  Star,
  FolderPlus,
  FolderMinus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/scl/confirm-dialog";


export const Route = createFileRoute("/templates/")({
  head: () => ({ meta: [{ title: "Message Templates — SCL" }] }),
  component: TemplatesPage,
});

const statusTone: Record<string, string> = {
  Approved: "border-emerald-700 bg-emerald-600 text-white",
  Pending: "border-amber-700 bg-amber-600 text-white",
  Rejected: "border-red-700 bg-red-600 text-white",
  Draft: "border-slate-600 bg-slate-500 text-white",
};

const categoryTone: Record<string, string> = {
  Marketing: "border-primary bg-primary text-primary-foreground",
  Utility: "border-sky-700 bg-sky-600 text-white",
  Service: "border-violet-700 bg-violet-600 text-white",
  Reminder: "border-amber-700 bg-amber-600 text-white",
};

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "Marketing", label: "Marketing", dot: "bg-primary" },
  { value: "Utility", label: "Utility", dot: "bg-sky-400" },
  { value: "Reminder", label: "Reminder", dot: "bg-amber-400" },
  { value: "Service", label: "Service", dot: "bg-violet-400" },
];

const CHANNEL_OPTIONS = [
  { value: "all", label: "All Group" },
  { value: "whatsapp", label: "WhatsApp", icon: <ChannelIcon channel="whatsapp" className="h-3.5 w-3.5" /> },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "Approved", label: "Approved", dot: "bg-emerald-400" },
  { value: "Pending", label: "Pending", dot: "bg-amber-400" },
  { value: "Rejected", label: "Rejected", dot: "bg-red-400" },
  { value: "Draft", label: "Draft", dot: "bg-muted-foreground" },
];

function TemplatesPage() {
  const { templates, groups, starred } = useTemplatesStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [detail, setDetail] = useState<Template | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [removeGroupOpen, setRemoveGroupOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    setPage(1);
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q) && !t.body.toLowerCase().includes(q)) return false;
      if (category !== "all" && t.category !== category) return false;
      if (channel !== "all" && t.channel !== channel) return false;
      if (status !== "all" && t.status !== status) return false;
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, query, category, channel, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const fromIdx = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const toIdx = Math.min(safePage * pageSize, filtered.length);

  // Keep selection in sync with what's currently visible.
  const visibleIds = useMemo(() => filtered.map((t) => t.id), [filtered]);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = () =>
    setSelected(allVisibleSelected ? [] : visibleIds);
  const clearSelection = () => setSelected([]);

  return (
    <AppShell
      title="Message Templates"
      subtitle="Standardized & brand-approved messages for WhatsApp Aroma Abadi."
    >
      <div className="space-y-6">


        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Templates"
              className="h-9 w-48 rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <SclSelect
            value={category}
            onChange={setCategory}
            options={CATEGORY_OPTIONS}
            className="w-36"
            ariaLabel="Filter by category"
          />
          <SclSelect
            value={channel}
            onChange={setChannel}
            options={CHANNEL_OPTIONS}
            className="w-36"
            ariaLabel="Filter by channel"
          />
          <SclSelect
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            className="w-32"
            ariaLabel="Filter by status"
          />
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setGroupsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 hover:bg-card px-3 h-9 text-xs font-medium transition-colors duration-150"
            >
              <Tags className="h-3.5 w-3.5" /> Manage Groups
            </button>
            <Link
              to="/templates/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 h-9 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
            >
              <Plus className="h-3.5 w-3.5" /> New Template
            </Link>
          </div>
        </div>

        <SectionCard className="overflow-visible">

          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 border-b border-border bg-primary/5 text-[11px]">
              <span className="text-muted-foreground">
                {selected.length} selected
              </span>
              <button
                onClick={() => setAddGroupOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 hover:bg-card px-2.5 py-1.5 transition-colors duration-150"
              >
                <FolderPlus className="h-3 w-3" /> Add to Group
              </button>
              <button
                onClick={() => setRemoveGroupOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 hover:bg-card px-2.5 py-1.5 transition-colors duration-150"
              >
                <FolderMinus className="h-3 w-3" /> Remove from Group
              </button>
              <button
                onClick={() => setBulkDeleteOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-destructive/40 text-destructive px-2.5 py-1.5 hover:bg-destructive/10 transition-colors duration-150"
              >
                <Trash2 className="h-3 w-3" /> Delete Templates
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
                  <th className="w-8 px-2 py-3"></th>
                  <th className="px-4 py-3 text-left font-medium">Template name</th>
                  <th className="px-4 py-3 text-left font-medium">Group</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Last updated</th>
                </tr>
              </thead>
              <tbody className="stagger divide-y divide-border">
                {paged.map((t) => {
                  const group = groups.find((g) => g.id === t.groupId);
                  const isStar = starred.includes(t.id);
                  const isSel = selected.includes(t.id);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setDetail(t)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="accent-[oklch(0.62_0.17_40)]"
                          checked={isSel}
                          onChange={() => toggleOne(t.id)}
                          aria-label={`Select ${t.name}`}
                        />
                      </td>
                      <td
                        className="px-2 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => templatesStore.toggleStar(t.id)}
                          className={`h-7 w-7 grid place-items-center rounded hover:bg-gray-50 ${
                            isStar
                              ? "text-amber-300"
                              : "text-muted-foreground/50 hover:text-amber-300"
                          }`}
                          aria-label={isStar ? "Unstar template" : "Star template"}
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${isStar ? "fill-current" : ""}`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-md">
                          {t.body}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {group ? (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium ${TEMPLATE_GROUP_BADGE[group.color]}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${TEMPLATE_GROUP_DOT[group.color]}`} />
                            {group.name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryTone[t.category]}`}
                        >
                          {t.category}
                        </span>
                      </td>
                      <td className="px-4 py-3"><ChannelDot channel={t.channel} /></td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone[t.status]}`}
                        >
                          {t.status === "Rejected" && <AlertTriangle className="h-2.5 w-2.5" />}
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{t.updated}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-xs text-muted-foreground">
                      No templates match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>{filtered.length === 0 ? "0" : `${fromIdx}–${toIdx}`} of {filtered.length} template{filtered.length !== 1 ? "s" : ""}</span>
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

      {groupsOpen && <ManageGroupsModal onClose={() => setGroupsOpen(false)} />}
      {detail && <TemplateDetailModal template={detail} onClose={() => setDetail(null)} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete template "${deleteTarget?.name}"?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            templatesStore.deleteTemplates([deleteTarget.id]);
            toast.success(`Template "${deleteTarget.name}" deleted`);
            setDeleteTarget(null);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selected.length} template${selected.length === 1 ? "" : "s"}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          const count = selected.length;
          templatesStore.deleteTemplates(selected);
          setSelected([]);
          toast.success(`Deleted ${count} template${count === 1 ? "" : "s"}`);
        }}
        onClose={() => setBulkDeleteOpen(false)}
      />

      {addGroupOpen && (
        <GroupPickerModal
          mode="add"
          selectedIds={selected}
          onClose={() => setAddGroupOpen(false)}
        />
      )}
      {removeGroupOpen && (
        <GroupPickerModal
          mode="remove"
          selectedIds={selected}
          onClose={() => setRemoveGroupOpen(false)}
        />
      )}
    </AppShell>
  );
}

function ManageGroupsModal({ onClose }: { onClose: () => void }) {
  const { groups } = useTemplatesStore();
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<TemplateGroup | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  const submitNew = () => {
    const name = newName.trim();
    if (!name) return;
    if (groups.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Group already exists");
      return;
    }
    templatesStore.addGroup(name);
    setNewName("");
    toast.success("Group created");
  };

  const submitRename = (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    templatesStore.renameGroup(id, name);
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[88vh] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Tags className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Manage Template Groups</h2>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground transition-colors duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitNew()}
              placeholder="New group name…"
              className="flex-1 h-9 rounded-md border border-border bg-background/40 px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              onClick={submitNew}
              disabled={!newName.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 h-9 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors duration-150"
            >
              <Plus className="h-3.5 w-3.5" /> Create
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search groups…"
              className="w-full h-9 rounded-md border border-border bg-background/40 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <div className="rounded-lg border border-border divide-y divide-border max-h-72 overflow-y-auto">
            {filtered.map((g) => (
              <div key={g.id} className="flex items-center gap-2 px-3 py-2">
                <span className={`h-2 w-2 rounded-full ${TEMPLATE_GROUP_DOT[g.color]}`} />
                {editingId === g.id ? (
                  <>
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitRename(g.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 h-7 rounded border border-border bg-background/60 px-2 text-[12px]"
                    />
                    <button
                      onClick={() => submitRename(g.id)}
                      className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-emerald-300 transition-colors duration-150"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-[13px]">{g.name}</span>
                    <button
                      onClick={() => {
                        setEditingId(g.id);
                        setEditingName(g.name);
                      }}
                      className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground transition-colors duration-150"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setPendingDelete(g)}
                      className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground hover:text-destructive transition-colors duration-150"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                No groups yet.
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border flex items-center justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-border bg-card/60 hover:bg-card px-3 h-8 text-[12px] transition-colors duration-150"
          >
            Done
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete Group"
        description={
          pendingDelete ? (
            <>
              Are you sure you want to delete the group{" "}
              <span className="text-foreground font-medium">
                {pendingDelete.name}
              </span>
              ? Templates in this group will be unassigned. This action cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (!pendingDelete) return;
          templatesStore.deleteGroup(pendingDelete.id);
          toast.success("Group deleted");
        }}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}

function TemplateDetailModal({
  template,
  onClose,
}: {
  template: Template;
  onClose: () => void;
}) {
  const { groups } = useTemplatesStore();
  const group: TemplateGroup | undefined = groups.find((g) => g.id === template.groupId);

  const languageLabel =
    TEMPLATE_LANGUAGES.find((l) => l.code === template.language)?.name ??
    template.language ??
    "English (US)";

  const channelLabel = "WhatsApp";

  // Derived metadata (deterministic placeholders so the demo feels complete)
  const reviewers = ["Priya Tan", "Marcus Lee", "Saanvi Patel", "Joaquín Ruiz"];
  const seed = template.id
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const reviewer = reviewers[seed % reviewers.length];
  const creator = reviewers[(seed + 1) % reviewers.length];
  const createdAt = "Nov 12, 2025";
  const reviewDate = template.status === "Approved" || template.status === "Rejected"
    ? "Nov 14, 2025"
    : null;

  const variables = useMemo(() => {
    const found = new Set<string>();
    const re = /\{\{([^}]+)\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(template.body)) !== null) found.add(m[1].trim());
    return Array.from(found);
  }, [template.body]);

  const variableHints: Record<string, string> = {
    "1": "Customer Name",
    "2": "Order Number",
    "3": "Tracking URL",
    "4": "Agent Name",
    name: "Contact Name",
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[90vw] max-w-[1280px] h-[85vh] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold tracking-tight truncate">
              {template.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone[template.status]}`}
              >
                {template.status === "Rejected" && <AlertTriangle className="h-2.5 w-2.5" />}
                {template.status === "Approved" && <CheckCircle2 className="h-2.5 w-2.5" />}
                {template.status === "Pending" && <Hourglass className="h-2.5 w-2.5" />}
                {template.status}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryTone[template.category]}`}
              >
                {template.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium">
                <ChannelIcon channel={template.channel} className="h-3 w-3" />
                {channelLabel}
              </span>
              {group && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium ${TEMPLATE_GROUP_BADGE[group.color]}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${TEMPLATE_GROUP_DOT[group.color]}`} />
                  {group.name}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground shrink-0 transition-colors duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_360px]">
          {/* Left — details (scrollable) */}
          <div className="overflow-y-auto p-6 space-y-6 border-r border-border">
            {/* Template Information */}
            <DetailSection title="Template Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReadField label="Template Name" value={template.name} />
                <ReadField label="Category" value={template.category} />
                <ReadField label="Language" value={languageLabel} />
                <ReadField
                  label="Template Group"
                  value={
                    group ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${TEMPLATE_GROUP_DOT[group.color]}`} />
                        {group.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  }
                />
                <ReadField label="Header Type" value="None" />
                <ReadField
                  label="Channel"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <ChannelIcon channel={template.channel} className="h-3.5 w-3.5" />
                      {channelLabel}
                    </span>
                  }
                />
                <ReadField label="Status" value={template.status} />
                <ReadField
                  label="Created At"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {createdAt}
                    </span>
                  }
                />
                <ReadField
                  label="Last Updated"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {template.updated}
                    </span>
                  }
                />
                <ReadField
                  label="Created By"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {creator}
                    </span>
                  }
                />
              </div>
            </DetailSection>

            {/* Message Content */}
            <DetailSection title="Message Content">
              <ReadField label="Header Content" value={<span className="text-muted-foreground">No header configured</span>} />
              <ReadField
                label="Body Message"
                value={
                  <div className="rounded-md border border-border bg-background/40 p-3 text-[13px] whitespace-pre-wrap leading-relaxed">
                    {renderBodyWithVars(template.body)}
                  </div>
                }
                block
              />
              <ReadField label="Footer Message" value={<span className="text-muted-foreground">No footer configured</span>} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReadField label="Button Type" value="None" />
                <ReadField label="Buttons" value={<span className="text-muted-foreground">—</span>} />
              </div>
            </DetailSection>

            {/* Variables */}
            {variables.length > 0 && (
              <DetailSection title="Variables Used">
                <div className="rounded-md border border-border bg-background/40 divide-y divide-border">
                  {variables.map((v) => (
                    <div key={v} className="flex items-center gap-3 px-3 py-2 text-[12px]">
                      <span className="font-mono rounded bg-primary/15 text-primary px-1.5 py-0.5 text-[11px]">
                        {`{{${v}}}`}
                      </span>
                      <span className="text-muted-foreground">
                        {variableHints[v] ?? "Unmapped variable"}
                      </span>
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}

            {/* Approval Details */}
            <DetailSection title="Approval Details">
              {template.status === "Approved" && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <ApprovalRow label="Review date" value={reviewDate ?? "—"} />
                    <ApprovalRow label="Reviewer" value={reviewer} />
                  </div>
                </div>
              )}
              {template.status === "Rejected" && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-red-300">
                    <AlertTriangle className="h-3.5 w-3.5" /> Rejected
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <ApprovalRow label="Rejected date" value={reviewDate ?? "—"} />
                    <ApprovalRow label="Reviewer" value={reviewer} />
                  </div>
                  {template.rejectionReason && (
                    <div>
                      <div className="text-[11px] font-medium text-red-300/80 mb-1">
                        Rejection reason
                      </div>
                      <p className="text-[12px] text-red-200/90 leading-relaxed">
                        {template.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {template.status === "Pending" && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 flex items-center gap-2 text-[12px] text-amber-200/90">
                  <Hourglass className="h-3.5 w-3.5 text-amber-300" />
                  Waiting for review by the channel provider.
                </div>
              )}
              {template.status === "Draft" && (
                <div className="rounded-lg border border-border bg-background/40 p-4 flex items-center gap-2 text-[12px] text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Not submitted yet — finish editing and submit for review.
                </div>
              )}
            </DetailSection>
          </div>

          {/* Right — sticky preview */}
          <div className="hidden lg:block bg-background/30">
            <div className="sticky top-0 p-5">
              <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <ChannelIcon channel={template.channel} className="h-4 w-4" />
                    <span className="text-sm font-medium">Live preview</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {channelLabel}
                  </span>
                </div>
                <div className="p-5 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent)]">
                  <DetailPhoneFrame channel={template.channel} senderName="Your business">
                    <div className="whitespace-pre-wrap break-words">
                      {renderBodyWithVars(template.body)}
                    </div>
                  </DetailPhoneFrame>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-border">
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 h-9 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors duration-150"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Template
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Template"
        description={
          <>
            Are you sure you want to delete{" "}
            <span className="text-foreground font-medium">{template.name}</span>?
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        onConfirm={() => {
          templatesStore.deleteTemplate(template.id);
          toast.success("Template deleted");
          onClose();
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ReadField({
  label,
  value,
  block,
}: {
  label: string;
  value: React.ReactNode;
  block?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      {block ? (
        value
      ) : (
        <div className="h-9 rounded-md border border-border bg-background/40 px-3 flex items-center text-[13px]">
          {value}
        </div>
      )}
    </div>
  );
}

function ApprovalRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </div>
      <div className="text-[12px]">{value}</div>
    </div>
  );
}

function DetailPhoneFrame({
  channel,
  senderName,
  children,
}: {
  channel: "whatsapp" | "instagram";
  senderName: string;
  children: React.ReactNode;
}) {
  const isWa = channel === "whatsapp";
  return (
    <div className="mx-auto w-full max-w-[280px] rounded-[28px] border border-border bg-background/60 p-3 shadow-xl">
      <div className="rounded-[20px] bg-background overflow-hidden">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <ChannelIcon channel={channel} className="h-5 w-5" />
          <div className="min-w-0">
            <div className="text-[12px] font-semibold truncate">{senderName}</div>
            <div className="text-[10px] text-muted-foreground">
              {"WhatsApp Business"}
            </div>
          </div>
        </div>
        <div className="min-h-[200px] p-3 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]">
          <div
            className={`max-w-[90%] rounded-2xl rounded-bl-sm px-3 py-2 text-[12px] leading-relaxed ${
              isWa
                ? "bg-emerald-500/15 border border-emerald-500/20 text-foreground"
                : "bg-pink-500/10 border border-pink-500/20 text-foreground"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderBodyWithVars(body: string) {
  const parts = body.split(/(\{\{[^}]+\}\})/g);
  return parts.map((p, i) =>
    /^\{\{[^}]+\}\}$/.test(p) ? (
      <span key={i} className="rounded bg-primary/15 px-1 py-0.5 text-primary font-medium">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function GroupPickerModal({
  mode,
  selectedIds,
  onClose,
}: {
  mode: "add" | "remove";
  selectedIds: string[];
  onClose: () => void;
}) {
  const { groups, templates } = useTemplatesStore();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const assignedGroupIds = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => {
      if (selectedIds.includes(t.id) && t.groupId) set.add(t.groupId);
    });
    return set;
  }, [templates, selectedIds]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = mode === "remove"
      ? groups.filter((g) => assignedGroupIds.has(g.id))
      : groups;
    return q ? base.filter((g) => g.name.toLowerCase().includes(q)) : base;
  }, [groups, assignedGroupIds, query, mode]);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const apply = () => {
    if (picked.length === 0) {
      toast.error("Pick at least one group");
      return;
    }
    if (mode === "add") {
      // Assign each picked group to all selected templates (last write wins for groupId).
      picked.forEach((gid) => templatesStore.setGroupForTemplates(selectedIds, gid));
      toast.success(`Added to ${picked.length} group${picked.length === 1 ? "" : "s"}`);
    } else {
      picked.forEach((gid) =>
        templatesStore.removeGroupFromTemplates(selectedIds, gid),
      );
      toast.success(`Removed from ${picked.length} group${picked.length === 1 ? "" : "s"}`);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold">
            {mode === "add" ? "Add to Group" : "Remove from Group"}
          </h2>
          <button
            onClick={onClose}
            className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground transition-colors duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search groups…"
              className="w-full h-9 rounded-md border border-border bg-background/40 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="rounded-lg border border-border divide-y divide-border max-h-72 overflow-y-auto">
            {list.map((g) => {
              const checked = picked.includes(g.id);
              return (
                <label
                  key={g.id}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                >
                  <input
                    type="checkbox"
                    className="accent-[oklch(0.62_0.17_40)]"
                    checked={checked}
                    onChange={() => toggle(g.id)}
                  />
                  <span className={`h-2 w-2 rounded-full ${TEMPLATE_GROUP_DOT[g.color]}`} />
                  <span className="text-[13px]">{g.name}</span>
                </label>
              );
            })}
            {list.length === 0 && (
              <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                {mode === "remove"
                  ? "Selected templates aren't assigned to any group."
                  : "No groups found."}
              </div>
            )}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-border bg-card/60 hover:bg-card px-3 h-9 text-xs font-medium transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={apply}
            className="inline-flex items-center rounded-md bg-primary px-3 h-9 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}