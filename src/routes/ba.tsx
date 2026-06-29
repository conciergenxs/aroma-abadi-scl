import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { useBaStore, baStore, type BA } from "@/components/scl/ba-store";
import { useSkuStore } from "@/components/scl/sku-store";
import { Search, Plus, KeyRound, Copy, Trash2, Eye, EyeOff, BadgeCheck, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ba")({
  head: () => ({
    meta: [
      { title: "Brand Ambassadors — Aroma Abadi" },
      { name: "description", content: "Kelola data Brand Ambassador Aroma Abadi: profil, brand, store, dan kredensial login WhatsApp." },
    ],
  }),
  component: BAPage,
});

function BAPage() {
  const { bas } = useBaStore();
  const { brands } = useSkuStore();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<BA | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const filtered = bas.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.waNumber.toLowerCase().includes(q) ||
      b.store.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.username.toLowerCase().includes(q)
    );
  });

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
    <AppShell title="Brand Ambassadors" subtitle="Profil dan akun login WhatsApp untuk seluruh BA Aroma Abadi.">
      <SectionCard>
        <div className="p-3 flex flex-wrap items-center gap-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari BA, WA, store, kota.."
              className="h-9 w-72 max-w-full rounded-md border border-border bg-card/60 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{filtered.length} BA</span>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 h-9 text-sm font-medium hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah BA
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <Th>Nama</Th>
                <Th>Brand</Th>
                <Th>Gender</Th>
                <Th>WA (Login)</Th>
                <Th>Username</Th>
                <Th>Password</Th>
                <Th>Posisi</Th>
                <Th>Store · Kota</Th>
                <Th>&nbsp;</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const shown = revealed.has(b.id);
                return (
                  <tr key={b.id} className="border-b border-border hover:bg-white/[0.02]">
                    <Td className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                          {b.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </div>
                        {b.name}
                      </div>
                    </Td>
                    <Td>{brandNames(b.brandIds)}</Td>
                    <Td>{b.gender}</Td>
                    <Td>{b.waNumber}</Td>
                    <Td>{b.username}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono text-sm">{shown ? b.password : "••••••••"}</code>
                        <button onClick={() => toggleReveal(b.id)} className="text-muted-foreground hover:text-foreground" title={shown ? "Sembunyikan" : "Tampilkan"}>
                          {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => { navigator.clipboard.writeText(b.password); toast.success("Password disalin"); }}
                          className="text-muted-foreground hover:text-foreground" title="Salin"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => { const pw = baStore.regeneratePassword(b.id); toast.success(`Password baru: ${pw}`); }}
                          className="text-muted-foreground hover:text-foreground" title="Generate ulang"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </Td>
                    <Td>{b.position}</Td>
                    <Td>{b.store} · <span className="text-muted-foreground">{b.city}</span></Td>
                    <Td>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setEditing(b)} className="rounded px-2 h-8 text-sm border border-border hover:bg-white/[0.04]">Edit</button>
                        <button
                          onClick={() => { if (confirm(`Hapus BA "${b.name}"?`)) { baStore.remove(b.id); toast.success("BA dihapus"); } }}
                          className="grid h-8 w-8 place-items-center rounded text-rose-500 hover:bg-rose-500/10"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-muted-foreground text-sm">Belum ada BA</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

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
  const [username, setUsername] = useState(initial?.username || "");
  const [password, setPassword] = useState(initial?.password || baStore.generatePassword());
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
      username: username || name.toLowerCase().replace(/\s+/g, "."),
      password,
      waNumber,
      brandIds: brandId ? [brandId] : [],
      city,
      store,
      position,
    }, initial?.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <form onSubmit={submit} className="w-full max-w-md bg-background border-l border-border overflow-y-auto">
        <div className="p-5 border-b border-border flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-primary mb-1"><BadgeCheck className="h-3.5 w-3.5" /> Brand Ambassador</div>
            <div className="text-base font-semibold">{initial ? "Edit BA" : "Tambah BA Baru"}</div>
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
          <Field label="Username">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Masukkan username (auto dari nama jika kosong).." className={inputCls} />
          </Field>
          <Field label="Password (generated)">
            <div className="flex gap-2">
              <input value={password} readOnly placeholder="Password otomatis dibuat.." className={`${inputCls} font-mono bg-muted/40 cursor-not-allowed`} />
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(password); toast.success("Password disalin"); }}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 text-sm hover:bg-white/[0.04]"
                title="Salin password"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
              <button type="button" onClick={() => setPassword(baStore.generatePassword())} className="rounded-md border border-border px-2.5 text-sm hover:bg-white/[0.04]">Generate</button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kota"><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Masukkan kota.." className={inputCls} /></Field>
            <Field label="Store"><input value={store} onChange={(e) => setStore(e.target.value)} placeholder="Masukkan nama store.." className={inputCls} /></Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
