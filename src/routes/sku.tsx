import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { useSkuStore, skuStore, type Brand, type Category, type SKU, type KnowledgeCard } from "@/components/scl/sku-store";
import { MultiFileUploader } from "@/components/scl/multi-file-uploader";
import { formatIDR } from "@/components/scl/transactions-store";
import { Plus, Trash2, ChevronRight, Package, FolderOpen, BookOpen, X, ImageIcon, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sku")({
  head: () => ({
    meta: [
      { title: "SKU & Knowledge — Aroma Abadi" },
      { name: "description", content: "Kelola Brand, Product Category, SKU, dan Knowledge Card untuk seluruh produk Aroma Abadi." },
    ],
  }),
  component: SkuPage,
});

function SkuPage() {
  const { brands } = useSkuStore();
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(brands[0]?.id || null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(brands[0]?.categories[0]?.id || null);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingSku, setEditingSku] = useState<{ sku?: SKU; categoryId: string } | null>(null);

  const brand = useMemo(() => brands.find((b) => b.id === selectedBrandId) || null, [brands, selectedBrandId]);
  const category = useMemo(() => brand?.categories.find((c) => c.id === selectedCategoryId) || null, [brand, selectedCategoryId]);

  return (
    <AppShell title="SKU & Knowledge" subtitle="Brand → Category → SKU → Knowledge Card untuk seluruh produk Aroma Abadi.">
      <div className="grid grid-cols-12 gap-4">
        {/* Brand sidebar */}
        <div className="col-span-12 md:col-span-3">
          <SectionCard>
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide">Brands</div>
              <button onClick={() => setShowBrandForm(true)} className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2 h-7 text-[11px] font-medium hover:opacity-90">
                <Plus className="h-3 w-3" /> Brand
              </button>
            </div>
            <ul className="p-2 space-y-1">
              {brands.map((b) => (
                <li key={b.id}>
                  <button
                    onClick={() => { setSelectedBrandId(b.id); setSelectedCategoryId(b.categories[0]?.id || null); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs ${selectedBrandId === b.id ? "bg-primary/10 text-primary border border-primary/30" : "hover:bg-white/[0.04] border border-transparent"}`}
                  >
                    <div className="h-7 w-7 rounded-md bg-primary/10 grid place-items-center overflow-hidden">
                      {b.logoUrl ? <img src={b.logoUrl} alt="" className="h-full w-full object-cover" /> : <Package className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium truncate">{b.name}</div>
                      <div className="text-[10px] text-muted-foreground">{b.categories.length} kategori · {b.categories.reduce((a, c) => a + c.skus.length, 0)} SKU</div>
                    </div>
                    <ChevronRight className="h-3 w-3 opacity-50" />
                  </button>
                </li>
              ))}
              {brands.length === 0 && <li className="px-3 py-6 text-center text-[11px] text-muted-foreground">Belum ada brand.</li>}
            </ul>
          </SectionCard>
        </div>

        {/* Brand detail + categories list */}
        <div className="col-span-12 md:col-span-4">
          {brand ? (
            <SectionCard>
              <div className="p-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 grid place-items-center overflow-hidden">
                    {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{brand.name}</div>
                    <div className="text-[11px] text-muted-foreground">{brand.brandKnowledge.length} dokumen brand knowledge</div>
                  </div>
                  <button
                    onClick={() => { if (confirm(`Hapus brand "${brand.name}"?`)) { skuStore.removeBrand(brand.id); setSelectedBrandId(null); toast.success("Brand dihapus"); } }}
                    className="grid h-7 w-7 place-items-center rounded text-rose-400 hover:bg-rose-500/10" title="Hapus brand"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-4 border-b border-border">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3" /> Brand Knowledge
                </div>
                <MultiFileUploader
                  files={brand.brandKnowledge}
                  onAdd={(atts) => skuStore.addBrandKnowledge(brand.id, atts)}
                  onRemove={(id) => skuStore.removeBrandKnowledge(brand.id, id)}
                  label="Upload Brand Knowledge"
                />
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <FolderOpen className="h-3 w-3" /> Product Categories
                  </div>
                  <AddCategoryButton brandId={brand.id} onAdded={(c) => setSelectedCategoryId(c.id)} />
                </div>
                <ul className="space-y-1">
                  {brand.categories.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => setSelectedCategoryId(c.id)}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs ${selectedCategoryId === c.id ? "bg-primary/10 text-primary border border-primary/30" : "hover:bg-white/[0.04] border border-transparent"}`}
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-[10px] text-muted-foreground">{c.skus.length} SKU · {c.categoryKnowledge.length} dokumen</div>
                        </div>
                        <ChevronRight className="h-3 w-3 opacity-50" />
                      </button>
                    </li>
                  ))}
                  {brand.categories.length === 0 && <li className="px-3 py-6 text-center text-[11px] text-muted-foreground">Belum ada category.</li>}
                </ul>
              </div>
            </SectionCard>
          ) : (
            <SectionCard><div className="p-10 text-center text-xs text-muted-foreground">Pilih brand di sebelah kiri.</div></SectionCard>
          )}
        </div>

        {/* Category detail (knowledge + SKUs) */}
        <div className="col-span-12 md:col-span-5">
          {brand && category ? (
            <CategoryDetail
              brand={brand}
              category={category}
              onAddSku={() => setEditingSku({ categoryId: category.id })}
              onEditSku={(sku) => setEditingSku({ sku, categoryId: category.id })}
            />
          ) : (
            <SectionCard><div className="p-10 text-center text-xs text-muted-foreground">Pilih category untuk melihat SKU.</div></SectionCard>
          )}
        </div>
      </div>

      {showBrandForm && <BrandFormModal onClose={() => setShowBrandForm(false)} onCreated={(b) => { setSelectedBrandId(b.id); setSelectedCategoryId(null); setShowBrandForm(false); }} />}
      {editingSku && brand && (
        <SkuFormModal
          brandId={brand.id}
          categoryId={editingSku.categoryId}
          initial={editingSku.sku}
          onClose={() => setEditingSku(null)}
        />
      )}
    </AppShell>
  );
}

