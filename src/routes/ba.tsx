import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { useBaStore, baStore, type BA } from "@/components/scl/ba-store";
import { useSkuStore } from "@/components/scl/sku-store";
import { Search, Plus, KeyRound, Copy, Trash2, Eye, EyeOff, BadgeCheck, X, ChevronLeft, ChevronRight, Filter, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export const Route = createFileRoute("/ba")({
  head: () => ({
    meta: [
      { title: "Beauty Ambassadors — Aroma Abadi" },
      { name: "description", content: "Kelola data Beauty Ambassador Aroma Abadi: profil, brand, store, dan kredensial login WhatsApp." },
    ],
  }),
  component: BAPage,
});

function BAPage() {
  const { bas } = useBaStore();
  const { brands } = useSkuStore();
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterPosisi, setFilterPosisi] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<BA | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [resetConfirm, setResetConfirm] = useState<BA | null>(null);

  // Unique filter options
  const allStores = useMemo(() => [...new Set(bas.map((b) => b.store).filter(Boolean))].sort(), [bas]);
  const allPosisi = useMemo(() => [...new Set(bas.map((b) => b.position).filter(Boolean))].sort(), [bas]);

  const filtered = useMemo(() => bas.filter((b) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !b.name.toLowerCase().includes(q) &&
        !b.waNumber.toLowerCase().includes(q) &&
        !b.store.toLowerCase().includes(q) &&
        !b.city.toLowerCase().includes(q)
      ) return false;
    }
    if (filterBrand && !b.brandIds.includes(filterBrand)) return false;
    if (filterGender && b.gender !== filterGender) return false;
    if (filterPosisi && b.position !== filterPosisi) return false;
    if (filterStore && b.store !== filterStore) return false;
    return true;
  }), [bas, search, filterBrand, filterGender, filterPosisi, filterStore]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilters = filterBrand || filterGender || filterPosisi || filterStore;

  function clearFilters() {
    setFilterBrand(""); setFilterGender(""); setFilterPosisi(""); setFilterStore("");
    setPage(1);
  }

  function toggleReveal(id: string) {
    setRevealed((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function brandNames(ids: string[]) {
    return ids.map((id) => brands.find((b) => b.id === id)?.name).filter(Boolean).join(", ") || "—";
  }

  return (
    <AppShell title="Beauty Ambassadors" subtitle="Profiles and WhatsApp login accounts for all Beauty Ambassadors.">
      <SectionCard>
        <div className="p-3 flex flex-wrap items-center gap-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, WA, store, city…"
              className="h-9 w-64 max-w-full rounded-md border border-border bg-card/60 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <select value={filterBrand} onChange={(e) => { setFilterBrand(e.target.value); setPage(1); }} className={filterSelectCls}>
              <option value="">All Brands</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={filterGender} onChange={(e) => { setFilterGender(e.target.value); setPage(1); }} className={filterSelectCls}>
              <option value="">All Genders</option>
              <option>Female</option><option>Male</option><option>Other</option>
            </select>
            <select value={filterPosisi} onChange={(e) => { setFilterPosisi(e.target.value); setPage(1); }} className={filterSelectCls}>
              <option value="">All Positions</option>
              {allPosisi.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select value={filterStore} onChange={(e) => { setFilterStore(e.target.value); setPage(1); }} className={filterSelectCls}>
              <option value="">All Stores</option>
              {allStores.map((s) => <option key={s}>{s}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2 h-8">
                <X className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 h-9 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" /> Add BA
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <Th>Name</Th>
                <Th>Brand</Th>
                <Th>Gender</Th>
                <Th>WA (Login)</Th>
                <Th>Password</Th>
                <Th>Position</Th>
                <Th>Store · City</Th>
                <Th>&nbsp;</Th>
              </tr>
            </thead>
            <tbody className="stagger">
              {paginated.map((b) => {
                const shown = revealed.has(b.id);
                return (
                  <tr key={b.id} className="border-b border-border hover:bg-white/[0.02] transition-colors">
                    <Td className="font-medium text-foreground">{b.name}</Td>
                    <Td>{brandNames(b.brandIds)}</Td>
                    <Td>{b.gender}</Td>
                    <Td>{b.waNumber}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono text-sm">{shown ? b.password : "••••••••"}</code>
                        <button onClick={() => toggleReveal(b.id)} className="text-muted-foreground hover:text-foreground transition-colors" title={shown ? "Sembunyikan" : "Tampilkan"}>
                          {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(b.password); toast.success("Password disalin"); }} className="text-muted-foreground hover:text-foreground transition-colors" title="Salin">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setResetConfirm(b)} className="text-muted-foreground hover:text-foreground transition-colors" title="Reset password">
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </Td>
                    <Td>{b.position}</Td>
                    <Td>{b.store} · <span className="text-muted-foreground">{b.city}</span></Td>
                    <Td>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setEditing(b)} className="rounded px-2 h-8 text-sm border border-border hover:bg-white/[0.04] transition-colors">Edit</button>
                        <button
                          onClick={() => { baStore.remove(b.id); toast.success("BA dihapus"); }}
                          className="grid h-8 w-8 place-items-center rounded text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">Tidak ada Beauty Ambassador ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {filtered.length} Beauty Ambassador{filtered.length !== 1 ? "s" : ""} · Halaman {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="grid h-8 w-8 place-items-center rounded-md border border-border disabled:opacity-40 hover:bg-white/[0.04] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
              Math.max(0, page - 3), Math.min(totalPages, page + 2)
            ).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 w-8 rounded-md text-xs font-medium transition-colors ${p === page ? "bg-primary text-primary-foreground" : "border border-border hover:bg-white/[0.04]"}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="grid h-8 w-8 place-items-center rounded-md border border-border disabled:opacity-40 hover:bg-white/[0.04] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SectionCard>

      {resetConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 modal-backdrop">
          <div className="w-full max-w-sm bg-background border border-border rounded-xl overflow-hidden modal-content">
            <div className="p-5 border-b border-border">
              <div className="text-sm font-semibold">Reset Password</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Reset password untuk <span className="text-foreground font-medium">{resetConfirm.name}</span>? Password baru akan di-generate otomatis.
              </p>
            </div>
            <div className="p-4 flex justify-end gap-2">
              <button onClick={() => setResetConfirm(null)} className="rounded-md border border-border px-3 h-9 text-sm">Batal</button>
              <button
                onClick={() => {
                  const pw = baStore.regeneratePassword(resetConfirm.id);
                  toast.success(`Password baru: ${pw}`);
                  setResetConfirm(null);
                }}
                className="rounded-md bg-primary text-primary-foreground px-3 h-9 text-sm font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {(showCreate || editing) && (
        <BAForm
          initial={editing}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSubmit={(input, id) => {
            if (id) { baStore.update(id, input); toast.success("BA diperbarui"); }
            else { const created = baStore.add(input); toast.success(`BA ditambahkan. Password: ${created.password}`); }
            setShowCreate(false); setEditing(null);
          }}
        />
      )}
    </AppShell>
  );
}

const filterSelectCls = "h-8 rounded-md border border-border bg-card/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40";

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-medium px-3 py-2.5 text-xs uppercase tracking-wide">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className}`}>{children}</td>;
}

function BAForm({ initial, onClose, onSubmit }: { initial: BA | null; onClose: () => void; onSubmit: (input: Omit<BA, "id">, id?: string) => void }) {
  const { brands } = useSkuStore();
  const [name, setName] = useState(initial?.name || "");
  const [brandId, setBrandId] = useState<string>(initial?.brandIds?.[0] || brands[0]?.id || "");
  const [gender, setGender] = useState<BA["gender"]>(initial?.gender || "Wanita");
  const [password, setPassword] = useState(initial?.password || baStore.generatePassword());
  const [spinning, setSpinning] = useState(false);
  const [waNumber, setWaNumber] = useState(initial?.waNumber || "+62 ");
  const [city, setCity] = useState(initial?.city || "");
  const [store, setStore] = useState(initial?.store || "");
  const [position, setPosition] = useState(initial?.position || "BA");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !waNumber.trim()) { toast.error("Nama dan No. WhatsApp wajib"); return; }
    onSubmit({
      name,
      gender,
      username: name.toLowerCase().replace(/\s+/g, "."),
      password,
      waNumber,
      brandIds: brandId ? [brandId] : [],
      city,
      store,
      position,
    }, initial?.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex modal-backdrop">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <form onSubmit={submit} className="w-full max-w-md bg-background border-l border-border overflow-y-auto slide-in-right">
        <div className="p-5 border-b border-border flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-primary mb-1"><BadgeCheck className="h-3.5 w-3.5" /> Beauty Ambassador</div>
            <div className="text-base font-semibold">{initial ? "Edit Beauty Ambassador" : "Tambah Beauty Ambassador Baru"}</div>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Nama Lengkap">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama lengkap.." className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gender">
              <select value={gender} onChange={(e) => setGender(e.target.value as BA["gender"])} className={inputCls}>
                <option>Wanita</option><option>Pria</option><option>Lainnya</option>
              </select>
            </Field>
            <Field label="No. WhatsApp (untuk login)">
              <input value={waNumber} onChange={(e) => setWaNumber(e.target.value)} placeholder="Masukkan no. WhatsApp.." className={inputCls} />
            </Field>
          </div>
          <Field label="Password (generated)">
            <div className="relative flex items-center">
              <input value={password} readOnly placeholder="Password otomatis dibuat.." className={`${inputCls} font-mono bg-muted/40 cursor-not-allowed pr-16`} />
              <div className="absolute right-1 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(password); toast.success("Password disalin"); }}
                  className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
                  title="Salin password"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpinning(true);
                    setPassword(baStore.generatePassword());
                    setTimeout(() => setSpinning(false), 420);
                  }}
                  className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
                  title="Generate ulang"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${spinning ? "animate-spin-once" : ""}`} />
                </button>
              </div>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kota">
              <SearchableSelect
                value={city}
                onChange={setCity}
                placeholder="Cari kota.."
                options={KOTA_LIST}
              />
            </Field>
            <Field label="Store">
              <SearchableSelect
                value={store}
                onChange={setStore}
                placeholder="Cari store.."
                options={STORE_LIST}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Posisi">
              <select value={position} onChange={(e) => setPosition(e.target.value)} className={inputCls}>
                <option>BA</option><option>Senior BA</option><option>Supervisor</option><option>Area Manager</option><option>Staf</option>
              </select>
            </Field>
            <Field label="Brand">
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputCls}>
                <option value="">Pilih brand..</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
          </div>
        </div>
        <div className="p-5 border-t border-border flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 h-9 text-sm">Batal</button>
          <button type="submit" className="rounded-md bg-primary text-primary-foreground px-3 h-9 text-sm font-medium">{initial ? "Simpan" : "Tambah BA"}</button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40";

const KOTA_LIST = [
  "Jakarta", "Surabaya", "Bandung", "Medan", "Bekasi", "Tangerang", "Depok",
  "Semarang", "Palembang", "Makassar", "Bogor", "Batam", "Pekanbaru", "Bandar Lampung",
  "Malang", "Padang", "Denpasar", "Samarinda", "Balikpapan", "Yogyakarta",
];

const STORE_LIST = [
  "Sogo Grand Indonesia", "Sogo Pondok Indah Mall", "Sogo Pacific Place",
  "Sogo Tunjungan Plaza", "Matahari Mal Kelapa Gading", "Matahari Citos",
  "Lippo Mall Kemang", "Central Park Mall", "Kota Kasablanka", "Senayan City",
  "Plaza Indonesia", "Gandaria City", "Summarecon Mal Serpong", "Living World Alam Sutera",
  "Pakuwon Mall Surabaya", "Galaxy Mall Surabaya", "Paris Van Java Bandung",
  "Trans Studio Mall Bandung", "Sun Plaza Medan", "Beachwalk Bali",
];

function SearchableSelect({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="relative">
      <input
        value={open ? query : value}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
        placeholder={value || placeholder}
        className={inputCls}
      />
      {open && (
        <ul className="absolute z-30 top-10 left-0 right-0 rounded-md border border-border bg-background shadow-lg max-h-44 overflow-y-auto">
          {filtered.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onMouseDown={() => { onChange(opt); setOpen(false); setQuery(""); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-white/[0.06] transition-colors ${value === opt ? "text-primary font-medium" : ""}`}
              >
                {opt}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">Tidak ditemukan — ketik untuk tambah manual</li>
          )}
        </ul>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
