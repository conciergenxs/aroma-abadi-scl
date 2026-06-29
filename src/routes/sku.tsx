import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { useSkuStore, skuStore, type Brand, type Category, type SKU, type KnowledgeCard } from "@/components/scl/sku-store";
import { MultiFileUploader } from "@/components/scl/multi-file-uploader";
import { formatIDR } from "@/components/scl/transactions-store";
import { Plus, Trash2, ChevronLeft, ChevronRight, Package, BookOpen, X, ImageIcon, Pencil, FolderOpen } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

type View =
  | { kind: "brands" }
  | { kind: "brand"; brandId: string }
  | { kind: "category"; brandId: string; categoryId: string };

function SkuPage() {
  const { brands } = useSkuStore();
  const [view, setView] = useState<View>({ kind: "brands" });
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingSku, setEditingSku] = useState<{ sku?: SKU; brandId: string; categoryId: string } | null>(null);

  const brand = useMemo(
    () => (view.kind !== "brands" ? brands.find((b) => b.id === view.brandId) || null : null),
    [brands, view],
  );
  const category = useMemo(
    () => (view.kind === "category" && brand ? brand.categories.find((c) => c.id === view.categoryId) || null : null),
    [brand, view],
  );

  return (
    <AppShell title="SKU & Knowledge" subtitle="Kelola brand, kategori, SKU, dan knowledge card produk Aroma Abadi.">
      {view.kind === "brands" && (
        <BrandsOverview brands={brands} onOpen={(b) => setView({ kind: "brand", brandId: b.id })} onAdd={() => setShowBrandForm(true)} />
      )}

      {view.kind === "brand" && brand && (
        <BrandDetail
          brand={brand}
          onBack={() => setView({ kind: "brands" })}
          onOpenCategory={(c) => setView({ kind: "category", brandId: brand.id, categoryId: c.id })}
        />
      )}

      {view.kind === "category" && brand && category && (
        <CategoryDetail
          brand={brand}
          category={category}
          onBack={() => setView({ kind: "brand", brandId: brand.id })}
          onAddSku={() => setEditingSku({ brandId: brand.id, categoryId: category.id })}
          onEditSku={(sku) => setEditingSku({ sku, brandId: brand.id, categoryId: category.id })}
        />
      )}

      {showBrandForm && (
        <BrandFormModal
          onClose={() => setShowBrandForm(false)}
          onCreated={(b) => { setView({ kind: "brand", brandId: b.id }); setShowBrandForm(false); }}
        />
      )}
      {editingSku && (
        <SkuFormModal
          brandId={editingSku.brandId}
          categoryId={editingSku.categoryId}
          initial={editingSku.sku}
          onClose={() => setEditingSku(null)}
        />
      )}
    </AppShell>
  );
}

/* ---------------- Level 1: Brands Overview ---------------- */

