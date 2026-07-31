import { useMemo, useState, useRef, useEffect } from "react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { useSkuStore, skuStore, type Brand, type Category, type SKU, type KnowledgeCard } from "@/components/scl/sku-store";
import { MultiFileUploader } from "@/components/scl/multi-file-uploader";
import { formatIDR } from "@/components/scl/transactions-store";
import { Plus, Trash2, ChevronLeft, ChevronRight, Package, BookOpen, X, ImageIcon, Pencil, FolderOpen, Home, MoreHorizontal, ExternalLink } from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

export const Route = createFileRoute("/sku")({
  head: () => ({
    meta: [
      { title: "SKU & Knowledge — Aroma Abadi" },
      { name: "description", content: "Manage Brands, Product Categories, SKUs, and Knowledge Cards for all Aroma Abadi products." },
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
    <AppShell title="SKU & Knowledge" subtitle="Manage brands, categories, SKUs, and knowledge cards for Aroma Abadi products.">
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
          onBackToBrands={() => setView({ kind: "brands" })}
          onAddSku={() => setEditingSku({ brandId: brand.id, categoryId: category.id })}
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
          <div className="text-sm text-muted-foreground">Click a brand to view its categories and SKUs.</div>
        </div>
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 h-9 text-[14px] font-medium hover:opacity-90">
          <Plus className="h-4 w-4" /> Add New Brand
        </button>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger">
        {visible.map((b) => {
          const skuCount = b.categories.reduce((a, c) => a + c.skus.length, 0);
          return (
            <button
              key={b.id}
              onClick={() => onOpen(b)}
              className="group card-hover text-left rounded-xl border border-border bg-card/60 hover:bg-card transition-colors p-4 flex flex-col gap-3"
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
          <div className="col-span-full text-center py-10 text-sm text-muted-foreground">No brands yet.</div>
        )}
      </div>
      {brands.length > 0 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Showing <span className="text-foreground font-medium">{start + 1}–{end}</span> of <span className="text-foreground font-medium">{brands.length}</span> brands
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 h-8 text-[13px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="px-2 text-muted-foreground">Page {safePage + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 h-8 text-[13px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
        <nav className="flex items-center gap-1 text-sm text-muted-foreground animate-fade-in">
          <button onClick={onBack} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            <Home className="h-3.5 w-3.5" /> Brands
          </button>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="text-foreground font-medium">{brand.name}</span>
        </nav>
        <button
          onClick={() => { if (confirm(`Delete brand "${brand.name}"?`)) { skuStore.removeBrand(brand.id); toast.success("Brand deleted"); onBack(); } }}
          className="inline-flex items-center gap-1.5 rounded text-rose-500 hover:bg-rose-500/10 px-2 h-8 text-sm" title="Delete brand"
        >
          <Trash2 className="h-4 w-4" /> Delete Brand
        </button>
      </div>

      <SectionCard>
        <div className="p-5 flex items-center gap-4">
          <div className="h-28 w-28 rounded-lg bg-white border border-border grid place-items-center overflow-hidden shrink-0">
            {brand.logoUrl ? <img src={brand.logoUrl} alt="" className="max-h-24 max-w-[85%] object-contain" /> : <Package className="h-10 w-10 text-primary" />}
          </div>
          <div>
            <div className="text-lg font-semibold">{brand.name}</div>
            <div className="text-sm text-muted-foreground">{brand.categories.length} {brand.categories.length === 1 ? "category" : "categories"} · {brand.brandKnowledge.length} brand knowledge {brand.brandKnowledge.length === 1 ? "document" : "documents"}</div>
          </div>
        </div>

      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Brand Knowledge" description="Brand guidelines, manifesto, tone of voice documents.">
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
          description="Click a category to view its SKUs & Knowledge Cards."
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
                    <div className="text-xs text-muted-foreground">{c.skus.length} SKU{c.skus.length !== 1 ? "s" : ""} · {c.categoryKnowledge.length} {c.categoryKnowledge.length === 1 ? "document" : "documents"}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
            {brand.categories.length === 0 && (
              <li className="text-center py-6 text-sm text-muted-foreground">No categories yet.</li>
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
    return <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 rounded-md border border-border px-3 h-8 text-[13px] font-medium hover:bg-gray-50"><Plus className="h-3.5 w-3.5" /> Category</button>;
  }
  return (
    <div className="flex items-center gap-1">
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name..." className="h-8 rounded-md border border-border bg-card/60 px-2 text-sm" />
      <button onClick={() => { if (!name.trim()) return; skuStore.addCategory(brandId, name.trim()); setName(""); setOpen(false); toast.success("Category added"); }}
        className="h-8 rounded-md bg-primary text-primary-foreground px-2.5 text-[14px] font-medium">Add</button>
      <button onClick={() => { setOpen(false); setName(""); }} className="h-8 w-8 grid place-items-center rounded-md border border-border"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

/* ---------------- Level 3: Category Detail ---------------- */

function CategoryDetail({ brand, category, onBack, onAddSku, onBackToBrands }: {
  brand: Brand; category: Category; onBack: () => void; onBackToBrands: () => void; onAddSku: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground animate-fade-in">
          <button onClick={onBackToBrands} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            <Home className="h-3.5 w-3.5" /> Brands
          </button>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <button onClick={onBack} className="hover:text-foreground transition-colors">{brand.name}</button>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="text-foreground font-medium">{category.name}</span>
        </nav>
        <button
          onClick={() => { if (confirm(`Delete category "${category.name}"?`)) { skuStore.removeCategory(brand.id, category.id); toast.success("Category deleted"); onBack(); } }}
          className="inline-flex items-center gap-1.5 rounded text-rose-500 hover:bg-rose-500/10 px-2 h-8 text-sm" title="Delete"
        >
          <Trash2 className="h-4 w-4" /> Delete Category
        </button>
      </div>

      {/* 30% / 70% layout */}
      <div className="flex gap-4 min-h-0">
        {/* LEFT 30% — Category Knowledge */}
        <div className="w-[30%] shrink-0">
          <SectionCard title="Category Knowledge" description="Playbook & category guidelines.">
            <div className="p-4">
              <MultiFileUploader
                files={category.categoryKnowledge}
                onAdd={(atts) => skuStore.addCategoryKnowledge(brand.id, category.id, atts)}
                onRemove={(id) => skuStore.removeCategoryKnowledge(brand.id, category.id, id)}
                label="Upload Category Knowledge"
              />
            </div>
          </SectionCard>
        </div>

        {/* RIGHT 70% — SKUs */}
        <div className="flex-1 min-w-0">
          <SectionCard
            title="SKUs"
            description="Select SKUs from the database or add new ones."
            action={<SkuSearchSelect brandId={brand.id} categoryId={category.id} onSelect={onAddSku} onAdd={onAddSku} />}
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
                    <SkuMenu
                      onDetails={() => navigate({ to: "/sku-detail/$skuId", params: { skuId: s.id } })}
                      onDelete={() => { skuStore.removeSku(brand.id, category.id, s.id); toast.success("SKU deleted"); }}
                    />
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
              {category.skus.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No SKUs yet. Use the button above to add.</li>}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

/* 3-dot action menu for each SKU row */
function SkuMenu({ onDetails, onDelete }: { onDetails: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="h-8 w-8 grid place-items-center rounded border border-border hover:bg-gray-50 text-muted-foreground hover:text-foreground transition-colors"
        title="Actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-40 rounded-lg border border-border bg-white shadow-lg py-1 animate-fade-in">
          <button onClick={() => { onDetails(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left hover:bg-gray-50 transition-colors text-foreground">
            <ExternalLink className="h-3.5 w-3.5 text-primary" /> See Details
          </button>
          <div className="my-1 border-t border-border" />
          <button onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left hover:bg-rose-50 transition-colors text-rose-600">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* Searchable SKU select (search from existing + add new) */
function SkuSearchSelect({ brandId, categoryId, onSelect, onAdd }: { brandId: string; categoryId: string; onSelect: (sku: SKU) => void; onAdd: () => void }) {
  void brandId; void categoryId; void onSelect;
  const { brands } = useSkuStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Collect all SKUs across all brands/categories as searchable pool
  const allSkus = useMemo(() => {
    const list: { sku: SKU; brandName: string; catName: string }[] = [];
    for (const b of brands) {
      for (const c of b.categories) {
        for (const s of c.skus) {
          list.push({ sku: s, brandName: b.name, catName: c.name });
        }
      }
    }
    return list;
  }, [brands]);

  const filtered = query
    ? allSkus.filter((x) => x.sku.name.toLowerCase().includes(query.toLowerCase()) || x.sku.code.toLowerCase().includes(query.toLowerCase()))
    : allSkus.slice(0, 8);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2.5 h-8 text-[14px] font-medium hover:opacity-90"
      >
        <Plus className="h-3.5 w-3.5" /> Add SKU
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-30 w-72 rounded-xl border border-border bg-background shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SKU from database…"
              className="w-full h-8 rounded-md border border-border bg-card/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.map(({ sku, brandName, catName }) => (
              <li key={sku.id}>
                <button
                  type="button"
                  onClick={() => { onSelect(sku); setOpen(false); setQuery(""); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  <div className="h-8 w-8 rounded bg-white border border-border grid place-items-center overflow-hidden shrink-0">
                    {sku.photoUrl ? <img src={sku.photoUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{sku.name}</div>
                    <div className="text-[11px] text-muted-foreground">{brandName} · {catName}</div>
                  </div>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-3 py-4 text-center text-sm text-muted-foreground">Not found</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function KnowledgeCards({ brandId, categoryId, sku }: { brandId: string; categoryId: string; sku: SKU }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KnowledgeCard | null>(null);
  return (
    <div>
      <div className="flex items-center justify-end mb-2">
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 h-8 text-[13px] font-medium hover:bg-gray-50 transition-colors"><Plus className="h-3.5 w-3.5" /> Knowledge Card</button>
      </div>
      {/* Horizontal scroll knowledge cards with numbered labels */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
        {sku.knowledgeCards.map((k, idx) => (
          <div key={k.id} className="shrink-0 w-48 snap-start rounded-md border border-border bg-card/40 overflow-hidden">
            {k.coverUrl && <img src={k.coverUrl} alt="" className="w-full h-24 object-cover" loading="lazy" />}
            <div className="p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Knowledge {idx + 1}</div>
              <div className="text-sm font-medium line-clamp-2">{k.title}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-3">{k.text}</div>
              <div className="mt-2 flex items-center justify-end gap-2">
                <button onClick={() => { setEditing(k); setShowForm(true); }} className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
                <span className="text-xs text-muted-foreground">·</span>
                <button onClick={() => { skuStore.removeKnowledgeCard(brandId, categoryId, sku.id, k.id); toast.success("Card deleted"); }} className="text-xs text-rose-500">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {sku.knowledgeCards.length === 0 && <div className="text-sm text-muted-foreground italic py-2">No knowledge cards yet.</div>}
      </div>
      {showForm && (
        <KnowledgeCardForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={(data) => {
            if (editing) skuStore.updateKnowledgeCard(brandId, categoryId, sku.id, editing.id, data);
            else skuStore.addKnowledgeCard(brandId, categoryId, sku.id, data);
            toast.success(editing ? "Card updated" : "Card added");
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
          <div className="text-sm font-semibold">{initial ? "Edit Knowledge Card" : "Add Knowledge Card"}</div>
          <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Cover</div>
            {coverUrl && <img src={coverUrl} alt="" className="w-full h-32 object-cover rounded-md mb-2" />}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickCover(f); }} />
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md border border-border px-3 h-8 text-[13px]">Choose Image</button>
              {coverUrl && <button type="button" onClick={() => setCoverUrl("")} className="rounded-md border border-border px-3 h-8 text-[13px] text-rose-500">Remove Cover</button>}
            </div>
          </div>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Card title..." className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Teks</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Knowledge content..." className="w-full rounded-md border border-border bg-card/60 px-2.5 py-2 text-sm" />
          </label>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 h-9 text-[14px]">Cancel</button>
          <button type="submit" className="rounded-md bg-primary text-primary-foreground px-3 h-9 text-[14px] font-medium">Save</button>
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
        onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; const b = skuStore.addBrand({ name: name.trim(), logoUrl: logoUrl || undefined }); toast.success("Brand added"); onCreated(b); }}
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
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md border border-border px-2.5 h-8 text-[14px]">Upload Logo</button>
              {logoUrl && <button type="button" onClick={() => setLogoUrl("")} className="text-[14px] text-rose-500">Remove</button>}
            </div>
          </div>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Brand Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand name..." className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm" />
          </label>
          <p className="text-xs text-muted-foreground">Brand Knowledge & Product Category can be set up after the brand is created.</p>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 h-9 text-[14px]">Cancel</button>
          <button type="submit" className="rounded-md bg-primary text-primary-foreground px-3 h-9 text-[14px] font-medium">Add Brand</button>
        </div>
      </form>
    </div>
  );
}

function SkuFormModal({ brandId, categoryId, initial, onClose }: { brandId: string; categoryId: string; initial?: SKU; onClose: () => void }) {
  const [name] = useState(initial?.name || "");
  const [code] = useState(initial?.code || "");
  const [price] = useState<number>(initial?.price || 0);
  const [description] = useState(initial?.description || "");
  const [photoUrl] = useState(initial?.photoUrl || "");

  // Fields are read-only — data is synced from Odoo
  const disabledInput = "h-9 w-full rounded-md border border-border bg-gray-50 px-2.5 text-sm text-muted-foreground cursor-not-allowed select-none";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 animate-fade-in">
      <div className="w-full max-w-md bg-background border border-border rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold">Add SKU</div>
          <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          {/* Odoo sync notice */}
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-[12px] text-amber-700">
            <span className="shrink-0 mt-0.5">ℹ️</span>
            <span>SKU data is synced from Odoo. Fields are read-only and cannot be edited here.</span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Product Photo</div>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-md bg-white border border-border grid place-items-center overflow-hidden">
                {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-primary/40" />}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-muted-foreground mb-1">Name</span>
              <input disabled value={name} placeholder="Synced from Odoo" className={disabledInput} />
            </label>
            <label className="block">
              <span className="block text-xs text-muted-foreground mb-1">Code</span>
              <input disabled value={code} placeholder="Synced from Odoo" className={disabledInput} />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Price (Rp)</span>
            <input disabled type="number" value={price} placeholder="Synced from Odoo" className={disabledInput} />
          </label>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Description</span>
            <textarea disabled value={description} rows={4} placeholder="Synced from Odoo" className="w-full rounded-md border border-border bg-gray-50 px-2.5 py-2 text-sm text-muted-foreground cursor-not-allowed select-none resize-none" />
          </label>
        </div>
        <div className="p-4 border-t border-border flex justify-end">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 h-9 text-[14px] hover:bg-gray-50 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}
