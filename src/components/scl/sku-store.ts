import { useSyncExternalStore } from "react";

export type Attachment = {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  url: string; // data URL or object URL
};

export type KnowledgeCard = {
  id: string;
  coverUrl?: string;
  title: string;
  text: string;
};

export type SKU = {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  price: number;
  photoUrl?: string;
  description: string;
  knowledgeCards: KnowledgeCard[];
};

export type Category = {
  id: string;
  brandId: string;
  name: string;
  categoryKnowledge: Attachment[];
  skus: SKU[];
};

export type Brand = {
  id: string;
  logoUrl?: string;
  name: string;
  brandKnowledge: Attachment[];
  categories: Category[];
};

type State = { brands: Brand[] };

const STORAGE_KEY = "aroma_sku_store_v1";

function seed(): Brand[] {
  return [
    {
      id: "brand-glow",
      name: "Aroma Glow",
      brandKnowledge: [],
      categories: [
        {
          id: "cat-glow-lip",
          brandId: "brand-glow",
          name: "Lip Care",
          categoryKnowledge: [],
          skus: [
            { id: "sku-glow-velvet-03", categoryId: "cat-glow-lip", name: "Velvet Rouge 03 Mauve", code: "AG-VR-03", price: 189000, description: "Matte velvet lipstick, long-lasting 12 jam, formula vegan.", knowledgeCards: [
              { id: "kc1", title: "Texture & Finish", text: "Velvet matte tanpa cracking, transfer-proof." },
              { id: "kc2", title: "Cara Aplikasi", text: "Aplikasi dari tengah bibir, ratakan ke sisi luar." },
            ] },
            { id: "sku-glow-velvet-05", categoryId: "cat-glow-lip", name: "Velvet Rouge 05 Berry", code: "AG-VR-05", price: 189000, description: "Shade berry deep, cocok untuk skin tone medium-deep.", knowledgeCards: [] },
          ],
        },
        {
          id: "cat-glow-face",
          brandId: "brand-glow",
          name: "Face Care",
          categoryKnowledge: [],
          skus: [
            { id: "sku-glow-serum", categoryId: "cat-glow-face", name: "Glow Serum 30ml", code: "AG-GS-30", price: 285000, description: "Niacinamide 10% + Vitamin C, mencerahkan dalam 14 hari.", knowledgeCards: [] },
          ],
        },
      ],
    },
    {
      id: "brand-velvet",
      name: "Aroma Velvet",
      brandKnowledge: [],
      categories: [
        {
          id: "cat-velvet-base",
          brandId: "brand-velvet",
          name: "Base Makeup",
          categoryKnowledge: [],
          skus: [
            { id: "sku-velvet-cushion-01", categoryId: "cat-velvet-base", name: "Velvet Cushion 01 Ivory", code: "AV-CC-01", price: 245000, description: "Cushion foundation SPF 50 PA+++, coverage medium.", knowledgeCards: [] },
            { id: "sku-velvet-cushion-02", categoryId: "cat-velvet-base", name: "Velvet Cushion 02 Beige", code: "AV-CC-02", price: 245000, description: "Cushion foundation SPF 50 PA+++, shade neutral beige.", knowledgeCards: [] },
          ],
        },
      ],
    },
  ];
}

function load(): State {
  if (typeof window === "undefined") return { brands: seed() };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const initial = { brands: seed() };
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial)); } catch { /* ignore */ }
  return initial;
}

