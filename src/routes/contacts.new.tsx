import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { ArrowLeft, Check, ChevronDown, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  type Contact,
  type ContactLabel,
  type LabelColor,
  type LifecycleStage,
} from "@/components/scl/mock-data";
import { LifecycleSelect } from "@/components/scl/lifecycle-select";
import {
  contactsStore,
  useContactsStore,
  type ContactProperty,
} from "@/components/scl/contacts-store";
import { labelColorDot } from "@/components/scl/app-shell";

export const Route = createFileRoute("/contacts/new")({
  head: () => ({ meta: [{ title: "Create New Contact — SCL" }] }),
  component: NewContactPage,
});

const COLORS: LabelColor[] = ["indigo", "pink", "emerald", "amber", "sky", "violet", "slate"];
const SYSTEM_KEYS = new Set([
  "name",
  "phone",
  "channel",
  "labels",
  "lists",
  "lastInteraction",
  "status",
  "email",
]);

function NewContactPage() {
  const { labels, lists, properties } = useContactsStore();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [ownerId, setOwnerId] = useState<string>("me");
  const [stage, setStage] = useState<LifecycleStage | null>(null);
  const [listIds, setListIds] = useState<string[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});

  const additionalProperties = useMemo<ContactProperty[]>(
    () => properties.filter((p) => !SYSTEM_KEYS.has(p.key) && !p.system),
    [properties],
  );

  const setCustom = (key: string, value: unknown) =>
    setCustomValues((v) => ({ ...v, [key]: value }));

  const handleCreateLabel = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const color = COLORS[labels.length % COLORS.length];
    const id = `lb-${Date.now()}`;
    contactsStore.setLabels((l) => [...l, { id, name: trimmed, color }]);
    setLabelIds((ids) => [...ids, id]);
    toast.success(`Label “${trimmed}” created`);
  };

  const handleCreateList = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = `ls-${Date.now()}`;
    contactsStore.setLists((l) => [...l, { id, name: trimmed }]);
    setListIds((ids) => [...ids, id]);
    toast.success(`List “${trimmed}” created`);
  };

  const submit = () => {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!name) { toast.error("First name and last name are required"); return; }
    if (!phone.trim()) { toast.error("Phone number is required"); return; }
    if (!email.trim()) { toast.error("Email is required"); return; }
    const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "NC";
    const contact: Contact = {
      id: `c-${Date.now()}`,
      name,
      phone: phone.trim(),
      email: email.trim(),
      channel: "whatsapp",
      labelIds,
      listIds,
      lastInteraction: "Just now",
      status: "Active",
      avatar: initials,
      ownerId: ownerId || undefined,
      lifecycleStage: stage ?? undefined,
      stageEnteredAt: stage ? new Date().toISOString() : undefined,
      customFields: customValues,
    };
    contactsStore.setContacts((cs) => [contact, ...cs]);
    contactsStore.addActivity(contact.id, "created", "Contact created");
    if (stage) contactsStore.addActivity(contact.id, "lifecycle", `Lifecycle set to ${stage}`);
    labelIds.forEach((id) => {
      const l = labels.find((x) => x.id === id);
      if (l) contactsStore.addActivity(contact.id, "label_added", `Added label “${l.name}”`);
    });
    listIds.forEach((id) => {
      const ls = lists.find((x) => x.id === id);
      if (ls) contactsStore.addActivity(contact.id, "list_added", `Added to list “${ls.name}”`);
    });
    toast.success("Contact created successfully");
    navigate({ to: "/contacts/$contactId", params: { contactId: contact.id } });
  };

  return (
    <AppShell title="Create New Contact" noPadding>
      <div className="flex flex-col h-[calc(100vh-64px)] min-h-0">
        {/* Sticky header */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/80 backdrop-blur px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/contacts"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-xs hover:bg-card"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Link>
            <h1 className="text-sm font-medium">Create New Contact</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ to: "/contacts" })}
              className="rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:bg-card"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> Create Contact
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 lg:px-6 py-6 space-y-6">
            {/* Section 1: Contact Information */}
            <Section
              title="Contact Information"
              description="Core details about this contact."
            >
              <FormGrid>
                <Field label="First Name" required>
                  <Input value={firstName} onChange={setFirstName} placeholder="Jane" />
                </Field>
                <Field label="Last Name" required>
                  <Input value={lastName} onChange={setLastName} placeholder="Doe" />
                </Field>
                <Field label="Phone Number" required>
                  <Input value={phone} onChange={setPhone} placeholder="+1 415 220 8841" type="tel" />
                </Field>
                <Field label="Email" required>
                  <Input value={email} onChange={setEmail} placeholder="jane@company.com" type="email" />
                </Field>
                <Field label="Contact Owner">
                  <Select
                    value={ownerId}
                    onChange={setOwnerId}
                    options={[
                      { value: "", label: "Unassigned" },
                      { value: "me", label: "Me (current user)" },
                    ]}
                  />
                </Field>
                <Field label="Lifecycle Stage">
                  <LifecycleSelect value={stage} onChange={setStage} />
                </Field>
                <Field label="Labels">
                  <LabelMultiSelect
                    labels={labels}
                    selectedIds={labelIds}
                    onToggle={(id) =>
                      setLabelIds((ids) =>
                        ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
                      )
                    }
                    onCreate={handleCreateLabel}
                  />
                </Field>
              </FormGrid>
            </Section>

            {/* Section 2: Add To Lists */}
            <Section
              title="Add To Lists"
              description="Group this contact into one or more lists."
            >
              <ListCompactSelect
                lists={lists}
                selectedIds={listIds}
                onToggle={(id) =>
                  setListIds((ids) =>
                    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
                  )
                }
                onCreate={handleCreateList}
              />
            </Section>

            {/* Section 3: Additional Information */}
            <Section
              title="Additional Information"
              description="Custom properties defined in Manage Properties."
            >
              {additionalProperties.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No custom properties yet. Create some in{" "}
                  <Link to="/contacts" className="text-primary hover:underline">
                    Manage Properties
                  </Link>
                  .
                </p>
              ) : (
                <FormGrid>
                  {additionalProperties.map((p) => (
                    <Field key={p.id} label={p.name}>
                      <PropertyInput
                        property={p}
                        value={customValues[p.key]}
                        onChange={(v) => setCustom(p.key, v)}
                      />
                    </Field>
                  ))}
                </FormGrid>
              )}
            </Section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ----------------------------- Layout helpers ----------------------------- */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card/40">
      <header className="px-5 py-4 border-b border-border">
        <div className="text-sm font-medium">{title}</div>
        {description && (
          <div className="text-[11px] text-muted-foreground mt-0.5">{description}</div>
        )}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </div>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-md border border-white/10 bg-white/[0.04] px-2.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 hover:bg-white/[0.06] transition-colors"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 hover:bg-white/[0.06] transition-colors"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-white/10 bg-white/[0.04] px-2 text-xs text-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 hover:bg-white/[0.06] transition-colors"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ----------------------------- Property input ----------------------------- */