function AddCategoryButton({ brandId, onAdded }: { brandId: string; onAdded: (c: Category) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  if (!open) {
    return <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 h-7 text-[11px] hover:bg-white/[0.04]"><Plus className="h-3 w-3" /> Category</button>;
  }
  return (
    <div className="flex items-center gap-1">
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama category" className="h-7 rounded-md border border-border bg-card/60 px-2 text-[11px]" />
      <button onClick={() => { if (!name.trim()) return; const c = skuStore.addCategory(brandId, name.trim()); onAdded(c); setName(""); setOpen(false); toast.success("Category ditambahkan"); }}
        className="h-7 rounded-md bg-primary text-primary-foreground px-2 text-[11px] font-medium">Tambah</button>
      <button onClick={() => { setOpen(false); setName(""); }} className="h-7 w-7 grid place-items-center rounded-md border border-border"><X className="h-3 w-3" /></button>
    </div>
  );
}

function CategoryDetail({ brand, category, onAddSku, onEditSku }: { brand: Brand; category: Category; onAddSku: () => void; onEditSku: (sku: SKU) => void }) {
  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="p-4 border-b border-border flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{brand.name}</div>
            <div className="text-sm font-semibold">{category.name}</div>
          </div>
          <button
            onClick={() => { if (confirm(`Hapus category "${category.name}"?`)) { skuStore.removeCategory(brand.id, category.id); toast.success("Category dihapus"); } }}
            className="grid h-7 w-7 place-items-center rounded text-rose-400 hover:bg-rose-500/10" title="Hapus"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="p-4">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" /> Category Knowledge
          </div>
          <MultiFileUploader
            files={category.categoryKnowledge}
            onAdd={(atts) => skuStore.addCategoryKnowledge(brand.id, category.id, atts)}
            onRemove={(id) => skuStore.removeCategoryKnowledge(brand.id, category.id, id)}
            label="Upload Category Knowledge"
          />
        </div>
      </SectionCard>

      <SectionCard>
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5"><Package className="h-3 w-3" /> SKUs</div>
          <button onClick={onAddSku} className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2 h-7 text-[11px] font-medium hover:opacity-90"><Plus className="h-3 w-3" /> SKU</button>
        </div>
        <ul className="divide-y divide-border">
          {category.skus.map((s) => (
            <li key={s.id} className="p-3">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-md bg-primary/10 grid place-items-center overflow-hidden">
                  {s.photoUrl ? <img src={s.photoUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <span className="text-[10px] text-muted-foreground">{s.code}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{s.description}</div>
                  <div className="mt-1 flex items-center gap-3 text-[11px]">
                    <span className="font-semibold">{formatIDR(s.price)}</span>
                    <span className="text-muted-foreground">{s.knowledgeCards.length} knowledge card</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button onClick={() => onEditSku(s)} className="rounded px-2 h-7 text-[11px] border border-border hover:bg-white/[0.04] inline-flex items-center gap-1"><Pencil className="h-3 w-3" /> Edit</button>
                  <button
                    onClick={() => { if (confirm(`Hapus SKU "${s.name}"?`)) { skuStore.removeSku(brand.id, category.id, s.id); toast.success("SKU dihapus"); } }}
                    className="grid h-7 w-7 place-items-center rounded text-rose-400 hover:bg-rose-500/10" title="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <KnowledgeCards brandId={brand.id} categoryId={category.id} sku={s} />
            </li>
          ))}
          {category.skus.length === 0 && <li className="p-6 text-center text-[11px] text-muted-foreground">Belum ada SKU.</li>}
        </ul>
      </SectionCard>
    </div>
  );
}

function KnowledgeCards({ brandId, categoryId, sku }: { brandId: string; categoryId: string; sku: SKU }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KnowledgeCard | null>(null);
  return (
    <div className="mt-3 ml-15 pl-3 border-l border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> Knowledge Cards</div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1 rounded-md border border-border px-2 h-6 text-[10px] hover:bg-white/[0.04]"><Plus className="h-2.5 w-2.5" /> Card</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sku.knowledgeCards.map((k) => (
          <div key={k.id} className="rounded-md border border-border bg-card/40 overflow-hidden">
            {k.coverUrl && <img src={k.coverUrl} alt="" className="w-full h-20 object-cover" />}
            <div className="p-2.5">
              <div className="text-xs font-medium">{k.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-3">{k.text}</div>
              <div className="mt-2 flex items-center justify-end gap-1">
                <button onClick={() => { setEditing(k); setShowForm(true); }} className="text-[10px] text-muted-foreground hover:text-foreground">Edit</button>
                <span className="text-[10px] text-muted-foreground">·</span>
                <button onClick={() => { skuStore.removeKnowledgeCard(brandId, categoryId, sku.id, k.id); toast.success("Card dihapus"); }} className="text-[10px] text-rose-400">Hapus</button>
              </div>
            </div>
          </div>
        ))}
        {sku.knowledgeCards.length === 0 && <div className="text-[11px] text-muted-foreground italic">Belum ada knowledge card.</div>}
      </div>
      {showForm && (
        <KnowledgeCardForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={(data) => {
            if (editing) skuStore.updateKnowledgeCard(brandId, categoryId, sku.id, editing.id, data);
            else skuStore.addKnowledgeCard(brandId, categoryId, sku.id, data);
            toast.success(editing ? "Card diperbarui" : "Card ditambahkan");
            setShowForm(false); setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function KnowledgeCardForm({ initial, onClose, onSubmit }: { initial: KnowledgeCard | null; onClose: () => void; onSubmit: (data: { title: string; text: string; coverUrl?: string }) => void }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [text, setText] = useState(initial?.text || "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl || "");
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickCover(file: File) {
    const reader = new FileReader();
    reader.onload = () => setCoverUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <form onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; onSubmit({ title, text, coverUrl: coverUrl || undefined }); }} className="w-full max-w-md bg-background border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold">{initial ? "Edit Knowledge Card" : "Tambah Knowledge Card"}</div>
          <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">Cover</div>
            {coverUrl && <img src={coverUrl} alt="" className="w-full h-32 object-cover rounded-md mb-2" />}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickCover(f); }} />
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md border border-border px-2 h-8 text-xs">Pilih Gambar</button>
              {coverUrl && <button type="button" onClick={() => setCoverUrl("")} className="rounded-md border border-border px-2 h-8 text-xs text-rose-400">Hapus Cover</button>}
            </div>
          </div>
          <label className="block">
            <span className="block text-[11px] text-muted-foreground mb-1">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="block text-[11px] text-muted-foreground mb-1">Teks</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="w-full rounded-md border border-border bg-card/60 px-2.5 py-2 text-sm" />
          </label>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 h-8 text-xs">Batal</button>
          <button type="submit" className="rounded-md bg-primary text-primary-foreground px-3 h-8 text-xs font-medium">Simpan</button>
        </div>
      </form>
    </div>
  );
}

function BrandFormModal({ onClose, onCreated }: { onClose: () => void; onCreated: (b: Brand) => void }) {
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  function pickLogo(file: File) {
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <form
        onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; const b = skuStore.addBrand({ name: name.trim(), logoUrl: logoUrl || undefined }); toast.success("Brand ditambahkan"); onCreated(b); }}
        className="w-full max-w-md bg-background border border-border rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold">Add New Brand</div>
          <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">Logo</div>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-md bg-primary/10 grid place-items-center overflow-hidden">
                {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-primary" />}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickLogo(f); }} />
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md border border-border px-2 h-8 text-xs">Upload Logo</button>
              {logoUrl && <button type="button" onClick={() => setLogoUrl("")} className="text-xs text-rose-400">Hapus</button>}
            </div>
          </div>
          <label className="block">
            <span className="block text-[11px] text-muted-foreground mb-1">Brand Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm" />
          </label>
          <p className="text-[11px] text-muted-foreground">Brand Knowledge & Product Category bisa di-setup setelah brand dibuat.</p>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 h-8 text-xs">Batal</button>
          <button type="submit" className="rounded-md bg-primary text-primary-foreground px-3 h-8 text-xs font-medium">Tambah Brand</button>
        </div>
      </form>
    </div>
  );
}

function SkuFormModal({ brandId, categoryId, initial, onClose }: { brandId: string; categoryId: string; initial?: SKU; onClose: () => void }) {
  const [name, setName] = useState(initial?.name || "");
  const [code, setCode] = useState(initial?.code || "");
  const [price, setPrice] = useState<number>(initial?.price || 0);
  const [description, setDescription] = useState(initial?.description || "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl || "");
  const fileRef = useRef<HTMLInputElement>(null);

  function pickPhoto(file: File) {
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !code.trim()) { toast.error("Nama & Code SKU wajib"); return; }
          if (initial) {
            skuStore.updateSku(brandId, categoryId, initial.id, { name, code, price, description, photoUrl: photoUrl || undefined });
            toast.success("SKU diperbarui");
          } else {
            skuStore.addSku(brandId, categoryId, { name, code, price, description, photoUrl: photoUrl || undefined });
            toast.success("SKU ditambahkan");
          }
          onClose();
        }}
        className="w-full max-w-md bg-background border border-border rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold">{initial ? "Edit SKU" : "Tambah SKU"}</div>
          <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">Foto Produk</div>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-md bg-primary/10 grid place-items-center overflow-hidden">
                {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-primary" />}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickPhoto(f); }} />
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md border border-border px-2 h-8 text-xs">Upload</button>
              {photoUrl && <button type="button" onClick={() => setPhotoUrl("")} className="text-xs text-rose-400">Hapus</button>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[11px] text-muted-foreground mb-1">Nama</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="block text-[11px] text-muted-foreground mb-1">Code</span>
              <input value={code} onChange={(e) => setCode(e.target.value)} className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm" />
            </label>
          </div>
          <label className="block">
            <span className="block text-[11px] text-muted-foreground mb-1">Harga (Rp)</span>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="block text-[11px] text-muted-foreground mb-1">Deskripsi</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-md border border-border bg-card/60 px-2.5 py-2 text-sm" />
          </label>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 h-8 text-xs">Batal</button>
          <button type="submit" className="rounded-md bg-primary text-primary-foreground px-3 h-8 text-xs font-medium">{initial ? "Simpan" : "Tambah"}</button>
        </div>
      </form>
    </div>
  );
}
