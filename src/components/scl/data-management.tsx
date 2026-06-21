import { useMemo, useState, useEffect, useRef, type ReactNode } from "react";
import { Search, Plus, Trash2, Pencil, X, ArrowLeft, Check, ChevronDown, GripVertical, Filter, Lock } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "./app-shell";
import { ConfirmDialog } from "./confirm-dialog";
import { SclSelect } from "./scl-select";

// =========================================================
// Shared types & palette
// =========================================================

export type DMSection = "labels" | "contact-properties";

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
  return section === "labels" ? <LabelsPage /> : <ContactPropertiesRouter />;
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
      className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 h-9 text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
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
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 hover:bg-card px-3 h-9 text-xs font-medium"
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
            className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground"
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
      className="w-full flex items-center justify-between gap-4 rounded-md border border-border bg-background/40 px-3 py-2.5 text-left hover:bg-background/60"
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
          className="h-7 px-2 rounded border border-border bg-card/60 hover:bg-card disabled:opacity-40"
        >
          Prev
        </button>
        <span className="px-2">
          {page} / {Math.max(1, pageCount)}
        </span>
        <button
          onClick={() => onPage(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className="h-7 px-2 rounded border border-border bg-card/60 hover:bg-card disabled:opacity-40"
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
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LabelRow | null>(null);
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

  const bulkUpdateColor = (color: LabelColorKey) => {
    const now = new Date().toISOString();
    setLabels((prev) =>
      prev.map((l) => (selected.has(l.id) ? { ...l, color, updatedAt: now } : l)),
    );
    setBulkEditOpen(false);
    setSelected(new Set());
    toast.success("Labels updated");
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
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 h-9 text-xs font-medium"
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
                      <tr key={row.id} className="border-b border-border last:border-0 hover:bg-white/[0.02]">
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
        }}
        initial={editTarget ?? undefined}
        mode="edit"
      />
      <BulkEditColorModal
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        onApply={bulkUpdateColor}
        count={selected.size}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Label"
        description={
          <>Are you sure you want to delete this label? This action cannot be undone.</>
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && del([deleteTarget.id])}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete Labels"
        description={
          <>
            Are you sure you want to delete {selected.size} label
            {selected.size === 1 ? "" : "s"}? This action cannot be undone.
          </>
        }
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => del(Array.from(selected))}
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