function BrandsOverview({ brands, onOpen, onAdd }: { brands: Brand[]; onOpen: (b: Brand) => void; onAdd: () => void }) {
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(brands.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, brands.length);
  const visible = brands.slice(start, end);
  return (
    <SectionCard>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Brands</div>
          <div className="text-sm text-muted-foreground">Klik brand untuk melihat kategori dan SKU.</div>
        </div>
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 h-9 text-sm font-medium hover:opacity-90">
          <Plus className="h-4 w-4" /> Add New Brand
        </button>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {visible.map((b) => {
          const skuCount = b.categories.reduce((a, c) => a + c.skus.length, 0);
          return (
            <button
              key={b.id}
              onClick={() => onOpen(b)}
              className="group text-left rounded-xl border border-border bg-card/60 hover:bg-card transition-colors p-4 flex flex-col gap-3"
            >
              <div className="h-48 rounded-lg bg-white grid place-items-center overflow-hidden border border-border">
                {b.logoUrl ? (
                  <img src={b.logoUrl} alt={b.name} className="max-h-36 max-w-[90%] object-contain" loading="lazy" />
                ) : (
                  <Package className="h-12 w-12 text-primary" />
                )}
              </div>

              <div>
                <div className="text-sm font-semibold truncate">{b.name}</div>
                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span><span className="font-medium text-foreground">{b.categories.length}</span> Categories</span>
                  <span>·</span>
                  <span><span className="font-medium text-foreground">{skuCount}</span> SKUs</span>
                </div>
              </div>
            </button>
          );
        })}
        {visible.length === 0 && (
          <div className="col-span-full text-center py-10 text-sm text-muted-foreground">Belum ada brand.</div>
        )}
      </div>
      {brands.length > 0 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Menampilkan <span className="text-foreground font-medium">{start + 1}–{end}</span> dari <span className="text-foreground font-medium">{brands.length}</span> brand
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 h-8 hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="px-2 text-muted-foreground">Hal. {safePage + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 h-8 hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ---------------- Level 2: Brand Detail ---------------- */

function BrandDetail({ brand, onBack, onOpenCategory }: { brand: Brand; onBack: () => void; onOpenCategory: (c: Category) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to Brands
        </button>
        <button
          onClick={() => { if (confirm(`Hapus brand "${brand.name}"?`)) { skuStore.removeBrand(brand.id); toast.success("Brand dihapus"); onBack(); } }}
          className="inline-flex items-center gap-1.5 rounded text-rose-500 hover:bg-rose-500/10 px-2 h-8 text-sm" title="Hapus brand"
        >
          <Trash2 className="h-4 w-4" /> Hapus Brand
        </button>
      </div>

      <SectionCard>
        <div className="p-5 flex items-center gap-4">
          <div className="h-28 w-28 rounded-lg bg-white border border-border grid place-items-center overflow-hidden shrink-0">
            {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="max-h-24 max-w-[85%] object-contain" /> : <Package className="h-10 w-10 text-primary" />}
          </div>
          <div>
            <div className="text-lg font-semibold">{brand.name}</div>
            <div className="text-sm text-muted-foreground">{brand.categories.length} kategori · {brand.brandKnowledge.length} dokumen brand knowledge</div>
          </div>
        </div>

      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Brand Knowledge" description="Dokumen panduan brand, manifesto, tone of voice.">
          <div className="p-4">
            <MultiFileUploader
              files={brand.brandKnowledge}
              onAdd={(atts) => skuStore.addBrandKnowledge(brand.id, atts)}
              onRemove={(id) => skuStore.removeBrandKnowledge(brand.id, id)}
              label="Upload Brand Knowledge"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Product Categories"
          description="Klik category untuk melihat SKU & Knowledge Card."
          action={<AddCategoryButton brandId={brand.id} />}
        >
          <ul className="p-3 space-y-2">
            {brand.categories.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => onOpenCategory(c)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-border bg-card/40 hover:bg-card transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-md bg-primary/10 grid place-items-center">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.skus.length} SKU · {c.categoryKnowledge.length} dokumen</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
            {brand.categories.length === 0 && (
              <li className="text-center py-6 text-sm text-muted-foreground">Belum ada category.</li>
            )}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

function AddCategoryButton({ brandId }: { brandId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  if (!open) {
    return <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 h-8 text-sm hover:bg-white/[0.04]"><Plus className="h-3.5 w-3.5" /> Category</button>;
  }
  return (
    <div className="flex items-center gap-1">
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama category.." className="h-8 rounded-md border border-border bg-card/60 px-2 text-sm" />
      <button onClick={() => { if (!name.trim()) return; skuStore.addCategory(brandId, name.trim()); setName(""); setOpen(false); toast.success("Category ditambahkan"); }}
        className="h-8 rounded-md bg-primary text-primary-foreground px-2.5 text-sm font-medium">Tambah</button>
      <button onClick={() => { setOpen(false); setName(""); }} className="h-8 w-8 grid place-items-center rounded-md border border-border"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

/* ---------------- Level 3: Category Detail ---------------- */

function CategoryDetail({ brand, category, onBack, onAddSku, onEditSku }: {
  brand: Brand; category: Category; onBack: () => void; onAddSku: () => void; onEditSku: (sku: SKU) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to {brand.name}
        </button>
        <button
          onClick={() => { if (confirm(`Hapus category "${category.name}"?`)) { skuStore.removeCategory(brand.id, category.id); toast.success("Category dihapus"); onBack(); } }}
          className="inline-flex items-center gap-1.5 rounded text-rose-500 hover:bg-rose-500/10 px-2 h-8 text-sm" title="Hapus"
        >
          <Trash2 className="h-4 w-4" /> Hapus Category
        </button>
      </div>

      <SectionCard>
        <div className="p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{brand.name}</div>
          <div className="text-lg font-semibold">{category.name}</div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Category Knowledge" description="Playbook & panduan untuk kategori produk ini.">
          <div className="p-4">
            <MultiFileUploader
              files={category.categoryKnowledge}
              onAdd={(atts) => skuStore.addCategoryKnowledge(brand.id, category.id, atts)}
              onRemove={(id) => skuStore.removeCategoryKnowledge(brand.id, category.id, id)}
              label="Upload Category Knowledge"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="SKUs"
          description="Klik knowledge cards untuk expand."
          action={
            <button onClick={onAddSku} className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2.5 h-8 text-sm font-medium hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> SKU
            </button>
          }
        >
          <ul className="divide-y divide-border">
            {category.skus.map((s) => (
              <li key={s.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-md bg-white border border-border grid place-items-center overflow-hidden shrink-0">
                    {s.photoUrl ? <img src={s.photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : <ImageIcon className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-sm font-medium">{s.name}</div>
                      <span className="text-xs text-muted-foreground">{s.code}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</div>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span className="font-semibold">{formatIDR(s.price)}</span>
                      <span className="text-muted-foreground">{s.knowledgeCards.length} knowledge card</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button onClick={() => onEditSku(s)} className="rounded px-2 h-8 text-sm border border-border hover:bg-white/[0.04] inline-flex items-center gap-1"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                    <button
                      onClick={() => { if (confirm(`Hapus SKU "${s.name}"?`)) { skuStore.removeSku(brand.id, category.id, s.id); toast.success("SKU dihapus"); } }}
                      className="grid h-8 w-8 place-items-center rounded text-rose-500 hover:bg-rose-500/10" title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <Accordion type="single" collapsible className="mt-3">
                  <AccordionItem value={s.id} className="border-border">
                    <AccordionTrigger className="text-sm hover:no-underline py-2">
                      <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Knowledge Cards ({s.knowledgeCards.length})</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <KnowledgeCards brandId={brand.id} categoryId={category.id} sku={s} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </li>
            ))}
            {category.skus.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Belum ada SKU.</li>}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

function KnowledgeCards({ brandId, categoryId, sku }: { brandId: string; categoryId: string; sku: SKU }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KnowledgeCard | null>(null);
  return (
    <div>
      <div className="flex items-center justify-end mb-2">
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1 rounded-md border border-border px-2 h-7 text-sm hover:bg-white/[0.04]"><Plus className="h-3 w-3" /> Card</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sku.knowledgeCards.map((k) => (
          <div key={k.id} className="rounded-md border border-border bg-card/40 overflow-hidden">
            {k.coverUrl && <img src={k.coverUrl} alt="" className="w-full h-24 object-cover" loading="lazy" />}
            <div className="p-3">
              <div className="text-sm font-medium">{k.title}</div>
              <div className="text-sm text-muted-foreground mt-1 line-clamp-3">{k.text}</div>
              <div className="mt-2 flex items-center justify-end gap-2">
                <button onClick={() => { setEditing(k); setShowForm(true); }} className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
                <span className="text-xs text-muted-foreground">·</span>
                <button onClick={() => { skuStore.removeKnowledgeCard(brandId, categoryId, sku.id, k.id); toast.success("Card dihapus"); }} className="text-xs text-rose-500">Hapus</button>
              </div>
            </div>
          </div>
        ))}
        {sku.knowledgeCards.length === 0 && <div className="text-sm text-muted-foreground italic col-span-full">Belum ada knowledge card.</div>}
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

/* ---------------- Modals (reused) ---------------- */

function KnowledgeCardForm({ initial, onClose, onSubmit }: { initial: KnowledgeCard | null; onClose: () => void; onSubmit: (data: { title: string; text: string; coverUrl?: string }) => void }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [text, setText] = useState(initial?.text || "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl || "");
  const fileRef = useRef<HTMLInputElement>(null);

  function pickCover(file: File) {
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
            <div className="text-xs text-muted-foreground mb-1">Cover</div>
            {coverUrl && <img src={coverUrl} alt="" className="w-full h-32 object-cover rounded-md mb-2" />}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickCover(f); }} />
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md border border-border px-2 h-8 text-sm">Pilih Gambar</button>
              {coverUrl && <button type="button" onClick={() => setCoverUrl("")} className="rounded-md border border-border px-2 h-8 text-sm text-rose-500">Hapus Cover</button>}
            </div>
          </div>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masukkan judul card.." className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Teks</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Masukkan isi knowledge.." className="w-full rounded-md border border-border bg-card/60 px-2.5 py-2 text-sm" />
          </label>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 h-9 text-sm">Batal</button>
          <button type="submit" className="rounded-md bg-primary text-primary-foreground px-3 h-9 text-sm font-medium">Simpan</button>
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
            <div className="text-xs text-muted-foreground mb-1">Logo</div>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-md bg-white border border-border grid place-items-center overflow-hidden">
                {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-primary" />}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickLogo(f); }} />
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md border border-border px-2.5 h-8 text-sm">Upload Logo</button>
              {logoUrl && <button type="button" onClick={() => setLogoUrl("")} className="text-sm text-rose-500">Hapus</button>}
            </div>
          </div>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Brand Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama brand.." className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm" />
          </label>
          <p className="text-xs text-muted-foreground">Brand Knowledge & Product Category bisa di-setup setelah brand dibuat.</p>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 h-9 text-sm">Batal</button>
          <button type="submit" className="rounded-md bg-primary text-primary-foreground px-3 h-9 text-sm font-medium">Tambah Brand</button>
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
            <div className="text-xs text-muted-foreground mb-1">Foto Produk</div>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-md bg-white border border-border grid place-items-center overflow-hidden">
                {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-primary" />}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickPhoto(f); }} />
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md border border-border px-2.5 h-8 text-sm">Upload</button>
              {photoUrl && <button type="button" onClick={() => setPhotoUrl("")} className="text-sm text-rose-500">Hapus</button>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-muted-foreground mb-1">Nama</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama SKU.." className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm" />
            </label>
            <label className="block">
              <span className="block text-xs text-muted-foreground mb-1">Code</span>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Masukkan kode SKU.." className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm" />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Harga (Rp)</span>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Masukkan harga.." className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Deskripsi</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Masukkan deskripsi produk.." className="w-full rounded-md border border-border bg-card/60 px-2.5 py-2 text-sm" />
          </label>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 h-9 text-sm">Batal</button>
          <button type="submit" className="rounded-md bg-primary text-primary-foreground px-3 h-9 text-sm font-medium">{initial ? "Simpan" : "Tambah"}</button>
        </div>
      </form>
    </div>
  );
}
