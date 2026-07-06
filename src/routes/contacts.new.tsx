import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { ArrowLeft, Check, ChevronDown, Plus, X, User, BadgeCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type Contact, type ContactLabel, type LabelColor } from "@/components/scl/mock-data";
import { contactsStore, useContactsStore } from "@/components/scl/contacts-store";
import { useBaStore, baStore } from "@/components/scl/ba-store";
import { useSkuStore } from "@/components/scl/sku-store";
import { labelColorDot } from "@/components/scl/app-shell";

export const Route = createFileRoute("/contacts/new")({
  head: () => ({ meta: [{ title: "Create New Contact — SCL" }] }),
  component: NewContactPage,
});

const COLORS: LabelColor[] = ["indigo", "pink", "emerald", "amber", "sky", "violet", "slate"];
const POSITIONS = ["BA", "Senior BA", "Supervisor"];
const GENDERS = ["Female", "Male", "Other"] as const;
const CITIES = ["Jakarta", "Bandung", "Surabaya", "Medan", "Makassar", "Bali", "Yogyakarta"];
const STORES_BY_CITY: Record<string, string[]> = {
  Jakarta: ["Plaza Indonesia", "Grand Indonesia", "Pondok Indah Mall", "Central Park"],
  Bandung: ["Paris van Java", "Trans Studio Mall", "Ciwalk", "23 Paskal"],
  Surabaya: ["Pakuwon Mall", "Tunjungan Plaza", "Galaxy Mall"],
  Medan: ["Sun Plaza", "Medan Fair Plaza"],
  Makassar: ["Trans Studio Mall Makassar", "Mall Panakkukang"],
  Bali: ["Beachwalk", "Discovery Mall"],
  Yogyakarta: ["Malioboro Mall", "Hartono Mall"],
};

type ContactType = "ba" | "customer";