let state: State = load();
const listeners = new Set<() => void>();
const emit = () => {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const getSnapshot = () => state;

function uid(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

export const skuStore = {
  get state() { return state; },
  addBrand(input: { name: string; logoUrl?: string }) {
    const brand: Brand = { id: uid("brand"), name: input.name, logoUrl: input.logoUrl, brandKnowledge: [], categories: [] };
    state = { brands: [brand, ...state.brands] };
    emit();
    return brand;
  },
  updateBrand(brandId: string, patch: Partial<Brand>) {
    state = { brands: state.brands.map((b) => (b.id === brandId ? { ...b, ...patch } : b)) };
    emit();
  },
  removeBrand(brandId: string) {
    state = { brands: state.brands.filter((b) => b.id !== brandId) };
    emit();
  },
  addBrandKnowledge(brandId: string, files: Attachment[]) {
    state = { brands: state.brands.map((b) => (b.id === brandId ? { ...b, brandKnowledge: [...b.brandKnowledge, ...files] } : b)) };
    emit();
  },
  removeBrandKnowledge(brandId: string, fileId: string) {
    state = { brands: state.brands.map((b) => (b.id === brandId ? { ...b, brandKnowledge: b.brandKnowledge.filter((a) => a.id !== fileId) } : b)) };
    emit();
  },
  addCategory(brandId: string, name: string) {
    const cat: Category = { id: uid("cat"), brandId, name, categoryKnowledge: [], skus: [] };
    state = { brands: state.brands.map((b) => (b.id === brandId ? { ...b, categories: [...b.categories, cat] } : b)) };
    emit();
    return cat;
  },
  removeCategory(brandId: string, categoryId: string) {
    state = { brands: state.brands.map((b) => (b.id === brandId ? { ...b, categories: b.categories.filter((c) => c.id !== categoryId) } : b)) };
    emit();
  },
  addCategoryKnowledge(brandId: string, categoryId: string, files: Attachment[]) {
    state = {
      brands: state.brands.map((b) => b.id !== brandId ? b : {
        ...b, categories: b.categories.map((c) => c.id !== categoryId ? c : { ...c, categoryKnowledge: [...c.categoryKnowledge, ...files] })
      })
    };
    emit();
  },
  removeCategoryKnowledge(brandId: string, categoryId: string, fileId: string) {
    state = {
      brands: state.brands.map((b) => b.id !== brandId ? b : {
        ...b, categories: b.categories.map((c) => c.id !== categoryId ? c : { ...c, categoryKnowledge: c.categoryKnowledge.filter((a) => a.id !== fileId) })
      })
    };
    emit();
  },
  addSku(brandId: string, categoryId: string, input: Omit<SKU, "id" | "categoryId" | "knowledgeCards">) {
    const sku: SKU = { id: uid("sku"), categoryId, knowledgeCards: [], ...input };
    state = {
      brands: state.brands.map((b) => b.id !== brandId ? b : {
        ...b, categories: b.categories.map((c) => c.id !== categoryId ? c : { ...c, skus: [...c.skus, sku] })
      })
    };
    emit();
    return sku;
  },
  updateSku(brandId: string, categoryId: string, skuId: string, patch: Partial<SKU>) {
    state = {
      brands: state.brands.map((b) => b.id !== brandId ? b : {
        ...b, categories: b.categories.map((c) => c.id !== categoryId ? c : {
          ...c, skus: c.skus.map((s) => s.id === skuId ? { ...s, ...patch } : s)
        })
      })
    };
    emit();
  },
  removeSku(brandId: string, categoryId: string, skuId: string) {
    state = {
      brands: state.brands.map((b) => b.id !== brandId ? b : {
        ...b, categories: b.categories.map((c) => c.id !== categoryId ? c : { ...c, skus: c.skus.filter((s) => s.id !== skuId) })
      })
    };
    emit();
  },
  addKnowledgeCard(brandId: string, categoryId: string, skuId: string, card: Omit<KnowledgeCard, "id">) {
    const kc: KnowledgeCard = { id: uid("kc"), ...card };
    state = {
      brands: state.brands.map((b) => b.id !== brandId ? b : {
        ...b, categories: b.categories.map((c) => c.id !== categoryId ? c : {
          ...c, skus: c.skus.map((s) => s.id !== skuId ? s : { ...s, knowledgeCards: [...s.knowledgeCards, kc] })
        })
      })
    };
    emit();
    return kc;
  },
  updateKnowledgeCard(brandId: string, categoryId: string, skuId: string, cardId: string, patch: Partial<KnowledgeCard>) {
    state = {
      brands: state.brands.map((b) => b.id !== brandId ? b : {
        ...b, categories: b.categories.map((c) => c.id !== categoryId ? c : {
          ...c, skus: c.skus.map((s) => s.id !== skuId ? s : { ...s, knowledgeCards: s.knowledgeCards.map((k) => k.id === cardId ? { ...k, ...patch } : k) })
        })
      })
    };
    emit();
  },
  removeKnowledgeCard(brandId: string, categoryId: string, skuId: string, cardId: string) {
    state = {
      brands: state.brands.map((b) => b.id !== brandId ? b : {
        ...b, categories: b.categories.map((c) => c.id !== categoryId ? c : {
          ...c, skus: c.skus.map((s) => s.id !== skuId ? s : { ...s, knowledgeCards: s.knowledgeCards.filter((k) => k.id !== cardId) })
        })
      })
    };
    emit();
  },
};

export function useSkuStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export async function fileToAttachment(file: File): Promise<Attachment> {
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return { id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, fileName: file.name, fileType: file.type || "application/octet-stream", size: file.size, url };
}
