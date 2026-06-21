import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { AppShell, SectionCard, ChannelDot, LabelChip, ListChip, labelColorClass, labelColorDot } from "@/components/scl/app-shell";
import { ChannelIcon } from "@/components/scl/channel-badge";
import { SclSelect } from "@/components/scl/scl-select";
import {
  type Contact,
  type Channel,
  type ContactLabel,
  type ContactList,
  type LabelColor,
  type LifecycleStage,
  connectedChannels,
} from "@/components/scl/mock-data";
import { LIFECYCLE_STAGES, STAGE_COLORS } from "@/components/scl/mock-data";
import {
  contactsStore,
  useContactsStore,
  PROPERTY_TYPE_LABELS,
  type ContactProperty,
  type PropertyType,
} from "@/components/scl/contacts-store";
import { toast } from "sonner";
import {
  Search, Plus, MoreHorizontal,
  Users, UserCircle2, Inbox as InboxIcon, ChevronLeft, ChevronRight, Pencil, Trash2, X,
  Tag as TagIcon, ListPlus, Check, Settings2, GripVertical, LayoutGrid, Rows3,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/scl/confirm-dialog";
import { PropertyFormModal } from "@/components/scl/property-form-modal";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Contacts — SCL" }] }),
  component: ContactsPage,
});

const COLORS: LabelColor[] = ["indigo", "pink", "emerald", "amber", "sky", "violet", "slate"];

function ContactsPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChildRoute = pathname !== "/contacts";

  const { contacts, labels, lists, properties } = useContactsStore();
  const setContacts = contactsStore.setContacts;
  const setLabels = contactsStore.setLabels;
  const setLists = contactsStore.setLists;
  const setProperties = contactsStore.setProperties;
  const navigate = useNavigate();
  const [showManageProps, setShowManageProps] = useState(false);
  const [activeView, setActiveView] = useState<string>("all"); // "all" | "mine" | listId
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  if (isChildRoute) return <Outlet />;

  const channelOptions = useMemo(() => {
    const connected = connectedChannels.filter((c) => c.status === "connected");
    const unique = Array.from(new Set(connected.map((c) => c.channel)));
    return [
      { value: "all", label: "All Channels" },
      ...unique.map((ch) => ({
        value: ch,
        label: ch === "whatsapp" ? "WhatsApp" : "Instagram",
        icon: <ChannelIcon channel={ch as Channel} className="h-4 w-4" />,
      })),
    ];
  }, []);

  const visibleContacts = useMemo(() => {
    let base: Contact[];
    if (activeView === "all") base = contacts;
    else if (activeView === "mine") base = contacts.filter((c) => c.ownerId === "me");
    else base = contacts.filter((c) => c.listIds.includes(activeView));
    if (channelFilter !== "all") {
      base = base.filter((c) => c.channel === channelFilter);
    }
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.instagram ?? "").toLowerCase().includes(q),
    );
  }, [contacts, activeView, channelFilter, query]);

  const totalPages = Math.max(1, Math.ceil(visibleContacts.length / perPage));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);
  useEffect(() => { setPage(1); }, [activeView, channelFilter, query, perPage]);
  const pageStart = (page - 1) * perPage;
  const pageContacts = visibleContacts.slice(pageStart, pageStart + perPage);

  const allSelected = selected.length > 0 && pageContacts.every((c) => selected.includes(c.id));
  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const selectedContacts = contacts.filter((c) => selected.includes(c.id));
  const selectedHaveAnyList = selectedContacts.some((c) => c.listIds.length > 0);

  const labelById = (id: string) => labels.find((l) => l.id === id);
  const listById = (id: string) => lists.find((l) => l.id === id);
  const activeList = activeView !== "all" && activeView !== "mine" ? listById(activeView) ?? null : null;
  const myCount = contacts.filter((c) => c.ownerId === "me").length;

  const updateContact = (id: string, patch: Partial<Contact>) =>
    setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const moveToStage = (contactId: string, stage: LifecycleStage) =>
    setContacts((cs) =>
      cs.map((c) =>
        c.id === contactId && c.lifecycleStage !== stage
          ? { ...c, lifecycleStage: stage, stageEnteredAt: new Date().toISOString() }
          : c,
      ),
    );

  const bulkAddLabel = (lid: string) =>
    setContacts((cs) => cs.map((c) => (selected.includes(c.id) && !c.labelIds.includes(lid) ? { ...c, labelIds: [...c.labelIds, lid] } : c)));
  const bulkRemoveLabel = (lid: string) =>
    setContacts((cs) => cs.map((c) => (selected.includes(c.id) ? { ...c, labelIds: c.labelIds.filter((x) => x !== lid) } : c)));
  const bulkAddList = (lsId: string) =>
    setContacts((cs) => cs.map((c) => (selected.includes(c.id) && !c.listIds.includes(lsId) ? { ...c, listIds: [...c.listIds, lsId] } : c)));
  const bulkRemoveList = (lsId: string) =>
    setContacts((cs) => cs.map((c) => (selected.includes(c.id) ? { ...c, listIds: c.listIds.filter((x) => x !== lsId) } : c)));
  const bulkDelete = () => {
    const count = selected.length;
    setContacts((cs) => cs.filter((c) => !selected.includes(c.id)));
    setSelected([]);
    toast.success(`Deleted ${count} contact${count === 1 ? "" : "s"}`);
  };

  const createList = () => {
    const name = newListName.trim();
    if (!name) { toast.error("List name is required"); return; }
    const id = `ls-${Date.now()}`;
    setLists((l) => [...l, { id, name }]);
    setNewListName("");
    setShowNewList(false);
    toast.success(`List “${name}” created`);
  };

  const renameList = (id: string, name: string) => {
    setLists((l) => l.map((x) => (x.id === id ? { ...x, name } : x)));
    toast.success("List renamed");
  };

  const deleteList = (id: string) => {
    const removed = lists.find((x) => x.id === id);
    setLists((l) => l.filter((x) => x.id !== id));
    setContacts((cs) => cs.map((c) => ({ ...c, listIds: c.listIds.filter((x) => x !== id) })));
    if (activeView === id) setActiveView("all");
    if (removed) toast.success(`List “${removed.name}” deleted`);
  };

  const createLabel = (name: string, color: LabelColor) => {
    const id = `lb-${Date.now()}`;
    setLabels((l) => [...l, { id, name, color }]);
    toast.success(`Label “${name}” created`);
    return id;
  };
  const updateLabel = (id: string, patch: Partial<ContactLabel>) => {
    setLabels((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    toast.success("Label updated");
  };
  const deleteLabel = (id: string) => {
    const removed = labels.find((x) => x.id === id);
    setLabels((l) => l.filter((x) => x.id !== id));
    setContacts((cs) => cs.map((c) => ({ ...c, labelIds: c.labelIds.filter((x) => x !== id) })));
    if (removed) toast.success(`Label “${removed.name}” deleted`);
  };

  return (
    <AppShell
      title={activeList ? activeList.name : activeView === "mine" ? "My Contacts" : "Contacts"}
      subtitle={
        activeList
          ? `${visibleContacts.length} contacts in this list`
          : activeView === "mine"
            ? `${visibleContacts.length} contacts assigned to you`
            : `${contacts.length} contacts · ${lists.length} lists`
      }
      noPadding
    >
      <div className="grid grid-cols-[240px_1fr] h-[calc(100vh-64px)] min-h-0">
        {/* Left sidebar: All Contacts + Lists */}
        <aside className="border-r border-border bg-sidebar/40 overflow-y-auto">
          <div className="p-3 space-y-1">
            <button
              onClick={() => { setActiveView("all"); setSelected([]); }}
              className={`w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs transition ${
                activeView === "all" ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> All contacts
              </span>
              <span className="text-[10px] text-muted-foreground">{contacts.length}</span>
            </button>
            <button
              onClick={() => { setActiveView("mine"); setSelected([]); }}
              className={`w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs transition ${
                activeView === "mine" ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <UserCircle2 className="h-3.5 w-3.5" /> My contacts
              </span>
              <span className="text-[10px] text-muted-foreground">{myCount}</span>
            </button>
          </div>

          <div className="px-3 pt-2 pb-1 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Contact lists</div>
            <button
              onClick={() => setShowNewList((v) => !v)}
              className="h-5 w-5 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground"
              title="New list"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {showNewList && (
            <div className="px-3 pb-2 flex items-center gap-1">
              <input
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createList(); if (e.key === "Escape") setShowNewList(false); }}
                placeholder="List name"
                className="h-7 flex-1 rounded-md border border-border bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <button onClick={createList} className="h-7 w-7 grid place-items-center rounded bg-primary text-primary-foreground hover:bg-primary/90">
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="px-3 pb-3 space-y-0.5">
            {lists.map((ls) => {
              const count = contacts.filter((c) => c.listIds.includes(ls.id)).length;
              const active = activeView === ls.id;
              return (
                <ListSidebarRow
                  key={ls.id}
                  list={ls}
                  count={count}
                  active={active}
                  onSelect={() => { setActiveView(ls.id); setSelected([]); }}
                  onRename={(name) => renameList(ls.id, name)}
                  onDelete={() => deleteList(ls.id)}
                />
              );
            })}
            {lists.length === 0 && (
              <div className="px-2 py-4 text-[11px] text-muted-foreground">No lists yet. Create one to group contacts for broadcasts.</div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-col min-h-0 overflow-hidden">
          <div className="p-5 pb-3 flex flex-wrap items-center gap-2 border-b border-border">
            <div className="inline-flex items-center rounded-md border border-border bg-card/60 p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition ${
                  viewMode === "list" ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Rows3 className="h-3.5 w-3.5" /> List
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition ${
                  viewMode === "kanban" ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Kanban
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contacts…"
                className="h-9 w-80 rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <SclSelect
              value={channelFilter}
              onChange={setChannelFilter}
              options={channelOptions}
              className="w-44"
            />
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setShowManageProps(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 py-2 text-xs hover:bg-card"
              >
                <Settings2 className="h-3.5 w-3.5" /> Manage Properties
              </button>
              <button
                onClick={() => navigate({ to: "/contacts/new" })}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" /> New Contact
              </button>
            </div>
          </div>

          {selected.length > 0 && (
            <div className="px-5 py-2.5 border-b border-border bg-primary/5 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-muted-foreground">{selected.length} selected</span>
              <PickerPopover
                label="Add to list"
                icon={<ListPlus className="h-3 w-3" />}
                items={lists.map((l) => ({ id: l.id, name: l.name }))}
                onPick={(id) => bulkAddList(id)}
              />
              {selectedHaveAnyList && (
                <PickerPopover
                  label="Remove from list"
                  icon={<X className="h-3 w-3" />}
                  items={lists
                    .filter((l) => selectedContacts.some((c) => c.listIds.includes(l.id)))
                    .map((l) => ({ id: l.id, name: l.name }))}
                  onPick={(id) => bulkRemoveList(id)}
                />
              )}
              <PickerPopover
                label="Add label"
                icon={<TagIcon className="h-3 w-3" />}
                items={labels.map((l) => ({ id: l.id, name: l.name, color: l.color }))}
                onPick={(id) => bulkAddLabel(id)}
              />
              <PickerPopover
                label="Remove label"
                icon={<X className="h-3 w-3" />}
                items={labels
                  .filter((l) => selectedContacts.some((c) => c.labelIds.includes(l.id)))
                  .map((l) => ({ id: l.id, name: l.name, color: l.color }))}
                onPick={(id) => bulkRemoveLabel(id)}
              />
              <button
                onClick={() => setBulkDeleteOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-destructive/40 text-destructive px-2.5 py-1.5 hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" /> Delete Contacts
              </button>
              <button onClick={() => setSelected([])} className="ml-auto text-muted-foreground hover:text-foreground">Clear selection</button>
            </div>
          )}

          <div className="flex-1 min-h-0 p-5">
            {viewMode === "kanban" ? (
              <KanbanBoard
                contacts={visibleContacts}
                onMove={moveToStage}
                onOpen={(id) => navigate({ to: "/contacts/$contactId", params: { contactId: id } })}
              />
            ) : (
            <SectionCard className="h-full flex flex-col">
              <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto [overscroll-behavior-x:contain] [overscroll-behavior-y:contain] scroll-smooth scl-scroll">
                <table className="min-w-full text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="sticky top-0 z-10 w-10 px-4 py-3 whitespace-nowrap bg-card border-b border-border shadow-[0_1px_0_0_oklch(1_0_0_/_6%)]">
                        <input
                          type="checkbox"
                          className="accent-[oklch(0.62_0.17_40)]"
                          checked={allSelected}
                          onChange={() => setSelected(allSelected ? [] : pageContacts.map((c) => c.id))}
                        />
                      </th>
                      {properties.filter((p) => p.visible).map((p) => (
                        <th key={p.id} className="sticky top-0 z-10 px-4 py-3 text-left font-medium whitespace-nowrap bg-card border-b border-border shadow-[0_1px_0_0_oklch(1_0_0_/_6%)]">{p.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pageContacts.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => navigate({ to: "/contacts/$contactId", params: { contactId: c.id } })}>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="accent-[oklch(0.62_0.17_40)]"
                            checked={selected.includes(c.id)}
                            onChange={() => toggle(c.id)}
                          />
                        </td>
                        {properties.filter((p) => p.visible).map((p) => (
                          <td key={p.id} className="px-4 py-3 whitespace-nowrap align-middle">
                            {renderPropertyCell(p, c, labelById, listById)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {pageContacts.length === 0 && (
                      <tr>
                        <td colSpan={properties.filter((p) => p.visible).length + 1} className="px-4 py-16 text-center text-xs text-muted-foreground">
                          <InboxIcon className="h-5 w-5 mx-auto mb-2 opacity-50" />
                          <div className="font-medium text-foreground">No contacts found</div>
                          <div className="mt-1">Try selecting another channel or clearing filters.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination
                total={visibleContacts.length}
                page={page}
                perPage={perPage}
                totalPages={totalPages}
                onPageChange={setPage}
                onPerPageChange={setPerPage}
              />
            </SectionCard>
            )}
          </div>
        </div>
      </div>

      {showManageProps && (
        <ManagePropertiesModal
          properties={properties}
          onClose={() => setShowManageProps(false)}
          onChange={(next) => { setProperties(next); toast.success("Property updated"); }}
        />
      )}
      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selected.length} contact${selected.length === 1 ? "" : "s"}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={bulkDelete}
        onClose={() => setBulkDeleteOpen(false)}
      />
    </AppShell>
  );
}

function renderPropertyCell(
  p: ContactProperty,
  c: Contact,
  labelById: (id: string) => ContactLabel | undefined,
  listById: (id: string) => ContactList | undefined,
) {
  switch (p.key) {
    case "name":
      return <span className="text-sm font-medium">{c.name}</span>;
    case "phone":
      return <span className="text-xs font-mono text-muted-foreground">{c.phone}</span>;
    case "channel":
      return <ChannelDot channel={c.channel} />;
    case "labels":
      return (() => {
        const ids = c.labelIds;
        const shown = ids.slice(0, 2);
        const extra = ids.length - shown.length;
        return (
          <div className="flex items-center gap-1 flex-nowrap">
            {shown.map((id) => {
              const l = labelById(id);
              return l ? <LabelChip key={id} label={l} /> : null;
            })}
            {extra > 0 && (
              <span className="inline-flex items-center rounded-md border border-border bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                +{extra}
              </span>
            )}
            {ids.length === 0 && <span className="text-[11px] text-muted-foreground">—</span>}
          </div>
        );
      })();
    case "lists":
      return (() => {
        const ids = c.listIds;
        const shown = ids.slice(0, 2);
        const extra = ids.length - shown.length;
        return (
          <div className="flex items-center gap-1 flex-nowrap">
            {shown.map((id) => {
              const l = listById(id);
              return l ? <ListChip key={id} name={l.name} /> : null;
            })}
            {extra > 0 && (
              <span className="inline-flex items-center rounded-md border border-border bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                +{extra}
              </span>
            )}
            {ids.length === 0 && <span className="text-[11px] text-muted-foreground">—</span>}
          </div>
        );
      })();
    case "lastInteraction":
      return <span className="text-xs text-muted-foreground">{c.lastInteraction}</span>;
    case "status":
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs ${
          c.status === "Active" ? "text-emerald-300" : c.status === "Inactive" ? "text-muted-foreground" : "text-rose-300"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${
            c.status === "Active" ? "bg-emerald-400" : c.status === "Inactive" ? "bg-muted-foreground" : "bg-rose-400"
          }`} />
          {c.status}
        </span>
      );
    default:
      return <span className="text-[11px] text-muted-foreground">—</span>;
  }
}

function ManagePropertiesModal({
  properties, onClose, onChange,
}: {
  properties: ContactProperty[];
  onClose: () => void;
  onChange: (next: ContactProperty[]) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ContactProperty | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const toggleVisible = (id: string) =>
    onChange(properties.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)));

  const deleteProp = (id: string) =>
    onChange(properties.filter((p) => p.id !== id));

  const upsertProp = (prop: ContactProperty) => {
    const exists = properties.some((p) => p.id === prop.id);
    if (exists) onChange(properties.map((p) => (p.id === prop.id ? prop : p)));
    else onChange([...properties, prop]);
  };

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const next = [...properties];
    const from = next.findIndex((p) => p.id === dragId);
    const to = next.findIndex((p) => p.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    setDragId(null);
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[720px] max-w-[95vw] rounded-xl border border-border bg-popover shadow-xl glass" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Manage Properties</div>
            <div className="text-[11px] text-muted-foreground">Reorder, show/hide, edit, or add contact properties.</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditing(null); setShowAdd(true); }}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> Add Property
            </button>
            <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-white/[0.02]">
              <tr>
                <th className="w-10 px-3 py-2"></th>
                <th className="w-12 px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Property Name</th>
                <th className="px-3 py-2 text-left font-medium">Property Type</th>
                <th className="w-24 px-3 py-2 text-left font-medium">Visible</th>
                <th className="w-24 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {properties.map((p, idx) => (
                <tr
                  key={p.id}
                  draggable
                  onDragStart={() => setDragId(p.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(p.id)}
                  className={`hover:bg-white/[0.02] ${dragId === p.id ? "opacity-50" : ""}`}
                >
                  <td className="px-3 py-2 text-muted-foreground cursor-grab">
                    <GripVertical className="h-4 w-4" />
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <div className="text-sm">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{p.key}{p.system ? " · default" : ""}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{PROPERTY_TYPE_LABELS[p.type]}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleVisible(p.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${p.visible ? "bg-primary" : "bg-white/10"}`}
                      aria-label="toggle visible"
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${p.visible ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => { setEditing(p); setShowAdd(true); }}
                        className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {!p.system && (
                        <button
                          onClick={() => deleteProp(p.id)}
                          className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <PropertyFormModal
          initial={editing}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSave={(prop) => { upsertProp(prop); setShowAdd(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function PropertyFormModal({
  initial, onClose, onSave,
}: {
  initial: ContactProperty | null;
  onClose: () => void;
  onSave: (p: ContactProperty) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [key, setKey] = useState(initial?.key ?? "");
  const [type, setType] = useState<PropertyType>(initial?.type ?? "text");
  const isEdit = !!initial;
  const isSystem = !!initial?.system;

  const autoKey = (n: string) =>
    n.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

  const save = () => {
    const finalName = name.trim();
    if (!finalName) return;
    const finalKey = (key.trim() || autoKey(finalName));
    onSave({
      id: initial?.id ?? `p-${Date.now()}`,
      key: finalKey,
      name: finalName,
      type,
      visible: initial?.visible ?? true,
      system: initial?.system,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[440px] max-w-[95vw] rounded-xl border border-border bg-popover shadow-xl glass" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-medium">{isEdit ? "Edit Property" : "Add Property"}</div>
          <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Property Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); if (!isEdit) setKey(autoKey(e.target.value)); }}
              placeholder="e.g. Company"
              className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Property Key</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={isSystem}
              placeholder="company"
              className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-60"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">Used internally. Lowercase, letters, numbers, underscores.</p>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Property Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PropertyType)}
              disabled={isSystem}
              className="h-9 w-full rounded-md border border-border bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-60"
            >
              {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:bg-card">Cancel</button>
          <button onClick={save} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            {isEdit ? "Save Changes" : "Add Property"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ListSidebarRow({
  list, count, active, onSelect, onRename, onDelete,
}: {
  list: ContactList; count: number; active: boolean;
  onSelect: () => void; onRename: (name: string) => void; onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(list.name);
  const [menu, setMenu] = useState(false);

  if (editing) {
    return (
      <div className="flex items-center gap-1 px-1">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onRename(value.trim() || list.name); setEditing(false); }
            if (e.key === "Escape") { setValue(list.name); setEditing(false); }
          }}
          onBlur={() => { onRename(value.trim() || list.name); setEditing(false); }}
          className="h-7 flex-1 rounded-md border border-border bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>
    );
  }

  return (
    <div className="group relative">
      <button
        onClick={onSelect}
        className={`w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs transition ${
          active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
        }`}
      >
        <span className="inline-flex items-center gap-2 truncate">
          <ChevronRight className="h-3 w-3 opacity-60" />
          <span className="truncate">{list.name}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">{count}</span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }}
            className="opacity-0 group-hover:opacity-100 h-5 w-5 grid place-items-center rounded hover:bg-white/[0.08]"
          >
            <MoreHorizontal className="h-3 w-3" />
          </span>
        </span>
      </button>
      {menu && (
        <div className="absolute right-2 top-full z-20 mt-1 w-36 rounded-md border border-border bg-popover shadow-lg overflow-hidden">
          <button
            onClick={() => { setMenu(false); setEditing(true); }}
            className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/[0.05] inline-flex items-center gap-2"
          >
            <Pencil className="h-3 w-3" /> Rename
          </button>
          <button
            onClick={() => { setMenu(false); onDelete(); }}
            className="w-full px-3 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10 inline-flex items-center gap-2"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function PickerPopover({
  label, icon, items, onPick,
}: {
  label: string;
  icon: React.ReactNode;
  items: { id: string; name: string; color?: LabelColor }[];
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2.5 py-1.5 hover:bg-card"
      >
        {icon} {label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-border bg-popover shadow-lg p-1 max-h-64 overflow-y-auto">
            {items.length === 0 && (
              <div className="px-2 py-3 text-[11px] text-muted-foreground text-center">Nothing to pick</div>
            )}
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => { onPick(it.id); setOpen(false); }}
                className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/[0.05] inline-flex items-center gap-2"
              >
                {it.color ? (
                  <span className={`h-2 w-2 rounded-full ${labelColorDot[it.color]}`} />
                ) : (
                  <span className="h-2 w-2 rounded-sm bg-primary/70" />
                )}
                {it.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LabelManager({
  labels, onCreate, onUpdate, onDelete, trigger,
}: {
  labels: ContactLabel[];
  onCreate: (name: string, color: LabelColor) => string;
  onUpdate: (id: string, patch: Partial<ContactLabel>) => void;
  onDelete: (id: string) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<LabelColor>("indigo");
  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-[420px] rounded-xl border border-border bg-popover shadow-xl glass" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Manage labels</div>
                <div className="text-[11px] text-muted-foreground">Create, edit, or remove labels.</div>
              </div>
              <button onClick={() => setOpen(false)} className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
              {labels.map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <ColorSwatch
                    color={l.color}
                    onChange={(c) => onUpdate(l.id, { color: c })}
                  />
                  <input
                    defaultValue={l.name}
                    onBlur={(e) => onUpdate(l.id, { name: e.target.value.trim() || l.name })}
                    className="h-8 flex-1 rounded-md border border-border bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <button
                    onClick={() => onDelete(l.id)}
                    className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-border space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">New label</div>
              <div className="flex items-center gap-2">
                <ColorSwatch color={newColor} onChange={setNewColor} />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Label name"
                  className="h-8 flex-1 rounded-md border border-border bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                <button
                  onClick={() => { if (newName.trim()) { onCreate(newName.trim(), newColor); setNewName(""); } }}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ColorSwatch({ color, onChange }: { color: LabelColor; onChange: (c: LabelColor) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`h-7 w-7 rounded-md border ${labelColorClass[color]} grid place-items-center`}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${labelColorDot[color]}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 flex gap-1 p-1.5 rounded-md border border-border bg-popover shadow-lg">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); }}
                className={`h-5 w-5 rounded-md border ${labelColorClass[c]} grid place-items-center`}
              >
                {c === color && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ContactDrawer({
  contact, labels, lists, onClose, onToggleLabel, onToggleList, onCreateLabel, onDeleteLabel,
}: {
  contact: Contact;
  labels: ContactLabel[];
  lists: ContactList[];
  onClose: () => void;
  onToggleLabel: (id: string) => void;
  onToggleList: (id: string) => void;
  onCreateLabel: (name: string, color: LabelColor) => void;
  onDeleteLabel: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-[420px] bg-sidebar border-l border-border h-full overflow-y-auto glass">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-medium">Contact details</div>
          <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 text-center border-b border-border">
          <div className="relative mx-auto h-16 w-16">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/40 to-card border border-border grid place-items-center text-base font-medium">{contact.avatar}</div>
            <ChannelIcon
              channel={contact.channel}
              className="absolute -bottom-0.5 -right-0.5 h-[22px] w-[22px] ring-2 ring-background shadow-sm"
            />
          </div>
          <div className="mt-3 text-sm font-medium">{contact.name}</div>
          <div className="text-[11px] text-muted-foreground">{contact.phone}{contact.instagram ? ` · ${contact.instagram}` : ""}</div>
        </div>

        <DrawerSection title="Labels">
          <div className="flex flex-wrap gap-1 mb-2">
            {contact.labelIds.length === 0 && <span className="text-[11px] text-muted-foreground">No labels yet</span>}
            {contact.labelIds.map((id) => {
              const l = labels.find((x) => x.id === id);
              return l ? <LabelChip key={id} label={l} onRemove={() => onToggleLabel(id)} /> : null;
            })}
          </div>
          <LabelPicker
            labels={labels}
            selectedIds={contact.labelIds}
            onToggle={onToggleLabel}
            onCreate={onCreateLabel}
            onDelete={onDeleteLabel}
          />
        </DrawerSection>

        <DrawerSection title="Lists">
          <div className="flex flex-wrap gap-1 mb-2">
            {contact.listIds.length === 0 && <span className="text-[11px] text-muted-foreground">Not in any list</span>}
            {contact.listIds.map((id) => {
              const l = lists.find((x) => x.id === id);
              return l ? <ListChip key={id} name={l.name} onRemove={() => onToggleList(id)} /> : null;
            })}
          </div>
          <Dropdown
            placeholder="Add to list…"
            icon={<ListPlus className="h-3 w-3" />}
            items={lists.map((l) => ({ id: l.id, name: l.name, selected: contact.listIds.includes(l.id) }))}
            onPick={onToggleList}
          />
        </DrawerSection>

        <DrawerSection title="Details">
          <DrawerRow label="Channel"><ChannelDot channel={contact.channel} /></DrawerRow>
          <DrawerRow label="Status">{contact.status}</DrawerRow>
          <DrawerRow label="Last interaction">{contact.lastInteraction}</DrawerRow>
        </DrawerSection>
      </aside>
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 border-b border-border">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}
function DrawerRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function Dropdown({
  placeholder, icon, items, onPick,
}: {
  placeholder: string;
  icon: React.ReactNode;
  items: { id: string; name: string; color?: LabelColor; selected?: boolean }[];
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full inline-flex items-center gap-2 rounded-md border border-dashed border-border bg-card/40 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-card"
      >
        {icon} {placeholder}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border border-border bg-popover shadow-lg p-1 max-h-56 overflow-y-auto">
            {items.length === 0 && (
              <div className="px-2 py-3 text-[11px] text-muted-foreground text-center">Nothing available</div>
            )}
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => onPick(it.id)}
                className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/[0.05] inline-flex items-center gap-2"
              >
                {it.color ? (
                  <span className={`h-2 w-2 rounded-full ${labelColorDot[it.color]}`} />
                ) : (
                  <span className="h-2 w-2 rounded-sm bg-primary/70" />
                )}
                <span className="flex-1">{it.name}</span>
                {it.selected && <Check className="h-3 w-3 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LabelPicker({
  labels, selectedIds, onToggle, onCreate, onDelete,
}: {
  labels: ContactLabel[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: (name: string, color: LabelColor) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = labels.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));
  const exactMatch = labels.some((l) => l.name.toLowerCase() === search.trim().toLowerCase());
  const canCreate = search.trim().length > 0 && !exactMatch;

  const handleCreate = () => {
    const name = search.trim();
    if (!name) return;
    const color = COLORS[(labels.length) % COLORS.length];
    onCreate(name, color);
    setSearch("");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full inline-flex items-center gap-2 rounded-md border border-dashed border-border bg-card/40 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-card"
      >
        <TagIcon className="h-3 w-3" /> Add label…
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setSearch(""); }} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border border-border bg-popover shadow-lg overflow-hidden">
            <div className="p-1.5 border-b border-border">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && canCreate) handleCreate(); }}
                placeholder="Search or create label…"
                className="h-7 w-full rounded border border-border bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="max-h-56 overflow-y-auto p-1">
              {filtered.map((l) => {
                const selected = selectedIds.includes(l.id);
                return (
                  <div key={l.id} className="group/row flex items-center gap-1">
                    <button
                      onClick={() => onToggle(l.id)}
                      className="flex-1 text-left px-2 py-1.5 text-xs rounded hover:bg-white/[0.05] inline-flex items-center gap-2"
                    >
                      <span className={`h-2 w-2 rounded-full ${labelColorDot[l.color]}`} />
                      <span className="flex-1">{l.name}</span>
                      {selected && <Check className="h-3 w-3 text-primary" />}
                    </button>
                    <button
                      onClick={() => onDelete(l.id)}
                      title="Delete label"
                      className="opacity-0 group-hover/row:opacity-100 h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 mr-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
              {filtered.length === 0 && !canCreate && (
                <div className="px-2 py-3 text-[11px] text-muted-foreground text-center">No labels</div>
              )}
              {canCreate && (
                <button
                  onClick={handleCreate}
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-white/[0.05] inline-flex items-center gap-2 border-t border-border mt-1 pt-2"
                >
                  <Plus className="h-3 w-3 text-primary" />
                  Create <span className="font-medium text-foreground">“{search.trim()}”</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TablePagination({
  total, page, perPage, totalPages, onPageChange, onPerPageChange,
}: {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPerPageChange: (n: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  const pages: (number | "…")[] = [];
  const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) add(i);
  } else {
    add(1);
    if (page > 4) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) add(i);
    if (page < totalPages - 3) pages.push("…");
    add(totalPages);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>Rows per page</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="h-7 rounded-md border border-border bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
        >
          {[10, 20, 30, 40, 50].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="ml-2">{start}–{end} of {total}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-border bg-card/60 hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-3 w-3" /> Prev
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="px-1.5 text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`h-7 min-w-7 px-2 rounded-md border text-xs ${
                p === page
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-card/60 hover:bg-card text-foreground"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-border bg-card/60 hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function formatInStage(iso?: string): string {
  if (!iso) return "Just now";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "Just now";
  const days = Math.floor(ms / 86400000);
  if (days < 1) return "Today";
  if (days < 7) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `${w} week${w === 1 ? "" : "s"}`;
  }
  if (days < 365) {
    const m = Math.floor(days / 30);
    return `${m} month${m === 1 ? "" : "s"}`;
  }
  const y = Math.floor(days / 365);
  return `${y} year${y === 1 ? "" : "s"}`;
}

function KanbanBoard({
  contacts,
  onMove,
  onOpen,
}: {
  contacts: Contact[];
  onMove: (id: string, stage: LifecycleStage) => void;
  onOpen: (id: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<LifecycleStage | null>(null);

  const byStage = useMemo(() => {
    const map = new Map<LifecycleStage, Contact[]>();
    LIFECYCLE_STAGES.forEach((s) => map.set(s, []));
    for (const c of contacts) {
      // Kanban only includes contacts with an assigned lifecycle stage.
      if (!c.lifecycleStage) continue;
      map.get(c.lifecycleStage as LifecycleStage)?.push(c);
    }
    return map;
  }, [contacts]);

  return (
    <div className="h-full overflow-auto [overscroll-behavior:contain] scl-scroll">
      <div className="flex gap-4 min-w-max min-h-full items-stretch pb-2">
        {LIFECYCLE_STAGES.map((stage) => {
          const items = byStage.get(stage) ?? [];
          const isOver = overStage === stage;
          const c = STAGE_COLORS[stage as LifecycleStage];
          return (
            <div
              key={stage}
              onDragOver={(e) => { e.preventDefault(); if (overStage !== stage) setOverStage(stage); }}
              onDragLeave={() => { if (overStage === stage) setOverStage(null); }}
              onDrop={() => {
                if (dragId) onMove(dragId, stage);
                setDragId(null);
                setOverStage(null);
              }}
              className={`flex flex-col w-72 shrink-0 rounded-lg border bg-card/40 transition self-stretch ${
                isOver
                  ? "border-primary/70 bg-primary/10 ring-1 ring-primary/40"
                  : "border-border"
              }`}
            >
              <div className="sticky top-0 z-10">
                <div className={`h-1 w-full ${c.bar}`} />
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-card/80 backdrop-blur">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                    <div className="text-xs font-medium truncate">{stage}</div>
                  </div>
                  <span className={`text-[10px] rounded px-1.5 py-0.5 border ${c.badge}`}>
                    {items.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 p-2 space-y-2">
                {items.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => { setDragId(c.id); e.dataTransfer.effectAllowed = "move"; }}
                    onDragEnd={() => { setDragId(null); setOverStage(null); }}
                    onClick={() => onOpen(c.id)}
                    className={`group relative rounded-md border border-border bg-card/80 hover:bg-card hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 cursor-grab active:cursor-grabbing px-3 py-2.5 pr-8 transition ${
                      dragId === c.id ? "opacity-60 shadow-xl ring-1 ring-primary/40 rotate-[0.5deg]" : ""
                    }`}
                  >
                    <span
                      aria-hidden
                      className="absolute top-1.5 right-1.5 grid place-items-center h-5 w-5 rounded text-muted-foreground/60 group-hover:text-muted-foreground cursor-grab active:cursor-grabbing"
                      title="Drag to move"
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </span>
                    <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      In stage: {formatInStage(c.stageEnteredAt)}
                    </div>
                  </div>
                ))}
                <div
                  className={`text-[11px] text-muted-foreground text-center rounded-md border border-dashed transition ${
                    isOver
                      ? "border-primary/60 bg-primary/5 text-foreground py-8"
                      : "border-border/50 py-6"
                  } ${items.length === 0 ? "" : "opacity-0 group-[]:opacity-100"}`}
                  style={items.length === 0 ? undefined : { display: isOver ? "block" : "none" }}
                >
                  Drop here
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