function PropertyInput({
  property,
  value,
  onChange,
}: {
  property: ContactProperty;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const v = value;
  switch (property.type) {
    case "multiline":
      return (
        <Textarea
          value={(v as string) ?? ""}
          onChange={(s) => onChange(s)}
          placeholder={property.name}
        />
      );
    case "number":
      return (
        <input
          type="number"
          value={(v as number | string) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className="h-9 w-full rounded-md border border-white/10 bg-white/[0.04] px-2.5 text-xs text-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 hover:bg-white/[0.06] transition-colors"
        />
      );
    case "email":
      return <Input value={(v as string) ?? ""} onChange={(s) => onChange(s)} type="email" />;
    case "phone":
      return <Input value={(v as string) ?? ""} onChange={(s) => onChange(s)} type="tel" />;
    case "url":
      return <Input value={(v as string) ?? ""} onChange={(s) => onChange(s)} type="url" placeholder="https://" />;
    case "date":
      return <Input value={(v as string) ?? ""} onChange={(s) => onChange(s)} type="date" />;
    case "boolean":
      return (
        <button
          type="button"
          onClick={() => onChange(!v)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${v ? "bg-primary" : "bg-white/10"}`}
          aria-label="toggle"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${v ? "translate-x-4" : "translate-x-0.5"}`}
          />
        </button>
      );
    case "select":
      return (
        <Select
          value={(v as string) ?? ""}
          onChange={(s) => onChange(s)}
          options={[{ value: "", label: "Select…" }, ...(property.options ?? []).map((o) => ({ value: o, label: o }))]}
        />
      );
    case "multiselect": {
      const selected = Array.isArray(v) ? (v as string[]) : [];
      const options = property.options ?? [];
      return (
        <div className="flex flex-wrap gap-1.5">
          {options.length === 0 && (
            <span className="text-[11px] text-muted-foreground">No options configured</span>
          )}
          {options.map((o) => {
            const on = selected.includes(o);
            return (
              <button
                type="button"
                key={o}
                onClick={() =>
                  onChange(on ? selected.filter((x) => x !== o) : [...selected, o])
                }
                className={`rounded-md border px-2 py-1 text-[11px] transition ${
                  on
                    ? "border-primary/60 bg-primary/15 text-foreground"
                    : "border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      );
    }
    default:
      return <Input value={(v as string) ?? ""} onChange={(s) => onChange(s)} placeholder={property.name} />;
  }
}

/* --------------------------- Multi-select widgets ------------------------- */

function LabelMultiSelect({
  labels,
  selectedIds,
  onToggle,
  onCreate,
}: {
  labels: ContactLabel[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const filtered = labels.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()),
  );
  const exact = labels.some((l) => l.name.toLowerCase() === search.trim().toLowerCase());
  const canCreate = search.trim().length > 0 && !exact;

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-9 flex flex-wrap items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs hover:bg-white/[0.06] focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 transition-colors"
      >
        {selectedIds.length === 0 && (
          <span className="text-muted-foreground">Select labels…</span>
        )}
        {selectedIds.map((id) => {
          const l = labels.find((x) => x.id === id);
          if (!l) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded border border-border bg-white/[0.04] px-1.5 py-0.5 text-[10px]"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${labelColorDot[l.color]}`} />
              {l.name}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onToggle(id); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </span>
            </span>
          );
        })}
        <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-white/10 bg-popover shadow-xl overflow-hidden">
            <div className="p-1.5 border-b border-border">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canCreate) {
                    onCreate(search.trim());
                    setSearch("");
                  }
                }}
                placeholder="Search or create label…"
                className="h-7 w-full rounded border border-white/10 bg-white/[0.04] px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="max-h-56 overflow-y-auto p-1">
              {filtered.map((l) => {
                const on = selectedIds.includes(l.id);
                return (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => onToggle(l.id)}
                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-white/[0.05] inline-flex items-center gap-2"
                  >
                    <span className={`h-2 w-2 rounded-full ${labelColorDot[l.color]}`} />
                    <span className="flex-1">{l.name}</span>
                    {on && <Check className="h-3 w-3 text-primary" />}
                  </button>
                );
              })}
              {filtered.length === 0 && !canCreate && (
                <div className="px-2 py-3 text-[11px] text-muted-foreground text-center">No labels</div>
              )}
              {canCreate && (
                <button
                  type="button"
                  onClick={() => { onCreate(search.trim()); setSearch(""); }}
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-white/[0.05] inline-flex items-center gap-2 border-t border-border mt-1 pt-2"
                >
                  <Plus className="h-3 w-3 text-primary" />
                  Create <span className="font-medium text-foreground">“{search.trim()}”</span>
                </button>
              )}
            </div>
        </div>
      )}
    </div>
  );
}

