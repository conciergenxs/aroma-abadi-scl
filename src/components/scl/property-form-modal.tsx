import { useState } from "react";
import { X } from "lucide-react";
import { PROPERTY_TYPE_LABELS, type ContactProperty, type PropertyType } from "./contacts-store";

/**
 * Shared Add/Edit Property modal used by:
 * - Contacts → Manage Properties
 * - Settings → Data Management → Contact Properties
 *
 * Single source of truth for the property create/update form.
 */
export function PropertyFormModal({
  initial,
  onClose,
  onSave,
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
    n
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const save = () => {
    const finalName = name.trim();
    if (!finalName) return;
    const finalKey = key.trim() || autoKey(finalName);
    onSave({
      id: initial?.id ?? `p-${Date.now()}`,
      key: finalKey,
      name: finalName,
      type,
      visible: initial?.visible ?? true,
      system: initial?.system,
      options: initial?.options,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm modal-backdrop"
      onClick={onClose}
    >
      <div
        className="w-[440px] max-w-[95vw] rounded-xl border border-border bg-popover shadow-xl glass modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-medium">{isEdit ? "Edit Property" : "Add Property"}</div>
          <button
            onClick={onClose}
            className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground transition-colors duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
              Property Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!isEdit) setKey(autoKey(e.target.value));
              }}
              placeholder="e.g. Company"
              className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
              Property Key
            </label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={isSystem}
              placeholder="company"
              className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-60"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Used internally. Lowercase, letters, numbers, underscores.
            </p>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
              Property Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PropertyType)}
              disabled={isSystem}
              className="h-9 w-full rounded-md border border-border bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-60"
            >
              {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 rounded-md border border-border bg-card/60 px-4 text-[14px] hover:bg-card transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="h-9 rounded-md bg-primary px-4 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isEdit ? "Save Changes" : "Add Property"}
          </button>
        </div>
      </div>
    </div>
  );
}
