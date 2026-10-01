import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { FloatingMenu } from "./floating-menu";
import type { SclSelectOption } from "./scl-select";

export type ManagedOption = SclSelectOption & {
  /** Rows that exist to express "none" rather than a real record — no rename,
   * no delete, and no three-dot affordance. */
  locked?: boolean;
};

/**
 * A single-select whose list is also where the list is maintained: options page
 * eight at a time, each row carries a hover-revealed menu to rename or delete
 * it, and the last row adds a new one inline. That keeps the "+ New …" button
 * out of the form, where it read as a second, unrelated control.
 */
export function SclManagedSelect({
  value,
  options,
  onChange,
  onAdd,
  onRename,
  onDelete,
  addLabel,
  namePlaceholder = "Name…",
  pageSize = 8,
  placeholder = "Select…",
  ariaLabel,
}: {
  value: string | null | undefined;
  options: ManagedOption[];
  onChange: (value: string) => void;
  onAdd: (name: string) => void;
  onRename: (value: string, name: string) => void;
  onDelete: (value: string) => void;
  /** e.g. "Add New Category". */
  addLabel: string;
  namePlaceholder?: string;
  pageSize?: number;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;
  const totalPages = Math.max(1, Math.ceil(options.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => options.slice((safePage - 1) * pageSize, safePage * pageSize),
    [options, safePage, pageSize],
  );

  // Deleting the last row on the last page would otherwise strand the viewer.
  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(1, Math.ceil(options.length / pageSize))));
  }, [options.length, pageSize]);

  const reset = () => {
    setMenuFor(null);
    setEditing(null);
    setDraft("");
    setAdding(false);
    setNewName("");
  };

  const commitAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAdd(name);
    setNewName("");
    setAdding(false);
    // A new entry lands at the end, so follow it there.
    setPage(Math.max(1, Math.ceil((options.length + 1) / pageSize)));
  };

  const commitRename = (v: string) => {
    const name = draft.trim();
    if (name) onRename(v, name);
    setEditing(null);
    setDraft("");
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-card/60 px-3 text-[13px] hover:bg-card focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 transition-colors"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.dot && <span className={`h-2 w-2 shrink-0 rounded-full ${selected.dot}`} />}
          <span className={`truncate ${selected ? "text-foreground" : "text-muted-foreground"}`}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <FloatingMenu
        anchorRef={btnRef}
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
      >
        <div className="rounded-md border border-border bg-popover shadow-xl overflow-hidden animate-scale-in origin-top">
          <div className="p-1">
            {paged.map((o) => {
              const active = o.value === value;
              if (editing === o.value) {
                return (
                  <div key={o.value} className="flex items-center gap-1 px-1 py-1">
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(o.value);
                        if (e.key === "Escape") {
                          setEditing(null);
                          setDraft("");
                        }
                      }}
                      className="h-7 min-w-0 flex-1 rounded border border-border bg-white px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <button
                      type="button"
                      onClick={() => commitRename(o.value)}
                      disabled={!draft.trim()}
                      className="press rounded bg-primary px-2 h-7 text-[11px] font-medium text-primary-foreground disabled:opacity-50 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                );
              }
              return (
                <div key={o.value} className="group/row relative flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      reset();
                    }}
                    className={`press flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] transition-colors ${
                      active ? "bg-primary/10 text-foreground" : "text-foreground/90 hover:bg-gray-50"
                    }`}
                  >
                    {o.dot && <span className={`h-2 w-2 shrink-0 rounded-full ${o.dot}`} />}
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </button>

                  {!o.locked && (
                    <button
                      type="button"
                      aria-label={`Options for ${o.label}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuFor((m) => (m === o.value ? null : o.value));
                      }}
                      // Faint until the row is hovered, so the list stays calm
                      // but the affordance is always discoverable.
                      className={`press mr-1 grid h-6 w-6 shrink-0 place-items-center rounded transition-colors hover:bg-gray-200 ${
                        menuFor === o.value
                          ? "text-foreground bg-gray-200"
                          : "text-muted-foreground/40 group-hover/row:text-foreground"
                      }`}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {menuFor === o.value && (
                    <div className="absolute right-1 top-full z-10 mt-0.5 w-32 overflow-hidden rounded-md border border-border bg-popover shadow-lg animate-scale-in origin-top-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(o.value);
                          setDraft(o.label);
                          setMenuFor(null);
                        }}
                        className="press flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] hover:bg-gray-50 transition-colors"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(o.value);
                          setMenuFor(null);
                        }}
                        className="press flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] text-destructive hover:bg-destructive/5 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-1.5 text-[11px] text-muted-foreground">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                aria-label="Previous page"
                className="press grid h-6 w-6 place-items-center rounded border border-border bg-card/40 enabled:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="tabular-nums">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                aria-label="Next page"
                className="press grid h-6 w-6 place-items-center rounded border border-border bg-card/40 enabled:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}

          <div className="border-t border-border">
            {adding ? (
              <div className="flex items-center gap-1 p-1">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitAdd();
                    if (e.key === "Escape") {
                      setAdding(false);
                      setNewName("");
                    }
                  }}
                  placeholder={namePlaceholder}
                  className="h-7 min-w-0 flex-1 rounded border border-border bg-white px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={commitAdd}
                  disabled={!newName.trim()}
                  className="press rounded bg-primary px-2 h-7 text-[11px] font-medium text-primary-foreground disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="press flex w-full items-center gap-1.5 px-3 py-2 text-left text-[12px] font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> {addLabel}
              </button>
            )}
          </div>
        </div>
      </FloatingMenu>
    </div>
  );
}