function ListCompactSelect({
  lists,
  selectedIds,
  onToggle,
  onCreate,
}: {
  lists: { id: string; name: string; description?: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: (name: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {lists.map((l) => {
          const on = selectedIds.includes(l.id);
          return (
            <button
              type="button"
              key={l.id}
              onClick={() => onToggle(l.id)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition ${
                on
                  ? "border-primary/60 bg-primary/15 text-foreground"
                  : "border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
              }`}
            >
              <span
                className={`h-3 w-3 rounded-sm border grid place-items-center transition ${
                  on ? "bg-primary border-primary" : "border-border bg-card/40"
                }`}
              >
                {on && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
              </span>
              {l.name}
            </button>
          );
        })}
      </div>

      {adding ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                onCreate(newName.trim());
                setNewName("");
                setAdding(false);
              }
              if (e.key === "Escape") {
                setAdding(false);
                setNewName("");
              }
            }}
            placeholder="New list name"
            className="h-8 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-2 text-xs focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={() => { if (newName.trim()) { onCreate(newName.trim()); setNewName(""); setAdding(false); } }}
            className="h-8 inline-flex items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Check className="h-3 w-3" /> Add
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName(""); }}
            className="h-8 rounded-md border border-border bg-card/60 px-2.5 text-xs hover:bg-card"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-card/40 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-card"
        >
          <Plus className="h-3 w-3" /> Create list
        </button>
      )}
    </div>
  );
}