function BulkEditColorModal({
  open,
  onClose,
  onApply,
  count,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (c: LabelColorKey) => void;
  count: number;
}) {
  const [color, setColor] = useState<LabelColorKey>("blue");
  useEffect(() => {
    if (open) setColor("blue");
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit ${count} Label${count === 1 ? "" : "s"}`}
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={() => onApply(color)}>Apply Color</PrimaryButton>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Update the color applied to the selected labels.
        </p>
        <div>
          <FieldLabel>Color</FieldLabel>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </div>
    </Modal>
  );
}

// =========================================================
// CONTACT PROPERTIES PAGE (+ Add/Edit pages)
// =========================================================

type PropType =
  | "text" | "number" | "email" | "phone" | "date"
  | "dropdown" | "checkbox" | "currency" | "url";

const PROP_TYPE_LABELS: Record<PropType, string> = {
  text: "Text",
  number: "Number",
  email: "Email",
  phone: "Phone",
  date: "Date",
  dropdown: "Dropdown",
  checkbox: "Checkbox",
  currency: "Currency",
  url: "URL",
};

type PropertyRow = {
  id: string;
  name: string;
  key: string;
  type: PropType;
  description?: string;
  usedIn: number;
  createdAt: string;
  updatedAt: string;
  required: boolean;
  visible: boolean;
  editable: boolean;
  options?: string[];
};

const SEED_PROPERTIES: PropertyRow[] = [
  { id: "p-1",  name: "Full Name",       key: "full_name",       type: "text",     usedIn: 12, createdAt: "2025-01-04T09:00:00Z", updatedAt: "2025-09-10T09:00:00Z", required: true,  visible: true,  editable: true },
  { id: "p-2",  name: "Email",           key: "email",           type: "email",    usedIn: 18, createdAt: "2025-01-04T09:00:00Z", updatedAt: "2025-09-12T09:00:00Z", required: true,  visible: true,  editable: true },
  { id: "p-3",  name: "Phone Number",    key: "phone_number",    type: "phone",    usedIn: 24, createdAt: "2025-01-04T09:00:00Z", updatedAt: "2025-09-15T09:00:00Z", required: true,  visible: true,  editable: true },
  { id: "p-4",  name: "Company Name",    key: "company_name",    type: "text",     usedIn: 9,  createdAt: "2025-02-08T09:00:00Z", updatedAt: "2025-10-02T09:00:00Z", required: false, visible: true,  editable: true },
  { id: "p-5",  name: "Industry",        key: "industry",        type: "dropdown", usedIn: 6,  createdAt: "2025-02-19T09:00:00Z", updatedAt: "2025-10-08T09:00:00Z", required: false, visible: true,  editable: true, options: ["Retail","Finance","Tech","Hospitality","Education","Healthcare"] },
  { id: "p-6",  name: "Annual Revenue",  key: "annual_revenue",  type: "currency", usedIn: 4,  createdAt: "2025-03-03T09:00:00Z", updatedAt: "2025-10-14T09:00:00Z", required: false, visible: true,  editable: true },
  { id: "p-7",  name: "Lead Source",     key: "lead_source",     type: "dropdown", usedIn: 11, createdAt: "2025-03-21T09:00:00Z", updatedAt: "2025-10-19T09:00:00Z", required: false, visible: true,  editable: true, options: ["Website","Referral","Ads","Event","Cold Outreach"] },
  { id: "p-8",  name: "Customer Status", key: "customer_status", type: "dropdown", usedIn: 8,  createdAt: "2025-04-09T09:00:00Z", updatedAt: "2025-10-26T09:00:00Z", required: false, visible: true,  editable: true, options: ["Active","Inactive","Churned"] },
  { id: "p-9",  name: "Campaign Source", key: "campaign_source", type: "text",     usedIn: 5,  createdAt: "2025-05-02T09:00:00Z", updatedAt: "2025-11-04T09:00:00Z", required: false, visible: true,  editable: true },
  { id: "p-10", name: "Assigned Agent",  key: "assigned_agent",  type: "text",     usedIn: 14, createdAt: "2025-05-22T09:00:00Z", updatedAt: "2025-11-18T09:00:00Z", required: false, visible: true,  editable: true },
];

const PROP_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  ...(Object.keys(PROP_TYPE_LABELS) as PropType[]).map((t) => ({
    value: t,
    label: PROP_TYPE_LABELS[t],
  })),
];

type CPView =
  | { kind: "list" }
  | { kind: "add" }
  | { kind: "edit"; id: string };

function ContactPropertiesRouter() {
  const [view, setView] = useState<CPView>({ kind: "list" });
  const [properties, setProperties] = useState<PropertyRow[]>(SEED_PROPERTIES);

  if (view.kind === "add") {
    return (
      <PropertyFormPage
        mode="create"
        onCancel={() => setView({ kind: "list" })}
        onSubmit={(p) => {
          const now = new Date().toISOString();
          setProperties((prev) => [
            { ...p, id: `p-${Date.now()}`, usedIn: 0, createdAt: now, updatedAt: now },
            ...prev,
          ]);
          toast.success("Property created");
          setView({ kind: "list" });
        }}
      />
    );
  }

  if (view.kind === "edit") {
    const target = properties.find((p) => p.id === view.id);
    if (!target) {
      setView({ kind: "list" });
      return null;
    }
    return (
      <PropertyFormPage
        mode="edit"
        initial={target}
        onCancel={() => setView({ kind: "list" })}
        onSubmit={(p) => {
          const now = new Date().toISOString();
          setProperties((prev) =>
            prev.map((x) =>
              x.id === target.id ? { ...x, ...p, updatedAt: now } : x,
            ),
          );
          toast.success("Property updated");
          setView({ kind: "list" });
        }}
      />
    );
  }

  return (
    <PropertiesListPage
      properties={properties}
      onAdd={() => setView({ kind: "add" })}
      onEdit={(id) => setView({ kind: "edit", id })}
      onDelete={(ids) => {
        setProperties((prev) => prev.filter((p) => !ids.includes(p.id)));
        toast.success(ids.length > 1 ? "Properties deleted" : "Property deleted");
      }}
    />
  );
}

function PropertiesListPage({
  properties,
  onAdd,
  onEdit,
  onDelete,
}: {
  properties: PropertyRow[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [deleteTarget, setDeleteTarget] = useState<PropertyRow | null>(null);
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

  const bulkEdit = () => {
    if (selected.size === 1) {
      onEdit(Array.from(selected)[0]);
    } else {
      toast.info("Select a single property to edit");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contact Properties"
        description="Manage custom contact fields used throughout the workspace."
        action={
          <PrimaryButton onClick={onAdd}>
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
              options={PROP_TYPE_OPTIONS}
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
              <GhostButton onClick={bulkEdit}>
                <Pencil className="h-3.5 w-3.5" /> Edit Property
              </GhostButton>
              <button
                onClick={() => setBulkDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 h-9 text-xs font-medium"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Property
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            title="No Contact Properties Found"
            description="Create your first property to customize contact data."
            action={
              <PrimaryButton onClick={onAdd}>
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
                    <th className="px-3 py-2.5 text-left font-medium">Internal Key</th>
                    <th className="px-3 py-2.5 text-left font-medium">Type</th>
                    <th className="px-3 py-2.5 text-left font-medium">Used In</th>
                    <th className="px-3 py-2.5 text-left font-medium">Created</th>
                    <th className="px-3 py-2.5 text-left font-medium">Last Updated</th>
                    <th className="w-24 px-5 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <Checkbox
                          checked={selected.has(row.id)}
                          onChange={() => toggleOne(row.id)}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium">{row.name}</div>
                        {row.description && (
                          <div className="text-[11px] text-muted-foreground">{row.description}</div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <code className="text-[11px] rounded bg-white/[0.04] border border-border px-1.5 py-0.5 text-muted-foreground">
                          {row.key}
                        </code>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center rounded-md border border-border bg-white/[0.03] px-2 py-0.5 text-[11px]">
                          {PROP_TYPE_LABELS[row.type]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{row.usedIn} contacts</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{fmtDate(row.createdAt)}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{fmtDate(row.updatedAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEdit(row.id)}
                            className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground hover:text-foreground"
                            aria-label="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(row)}
                            className="h-7 w-7 grid place-items-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Property"
        description={
          <>Are you sure you want to delete this property? This action cannot be undone.</>
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDelete([deleteTarget.id]);
        }}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete Properties"
        description={
          <>
            Are you sure you want to delete {selected.size} propert
            {selected.size === 1 ? "y" : "ies"}? This action cannot be undone.
          </>
        }
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => {
          onDelete(Array.from(selected));
          setSelected(new Set());
        }}
      />
    </div>
  );
}

type PropertyFormValue = Omit<PropertyRow, "id" | "usedIn" | "createdAt" | "updatedAt">;

function PropertyFormPage({
  mode,
  initial,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial?: PropertyRow;
  onCancel: () => void;
  onSubmit: (p: PropertyFormValue) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [key, setKey] = useState(initial?.key ?? "");
  const [keyDirty, setKeyDirty] = useState(!!initial);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<PropType>(initial?.type ?? "text");
  const [required, setRequired] = useState(initial?.required ?? false);
  const [visible, setVisible] = useState(initial?.visible ?? true);
  const [editable, setEditable] = useState(initial?.editable ?? true);
  const [options, setOptions] = useState<string[]>(initial?.options ?? []);
  const [newOption, setNewOption] = useState("");

  // Auto-generate internal key from name until user edits it manually.
  useEffect(() => {
    if (!keyDirty) {
      setKey(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, ""),
      );
    }
  }, [name, keyDirty]);

  const canSubmit = name.trim().length > 0 && key.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      key: key.trim(),
      description: description.trim() || undefined,
      type,
      required,
      visible,
      editable,
      options: type === "dropdown" ? options : undefined,
    });
  };

  // Drag-to-reorder for dropdown options
  const dragIndex = useRef<number | null>(null);
  const onDragStart = (i: number) => () => {
    dragIndex.current = i;
  };
  const onDragOver = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === i) return;
    setOptions((prev) => {
      const next = prev.slice();
      const [m] = next.splice(from, 1);
      next.splice(i, 0, m);
      dragIndex.current = i;
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 px-1 pt-0.5">
        <div className="min-w-0">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Contact Properties
          </button>
          <h2 className="text-xl font-semibold leading-tight m-0 mt-1.5">
            {mode === "create" ? "Add Property" : "Edit Property"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 m-0">
            {mode === "create"
              ? "Define a new custom contact field for your workspace."
              : "Update the configuration for this contact property."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GhostButton onClick={onCancel}>Cancel</GhostButton>
          <PrimaryButton disabled={!canSubmit} onClick={submit}>
            {mode === "create" ? "Create Property" : "Save Changes"}
          </PrimaryButton>
        </div>
      </div>

      <SectionCard title="Property Details">
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <FieldLabel>Property Name</FieldLabel>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Annual Revenue"
            />
          </label>
          <label className="block">
            <FieldLabel>Internal Key</FieldLabel>
            <TextInput
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setKeyDirty(true);
              }}
              placeholder="annual_revenue"
            />
          </label>
          <label className="block md:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Help text shown alongside this field."
            />
          </label>
          <label className="block">
            <FieldLabel>Property Type</FieldLabel>
            <div className="mt-1">
              <SclSelect
                value={type}
                onChange={(v) => setType(v as PropType)}
                options={(Object.keys(PROP_TYPE_LABELS) as PropType[]).map((t) => ({
                  value: t,
                  label: PROP_TYPE_LABELS[t],
                }))}
              />
            </div>
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Behavior">
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Toggle
            checked={required}
            onChange={setRequired}
            label="Required"
            description="Must be filled when creating a contact."
          />
          <Toggle
            checked={visible}
            onChange={setVisible}
            label="Visible"
            description="Show in contact list and detail."
          />
          <Toggle
            checked={editable}
            onChange={setEditable}
            label="Editable"
            description="Allow users to update this field."
          />
        </div>
      </SectionCard>

      {type === "dropdown" && (
        <SectionCard
          title="Dropdown Options"
          description="Manage the list of selectable options. Drag to reorder."
        >
          <div className="p-5 space-y-3">
            {options.length === 0 && (
              <div className="text-xs text-muted-foreground">
                No options yet. Add your first option below.
              </div>
            )}
            {options.map((opt, i) => (
              <div
                key={`${opt}-${i}`}
                draggable
                onDragStart={onDragStart(i)}
                onDragOver={onDragOver(i)}
                className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-2.5 py-1.5"
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab" />
                <input
                  value={opt}
                  onChange={(e) =>
                    setOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))
                  }
                  className="flex-1 h-8 bg-transparent text-sm focus:outline-none"
                />
                <button
                  onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                  className="h-7 w-7 grid place-items-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  aria-label="Remove option"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newOption.trim()) {
                    e.preventDefault();
                    setOptions((p) => [...p, newOption.trim()]);
                    setNewOption("");
                  }
                }}
                placeholder="New option"
                className="h-9 flex-1 rounded-md border border-border bg-background/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <GhostButton
                onClick={() => {
                  if (!newOption.trim()) return;
                  setOptions((p) => [...p, newOption.trim()]);
                  setNewOption("");
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add Option
              </GhostButton>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// Silence unused-import warning when ChevronDown isn't directly used elsewhere.
const _unused = ChevronDown;
void _unused;