import { useMemo, useState, useEffect, useRef, type ReactNode } from "react";
import {
  Search, Plus, Trash2, Pencil, X, Check, ChevronDown, Filter, Lock,
  GripVertical, RotateCcw, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "./app-shell";
import { ConfirmDialog } from "./confirm-dialog";
import { SclSelect } from "./scl-select";
import {
  contactsStore,
  useContactsStore,
  PROPERTY_TYPE_LABELS,
  type ContactProperty,
  type PropertyType,
  type LifecycleStageDef,
  type LifecycleColorKey,
  type LifecycleGroup,
  LIFECYCLE_COLORS,
} from "./contacts-store";
import { ChannelDot, LabelChip, ListChip } from "./app-shell";
import type { Contact, ContactLabel, ContactList } from "./mock-data";
import { PropertyFormModal } from "./property-form-modal";

// =========================================================
// Shared types & palette
// =========================================================

export type DMSection =
  | "labels"
  | "contact-properties"
  | "customer-lifecycle"
  | "recently-deleted";

type LabelColorKey =
  | "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink" | "gray";

const LABEL_COLORS: { key: LabelColorKey; name: string; badge: string; dot: string }[] = [
  { key: "red",    name: "Red",    badge: "border-red-500/30 bg-red-500/10 text-red-300",          dot: "bg-red-500" },
  { key: "orange", name: "Orange", badge: "border-orange-500/30 bg-orange-500/10 text-orange-300", dot: "bg-orange-500" },
  { key: "yellow", name: "Yellow", badge: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300", dot: "bg-yellow-500" },
  { key: "green",  name: "Green",  badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-500" },
  { key: "blue",   name: "Blue",   badge: "border-blue-500/30 bg-blue-500/10 text-blue-300",       dot: "bg-blue-500" },
  { key: "purple", name: "Purple", badge: "border-violet-500/30 bg-violet-500/10 text-violet-300", dot: "bg-violet-500" },
  { key: "pink",   name: "Pink",   badge: "border-pink-500/30 bg-pink-500/10 text-pink-300",       dot: "bg-pink-500" },
  { key: "gray",   name: "Gray",   badge: "border-slate-500/30 bg-slate-500/10 text-slate-300",    dot: "bg-slate-400" },
];

const colorMeta = (k: LabelColorKey) => LABEL_COLORS.find((c) => c.key === k)!;

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// =========================================================
// Module entry
// =========================================================

type Props = {
  section: DMSection;
  onNavigate?: (s: DMSection) => void;
};

export function DataManagementModule({ section }: Props) {
  if (section === "labels") return <LabelsPage />;
  if (section === "contact-properties") return <ContactPropertiesRouter />;
  if (section === "customer-lifecycle") return <CustomerLifecyclePage />;
  return <RecentlyDeletedContactsPage />;
}

// =========================================================
// Page header
// =========================================================

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-1 pt-0.5">
      <div>
        <h2 className="text-xl font-semibold leading-tight m-0">{title}</h2>
        <p className="text-xs text-muted-foreground mt-1 m-0">{description}</p>
      </div>
      {action}
    </div>
  );
}

// =========================================================
// Primitive UI helpers (reused across both pages)
// =========================================================

function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 h-9 text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors duration-150"
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 hover:bg-card px-3 h-9 text-xs font-medium transition-colors duration-150"
    >
      {children}
    </button>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-64 rounded-md border border-border bg-background/60 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
      />
    </div>
  );
}

// =========================================================
// CUSTOMER LIFECYCLE PAGE
//
// Reads & writes the SAME `state.lifecycleStages` list used by
// Contacts Kanban, Inbox lifecycle filters, and Contact Detail.
// There is only one lifecycle configuration in the application.
// =========================================================

const LIFECYCLE_COLOR_KEYS = Object.keys(LIFECYCLE_COLORS) as LifecycleColorKey[];