function NewContactPage() {
  const { labels } = useContactsStore();
  const { bas } = useBaStore();
  const { brands } = useSkuStore();
  const navigate = useNavigate();

  // Step 1: choose type
  const [contactType, setContactType] = useState<ContactType | null>(null);

  // Shared
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<typeof GENDERS[number] | "">("");

  // BA-specific
  const [brandIds, setBrandIds] = useState<string[]>([]);
  const [position, setPosition] = useState("");
  const [city, setCity] = useState("");
  const [store, setStore] = useState("");

  // Customer-specific
  const [pointBalance, setPointBalance] = useState("");
  const [customerBrandIds, setCustomerBrandIds] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);

  const availableStores = city ? (STORES_BY_CITY[city] ?? []) : [];

  const brandName = (id: string) =>
    brands.find((b) => b.id === id)?.name ?? id.replace("brand-", "").replace(/-/g, " ");

  const toggleBrand = (id: string, list: string[], setList: (v: string[]) => void) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const handleCreateLabel = (n: string) => {
    const trimmed = n.trim();
    if (!trimmed) return;
    const color = COLORS[labels.length % COLORS.length];
    const id = `lb-${Date.now()}`;
    contactsStore.setLabels((l) => [...l, { id, name: trimmed, color }]);
    setLabelIds((ids) => [...ids, id]);
    toast.success(`Label "${trimmed}" dibuat`);
  };

  const submitBA = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!phone.trim()) { toast.error("WA Number is required"); return; }
    if (!gender) { toast.error("Gender is required"); return; }
    if (brandIds.length === 0) { toast.error("Select at least one brand"); return; }
    if (!position) { toast.error("Position is required"); return; }
    if (!city) { toast.error("City is required"); return; }
    if (!store) { toast.error("Store is required"); return; }

    const initials = name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const contact: Contact = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      channel: "whatsapp",
      gender: gender as "Female" | "Male" | "Other",
      labelIds: ["lb-ba"],
      listIds: [],
      lastInteraction: "Just now",
      status: "Active",
      avatar: initials || "BA",
      ownerId: "arma",
      pointBalance: 0,
    };
    contactsStore.setContacts((cs) => [contact, ...cs]);
    contactsStore.addActivity(contact.id, "created", "BA Contact created");

    // Add to ba-store
    const username = name.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "");
    baStore.add({
      name: name.trim(),
      gender: gender as "Female" | "Male" | "Other",
      username,
      waNumber: phone.trim(),
      brandIds,
      city,
      store,
      position,
    });

    toast.success("BA Contact berhasil dibuat");
    navigate({ to: "/contacts/$contactId", params: { contactId: contact.id } });
  };

  const submitCustomer = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!phone.trim()) { toast.error("WA Number is required"); return; }

    const initials = name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const contact: Contact = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      channel: "whatsapp",
      gender: (gender as "Wanita" | "Pria" | "Lainnya") || undefined,
      labelIds,
      listIds: [],
      lastInteraction: "Just now",
      status: "Active",
      avatar: initials || "CX",
      ownerId: "arma",
      pointBalance: pointBalance ? Number(pointBalance) : 0,
    };
    contactsStore.setContacts((cs) => [contact, ...cs]);
    contactsStore.addActivity(contact.id, "created", "Customer Contact created");
    labelIds.forEach((id) => {
      const l = labels.find((x) => x.id === id);
      if (l) contactsStore.addActivity(contact.id, "label_added", `Added label "${l.name}"`);
    });

    toast.success("Customer Contact berhasil dibuat");
    navigate({ to: "/contacts/$contactId", params: { contactId: contact.id } });
  };

  // ── Step 1: type selector ────────────────────────────────────────────────
  if (!contactType) {
    return (
      <AppShell title="New Contact" backTo="/contacts" noPadding>
        <div className="flex flex-col h-[calc(100vh-64px)] min-h-0">

          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-lg">
              <div className="text-center mb-8">
                <h2 className="text-lg font-semibold">Select Contact Type</h2>
                <p className="text-sm text-muted-foreground mt-1">Form yang muncul akan disesuaikan berdasarkan tipe yang dipilih.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Customer */}
                <button
                  type="button"
                  onClick={() => setContactType("customer")}
                  className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-border bg-card/40 p-8 text-left hover:border-primary/50 hover:bg-primary/[0.04] transition-all duration-150"
                >
                  <div className="h-14 w-14 rounded-full bg-sky-600/15 border border-sky-600/30 grid place-items-center group-hover:bg-sky-600/20 transition-colors">
                    <User className="h-6 w-6 text-sky-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold">Customer</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Pelanggan yang membeli produk Aroma Abadi</div>
                  </div>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-sky-600 text-white border border-sky-700">Consumer</span>
                </button>

                {/* BA */}
                <button
                  type="button"
                  onClick={() => setContactType("ba")}
                  className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-border bg-card/40 p-8 text-left hover:border-primary/50 hover:bg-primary/[0.04] transition-all duration-150"
                >
                  <div className="h-14 w-14 rounded-full bg-violet-600/15 border border-violet-600/30 grid place-items-center group-hover:bg-violet-600/20 transition-colors">
                    <BadgeCheck className="h-6 w-6 text-violet-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold">Beauty Ambassador</div>
                    <div className="text-[11px] text-muted-foreground mt-1">BA yang menjual dan mempromosikan produk di store</div>
                  </div>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-violet-600 text-white border border-violet-700">BA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Step 2: BA form ──────────────────────────────────────────────────────
  if (contactType === "ba") {
    return (
      <AppShell title="New BA" noPadding>
        <div className="flex flex-col h-[calc(100vh-64px)] min-h-0">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/80 backdrop-blur px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setContactType(null)}
                className="inline-flex items-center gap-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.06] px-2 h-7 text-xs font-medium transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <h1 className="text-sm font-medium">Create Beauty Ambassador</h1>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-violet-600 text-white border border-violet-700">BA</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate({ to: "/contacts" })} className="rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:bg-card">
                Cancel
              </button>
              <button onClick={submitBA} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                <Plus className="h-3.5 w-3.5" /> Create BA
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="rounded-xl border border-border bg-card/40 divide-y divide-border">
                <FormSection title="Basic Information">
                  <FormGrid>
                    <Field label="Nama Lengkap" required>
                      <Input value={name} onChange={setName} placeholder="Dewi Lestari" />
                    </Field>
                    <Field label="WA Number" required>
                      <Input value={phone} onChange={setPhone} placeholder="+62 811 1234 5678" type="tel" />
                    </Field>
                    <Field label="Gender" required>
                      <SimpleSelect value={gender} onChange={setGender} options={[{ value: "", label: "Select gender…" }, ...GENDERS.map((g) => ({ value: g, label: g }))]} />
                    </Field>
                    <Field label="Posisi" required>
                      <SimpleSelect value={position} onChange={setPosition} options={[{ value: "", label: "Select position…" }, ...POSITIONS.map((p) => ({ value: p, label: p }))]} />
                    </Field>
                  </FormGrid>
                </FormSection>

                <FormSection title="Brand">
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">Select one or more brands handled by this BA.</p>
                    <div className="flex flex-wrap gap-2">
                      {brands.map((b) => {
                        const on = brandIds.includes(b.id);
                        return (
                          <button
                            type="button"
                            key={b.id}
                            onClick={() => toggleBrand(b.id, brandIds, setBrandIds)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${on ? "border-primary/60 bg-primary/15 text-foreground font-medium" : "border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"}`}
                          >
                            {on && <Check className="h-3 w-3 text-primary" />}
                            {b.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </FormSection>

                <FormSection title="Lokasi">
                  <FormGrid>
                    <Field label="Kota" required>
                      <SimpleSelect value={city} onChange={(v) => { setCity(v); setStore(""); }} options={[{ value: "", label: "Select city…" }, ...CITIES.map((c) => ({ value: c, label: c }))]} />
                    </Field>
                    <Field label="Store" required>
                      <SimpleSelect
                        value={store}
                        onChange={setStore}
                        disabled={!city}
                        options={[{ value: "", label: city ? "Select store…" : "Select city first" }, ...availableStores.map((s) => ({ value: s, label: s }))]}
                      />
                    </Field>
                  </FormGrid>
                </FormSection>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Step 2: Customer form ────────────────────────────────────────────────
  return (
    <AppShell title="New Customer" noPadding>
      <div className="flex flex-col h-[calc(100vh-64px)] min-h-0">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/80 backdrop-blur px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setContactType(null)}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-sm font-medium">Buat Customer Baru</h1>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-sky-600 text-white border border-sky-700">Consumer</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate({ to: "/contacts" })} className="rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:bg-card">
              Batal
            </button>
            <button onClick={submitCustomer} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5" /> Buat Customer
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl border border-border bg-card/40 divide-y divide-border">
              <FormSection title="Informasi Dasar">
                <FormGrid>
                  <Field label="Nama Lengkap" required>
                    <Input value={name} onChange={setName} placeholder="Putri Anggraini" />
                  </Field>
                  <Field label="WA Number" required>
                    <Input value={phone} onChange={setPhone} placeholder="+62 812 3456 7890" type="tel" />
                  </Field>
                  <Field label="Gender">
                    <SimpleSelect value={gender} onChange={setGender} options={[{ value: "", label: "Select gender…" }, ...GENDERS.map((g) => ({ value: g, label: g }))]} />
                  </Field>
                  <Field label="Point Balance">
                    <Input value={pointBalance} onChange={setPointBalance} placeholder="0" type="number" />
                  </Field>
                </FormGrid>
              </FormSection>

              <FormSection title="Brands">
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">Brand produk yang relevan untuk customer ini (opsional).</p>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((b) => {
                      const on = customerBrandIds.includes(b.id);
                      return (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => toggleBrand(b.id, customerBrandIds, setCustomerBrandIds)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${on ? "border-primary/60 bg-primary/15 text-foreground font-medium" : "border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"}`}
                        >
                          {on && <Check className="h-3 w-3 text-primary" />}
                          {b.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </FormSection>

              <FormSection title="Labels">
                <LabelMultiSelect
                  labels={labels}
                  selectedIds={labelIds}
                  onToggle={(id) => setLabelIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])}
                  onCreate={handleCreateLabel}
                />
              </FormSection>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ── Layout helpers ───────────────────────────────────────────────────────── */

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">{title}</div>
      {children}
    </div>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
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

function SimpleSelect({ value, onChange, options, disabled }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; disabled?: boolean }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="h-9 w-full rounded-md border border-white/10 bg-white/[0.04] px-2 text-xs text-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function LabelMultiSelect({ labels, selectedIds, onToggle, onCreate }: { labels: ContactLabel[]; selectedIds: string[]; onToggle: (id: string) => void; onCreate: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const filtered = labels.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));
  const exact = labels.some((l) => l.name.toLowerCase() === search.trim().toLowerCase());
  const canCreate = search.trim().length > 0 && !exact;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) { setOpen(false); setSearch(""); }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setSearch(""); } };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-9 flex flex-wrap items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs hover:bg-white/[0.06] focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 transition-colors"
      >
        {selectedIds.length === 0 && <span className="text-muted-foreground">Pilih label…</span>}
        {selectedIds.map((id) => {
          const l = labels.find((x) => x.id === id);
          if (!l) return null;
          return (
            <span key={id} className="inline-flex items-center gap-1 rounded border border-border bg-white/[0.04] px-1.5 py-0.5 text-[10px]">
              <span className={`h-1.5 w-1.5 rounded-full ${labelColorDot[l.color]}`} />
              {l.name}
              <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); onToggle(id); }} className="text-muted-foreground hover:text-foreground">
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
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && canCreate) { onCreate(search.trim()); setSearch(""); } }} placeholder="Cari atau buat label…" className="h-7 w-full rounded border border-white/10 bg-white/[0.04] px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.map((l) => {
              const on = selectedIds.includes(l.id);
              return (
                <button type="button" key={l.id} onClick={() => onToggle(l.id)} className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-white/[0.05] inline-flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${labelColorDot[l.color]}`} />
                  <span className="flex-1">{l.name}</span>
                  {on && <Check className="h-3 w-3 text-primary" />}
                </button>
              );
            })}
            {filtered.length === 0 && !canCreate && <div className="px-2 py-3 text-[11px] text-muted-foreground text-center">Tidak ada label</div>}
            {canCreate && (
              <button type="button" onClick={() => { onCreate(search.trim()); setSearch(""); }} className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-white/[0.05] inline-flex items-center gap-2 border-t border-border mt-1 pt-2">
                <Plus className="h-3 w-3 text-primary" />
                Buat <span className="font-medium text-foreground">"{search.trim()}"</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
