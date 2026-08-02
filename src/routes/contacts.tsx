import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { fmtDateEN, fmtNum } from "@/lib/fmt";
import { AppShell, SectionCard, ChannelDot, LabelChip, ListChip, labelColorClass, labelColorDot } from "@/components/scl/app-shell";
import { ChannelIcon } from "@/components/scl/channel-badge";
import {
  type Contact,
  type Channel,
  type ContactLabel,
  type ContactList,
  type LabelColor,
  type LifecycleStage,
} from "@/components/scl/mock-data";
import {
  contactsStore,
  useContactsStore,
  PROPERTY_TYPE_LABELS,
  type ContactProperty,
  type LifecycleStageDef,
  LIFECYCLE_COLORS,
  getStageStyle,
} from "@/components/scl/contacts-store";
import { useBaStore } from "@/components/scl/ba-store";
import { useSkuStore } from "@/components/scl/sku-store";
import { useTransactionsStore } from "@/components/scl/transactions-store";
import { toast } from "sonner";
import {
  Search, Plus, MoreHorizontal,
  Users, UserCircle2, Inbox as InboxIcon, ChevronLeft, ChevronRight, Pencil, Trash2, X,
  Tag as TagIcon, ListPlus, Check, Settings2, GripVertical, LayoutGrid, Rows3, Info,
  Phone, Mail, Hash,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/scl/confirm-dialog";
import { PropertyFormModal } from "@/components/scl/property-form-modal";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Contacts — SCL" }] }),
  validateSearch: (search: Record<string, unknown>): { audience?: string } =>
    typeof search.audience === "string" ? { audience: search.audience } : {},
  component: ContactsPage,
});

const COLORS: LabelColor[] = ["indigo", "pink", "emerald", "amber", "sky", "violet", "slate"];

function ContactsPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChildRoute = pathname !== "/contacts";

  const { contacts, labels, lists, properties } = useContactsStore();
  const lifecycleStages = useContactsStore().lifecycleStages;
  const { brands } = useSkuStore();
  const { transactions } = useTransactionsStore();
  const setContacts = contactsStore.setContacts;
  const setLabels = contactsStore.setLabels;
  const setLists = contactsStore.setLists;
  const setProperties = contactsStore.setProperties;
  const navigate = useNavigate();
  const [showManageProps, setShowManageProps] = useState(false);
  const [audienceModalId, setAudienceModalId] = useState<string | null>(null);
  const [audienceSearch, setAudienceSearch] = useState("");
  const [infoContact, setInfoContact] = useState<Contact | null>(null);
  const { audience: audienceParam } = Route.useSearch();
  const [activeView, setActiveView] = useState<string>(() => audienceParam ?? "all"); // "all" | "mine" | listId | brand:id
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  if (isChildRoute) return <Outlet />;

  const visibleContacts = useMemo(() => {
    let base: Contact[];
    const live = contacts.filter((c) => !c.deleted);
    if (activeView === "all") base = live;
    else if (activeView === "mine") base = live.filter((c) => !c.labelIds.includes("lb-ba"));
    else if (activeView === "ba") base = live.filter((c) => c.labelIds.includes("lb-ba"));
    else if (activeView.startsWith("brand:")) {
      // brand view: show all contacts (BA + customer) with this brand
      const brandId = activeView.slice(6);
      base = live.filter((c) => (c.brandIds ?? []).includes(brandId));
    }
    else base = live.filter((c) => c.listIds.includes(activeView));
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.instagram ?? "").toLowerCase().includes(q),
    );
  }, [contacts, activeView, query]);

  const totalPages = Math.max(1, Math.ceil(visibleContacts.length / perPage));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);
  useEffect(() => { setPage(1); }, [activeView, query, perPage]);
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
  const liveContacts = contacts.filter((c) => !c.deleted);
  const myCount = liveContacts.filter((c) => !c.labelIds.includes("lb-ba")).length;
  const baCount = liveContacts.filter((c) => c.labelIds.includes("lb-ba")).length;

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
  const addAllVisibleToList = (lsId: string) => {
    const ids = visibleContacts.map((c) => c.id);
    setContacts((cs) => cs.map((c) => (ids.includes(c.id) && !c.listIds.includes(lsId) ? { ...c, listIds: [...c.listIds, lsId] } : c)));
    const aud = lists.find((l) => l.id === lsId);
    toast.success(`Added ${ids.length} contact${ids.length === 1 ? "" : "s"} to ${aud?.name ?? "audience"}`);
  };
  const bulkRemoveList = (lsId: string) =>
    setContacts((cs) => cs.map((c) => (selected.includes(c.id) ? { ...c, listIds: c.listIds.filter((x) => x !== lsId) } : c)));
  const bulkDelete = () => {
    const count = selected.length;
    contactsStore.softDeleteContacts(selected);
    setSelected([]);
    toast.success(
      `Moved ${count} contact${count === 1 ? "" : "s"} to Recently Deleted`,
    );
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
      title={activeView === "mine" ? "Customer Contacts" : activeView === "ba" ? "BA Contacts" : activeList ? activeList.name : "All Contacts"}
      subtitle={
        activeList
          ? `${visibleContacts.length} contacts in this audience`
          : activeView === "mine"
            ? `${visibleContacts.length} contacts assigned to you`
            : `${liveContacts.length} contacts · ${lists.length} audiences`
      }
      noPadding
    >
      <div className="grid grid-cols-[240px_1fr] h-[calc(100vh-64px)] min-h-0">
        {/* Left sidebar: All Contacts + Lists */}
        <aside className="border-r border-border bg-background scl-grid-bg overflow-y-auto">
          <div className="p-3 space-y-1">
            <button
              onClick={() => { setActiveView("all"); setSelected([]); }}
              className={`w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs transition ${
                activeView === "all" ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> All Contacts
              </span>
              <span className="text-[10px] text-muted-foreground">{liveContacts.length}</span>
            </button>
            <button
              onClick={() => { setActiveView("mine"); setSelected([]); }}
              className={`w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs transition ${
                activeView === "mine" ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <UserCircle2 className="h-3.5 w-3.5" /> Customer Contacts
              </span>
              <span className="text-[10px] text-muted-foreground">{myCount}</span>
            </button>
            <button
              onClick={() => { setActiveView("ba"); setSelected([]); }}
              className={`w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs transition ${
                activeView === "ba" ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <UserCircle2 className="h-3.5 w-3.5" /> BA Contacts
              </span>
              <span className="text-[10px] text-muted-foreground">{baCount}</span>
            </button>
          </div>

          <BrandsNav activeView={activeView} setActiveView={setActiveView} setSelected={setSelected} />

          {/* Audience section */}
          <div className="pt-3 border-t border-border mt-3 px-0">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Audience</span>
              <button
                onClick={() => navigate({ to: "/contacts/audience/new" })}
                className="h-5 w-5 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            {lists.map((l) => (
              <button
                key={l.id}
                onClick={() => { setActiveView(l.id); setSelected([]); }}
                onDoubleClick={() => setAudienceModalId(l.id)}
                className={`w-full text-left px-3 py-1.5 text-[12px] rounded hover:bg-gray-50 flex items-center gap-2 transition-colors ${activeView === l.id ? "text-foreground bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Users className="h-3 w-3 shrink-0" />
                <span className="truncate flex-1">{l.name}</span>
                <span
                  className="text-[10px] text-muted-foreground/60 hover:text-primary cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setAudienceModalId(l.id); setAudienceSearch(""); }}
                  title="Manage contacts"
                >
                  {contacts.filter(c => c.listIds.includes(l.id)).length}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-col min-h-0 overflow-hidden">
          <div className="p-5 pb-3 flex flex-wrap items-center gap-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contacts…"
                className="h-9 w-80 rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setShowManageProps(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 py-2 text-xs hover:bg-card"
              >
                <Settings2 className="h-3.5 w-3.5" /> Manage Properties
                <span className="ml-0.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">{properties.length}</span>
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
                label="Add to audience"
                icon={<ListPlus className="h-3 w-3" />}
                items={lists.map((l) => ({ id: l.id, name: l.name }))}
                onPick={(id) => bulkAddList(id)}
              />
              {selectedHaveAnyList && (
                <PickerPopover
                  label="Remove from audience"
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
                stages={lifecycleStages}
                onMove={moveToStage}
                onOpen={(id) => navigate({ to: "/contacts/$contactId", params: { contactId: id } })}
              />
            ) : (
            <SectionCard className="h-full flex flex-col">
              <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto [overscroll-behavior-x:contain] [overscroll-behavior-y:contain] scroll-smooth scl-scroll">
                <ContactsTable
                  contacts={pageContacts}
                  view={activeView}
                  selected={selected}
                  allSelected={allSelected}
                  onSelectAll={() => setSelected(allSelected ? [] : pageContacts.map((c) => c.id))}
                  onToggle={toggle}
                  onOpen={(id) => navigate({ to: "/contacts/$contactId", params: { contactId: id } })}
                />
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
      {audienceModalId && (() => {
        const aud = lists.find(l => l.id === audienceModalId);
        if (!aud) return null;
        const q = audienceSearch.toLowerCase();
        const nonBA = contacts.filter(c => !c.labelIds.includes("lb-ba") && (
          !q || c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
        ));
        const inAudCount = contacts.filter(c => c.listIds.includes(audienceModalId)).length;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => { setAudienceModalId(null); setInfoContact(null); }} />
            <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">{aud.name}</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Select contacts to include in this audience</p>
                </div>
                <button onClick={() => { setAudienceModalId(null); setInfoContact(null); }} className="h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Search */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    value={audienceSearch}
                    onChange={e => setAudienceSearch(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="w-full h-8 rounded-md border border-border bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
                <div className="w-px h-6 bg-border shrink-0" />
                <button
                  type="button"
                  onClick={() => navigate({ to: "/contacts/audience/add/$audienceId", params: { audienceId: audienceModalId } })}
                  className="shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-md border border-primary/30 bg-primary/10 text-[11px] font-medium text-primary hover:bg-primary/15 transition-colors whitespace-nowrap"
                >
                  <Plus className="h-3 w-3" /> Add More
                </button>
              </div>
              {/* Contact list */}
              <div className="max-h-64 overflow-y-auto space-y-0.5 border border-border rounded-lg bg-background">
                {nonBA.length === 0 && (
                  <div className="px-3 py-6 text-center text-xs text-muted-foreground">No contacts found</div>
                )}
                {nonBA.map(c => {
                  const inList = c.listIds.includes(audienceModalId);
                  return (
                    <div key={c.id} className={`flex items-center gap-2.5 px-2.5 py-2 transition-colors ${inList ? "bg-primary/8" : ""}`}>
                      <button type="button"
                        onClick={() => setContacts(cs => cs.map(x => x.id === c.id
                          ? { ...x, listIds: inList ? x.listIds.filter(id => id !== audienceModalId) : [...x.listIds, audienceModalId!] }
                          : x))}
                        className={`flex items-center gap-2.5 flex-1 min-w-0 text-left text-[12px] ${inList ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <span className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 border ${inList ? "bg-primary/20 border-primary/40 text-primary" : "bg-muted border-border"}`}>{c.avatar}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{c.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{c.phone}</div>
                        </div>
                        {inList && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setInfoContact(infoContact?.id === c.id ? null : c)}
                        className={`h-6 w-6 grid place-items-center rounded shrink-0 transition-colors ${infoContact?.id === c.id ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                        title="Contact info"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* Inline contact info panel */}
              {infoContact && (
                <div className="rounded-lg border border-border bg-background p-3 space-y-2 text-[12px]">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-semibold">{infoContact.avatar}</span>
                    {infoContact.name}
                    {infoContact.lifecycleStage && (
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{infoContact.lifecycleStage}</span>
                    )}
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex items-center gap-2"><Phone className="h-3 w-3 shrink-0" />{infoContact.phone}</div>
                    {infoContact.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3 shrink-0" />{infoContact.email}</div>}
                    {infoContact.labelIds.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {infoContact.labelIds.map(lid => {
                          const lbl = labels.find(l => l.id === lid);
                          return lbl ? <span key={lid} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${labelColorClass[lbl.color]}`}>{lbl.name}</span> : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{inAudCount} contact{inAudCount !== 1 ? "s" : ""} in this audience</span>
                <button onClick={() => { setAudienceModalId(null); setInfoContact(null); }} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 transition-colors">Done</button>
              </div>
            </div>
          </div>
        );
      })()}
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

// ── Brands Nav ────────────────────────────────────────────────────────────
function BrandsNav({ activeView, setActiveView, setSelected }: {
  activeView: string;
  setActiveView: (v: string) => void;
  setSelected: (s: string[]) => void;
}) {
  const { brands } = useSkuStore();
  const { contacts } = useContactsStore();
  const liveContacts = useMemo(() => contacts.filter((c) => !c.deleted), [contacts]);

  const countForBrand = (brandId: string) =>
    liveContacts.filter((c) => (c.brandIds ?? []).includes(brandId)).length;

  return (
    <>
      <div className="px-3 pt-2 pb-1 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Brands</div>
      </div>
      <div className="px-3 pb-3 space-y-0.5">
        {brands.map((brand) => {
          const count = countForBrand(brand.id);
          const active = activeView === `brand:${brand.id}`;
          return (
            <button
              key={brand.id}
              onClick={() => { setActiveView(`brand:${brand.id}`); setSelected([]); }}
              className={`w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs transition ${
                active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-sm bg-primary/70 shrink-0" />
                {brand.name}
              </span>
              <span className="text-[10px] text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Contact Type Chip ──────────────────────────────────────────────────────
function ContactTypeChip({ isBA }: { isBA: boolean }) {
  return isBA ? (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-violet-600 text-white border border-violet-700">
      BA
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-sky-600 text-white border border-sky-700">
      Consumer
    </span>
  );
}

// ── Contacts Table (fixed columns per view) ────────────────────────────────
function ContactsTable({
  contacts,
  view,
  selected,
  allSelected,
  onSelectAll,
  onToggle,
  onOpen,
}: {
  contacts: Contact[];
  view: string;
  selected: string[];
  allSelected: boolean;
  onSelectAll: () => void;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const { bas } = useBaStore();
  const { brands } = useSkuStore();
  const { transactions } = useTransactionsStore();
  const brandName = (id: string) => brands.find((b) => b.id === id)?.name ?? id.replace("brand-", "").replace(/-/g, " ");


  // Last transaction per contact
  const lastTxByContact = useMemo(() => {
    const map = new Map<string, { date: string; invoice: string }>();
    for (const t of transactions) {
      if (!t.customerId) continue;
      const existing = map.get(t.customerId);
      if (!existing || new Date(t.date) > new Date(existing.date)) {
        map.set(t.customerId, { date: t.date, invoice: t.invoice });
      }
    }
    return map;
  }, [transactions]);

  const thCls = "sticky top-0 z-10 px-4 py-3 text-left font-medium whitespace-nowrap bg-card border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground shadow-[0_1px_0_0_oklch(1_0_0_/_6%)]";
  const tdCls = "px-4 py-3 whitespace-nowrap align-middle text-xs";

  const isBA = (c: Contact) => c.labelIds.includes("lb-ba");
  const getBA = (c: Contact) => bas.find((b) => b.waNumber.replace(/\s/g, "") === c.phone.replace(/\s/g, ""));

  // Column layout per view
  const isBaView    = view === "ba";
  const isMineView  = view === "mine";
  const isAllOrBrand = view === "all" || view.startsWith("brand:");

  // colSpan for empty state
  const colSpan = isBaView ? 9 : isMineView ? 7 : 5;

  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr>
          <th className={`${thCls} w-10`}>
            <input type="checkbox" className="accent-[oklch(0.62_0.17_40)]" checked={allSelected} onChange={onSelectAll} />
          </th>
          <th className={thCls}>Name</th>
          {(isAllOrBrand || isMineView) && <th className={thCls}>Gender</th>}
          <th className={thCls}>WA Number</th>
          <th className={thCls}>Contact Type</th>
          {isMineView && <th className={thCls}>Point Balance</th>}
          {isMineView && <th className={thCls}>Last Transaction</th>}
          {isBaView && <>
            <th className={thCls}>Brand</th>
            <th className={thCls}>Gender</th>
            <th className={thCls}>Position</th>
            <th className={thCls}>Store</th>
            <th className={thCls}>City</th>
          </>}
        </tr>
      </thead>
      <tbody className="stagger divide-y divide-border">
        {contacts.map((c) => {
          const ba = getBA(c);
          return (
            <tr key={c.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => onOpen(c.id)}>
              <td className={tdCls} onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" className="accent-[oklch(0.62_0.17_40)]" checked={selected.includes(c.id)} onChange={() => onToggle(c.id)} />
              </td>
              <td className={tdCls}>
                <span className="font-medium text-foreground">{c.name}</span>
              </td>
              {(isAllOrBrand || isMineView) && (
                <td className={tdCls}>{c.gender ?? ba?.gender ?? <span className="text-muted-foreground">—</span>}</td>
              )}
              <td className={`${tdCls} text-muted-foreground tabular-nums`}>{c.phone}</td>
              <td className={tdCls}><ContactTypeChip isBA={isBA(c)} /></td>
              {isMineView && (
                <td className={`${tdCls} tabular-nums`}>
                  {c.pointBalance != null && c.pointBalance > 0
                    ? <span className="text-foreground font-medium">{fmtNum(c.pointBalance)} pts</span>
                    : <span className="text-muted-foreground">—</span>}
                </td>
              )}
              {isMineView && (() => {
                const tx = lastTxByContact.get(c.id);
                return (
                  <td className={`${tdCls} text-[11px]`}>
                    {tx ? (
                      <div>
                        <div className="text-foreground font-medium">{tx.invoice}</div>
                        <div className="text-muted-foreground">{fmtDateEN(tx.date)}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                );
              })()}
              {isBaView && <>
                <td className={tdCls}>{ba?.brandIds?.length ? ba.brandIds.map(brandName).join(", ") : <span className="text-muted-foreground">—</span>}</td>
                <td className={tdCls}>{ba?.gender ?? <span className="text-muted-foreground">—</span>}</td>
                <td className={tdCls}>{ba?.position ?? <span className="text-muted-foreground">—</span>}</td>
                <td className={tdCls}>{ba?.store ?? <span className="text-muted-foreground">—</span>}</td>
                <td className={tdCls}>{ba?.city ?? <span className="text-muted-foreground">—</span>}</td>
              </>}
            </tr>
          );
        })}
        {contacts.length === 0 && (
          <tr>
            <td colSpan={colSpan} className="px-4 py-16 text-center text-xs text-muted-foreground">
              <InboxIcon className="h-5 w-5 mx-auto mb-2 opacity-50" />
              <div className="font-medium text-foreground">No contacts found</div>
              <div className="mt-1">Try selecting another channel or clearing filters.</div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
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
      return <span className="font-sans text-xs font-normal text-foreground">{c.name}</span>;
    case "phone":
      return <span className="font-sans text-xs font-normal text-muted-foreground tabular-nums">{c.phone}</span>;
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
            <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground">
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
                  className={`hover:bg-gray-50 ${dragId === p.id ? "opacity-50" : ""}`}
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
                        className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:bg-gray-50 hover:text-foreground"
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
          active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
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
            className="opacity-0 group-hover:opacity-100 h-5 w-5 grid place-items-center rounded hover:bg-gray-100"
          >
            <MoreHorizontal className="h-3 w-3" />
          </span>
        </span>
      </button>
      {menu && (
        <div className="absolute right-2 top-full z-20 mt-1 w-36 rounded-md border border-border bg-popover shadow-lg overflow-hidden">
          <button
            onClick={() => { setMenu(false); setEditing(true); }}
            className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 inline-flex items-center gap-2"
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
                className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-gray-50 inline-flex items-center gap-2"
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
              <button onClick={() => setOpen(false)} className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground">
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
          <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 text-center border-b border-border">
          <div className="relative mx-auto h-16 w-16">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/40 to-card border border-border grid place-items-center text-[15px] font-medium">{contact.avatar}</div>
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

        <DrawerSection title="Audience">
          <div className="flex flex-wrap gap-1 mb-2">
            {contact.listIds.length === 0 && <span className="text-[11px] text-muted-foreground">Not in any audience</span>}
            {contact.listIds.map((id) => {
              const l = lists.find((x) => x.id === id);
              return l ? <ListChip key={id} name={l.name} onRemove={() => onToggleList(id)} /> : null;
            })}
          </div>
          <Dropdown
            placeholder="Add to audience…"
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
                className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-gray-50 inline-flex items-center gap-2"
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
                      className="flex-1 text-left px-2 py-1.5 text-xs rounded hover:bg-gray-50 inline-flex items-center gap-2"
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
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-50 inline-flex items-center gap-2 border-t border-border mt-1 pt-2"
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
  stages,
  onMove,
  onOpen,
}: {
  contacts: Contact[];
  stages: LifecycleStageDef[];
  onMove: (id: string, stage: LifecycleStage) => void;
  onOpen: (id: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<LifecycleStage | null>(null);

  const byStage = useMemo(() => {
    const map = new Map<LifecycleStage, Contact[]>();
    stages.forEach((s) => map.set(s.name, []));
    for (const c of contacts) {
      // Kanban only includes contacts with an assigned lifecycle stage.
      if (!c.lifecycleStage) continue;
      map.get(c.lifecycleStage as LifecycleStage)?.push(c);
    }
    return map;
  }, [contacts, stages]);

  return (
    <div className="h-full overflow-auto [overscroll-behavior:contain] scl-scroll">
      <div className="flex gap-4 min-w-max min-h-full items-stretch pb-2">
        {stages.map((stageDef) => {
          const stage = stageDef.name;
          const items = byStage.get(stage) ?? [];
          const isOver = overStage === stage;
          const c = LIFECYCLE_COLORS[stageDef.color];
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
