import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import {
  useSkuStore,
  skuStore,
  availableOdooProducts,
  type Brand,
  type Category,
  type SKU,
  type KnowledgeCard,
  type OdooProduct,
} from "@/components/scl/sku-store";
import { MultiFileUploader } from "@/components/scl/multi-file-uploader";
import { formatIDR } from "@/components/scl/transactions-store";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  BookOpen,
  X,
  ImageIcon,
  Pencil,
  FolderOpen,
  Home,
  MoreHorizontal,
  ExternalLink,
  Camera,
} from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

export const Route = createFileRoute("/sku")({
  head: () => ({
    meta: [
      { title: "SKU & Knowledge — Aroma Abadi" },
      {
        name: "description",
        content:
          "Manage Brands, Product Categories, SKUs, and Knowledge Cards for all Aroma Abadi products.",
      },
    ],
  }),
  component: SkuPage,
});

type View =
  | { kind: "brands" }
  | { kind: "brand"; brandId: string }
  | { kind: "category"; brandId: string; categoryId: string };

/** Shared "pick an image, read it as a data URL" helper — this app is
 *  frontend-only with no upload backend, so the picked file's data URL is
 *  what actually gets stored (same approach BrandFormModal already uses). */
function useImagePicker(onPick: (dataUrl: string) => void) {
  const fileRef = useRef<HTMLInputElement>(null);
  function openPicker() {
    fileRef.current?.click();
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file again still fires onChange
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPick(String(reader.result));
    reader.readAsDataURL(file);
  }
  return { fileRef, openPicker, handleChange };
}

function SkuPage() {
  const { brands } = useSkuStore();
  const [view, setView] = useState<View>({ kind: "brands" });
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [importingSku, setImportingSku] = useState<{
    product: OdooProduct;
    brandId: string;
    categoryId: string;
  } | null>(null);

  const brand = useMemo(
    () => (view.kind !== "brands" ? brands.find((b) => b.id === view.brandId) || null : null),
    [brands, view],
  );
  const category = useMemo(
    () =>
      view.kind === "category" && brand
        ? brand.categories.find((c) => c.id === view.categoryId) || null
        : null,
    [brand, view],
  );

  return (
    <AppShell
      title="SKU & Knowledge"
      subtitle="Manage brands, categories, SKUs, and knowledge cards for Aroma Abadi products."
    >
      {view.kind === "brands" && (
        <BrandsOverview
          brands={brands}
          onOpen={(b) => setView({ kind: "brand", brandId: b.id })}
          onAdd={() => setShowBrandForm(true)}
        />
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
          onPickProduct={(product) =>
            setImportingSku({ product, brandId: brand.id, categoryId: category.id })
          }
        />
      )}

      {showBrandForm && (
        <BrandFormModal
          onClose={() => setShowBrandForm(false)}
          onCreated={(b) => {
            setView({ kind: "brand", brandId: b.id });
            setShowBrandForm(false);
          }}
        />
      )}
      {importingSku && (
        <SkuFormModal
          brandId={importingSku.brandId}
          categoryId={importingSku.categoryId}
          product={importingSku.product}
          onClose={() => setImportingSku(null)}
        />
      )}
    </AppShell>
  );
}

/* ---------------- Level 1: Brands Overview ---------------- */