function CustomerLifecyclePage() {
  const { lifecycleStages } = useContactsStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createGroup, setCreateGroup] = useState<LifecycleGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LifecycleStageDef | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const active = lifecycleStages.filter((s) => s.group === "active");
  const lost = lifecycleStages.filter((s) => s.group === "lost");

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return setDragId(null);
    const ids = lifecycleStages.map((s) => s.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return setDragId(null);
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    contactsStore.reorderLifecycleStages(next);
    setDragId(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customer Lifecycle"
        description="Manage the lifecycle stages used across Contacts Kanban, Inbox, and Contact records."
      />

      <SectionCard>
        <LifecycleGroupSection
          title="Active Stages"
          stages={active}
          editingId={editingId}
          dragId={dragId}
          setDragId={setDragId}
          onDropTarget={handleDrop}
          onEdit={(id) => setEditingId(id)}
          onCancelEdit={() => setEditingId(null)}
          onDelete={(s) => setDeleteTarget(s)}
          onCreate={() => setCreateGroup("active")}
        />
        <div className="h-px bg-border" />
        <LifecycleGroupSection
          title="Lost Stages"
          stages={lost}
          editingId={editingId}
          dragId={dragId}
          setDragId={setDragId}
          onDropTarget={handleDrop}
          onEdit={(id) => setEditingId(id)}
          onCancelEdit={() => setEditingId(null)}
          onDelete={(s) => setDeleteTarget(s)}
          onCreate={() => setCreateGroup("lost")}
        />
      </SectionCard>

      <LifecycleStageModal
        open={createGroup !== null}
        mode="create"
        group={createGroup ?? "active"}
        onClose={() => setCreateGroup(null)}
        onSubmit={(name, color) => {
          if (!createGroup) return;
          contactsStore.addLifecycleStage({ name, color, group: createGroup });
          toast.success("Stage created");
          setCreateGroup(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Stage"
        description={
          <>
            Delete stage <span className="font-semibold">{deleteTarget?.name}</span>? Contacts
            currently in this stage will have their lifecycle cleared. This cannot be undone.
          </>
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            contactsStore.deleteLifecycleStage(deleteTarget.id);
            toast.success("Stage deleted");
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function LifecycleGroupSection({
  title, stages, editingId, dragId, setDragId, onDropTarget,
  onEdit, onCancelEdit, onDelete, onCreate,
}: {
  title: string;
  stages: LifecycleStageDef[];
  editingId: string | null;
  dragId: string | null;
  setDragId: (id: string | null) => void;
  onDropTarget: (id: string) => void;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (s: LifecycleStageDef) => void;
  onCreate: () => void;
}) {
  return (
    <div className="px-5 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
        {title}
      </div>
      <div className="space-y-2">
        {stages.map((s) =>
          editingId === s.id ? (
            <LifecycleStageEditor
              key={s.id}
              stage={s}
              onCancel={onCancelEdit}
              onSave={(name, color) => {
                contactsStore.updateLifecycleStage(s.id, { name, color });
                toast.success("Stage updated");
                onCancelEdit();
              }}
            />
          ) : (
            <LifecycleStageRow
              key={s.id}
              stage={s}
              dragging={dragId === s.id}
              onDragStart={() => setDragId(s.id)}
              onDragEnd={() => setDragId(null)}
              onDropTarget={() => onDropTarget(s.id)}
              onEdit={() => onEdit(s.id)}
              onDelete={() => onDelete(s)}
            />
          ),
        )}
        {stages.length === 0 && (
          <div className="text-xs text-muted-foreground border border-dashed border-border rounded-md py-6 text-center">
            No stages yet
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline transition-colors duration-150"
      >
        <Plus className="h-3.5 w-3.5" /> Create
      </button>
    </div>
  );
}

function LifecycleStageRow({
  stage, dragging, onDragStart, onDragEnd, onDropTarget, onEdit, onDelete,
}: {
  stage: LifecycleStageDef;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropTarget: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const c = LIFECYCLE_COLORS[stage.color];
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropTarget();
      }}
      className={`group flex items-center gap-2 rounded-md border border-border bg-card/40 px-2.5 py-2 transition ${
        dragging ? "opacity-50" : "hover:bg-card/70"
      }`}
    >
      <span className="text-muted-foreground/60 cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </span>
      <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
      <span className="text-sm flex-1 truncate">{stage.name}</span>
      {stage.system && (
        <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-white/[0.04] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <Lock className="h-2.5 w-2.5" /> Default
        </span>
      )}
      <button
        type="button"
        onClick={onEdit}
        className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:bg-gray-50 hover:text-foreground transition-colors duration-150"
        aria-label="Edit stage"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      {!stage.system && (
        <button
          type="button"
          onClick={onDelete}
          className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-150"
          aria-label="Delete stage"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function LifecycleStageEditor({
  stage, onCancel, onSave,
}: {
  stage: LifecycleStageDef;
  onCancel: () => void;
  onSave: (name: string, color: LifecycleColorKey) => void;
}) {
  const [name, setName] = useState(stage.name);
  const [color, setColor] = useState<LifecycleColorKey>(stage.color);
  const canSave = name.trim().length > 0;
  return (
    <div className="rounded-md border border-primary/40 bg-primary/5 px-3 py-3 space-y-3">
      <div>
        <FieldLabel>Stage Name</FieldLabel>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div>
        <FieldLabel>Stage Color</FieldLabel>
        <LifecycleColorPicker value={color} onChange={setColor} />
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <GhostButton onClick={onCancel}>Cancel</GhostButton>
        <PrimaryButton disabled={!canSave} onClick={() => canSave && onSave(name.trim(), color)}>
          Save Changes
        </PrimaryButton>
      </div>
    </div>
  );
}

function LifecycleStageModal({
  open, mode, group, onClose, onSubmit,
}: {
  open: boolean;
  mode: "create";
  group: LifecycleGroup;
  onClose: () => void;
  onSubmit: (name: string, color: LifecycleColorKey) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<LifecycleColorKey>("blue");
  useEffect(() => {
    if (open) { setName(""); setColor("blue"); }
  }, [open]);
  const canSubmit = name.trim().length > 0;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? `Create ${group === "active" ? "Active" : "Lost"} Stage` : "Edit Stage"}
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton disabled={!canSubmit} onClick={() => canSubmit && onSubmit(name.trim(), color)}>
            Create Stage
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <FieldLabel>Stage Name</FieldLabel>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Negotiation" />
        </label>
        <div>
          <FieldLabel>Stage Color</FieldLabel>
          <LifecycleColorPicker value={color} onChange={setColor} />
        </div>
      </div>
    </Modal>
  );
}

function LifecycleColorPicker({
  value, onChange,
}: {
  value: LifecycleColorKey;
  onChange: (c: LifecycleColorKey) => void;
}) {
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {LIFECYCLE_COLOR_KEYS.map((k) => {
        const c = LIFECYCLE_COLORS[k];
        const active = value === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className={`h-8 w-8 rounded-full grid place-items-center border-2 transition ${
              active ? "border-foreground" : "border-transparent hover:border-border"
            }`}
            aria-label={c.name}
          >
            <span className={`h-5 w-5 rounded-full ${c.dot}`} />
          </button>
        );
      })}
    </div>
  );
}

// =========================================================
// RECENTLY DELETED CONTACTS PAGE
//
// Reads from the SAME `state.contacts` list. Filters where deleted=true.
// Uses the same property visibility configuration so columns mirror the
// Contacts module table.
// =========================================================

function RecentlyDeletedContactsPage() {
  const { contacts, labels, lists, properties } = useContactsStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const visibleProps = useMemo(
    () => properties.filter((p) => p.visible),
    [properties],
  );

  const deletedContacts = useMemo(() => {
    const base = contacts.filter((c) => c.deleted);
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.instagram ?? "").toLowerCase().includes(q),
    );
  }, [contacts, query]);

  const labelById = (id: string) => labels.find((l) => l.id === id);
  const listById = (id: string) => lists.find((l) => l.id === id);

  const allChecked = deletedContacts.length > 0 && deletedContacts.every((c) => selected.has(c.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allChecked) deletedContacts.forEach((c) => next.delete(c.id));
    else deletedContacts.forEach((c) => next.add(c.id));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const restore = (ids: string[]) => {
    contactsStore.restoreContacts(ids);
    setSelected(new Set());
    toast.success(
      ids.length > 1 ? `${ids.length} contacts restored` : "Contact restored",
    );
  };
  const hardDelete = (ids: string[]) => {
    contactsStore.hardDeleteContacts(ids);
    setSelected(new Set());
    toast.success(
      ids.length > 1 ? `${ids.length} contacts permanently deleted` : "Contact permanently deleted",
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Recently Deleted Contacts"
        description="Contacts moved to this recycle bin. Restore them to the Contacts module or delete permanently."
      />

      <SectionCard>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <SearchInput value={query} onChange={setQuery} placeholder="Search deleted contacts" />
          <div className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> {deletedContacts.length} deleted
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-primary/10 border-b border-border">
            <div className="text-xs">
              <span className="font-semibold">{selected.size}</span> selected
            </div>
            <div className="flex items-center gap-2">
              <GhostButton onClick={() => setBulkRestoreOpen(true)}>
                <RotateCcw className="h-3.5 w-3.5" />{" "}
                {selected.size === 1 ? "Restore" : "Restore Selected"}
              </GhostButton>
              <button
                onClick={() => setBulkDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 h-9 text-xs font-medium transition-colors duration-150"
              >
                <Trash2 className="h-3.5 w-3.5" />{" "}
                {selected.size === 1 ? "Permanently Delete" : "Permanently Delete Selected"}
              </button>
            </div>
          </div>
        )}

        {deletedContacts.length === 0 ? (
          <EmptyState
            title="No Deleted Contacts"
            description="Contacts you delete from the Contacts module will appear here. Restore them anytime."
            action={null}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="w-10 px-5 py-2.5 text-left">
                    <Checkbox checked={allChecked} onChange={toggleAll} />
                  </th>
                  {visibleProps.map((p) => (
                    <th key={p.id} className="px-3 py-2.5 text-left font-medium whitespace-nowrap">
                      {p.name}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">
                    Deleted
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deletedContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-5 py-3">
                      <Checkbox
                        checked={selected.has(c.id)}
                        onChange={() => toggleOne(c.id)}
                      />
                    </td>
                    {visibleProps.map((p) => (
                      <td key={p.id} className="px-3 py-3 whitespace-nowrap align-middle">
                        {renderContactCell(p, c, labelById, listById)}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {c.deletedAt ? fmtDate(c.deletedAt) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => restore([c.id])}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 hover:bg-card px-2 py-1 text-[11px] transition-colors duration-150"
                        >
                          <RotateCcw className="h-3 w-3" /> Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(new Set([c.id]));
                            setBulkDeleteOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 px-2 py-1 text-[11px] transition-colors duration-150"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={bulkRestoreOpen}
        title={selected.size === 1 ? "Restore Contact" : "Restore Contacts"}
        description={
          <>
            Restore {selected.size} contact{selected.size === 1 ? "" : "s"} to the Contacts module?
          </>
        }
        confirmLabel="Restore"
        onClose={() => setBulkRestoreOpen(false)}
        onConfirm={() => {
          restore(Array.from(selected));
          setBulkRestoreOpen(false);
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete Permanently"
        description={
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                Permanently delete {selected.size} contact{selected.size === 1 ? "" : "s"}?
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              This action cannot be undone. All contact data will be removed.
            </div>
          </div>
        }
        confirmLabel="Delete Permanently"
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => {
          hardDelete(Array.from(selected));
          setBulkDeleteOpen(false);
        }}
      />
    </div>
  );
}

function renderContactCell(
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
    case "labels": {
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
    }
    case "lists": {
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
    }
    case "lastInteraction":
      return <span className="text-xs text-muted-foreground">{c.lastInteraction}</span>;
    case "status":
      return (
        <span className="text-xs text-muted-foreground">{c.status}</span>
      );
    default:
      return <span className="text-[11px] text-muted-foreground">—</span>;
  }
}
function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${width} rounded-xl border border-border bg-card shadow-2xl overflow-hidden`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground transition-colors duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          {footer}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`mt-1 h-9 w-full rounded-md border border-border bg-background/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 ${className}`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`mt-1 w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none ${className}`}
    />
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 rounded-md border border-border bg-background/40 px-3 py-2.5 text-left hover:bg-background/60 transition-colors duration-150"
    >
      <div>
        <div className="text-sm">{label}</div>
        {description && (
          <div className="text-[11px] text-muted-foreground mt-0.5">{description}</div>
        )}
      </div>
      <span
        className={`relative h-5 w-9 rounded-full transition ${
          checked ? "bg-primary" : "bg-white/[0.08]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function Checkbox({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`h-4 w-4 rounded border grid place-items-center transition ${
        checked ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background/60"
      }`}
    >
      {checked && <Check className="h-3 w-3" />}
    </button>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="p-12 grid place-items-center text-center">
      <div className="max-w-sm">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
        <div className="mt-4 inline-flex">{action}</div>
      </div>
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  onPage,
  total,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
  total: number;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
      <span>{total} total</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="h-7 px-2 rounded border border-border bg-card/60 hover:bg-card disabled:opacity-40 transition-colors duration-150"
        >
          Prev
        </button>
        <span className="px-2">
          {page} / {Math.max(1, pageCount)}
        </span>
        <button
          onClick={() => onPage(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className="h-7 px-2 rounded border border-border bg-card/60 hover:bg-card disabled:opacity-40 transition-colors duration-150"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// =========================================================
// LABELS PAGE
// =========================================================

type LabelRow = {
  id: string;
  name: string;
  color: LabelColorKey;
  createdAt: string;
  updatedAt: string;
};

const SEED_LABELS: LabelRow[] = [
  { id: "lb-1",  name: "VIP Customer",       color: "yellow", createdAt: "2025-01-12T09:00:00Z", updatedAt: "2025-09-04T14:00:00Z" },
  { id: "lb-2",  name: "Hot Lead",           color: "red",    createdAt: "2025-02-02T09:00:00Z", updatedAt: "2025-08-19T14:00:00Z" },
  { id: "lb-3",  name: "Enterprise",         color: "blue",   createdAt: "2025-02-21T09:00:00Z", updatedAt: "2025-09-22T14:00:00Z" },
  { id: "lb-4",  name: "Potential Client",   color: "purple", createdAt: "2025-03-10T09:00:00Z", updatedAt: "2025-10-01T14:00:00Z" },
  { id: "lb-5",  name: "Existing Customer",  color: "green",  createdAt: "2025-03-28T09:00:00Z", updatedAt: "2025-10-12T14:00:00Z" },
  { id: "lb-6",  name: "Repeat Buyer",       color: "green",  createdAt: "2025-04-14T09:00:00Z", updatedAt: "2025-10-20T14:00:00Z" },
  { id: "lb-7",  name: "Newsletter",         color: "gray",   createdAt: "2025-05-02T09:00:00Z", updatedAt: "2025-10-28T14:00:00Z" },
  { id: "lb-8",  name: "Partnership",        color: "pink",   createdAt: "2025-05-19T09:00:00Z", updatedAt: "2025-11-05T14:00:00Z" },
  { id: "lb-9",  name: "Campaign Lead",      color: "orange", createdAt: "2025-06-04T09:00:00Z", updatedAt: "2025-11-12T14:00:00Z" },
  { id: "lb-10", name: "Inactive Customer",  color: "gray",   createdAt: "2025-06-21T09:00:00Z", updatedAt: "2025-11-22T14:00:00Z" },
];

const COLOR_FILTER_OPTIONS = [
  { value: "all", label: "All Colors" },
  ...LABEL_COLORS.map((c) => ({ value: c.key, label: c.name })),
];

function LabelsPage() {
  const [labels, setLabels] = useState<LabelRow[]>(SEED_LABELS);
  const [query, setQuery] = useState("");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LabelRow | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return labels.filter(
      (l) =>
        (colorFilter === "all" || l.color === colorFilter) &&
        (!q || l.name.toLowerCase().includes(q)),
    );
  }, [labels, query, colorFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allOnPageChecked = paged.length > 0 && paged.every((r) => selected.has(r.id));

  const togglePageAll = () => {
    const next = new Set(selected);
    if (allOnPageChecked) paged.forEach((r) => next.delete(r.id));
    else paged.forEach((r) => next.add(r.id));
    setSelected(next);
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const create = (name: string, color: LabelColorKey) => {
    const now = new Date().toISOString();
    setLabels((prev) => [
      { id: `lb-${Date.now()}`, name, color, createdAt: now, updatedAt: now },
      ...prev,
    ]);
    toast.success("Label created");
  };

  const update = (id: string, name: string, color: LabelColorKey) => {
    const now = new Date().toISOString();
    setLabels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, name, color, updatedAt: now } : l)),
    );
    toast.success("Label updated");
  };

  const del = (ids: string[]) => {
    setLabels((prev) => prev.filter((l) => !ids.includes(l.id)));
    setSelected((prev) => {
      const n = new Set(prev);
      ids.forEach((i) => n.delete(i));
      return n;
    });
    toast.success(ids.length > 1 ? "Labels deleted" : "Label deleted");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Labels"
        description="Create and manage labels used to organize contacts."
        action={
          <PrimaryButton onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Create New Label
          </PrimaryButton>
        }
      />

      <SectionCard>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <SearchInput value={query} onChange={setQuery} placeholder="Search labels" />
          <div className="w-44">
            <SclSelect
              value={colorFilter}
              onChange={setColorFilter}
              options={COLOR_FILTER_OPTIONS}
            />
          </div>
          <div className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> {filtered.length} labels
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-primary/10 border-b border-border">
            <div className="text-xs">
              <span className="font-semibold">{selected.size}</span> selected
            </div>
            <div className="flex items-center gap-2">
              {selected.size === 1 && (
                <GhostButton
                  onClick={() => {
                    const id = Array.from(selected)[0];
                    const row = labels.find((l) => l.id === id) ?? null;
                    setEditTarget(row);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit Label
                </GhostButton>
              )}
              <button
                onClick={() => setBulkDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 h-9 text-xs font-medium transition-colors duration-150"
              >
                <Trash2 className="h-3.5 w-3.5" /> {selected.size === 1 ? "Delete Label" : "Delete Labels"}
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            title="No Labels Found"
            description="Create your first label to organize contacts."
            action={
              <PrimaryButton onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Create Label
              </PrimaryButton>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card/80 backdrop-blur">
                  <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="w-10 px-5 py-2.5 text-left">
                      <Checkbox checked={allOnPageChecked} onChange={togglePageAll} />
                    </th>
                    <th className="px-3 py-2.5 text-left font-medium">Label Name</th>
                    <th className="px-3 py-2.5 text-left font-medium">Color</th>
                    <th className="px-3 py-2.5 text-left font-medium">Created</th>
                    <th className="px-3 py-2.5 text-left font-medium">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row) => {
                    const c = colorMeta(row.color);
                    return (
                      <tr key={row.id} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-5 py-3">
                          <Checkbox
                            checked={selected.has(row.id)}
                            onChange={() => toggleOne(row.id)}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${c.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                            {row.name}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                            {c.name}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">{fmtDate(row.createdAt)}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">{fmtDate(row.updatedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              onPage={setPage}
              total={filtered.length}
            />
          </>
        )}
      </SectionCard>

      <LabelFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(name, color) => {
          create(name, color);
          setCreateOpen(false);
        }}
        mode="create"
      />
      <LabelFormModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={(name, color) => {
          if (editTarget) update(editTarget.id, name, color);
          setEditTarget(null);
          setSelected(new Set());
        }}
        initial={editTarget ?? undefined}
        mode="edit"
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        title={selected.size === 1 ? "Delete Label" : "Delete Labels"}
        description={
          <>
            Are you sure you want to delete {selected.size} label
            {selected.size === 1 ? "" : "s"}? This action cannot be undone.
          </>
        }
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => {
          del(Array.from(selected));
          setBulkDeleteOpen(false);
        }}
      />
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: LabelColorKey;
  onChange: (c: LabelColorKey) => void;
}) {
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {LABEL_COLORS.map((c) => {
        const active = c.key === value;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            className={`h-8 w-8 rounded-full grid place-items-center border-2 transition ${
              active ? "border-foreground" : "border-transparent hover:border-border"
            }`}
            aria-label={c.name}
          >
            <span className={`h-5 w-5 rounded-full ${c.dot}`} />
          </button>
        );
      })}
    </div>
  );
}

function LabelFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: LabelColorKey) => void;
  initial?: LabelRow;
  mode: "create" | "edit";
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<LabelColorKey>("blue");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setColor(initial?.color ?? "blue");
    }
  }, [open, initial]);

  const c = colorMeta(color);
  const canSubmit = name.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Create New Label" : "Edit Label"}
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton
            disabled={!canSubmit}
            onClick={() => canSubmit && onSubmit(name.trim(), color)}
          >
            {mode === "create" ? "Create Label" : "Save Changes"}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <FieldLabel>Label Name</FieldLabel>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. VIP Customer"
            autoFocus
          />
        </label>
        <div>
          <FieldLabel>Color</FieldLabel>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div>
          <FieldLabel>Preview</FieldLabel>
          <div className="mt-1">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${c.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
              {name.trim() || "Label name"}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}


// =========================================================
// CONTACT PROPERTIES PAGE
//
// IMPORTANT: This page is only an alternate management entry point
// for the SAME contact-property data shown in Contacts → Manage
// Properties. It reads from and writes to `contactsStore` directly
// and reuses the shared `PropertyFormModal`. There is no separate
// data source, schema, or CRUD logic.
// =========================================================

const PROP_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Types" },
  ...(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => ({
    value: t,
    label: PROPERTY_TYPE_LABELS[t],
  })),
];

function ContactPropertiesRouter() {
  const { properties } = useContactsStore();
  const setProperties = contactsStore.setProperties;

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ContactProperty | null>(null);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return properties.filter(
      (p) =>
        (typeFilter === "all" || p.type === typeFilter) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q)),
    );
  }, [properties, query, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allOnPageChecked = paged.length > 0 && paged.every((r) => selected.has(r.id));
  const togglePageAll = () => {
    const next = new Set(selected);
    if (allOnPageChecked) paged.forEach((r) => next.delete(r.id));
    else paged.forEach((r) => next.add(r.id));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const upsertProperty = (prop: ContactProperty) => {
    const exists = properties.some((p) => p.id === prop.id);
    setProperties(
      exists
        ? properties.map((p) => (p.id === prop.id ? prop : p))
        : [...properties, prop],
    );
    toast.success(exists ? "Property updated" : "Property created");
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selected);
    const blocked = properties.filter((p) => ids.includes(p.id) && p.system);
    const deletableIds = ids.filter(
      (id) => !properties.find((p) => p.id === id)?.system,
    );
    if (blocked.length > 0) {
      toast.error(
        `${blocked.length} system propert${blocked.length === 1 ? "y" : "ies"} cannot be deleted`,
      );
    }
    if (deletableIds.length > 0) {
      setProperties(properties.filter((p) => !deletableIds.includes(p.id)));
      toast.success(deletableIds.length > 1 ? "Properties deleted" : "Property deleted");
    }
    setSelected(new Set());
    setBulkDeleteOpen(false);
  };

  const toggleVisible = (id: string) => {
    setProperties(properties.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)));
  };

  const selectedIds = Array.from(selected);
  const singleSelectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const anySystemSelected = selectedIds.some(
    (id) => properties.find((p) => p.id === id)?.system,
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contact Properties"
        description="Manage the contact fields used across your workspace. Synced with Contacts → Manage Properties."
        action={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Add Property
          </PrimaryButton>
        }
      />

      <SectionCard>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <SearchInput value={query} onChange={setQuery} placeholder="Search properties" />
          <div className="w-48">
            <SclSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={PROP_TYPE_FILTER_OPTIONS}
            />
          </div>
          <div className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> {filtered.length} properties
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-primary/10 border-b border-border">
            <div className="text-xs">
              <span className="font-semibold">{selected.size}</span> selected
            </div>
            <div className="flex items-center gap-2">
              {singleSelectedId && (
                <GhostButton
                  onClick={() => {
                    const target = properties.find((p) => p.id === singleSelectedId) ?? null;
                    setEditing(target);
                    setShowForm(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit Property
                </GhostButton>
              )}
              {!anySystemSelected && (
                <button
                  onClick={() => setBulkDeleteOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 h-9 text-xs font-medium transition-colors duration-150"
                >
                  <Trash2 className="h-3.5 w-3.5" />{" "}
                  {selected.size === 1 ? "Delete Property" : "Delete Properties"}
                </button>
              )}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            title="No Contact Properties Found"
            description="Create your first property to customize contact data."
            action={
              <PrimaryButton
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Create Property
              </PrimaryButton>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card/80 backdrop-blur">
                  <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="w-10 px-5 py-2.5 text-left">
                      <Checkbox checked={allOnPageChecked} onChange={togglePageAll} />
                    </th>
                    <th className="px-3 py-2.5 text-left font-medium">Property Name</th>
                    <th className="px-3 py-2.5 text-left font-medium">Property Key</th>
                    <th className="px-3 py-2.5 text-left font-medium">Property Type</th>
                    <th className="px-3 py-2.5 text-left font-medium">Visible</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-5 py-3">
                        <Checkbox
                          checked={selected.has(row.id)}
                          onChange={() => toggleOne(row.id)}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium inline-flex items-center gap-1.5">
                          {row.name}
                          {row.system && (
                            <span
                              title="System property"
                              className="inline-flex items-center gap-1 rounded-sm border border-border bg-white/[0.04] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
                            >
                              <Lock className="h-2.5 w-2.5" /> System
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{row.key}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center rounded-md border border-border bg-white/[0.03] px-2 py-0.5 text-[11px]">
                          {PROPERTY_TYPE_LABELS[row.type]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => toggleVisible(row.id)}
                          aria-label={row.visible ? "Hide property" : "Show property"}
                          className={`relative h-5 w-9 rounded-full transition ${
                            row.visible ? "bg-primary" : "bg-white/[0.08]"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                              row.visible ? "left-[18px]" : "left-0.5"
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              onPage={setPage}
              total={filtered.length}
            />
          </>
        )}
      </SectionCard>

      {showForm && (
        <PropertyFormModal
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={(prop) => {
            upsertProperty(prop);
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={selected.size === 1 ? "Delete Property" : "Delete Properties"}
        description={
          <>
            Are you sure you want to delete {selected.size} propert
            {selected.size === 1 ? "y" : "ies"}? This action cannot be undone.
          </>
        }
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}

// Silence unused-import warning when ChevronDown isn't directly used elsewhere.
const _unused = [ChevronDown, useEffect, useRef, Check];
void _unused;