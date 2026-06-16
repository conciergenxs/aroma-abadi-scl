import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard, ChannelDot, LabelChip, ListChip, labelColorClass, labelColorDot } from "@/components/scl/app-shell";
import {
  contacts as seedContacts,
  initialLabels,
  initialLists,
  type Contact,
  type ContactLabel,
  type ContactList,
  type LabelColor,
} from "@/components/scl/mock-data";
import {
  Search, Filter, Plus, Download, MoreHorizontal, ArrowUpDown,
  Users, Inbox as InboxIcon, ChevronRight, Pencil, Trash2, X,
  Tag as TagIcon, ListPlus, Check,
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Contacts — SCL" }] }),
  component: ContactsPage,
});

const COLORS: LabelColor[] = ["indigo", "pink", "emerald", "amber", "sky", "violet", "slate"];

function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(seedContacts);
  const [labels, setLabels] = useState<ContactLabel[]>(initialLabels);
  const [lists, setLists] = useState<ContactList[]>(initialLists);
  const [activeListId, setActiveListId] = useState<string | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [openContactId, setOpenContactId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");

  const visibleContacts = useMemo(() => {
    const base = activeListId === "all" ? contacts : contacts.filter((c) => c.listIds.includes(activeListId));
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.instagram ?? "").toLowerCase().includes(q),
    );
  }, [contacts, activeListId, query]);

  const allSelected = selected.length > 0 && selected.length === visibleContacts.length;
  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const selectedContacts = contacts.filter((c) => selected.includes(c.id));
  const selectedHaveAnyList = selectedContacts.some((c) => c.listIds.length > 0);

  const labelById = (id: string) => labels.find((l) => l.id === id);
  const listById = (id: string) => lists.find((l) => l.id === id);
  const activeList = activeListId === "all" ? null : listById(activeListId) ?? null;

  const updateContact = (id: string, patch: Partial<Contact>) =>
    setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const bulkAddLabel = (lid: string) =>
    setContacts((cs) => cs.map((c) => (selected.includes(c.id) && !c.labelIds.includes(lid) ? { ...c, labelIds: [...c.labelIds, lid] } : c)));
  const bulkRemoveLabel = (lid: string) =>
    setContacts((cs) => cs.map((c) => (selected.includes(c.id) ? { ...c, labelIds: c.labelIds.filter((x) => x !== lid) } : c)));
  const bulkAddList = (lsId: string) =>
    setContacts((cs) => cs.map((c) => (selected.includes(c.id) && !c.listIds.includes(lsId) ? { ...c, listIds: [...c.listIds, lsId] } : c)));
  const bulkRemoveList = (lsId: string) =>
    setContacts((cs) => cs.map((c) => (selected.includes(c.id) ? { ...c, listIds: c.listIds.filter((x) => x !== lsId) } : c)));
  const bulkDelete = () => {
    setContacts((cs) => cs.filter((c) => !selected.includes(c.id)));
    setSelected([]);
  };

  const createList = () => {
    const name = newListName.trim();
    if (!name) return;
    const id = `ls-${Date.now()}`;
    setLists((l) => [...l, { id, name }]);
    setNewListName("");
    setShowNewList(false);
  };

  const renameList = (id: string, name: string) =>
    setLists((l) => l.map((x) => (x.id === id ? { ...x, name } : x)));

  const deleteList = (id: string) => {
    setLists((l) => l.filter((x) => x.id !== id));
    setContacts((cs) => cs.map((c) => ({ ...c, listIds: c.listIds.filter((x) => x !== id) })));
    if (activeListId === id) setActiveListId("all");
  };

  const createLabel = (name: string, color: LabelColor) => {
    const id = `lb-${Date.now()}`;
    setLabels((l) => [...l, { id, name, color }]);
    return id;
  };
  const updateLabel = (id: string, patch: Partial<ContactLabel>) =>
    setLabels((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const deleteLabel = (id: string) => {
    setLabels((l) => l.filter((x) => x.id !== id));
    setContacts((cs) => cs.map((c) => ({ ...c, labelIds: c.labelIds.filter((x) => x !== id) })));
  };

  const openContact = contacts.find((c) => c.id === openContactId) ?? null;

  return (
    <AppShell
      title={activeList ? activeList.name : "Contacts"}
      subtitle={
        activeList
          ? `${visibleContacts.length} contacts in this list`
          : `${contacts.length} contacts · ${lists.length} lists · ${labels.length} labels`
      }
      noPadding
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" /> New contact
        </button>
      }
    >
      <div className="grid grid-cols-[240px_1fr] h-[calc(100vh-64px)] min-h-0">
        {/* Left sidebar: All Contacts + Lists */}
        <aside className="border-r border-border bg-sidebar/40 overflow-y-auto">
          <div className="p-3 space-y-1">
            <button
              onClick={() => { setActiveListId("all"); setSelected([]); }}
              className={`w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs transition ${
                activeListId === "all" ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> All contacts
              </span>
              <span className="text-[10px] text-muted-foreground">{contacts.length}</span>
            </button>
          </div>

          <div className="px-3 pt-2 pb-1 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Lists</div>
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
              const active = activeListId === ls.id;
              return (
                <ListSidebarRow
                  key={ls.id}
                  list={ls}
                  count={count}
                  active={active}
                  onSelect={() => { setActiveListId(ls.id); setSelected([]); }}
                  onRename={(name) => renameList(ls.id, name)}
                  onDelete={() => deleteList(ls.id)}
                />
              );
            })}
            {lists.length === 0 && (
              <div className="px-2 py-4 text-[11px] text-muted-foreground">No lists yet. Create one to group contacts for broadcasts.</div>
            )}
          </div>

          <div className="px-3 pt-2 pb-3 border-t border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
              <span>Labels</span>
              <LabelManager
                labels={labels}
                onCreate={createLabel}
                onUpdate={updateLabel}
                onDelete={deleteLabel}
                trigger={
                  <span className="inline-flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3 w-3" /> Manage
                  </span>
                }
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {labels.map((l) => <LabelChip key={l.id} label={l} />)}
            </div>
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
                placeholder="Search name, phone, IG handle…"
                className="h-9 w-80 rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            {["All channels", "All labels", "All statuses"].map((f) => (
              <button key={f} className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-3 py-2 text-xs hover:bg-card">
                {f}
                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
            <button className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-3 py-2 text-xs hover:bg-card">
              <Filter className="h-3 w-3" /> Filters
            </button>
            <div className="ml-auto">
              <button className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-3 py-2 text-xs hover:bg-card">
                <Download className="h-3 w-3" /> Export
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
                onClick={bulkDelete}
                className="inline-flex items-center gap-1 rounded-md border border-destructive/40 text-destructive px-2.5 py-1.5 hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
              <button onClick={() => setSelected([])} className="ml-auto text-muted-foreground hover:text-foreground">Clear selection</button>
            </div>
          )}

          <div className="flex-1 overflow-auto p-5">
            <SectionCard>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-white/[0.02]">
                    <tr>
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          className="accent-[oklch(0.62_0.17_40)]"
                          checked={allSelected}
                          onChange={() => setSelected(allSelected ? [] : visibleContacts.map((c) => c.id))}
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Phone number</th>
                      <th className="px-4 py-3 text-left font-medium">Channel</th>
                      <th className="px-4 py-3 text-left font-medium">Labels</th>
                      <th className="px-4 py-3 text-left font-medium">Lists</th>
                      <th className="px-4 py-3 text-left font-medium">Last interaction</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="w-10 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibleContacts.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => setOpenContactId(c.id)}>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="accent-[oklch(0.62_0.17_40)]"
                            checked={selected.includes(c.id)}
                            onChange={() => toggle(c.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-[11px] font-medium">
                              {c.avatar}
                            </div>
                            <div className="leading-tight">
                              <div className="text-sm font-medium">{c.name}</div>
                              <div className="text-[11px] text-muted-foreground">{c.instagram ?? "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{c.phone}</td>
                        <td className="px-4 py-3"><ChannelDot channel={c.channel} /></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {c.labelIds.map((id) => {
                              const l = labelById(id);
                              return l ? <LabelChip key={id} label={l} /> : null;
                            })}
                            {c.labelIds.length === 0 && <span className="text-[11px] text-muted-foreground">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {c.listIds.map((id) => {
                              const l = listById(id);
                              return l ? <ListChip key={id} name={l.name} /> : null;
                            })}
                            {c.listIds.length === 0 && <span className="text-[11px] text-muted-foreground">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{c.lastInteraction}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs ${
                            c.status === "Active" ? "text-emerald-300" : c.status === "Inactive" ? "text-muted-foreground" : "text-rose-300"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              c.status === "Active" ? "bg-emerald-400" : c.status === "Inactive" ? "bg-muted-foreground" : "bg-rose-400"
                            }`} />
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {visibleContacts.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-16 text-center text-xs text-muted-foreground">
                          <InboxIcon className="h-5 w-5 mx-auto mb-2 opacity-50" />
                          No contacts match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {openContact && (
        <ContactDrawer
          contact={openContact}
          labels={labels}
          lists={lists}
          onClose={() => setOpenContactId(null)}
          onToggleLabel={(lid) => {
            const has = openContact.labelIds.includes(lid);
            updateContact(openContact.id, { labelIds: has ? openContact.labelIds.filter((x) => x !== lid) : [...openContact.labelIds, lid] });
          }}
          onToggleList={(lsId) => {
            const has = openContact.listIds.includes(lsId);
            updateContact(openContact.id, { listIds: has ? openContact.listIds.filter((x) => x !== lsId) : [...openContact.listIds, lsId] });
          }}
        />
      )}
    </AppShell>
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
  contact, labels, lists, onClose, onToggleLabel, onToggleList,
}: {
  contact: Contact;
  labels: ContactLabel[];
  lists: ContactList[];
  onClose: () => void;
  onToggleLabel: (id: string) => void;
  onToggleList: (id: string) => void;
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
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-primary/40 to-card border border-border grid place-items-center text-base font-medium">{contact.avatar}</div>
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
          <Dropdown
            placeholder="Add label…"
            icon={<TagIcon className="h-3 w-3" />}
            items={labels.map((l) => ({ id: l.id, name: l.name, color: l.color, selected: contact.labelIds.includes(l.id) }))}
            onPick={onToggleLabel}
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
          <DrawerRow label="Subscription">{contact.subscription}</DrawerRow>
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