function BrandsOverview({
  brands,
  onOpen,
  onAdd,
}: {
  brands: Brand[];
  onOpen: (b: Brand) => void;
  onAdd: () => void;
}) {
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
          <div className="text-sm text-muted-foreground">
            Click a brand to view its categories and SKUs.
          </div>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 h-9 text-[14px] font-medium hover:opacity-90 transition-colors duration-150"
        >
          <Plus className="h-4 w-4" /> Add New Brand
        </button>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger">
        {visible.map((b) => {
          const skuCount = b.categories.reduce(
            (a, c) => a + c.skus.filter((s) => s.kind === "sku").length,
            0,
          );
          return (
            <button
              key={b.id}
              onClick={() => onOpen(b)}
              className="group card-hover text-left rounded-xl border border-border bg-card/60 hover:bg-card transition-colors p-4 flex flex-col gap-3"
            >
              <div className="h-48 rounded-lg bg-white grid place-items-center overflow-hidden border border-border">
                {b.logoUrl ? (
                  <img
                    src={b.logoUrl}
                    alt={b.name}
                    className="max-h-36 max-w-[90%] object-contain"
                    loading="lazy"
                  />
                ) : (
                  <Package className="h-12 w-12 text-primary" />
                )}
              </div>

              <div>
                <div className="text-sm font-semibold truncate">{b.name}</div>
                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground">{b.categories.length}</span>{" "}
                    Categories
                  </span>
                  <span>·</span>
                  <span>
                    <span className="font-medium text-foreground">{skuCount}</span> SKUs
                  </span>
                </div>
              </div>
            </button>
          );
        })}
        {visible.length === 0 && (
          <div className="col-span-full text-center py-10 text-sm text-muted-foreground">
            No brands yet.
          </div>
        )}
      </div>
      {brands.length > 0 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Showing{" "}
            <span className="text-foreground font-medium">
              {start + 1}–{end}
            </span>{" "}
            of <span className="text-foreground font-medium">{brands.length}</span> brands
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 h-8 text-[13px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="px-2 text-muted-foreground">
              Page {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 h-8 text-[13px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
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

function BrandDetail({
  brand,
  onBack,
  onOpenCategory,
}: {
  brand: Brand;
  onBack: () => void;
  onOpenCategory: (c: Category) => void;
}) {
  const {
    fileRef: logoFileRef,
    openPicker: openLogoPicker,
    handleChange: handleLogoChange,
  } = useImagePicker((dataUrl) => skuStore.updateBrand(brand.id, { logoUrl: dataUrl }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground animate-fade-in">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-3.5 w-3.5" /> Brands
          </button>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="text-foreground font-medium">{brand.name}</span>
        </nav>
        <button
          onClick={() => {
            if (confirm(`Delete brand "${brand.name}"?`)) {
              skuStore.removeBrand(brand.id);
              toast.success("Brand deleted");
              onBack();
            }
          }}
          className="inline-flex items-center gap-1.5 rounded text-rose-500 hover:bg-rose-500/10 px-2 h-8 text-sm transition-colors duration-150"
          title="Delete brand"
        >
          <Trash2 className="h-4 w-4" /> Delete Brand
        </button>
      </div>

      <SectionCard>
        <div className="p-3 flex items-center gap-3">
          <div className="relative h-14 w-14 rounded-lg bg-white border border-border grid place-items-center overflow-hidden shrink-0">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt="" className="max-h-11 max-w-[85%] object-contain" />
            ) : (
              <Package className="h-5 w-5 text-primary" />
            )}
            <input
              ref={logoFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
            <button
              type="button"
              onClick={openLogoPicker}
              title="Change brand logo"
              className="absolute bottom-0.5 right-0.5 h-5 w-5 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-md hover:bg-primary/90 transition-colors duration-150"
            >
              <Camera className="h-2.5 w-2.5" />
            </button>
          </div>
          <div>
            <div className="text-sm font-semibold">{brand.name}</div>
            <div className="text-xs text-muted-foreground">
              {brand.categories.length} {brand.categories.length === 1 ? "category" : "categories"}{" "}
              · {brand.brandKnowledge.length} brand knowledge{" "}
              {brand.brandKnowledge.length === 1 ? "document" : "documents"}
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="Brand Knowledge"
          description="Brand guidelines, manifesto, tone of voice documents."
        >
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
              <CategoryRow
                key={c.id}
                brandId={brand.id}
                category={c}
                onOpen={() => onOpenCategory(c)}
              />
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
  const [imageUrl, setImageUrl] = useState("");
  const { fileRef, openPicker, handleChange } = useImagePicker(setImageUrl);
  const ref = useRef<HTMLDivElement>(null);

  function close() {
    setOpen(false);
    setName("");
    setImageUrl("");
  }

  function submit() {
    if (!name.trim()) return;
    skuStore.addCategory(brandId, name.trim(), imageUrl || undefined);
    toast.success("Category added");
    close();
  }

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md border border-border px-3 h-8 text-[13px] font-medium hover:bg-gray-50 transition-colors duration-150"
      >
        <Plus className="h-3.5 w-3.5" /> Category
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-30 w-72 rounded-xl border border-border bg-background shadow-xl overflow-hidden animate-scale-in origin-top-right p-3 space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openPicker}
              title="Upload category image"
              className="group relative h-12 w-12 rounded-md bg-primary/10 grid place-items-center overflow-hidden shrink-0 hover:bg-primary/20 transition-colors duration-150"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <FolderOpen className="h-5 w-5 text-primary" />
              )}
              <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 grid place-items-center">
                <Camera className="h-3.5 w-3.5 text-white" />
              </span>
            </button>
            <button
              type="button"
              onClick={openPicker}
              className="text-[13px] text-primary hover:underline"
            >
              {imageUrl ? "Replace photo" : "Upload photo"}
            </button>
          </div>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Category name..."
            className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="h-8 rounded-md border border-border px-3 text-[13px] hover:bg-gray-50 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              className="h-8 rounded-md bg-primary text-primary-foreground px-3 text-[13px] font-medium hover:opacity-90 transition-opacity duration-150"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryRow({
  brandId,
  category,
  onOpen,
}: {
  brandId: string;
  category: Category;
  onOpen: () => void;
}) {
  const { fileRef, openPicker, handleChange } = useImagePicker((dataUrl) =>
    skuStore.updateCategory(brandId, category.id, { imageUrl: dataUrl }),
  );

  return (
    <li className="flex items-center gap-3 px-3 py-3 rounded-lg border border-border bg-card/40 hover:bg-card transition-colors">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openPicker();
        }}
        title="Upload category image"
        className="group relative h-10 w-10 rounded-md bg-primary/10 grid place-items-center overflow-hidden shrink-0 hover:bg-primary/20 transition-colors duration-150"
      >
        {category.imageUrl ? (
          <img src={category.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <FolderOpen className="h-5 w-5 text-primary" />
        )}
        <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 grid place-items-center">
          <Camera className="h-3.5 w-3.5 text-white" />
        </span>
      </button>
      <button onClick={onOpen} className="flex-1 min-w-0 flex items-center gap-3 text-left">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{category.name}</div>
          <div className="text-xs text-muted-foreground">
            {category.skus.length} card{category.skus.length !== 1 ? "s" : ""} ·{" "}
            {category.categoryKnowledge.length} category knowledge
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
    </li>
  );
}

/* ---------------- Level 3: Category Detail ---------------- */

function CategoryDetail({
  brand,
  category,
  onBack,
  onPickProduct,
  onBackToBrands,
}: {
  brand: Brand;
  category: Category;
  onBack: () => void;
  onBackToBrands: () => void;
  onPickProduct: (product: OdooProduct) => void;
}) {
  const {
    fileRef: imageFileRef,
    openPicker: openImagePicker,
    handleChange: handleImageChange,
  } = useImagePicker((dataUrl) =>
    skuStore.updateCategory(brand.id, category.id, { imageUrl: dataUrl }),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground animate-fade-in">
          <button
            onClick={onBackToBrands}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-3.5 w-3.5" /> Brands
          </button>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <button onClick={onBack} className="hover:text-foreground transition-colors">
            {brand.name}
          </button>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="text-foreground font-medium">{category.name}</span>
        </nav>
        <button
          onClick={() => {
            if (confirm(`Delete category "${category.name}"?`)) {
              skuStore.removeCategory(brand.id, category.id);
              toast.success("Category deleted");
              onBack();
            }
          }}
          className="inline-flex items-center gap-1.5 rounded text-rose-500 hover:bg-rose-500/10 px-2 h-8 text-sm transition-colors duration-150"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" /> Delete Category
        </button>
      </div>

      <SectionCard>
        <div className="p-3 flex items-center gap-3">
          <div className="relative h-14 w-14 rounded-lg bg-white border border-border grid place-items-center overflow-hidden shrink-0">
            {category.imageUrl ? (
              <img src={category.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <FolderOpen className="h-5 w-5 text-primary" />
            )}
            <input
              ref={imageFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              type="button"
              onClick={openImagePicker}
              title="Change category photo"
              className="absolute bottom-0.5 right-0.5 h-5 w-5 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-md hover:bg-primary/90 transition-colors duration-150"
            >
              <Camera className="h-2.5 w-2.5" />
            </button>
          </div>
          <div>
            <div className="text-sm font-semibold">{category.name}</div>
            <div className="text-xs text-muted-foreground">
              {category.skus.length} card{category.skus.length !== 1 ? "s" : ""} ·{" "}
              {category.categoryKnowledge.length} category knowledge
            </div>
          </div>
        </div>
      </SectionCard>

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

        {/* RIGHT 70% — Cards (SKUs synced from Odoo + manually authored General Knowledge modules) */}
        <div className="flex-1 min-w-0">
          <SectionCard
            title="Cards"
            description="Products from Odoo plus manually authored reference modules."
            action={
              <AddModuleMenu
                importedCodes={brand.categories
                  .flatMap((c) => c.skus)
                  .filter((s) => s.kind === "sku")
                  .map((s) => s.code!)}
                onPickProduct={onPickProduct}
                onAddGeneral={(input) => {
                  skuStore.addModule(brand.id, category.id, { kind: "general", ...input });
                  toast.success("General Knowledge module added");
                }}
              />
            }
          >
            <CardsList brand={brand} category={category} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

type CardsFilter = "all" | "sku" | "general";

/* Chip row to switch between All / SKUs / General Knowledge, sitting right
 * below the "Cards" description — filters the same underlying list rather
 * than being separate tabs, so nothing here changes what data exists. */
const CARDS_PAGE_SIZE = 5;

function CardsList({ brand, category }: { brand: Brand; category: Category }) {
  const [filter, setFilter] = useState<CardsFilter>("all");
  const [page, setPage] = useState(1);
  const counts = {
    all: category.skus.length,
    sku: category.skus.filter((s) => s.kind === "sku").length,
    general: category.skus.filter((s) => s.kind === "general").length,
  };
  const filtered = category.skus.filter((s) => filter === "all" || s.kind === filter);
  const emptyLabel =
    filter === "sku"
      ? "No SKUs yet."
      : filter === "general"
        ? "No General Knowledge modules yet."
        : "No cards yet. Use the button above to add a SKU or a General Knowledge module.";

  // Reset to page 1 whenever the filter (or category) changes, so pagination
  // never lands on a page that no longer exists for the new result set.
  useEffect(() => {
    setPage(1);
  }, [filter, category.id]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / CARDS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const fromIdx = filtered.length === 0 ? 0 : (safePage - 1) * CARDS_PAGE_SIZE + 1;
  const toIdx = Math.min(safePage * CARDS_PAGE_SIZE, filtered.length);
  const paged = filtered.slice((safePage - 1) * CARDS_PAGE_SIZE, safePage * CARDS_PAGE_SIZE);

  return (
    <>
      <div className="flex items-center gap-1.5 px-5 py-3 border-b border-border">
        {(
          [
            { key: "all", label: "All" },
            { key: "sku", label: "SKUs" },
            { key: "general", label: "General Knowledge" },
          ] as const
        ).map((opt) => {
          const active = filter === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilter(opt.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors duration-150 ${
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-gray-50"
              }`}
            >
              {opt.label}
              <span
                className={`rounded-full px-1.5 text-[10px] ${active ? "bg-primary/15" : "bg-black/5"}`}
              >
                {counts[opt.key]}
              </span>
            </button>
          );
        })}
      </div>
      <ul className="divide-y divide-border">
        {paged.map((s) => (
          <SkuRow key={s.id} brand={brand} category={category} sku={s} />
        ))}
        {filtered.length === 0 && (
          <li className="p-6 text-center text-sm text-muted-foreground">{emptyLabel}</li>
        )}
      </ul>
      <div className="grid grid-cols-3 items-center gap-3 px-5 py-3 border-t border-border text-[11px] text-muted-foreground">
        <span>Showing: {filtered.length} data</span>
        <span className="text-center">
          {filtered.length === 0 ? "0-0" : `${fromIdx}-${toIdx}`} data
        </span>
        <div className="flex items-center justify-end gap-1.5">
          {totalPages > 1 && (
            <>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-gray-50 transition-colors duration-150"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-gray-50 transition-colors duration-150"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function SkuRow({ brand, category, sku }: { brand: Brand; category: Category; sku: SKU }) {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KnowledgeCard | null>(null);

  return (
    <li className="p-4">
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 rounded-md bg-white border border-border grid place-items-center overflow-hidden shrink-0">
          {sku.photoUrl ? (
            <img src={sku.photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <ImageIcon className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {sku.kind === "sku" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Package className="h-2.5 w-2.5" /> SKU
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-600">
                <BookOpen className="h-2.5 w-2.5" /> General Knowledge
              </span>
            )}
            <div className="text-sm font-medium">{sku.name}</div>
            {sku.kind === "sku" && (
              <span className="text-xs text-muted-foreground">{sku.code}</span>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{sku.description}</div>
          <div className="mt-2 flex items-center gap-3 text-sm">
            {sku.kind === "sku" && <span className="font-semibold">{formatIDR(sku.price!)}</span>}
            <span className="text-muted-foreground">
              {sku.knowledgeCards.length} knowledge card
            </span>
          </div>
        </div>
        <SkuMenu
          onDetails={
            sku.kind === "sku"
              ? () => navigate({ to: "/sku-detail/$skuId", params: { skuId: sku.id } })
              : undefined
          }
          onDelete={() => {
            skuStore.removeSku(brand.id, category.id, sku.id);
            toast.success(sku.kind === "sku" ? "SKU deleted" : "Module deleted");
          }}
        />
      </div>

      <Accordion type="single" collapsible className="mt-3">
        <AccordionItem value={sku.id} className="border-border">
          <AccordionTrigger
            className="text-sm hover:no-underline py-2 transition-colors duration-150"
            actions={
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 h-8 text-[13px] font-medium hover:bg-gray-50 transition-colors duration-150"
              >
                <Plus className="h-3.5 w-3.5" /> Knowledge Card
              </button>
            }
          >
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Knowledge Cards ({sku.knowledgeCards.length})
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <KnowledgeCards
              brandId={brand.id}
              categoryId={category.id}
              sku={sku}
              onEdit={(k) => {
                setEditing(k);
                setShowForm(true);
              }}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {showForm && (
        <KnowledgeCardForm
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={(data) => {
            if (editing)
              skuStore.updateKnowledgeCard(brand.id, category.id, sku.id, editing.id, data);
            else skuStore.addKnowledgeCard(brand.id, category.id, sku.id, data);
            toast.success(editing ? "Card updated" : "Card added");
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </li>
  );
}

/* 3-dot action menu for each SKU row */
function SkuMenu({ onDetails, onDelete }: { onDetails?: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="h-8 w-8 grid place-items-center rounded border border-border hover:bg-gray-50 text-muted-foreground hover:text-foreground transition-colors"
        title="Actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-40 rounded-lg border border-border bg-white shadow-lg py-1 animate-fade-in">
          {onDetails && (
            <>
              <button
                onClick={() => {
                  onDetails();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left hover:bg-gray-50 transition-colors text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5 text-primary" /> See Details
              </button>
              <div className="my-1 border-t border-border" />
            </>
          )}
          <button
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left hover:bg-rose-50 transition-colors text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* "+ Add Module" — first choose a kind (SKU synced from Odoo, or a manually
 * authored General Knowledge module), then either open the Odoo product
 * picker overlay (select2-style search + pagination across the whole
 * catalog) or fill in the General Knowledge form. */
function AddModuleMenu({
  importedCodes,
  onPickProduct,
  onAddGeneral,
}: {
  importedCodes: string[];
  onPickProduct: (product: OdooProduct) => void;
  onAddGeneral: (input: { name: string; description: string; photoUrl?: string }) => void;
}) {
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [skuPickerOpen, setSkuPickerOpen] = useState(false);
  const [generalOpen, setGeneralOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!choiceOpen) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setChoiceOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [choiceOpen]);

  return (
    <>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setChoiceOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 h-8 text-[14px] font-medium hover:opacity-90 transition-colors duration-150"
        >
          <Plus className="h-3.5 w-3.5" /> Add Module
        </button>

        {choiceOpen && (
          <div className="absolute right-0 top-10 z-30 w-64 rounded-xl border border-border bg-background shadow-xl overflow-hidden animate-scale-in origin-top-right p-2 space-y-2">
            <button
              type="button"
              onClick={() => {
                setChoiceOpen(false);
                setSkuPickerOpen(true);
              }}
              className="w-full flex flex-col items-start gap-0.5 rounded-lg border border-border px-3 py-2.5 text-left hover:bg-gray-50 hover:border-primary/30 transition-colors duration-150"
            >
              <div className="text-sm font-medium">Add SKU</div>
              <div className="text-[11px] text-muted-foreground leading-snug">
                Sync a product from Odoo
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setChoiceOpen(false);
                setGeneralOpen(true);
              }}
              className="w-full flex flex-col items-start gap-0.5 rounded-lg border border-border px-3 py-2.5 text-left hover:bg-gray-50 hover:border-primary/30 transition-colors duration-150"
            >
              <div className="text-sm font-medium">General Knowledge</div>
              <div className="text-[11px] text-muted-foreground leading-snug">
                Manually add a reference module
              </div>
            </button>
          </div>
        )}
      </div>

      {skuPickerOpen && (
        <OdooProductPickerModal
          importedCodes={importedCodes}
          onPick={(product) => {
            onPickProduct(product);
            setSkuPickerOpen(false);
          }}
          onClose={() => setSkuPickerOpen(false)}
        />
      )}

      {generalOpen && (
        <GeneralKnowledgeFormModal
          onClose={() => setGeneralOpen(false)}
          onSubmit={(input) => {
            onAddGeneral(input);
            setGeneralOpen(false);
          }}
        />
      )}
    </>
  );
}

const ODOO_PICKER_PAGE_SIZE = 6;

/* Select2-style overlay: search across every Odoo product in the database
 * (not just this category — Odoo is the source of truth, not this app's
 * category tree) and page through the results. Already-imported products
 * (matched by code, across the whole brand) drop out of the list. */
function OdooProductPickerModal({
  importedCodes,
  onPick,
  onClose,
}: {
  importedCodes: string[];
  onPick: (product: OdooProduct) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const available = useMemo(() => availableOdooProducts(importedCodes), [importedCodes]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
    );
  }, [available, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ODOO_PICKER_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * ODOO_PICKER_PAGE_SIZE,
    safePage * ODOO_PICKER_PAGE_SIZE,
  );

  // Portaled to <body> for the same reason as KnowledgeCardForm / GeneralKnowledgeFormModal.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 modal-backdrop">
      <div className="w-full max-w-lg max-h-[85vh] bg-background border border-border rounded-xl overflow-hidden shadow-xl modal-content flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <div className="text-sm font-semibold">Add SKU from Odoo</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {filtered.length} product{filtered.length === 1 ? "" : "s"} available
            </div>
          </div>
          <button type="button" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3 border-b border-border shrink-0">
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search all Odoo products…"
            className="w-full h-9 rounded-md border border-border bg-card/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
        <ul className="flex-1 min-h-0 overflow-y-auto divide-y divide-border">
          {paged.map((product) => (
            <li key={product.odooId}>
              <button
                type="button"
                onClick={() => onPick(product)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="h-10 w-10 rounded bg-white border border-border grid place-items-center overflow-hidden shrink-0">
                  <ImageIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{product.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {product.code} · {formatIDR(product.price)}
                  </div>
                </div>
              </button>
            </li>
          ))}
          {paged.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              {available.length === 0
                ? "All Odoo products are already imported."
                : "No products match your search."}
            </li>
          )}
        </ul>
        {totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground shrink-0">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-gray-50 transition-colors duration-150"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span>
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-gray-50 transition-colors duration-150"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* General Knowledge module form — same shape as the Odoo SKU form (photo +
 * name + description) but every field is typed in by hand since there's no
 * source-of-truth product record; no code or price, because it isn't a
 * purchasable item. */
function GeneralKnowledgeFormModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: { name: string; description: string; photoUrl?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const { fileRef, openPicker, handleChange } = useImagePicker(setPhotoUrl);

  function submit() {
    if (!name.trim()) return toast.error("Name is required.");
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      photoUrl: photoUrl || undefined,
    });
  }

  // Portaled to <body> — this is triggered from AddModuleMenu, which lives
  // inside the "Cards" SectionCard's `.glass` (backdrop-filter) subtree; see
  // KnowledgeCardForm above for why that requires a portal.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 modal-backdrop">
      <div className="w-full max-w-md bg-background border border-border rounded-xl overflow-hidden shadow-xl modal-content">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold">Add General Knowledge</div>
          <button type="button" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2.5 text-[12px] text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
            <span>
              Reference material only — General Knowledge modules have no code or price and never
              appear as purchasable products.
            </span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Photo</div>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-md bg-white border border-border grid place-items-center overflow-hidden shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-primary/40" />
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={openPicker}
                className="rounded-md border border-border px-2.5 h-8 text-[14px] hover:bg-gray-50 transition-colors duration-150"
              >
                {photoUrl ? "Replace Photo" : "Upload Photo"}
              </button>
            </div>
          </div>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">
              Name <span className="text-rose-500">*</span>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Skin Prep Routine Guide"
              className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What this module covers…"
              className="w-full rounded-md border border-border bg-card/60 px-2.5 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </label>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 h-9 text-[14px] hover:bg-gray-50 transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-md bg-primary text-primary-foreground px-3 h-9 text-[14px] font-medium hover:opacity-90 transition-opacity duration-150"
          >
            Add Module
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* Purely presentational — the "add" trigger lives beside the accordion
 * header in SkuRow, which also owns the shared add/edit form state. */
function KnowledgeCards({
  brandId,
  categoryId,
  sku,
  onEdit,
}: {
  brandId: string;
  categoryId: string;
  sku: SKU;
  onEdit: (card: KnowledgeCard) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
      {sku.knowledgeCards.map((k, idx) => (
        <div
          key={k.id}
          className="shrink-0 w-48 snap-start rounded-md border border-border bg-card/40 overflow-hidden"
        >
          {k.coverUrl && (
            <img src={k.coverUrl} alt="" className="w-full h-24 object-cover" loading="lazy" />
          )}
          <div className="p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
              Knowledge {idx + 1}
            </div>
            <div className="text-sm font-medium line-clamp-2">{k.title}</div>
            <div className="text-xs text-muted-foreground mt-1 line-clamp-3">{k.text}</div>
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => onEdit(k)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                Edit
              </button>
              <span className="text-xs text-muted-foreground">·</span>
              <button
                onClick={() => {
                  skuStore.removeKnowledgeCard(brandId, categoryId, sku.id, k.id);
                  toast.success("Card deleted");
                }}
                className="text-xs text-rose-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
      {sku.knowledgeCards.length === 0 && (
        <div className="text-sm text-muted-foreground italic py-2">No knowledge cards yet.</div>
      )}
    </div>
  );
}

/* ---------------- Modals (reused) ---------------- */

function KnowledgeCardForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial: KnowledgeCard | null;
  onClose: () => void;
  onSubmit: (data: { title: string; text: string; coverUrl?: string }) => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [text, setText] = useState(initial?.text || "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl || "");
  const fileRef = useRef<HTMLInputElement>(null);

  function pickCover(file: File) {
    const reader = new FileReader();
    reader.onload = () => setCoverUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  // Portaled to <body> — this form can be opened from deep inside a
  // SectionCard/Accordion tree, and any ancestor's `backdrop-filter`
  // (the `.glass` card treatment) becomes a containing block for
  // `position: fixed` descendants just like `transform` does, which
  // clips a non-portaled backdrop to that card's box instead of the
  // real viewport. Portaling escapes that regardless of where this is
  // triggered from — see BrandPicker/ItemScopeEditor for the same pattern.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 modal-backdrop">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          onSubmit({ title, text, coverUrl: coverUrl || undefined });
        }}
        className="w-full max-w-md bg-background border border-border rounded-xl overflow-hidden modal-content"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold">
            {initial ? "Edit Knowledge Card" : "Add Knowledge Card"}
          </div>
          <button type="button" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Cover</div>
            {coverUrl && (
              <img src={coverUrl} alt="" className="w-full h-32 object-cover rounded-md mb-2" />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pickCover(f);
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-md border border-border px-3 h-8 text-[13px]"
              >
                Choose Image
              </button>
              {coverUrl && (
                <button
                  type="button"
                  onClick={() => setCoverUrl("")}
                  className="rounded-md border border-border px-3 h-8 text-[13px] text-rose-500"
                >
                  Remove Cover
                </button>
              )}
            </div>
          </div>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title..."
              className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Content</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Knowledge content..."
              className="w-full rounded-md border border-border bg-card/60 px-2.5 py-2 text-sm"
            />
          </label>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 h-9 text-[14px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary text-primary-foreground px-3 h-9 text-[14px] font-medium"
          >
            Save
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

function BrandFormModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (b: Brand) => void;
}) {
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  function pickLogo(file: File) {
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 modal-backdrop">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const b = skuStore.addBrand({ name: name.trim(), logoUrl: logoUrl || undefined });
          toast.success("Brand added");
          onCreated(b);
        }}
        className="w-full max-w-md bg-background border border-border rounded-xl overflow-hidden modal-content"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold">Add New Brand</div>
          <button type="button" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Logo</div>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-md bg-white border border-border grid place-items-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-5 w-5 text-primary" />
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickLogo(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-md border border-border px-2.5 h-8 text-[14px]"
              >
                Upload Logo
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="text-[14px] text-rose-500"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Brand Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Brand name..."
              className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Brand Knowledge & Product Category can be set up after the brand is created.
          </p>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 h-9 text-[14px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary text-primary-foreground px-3 h-9 text-[14px] font-medium"
          >
            Add Brand
          </button>
        </div>
      </form>
    </div>
  );
}

function SkuFormModal({
  brandId,
  categoryId,
  product,
  onClose,
}: {
  brandId: string;
  categoryId: string;
  product: OdooProduct;
  onClose: () => void;
}) {
  const [photoUrl, setPhotoUrl] = useState("");
  const { fileRef, openPicker, handleChange } = useImagePicker(setPhotoUrl);

  // Everything but the photo comes straight from Odoo — read-only here.
  const disabledInput =
    "h-9 w-full rounded-md border border-border bg-gray-50 px-2.5 text-sm text-muted-foreground cursor-not-allowed select-none";

  function submit() {
    if (!photoUrl) return toast.error("Upload a product photo to continue.");
    skuStore.addModule(brandId, categoryId, {
      kind: "sku",
      name: product.name,
      code: product.code,
      price: product.price,
      description: product.description,
      photoUrl,
    });
    toast.success("SKU added");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 modal-backdrop">
      <div className="w-full max-w-md bg-background border border-border rounded-xl overflow-hidden shadow-xl modal-content">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold">Add SKU</div>
          <button type="button" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {/* Odoo sync notice */}
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-[12px] text-amber-700">
            <span className="shrink-0 mt-0.5">ℹ️</span>
            <span>
              Product data is synced from Odoo and read-only. Odoo doesn't carry photography, so
              upload one below.
            </span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Product Photo <span className="text-rose-500">*</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-md bg-white border border-border grid place-items-center overflow-hidden shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-primary/40" />
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={openPicker}
                className="rounded-md border border-border px-2.5 h-8 text-[14px] hover:bg-gray-50 transition-colors duration-150"
              >
                {photoUrl ? "Replace Photo" : "Upload Photo"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-muted-foreground mb-1">Name</span>
              <input disabled value={product.name} className={disabledInput} />
            </label>
            <label className="block">
              <span className="block text-xs text-muted-foreground mb-1">Code</span>
              <input disabled value={product.code} className={disabledInput} />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Price (Rp)</span>
            <input disabled value={formatIDR(product.price)} className={disabledInput} />
          </label>
          <label className="block">
            <span className="block text-xs text-muted-foreground mb-1">Description</span>
            <textarea
              disabled
              value={product.description}
              rows={4}
              className="w-full rounded-md border border-border bg-gray-50 px-2.5 py-2 text-sm text-muted-foreground cursor-not-allowed select-none resize-none"
            />
          </label>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 h-9 text-[14px] hover:bg-gray-50 transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-md bg-primary text-primary-foreground px-3 h-9 text-[14px] font-medium hover:opacity-90 transition-opacity duration-150"
          >
            Add SKU
          </button>
        </div>
      </div>
    </div>
  );
}
