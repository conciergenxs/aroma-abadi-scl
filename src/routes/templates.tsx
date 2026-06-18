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
import type { Template, TemplateGroup } from "@/components/scl/mock-data";
import {
  Plus,
  Search,
  MoreHorizontal,
  Tags,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/templates")({
  head: () => ({ meta: [{ title: "Message Templates — SCL" }] }),
  component: TemplatesPage,
});

const statusTone: Record<string, string> = {
  Approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  Pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Rejected: "border-red-500/30 bg-red-500/10 text-red-300",
  Draft: "border-border bg-white/[0.04] text-muted-foreground",
};

const categoryTone: Record<string, string> = {
  Marketing: "border-primary/30 bg-primary/10 text-primary",
  Utility: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  Service: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  Reminder: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "Marketing", label: "Marketing", dot: "bg-primary" },
  { value: "Utility", label: "Utility", dot: "bg-sky-400" },
  { value: "Reminder", label: "Reminder", dot: "bg-amber-400" },
  { value: "Service", label: "Service", dot: "bg-violet-400" },
];

const CHANNEL_OPTIONS = [
  { value: "all", label: "All Channels" },
  { value: "whatsapp", label: "WhatsApp", icon: <ChannelIcon channel="whatsapp" className="h-3.5 w-3.5" /> },
  { value: "instagram", label: "Instagram", icon: <ChannelIcon channel="instagram" className="h-3.5 w-3.5" /> },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "Approved", label: "Approved", dot: "bg-emerald-400" },
  { value: "Pending", label: "Pending", dot: "bg-amber-400" },
  { value: "Rejected", label: "Rejected", dot: "bg-red-400" },
  { value: "Draft", label: "Draft", dot: "bg-muted-foreground" },
];

function TemplatesPage() {
  const { templates, groups } = useTemplatesStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [detail, setDetail] = useState<Template | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q) && !t.body.toLowerCase().includes(q)) return false;
      if (category !== "all" && t.category !== category) return false;
      if (channel !== "all" && t.channel !== channel) return false;
      if (status !== "all" && t.status !== status) return false;
      return true;
    });
  }, [templates, query, category, channel, status]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Message Templates</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Reusable, brand-approved messages for WhatsApp & Instagram.
          </p>
        </div>

        <SectionCard className="overflow-visible">
          <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates"
                className="h-9 w-64 rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <SclSelect
              value={category}
              onChange={setCategory}
              options={CATEGORY_OPTIONS}
              className="w-44"
              ariaLabel="Filter by category"
            />
            <SclSelect
              value={channel}
              onChange={setChannel}
              options={CHANNEL_OPTIONS}
              className="w-44"
              ariaLabel="Filter by channel"
            />
            <SclSelect
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
              className="w-44"
              ariaLabel="Filter by status"
            />
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setGroupsOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 hover:bg-card px-3 h-9 text-xs font-medium"
              >
                <Tags className="h-3.5 w-3.5" /> Manage Groups
              </button>
              <Link
                to="/templates/new"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 h-9 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" /> New Template
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Template name</th>
                  <th className="px-4 py-3 text-left font-medium">Group</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Last updated</th>
                  <th className="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => {
                  const group = groups.find((g) => g.id === t.groupId);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setDetail(t)}
                      className="hover:bg-white/[0.02] cursor-pointer"
                    >
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
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-xs text-muted-foreground">
                      No templates match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {groupsOpen && <ManageGroupsModal onClose={() => setGroupsOpen(false)} />}
      {detail && <TemplateDetailModal template={detail} onClose={() => setDetail(null)} />}
    </AppShell>
  );
}

function ManageGroupsModal({ onClose }: { onClose: () => void }) {
  const { groups } = useTemplatesStore();
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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
            className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground"
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
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 h-9 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
                      className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-emerald-300"
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
                      className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        templatesStore.deleteGroup(g.id);
                        toast.success("Group deleted");
                      }}
                      className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground hover:text-destructive"
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
            className="inline-flex items-center rounded-md border border-border bg-card/60 hover:bg-card px-3 h-8 text-[12px]"
          >
            Done
          </button>
        </div>
      </div>
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
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <ChannelIcon channel={template.channel} className="h-4 w-4" />
            <h2 className="text-sm font-semibold truncate">{template.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryTone[template.category]}`}>
              {template.category}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone[template.status]}`}>
              {template.status === "Rejected" && <AlertTriangle className="h-2.5 w-2.5" />}
              {template.status}
            </span>
            {group && (
              <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium ${TEMPLATE_GROUP_BADGE[group.color]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${TEMPLATE_GROUP_DOT[group.color]}`} />
                {group.name}
              </span>
            )}
          </div>

          {template.status === "Rejected" && template.rejectionReason && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-300 mb-1">
                <AlertTriangle className="h-3 w-3" /> Rejection reason
              </div>
              <p className="text-[12px] text-red-200/90 leading-relaxed">
                {template.rejectionReason}
              </p>
            </div>
          )}

          <div>
            <div className="text-[11px] font-medium text-muted-foreground mb-1">
              Message body
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3 text-[13px] whitespace-pre-wrap leading-relaxed">
              {template.body}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}