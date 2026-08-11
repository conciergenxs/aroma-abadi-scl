import { useSyncExternalStore } from "react";
import logoDG from "@/assets/brand-dolce-gabbana.png";
import logoSisley from "@/assets/brand-sisley.png";
import logoRimmel from "@/assets/brand-rimmel.png";
import logoLaura from "@/assets/brand-laura-mercier.png";
import logoBM from "@/assets/brand-baremineral.png";
import skuCaviar from "@/assets/sku-caviar-lipstick.jpg";
import skuFoundation from "@/assets/sku-real-flawless-foundation.jpg";
import skuFeather from "@/assets/sku-feather-matte-powder.jpg";
import skuTranslucent from "@/assets/sku-translucent-powder.jpg";
import skuSpray from "@/assets/sku-setting-spray.jpg";
import skuBlush from "@/assets/sku-blush-infusion.jpg";
import kc1 from "@/assets/kc-cover-1.jpg";
import kc2 from "@/assets/kc-cover-2.jpg";
import kc3 from "@/assets/kc-cover-3.jpg";
import kc4 from "@/assets/kc-cover-4.jpg";

export type Attachment = {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  url: string;
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
  imageUrl?: string;
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

const STORAGE_KEY = "aroma_sku_store_v3";

function mockPdf(name: string, kb = 480): Attachment {
  return {
    id: `att-${name.replace(/\W+/g, "-").toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`,
    fileName: name,
    fileType: "application/pdf",
    size: kb * 1024,
    url: "#",
  };
}

function seed(): Brand[] {
  return [
    {
      id: "brand-dg",
      name: "Dolce & Gabbana",
      logoUrl: logoDG,
      brandKnowledge: [
        mockPdf("D&G Beauty Brand Manifesto.pdf", 620),
        mockPdf("D&G Tone of Voice Guideline.pdf", 410),
      ],
      categories: [
        {
          id: "cat-dg-lip", brandId: "brand-dg", name: "Lip",
          categoryKnowledge: [mockPdf("Lip Category Playbook.pdf", 340)],
          skus: [
            {
              id: "sku-dg-caviar-42", categoryId: "cat-dg-lip",
              name: "Caviar Hydra-Crème Lipstick 42g", code: "DG-CHC-42",
              price: 685000, photoUrl: skuCaviar,
              description: "Hydrating lipstick with caviar essence formula. Satin glossy finish, lasts 8 hours, moisturizing without dryness.",
              knowledgeCards: [
                { id: "kc-dg-1", coverUrl: kc3, title: "Texture & Finish", text: "Hydra-crème delivers a satin finish with a fine sheen, non-transferring after setting in 2 minutes." },
                { id: "kc-dg-2", coverUrl: kc1, title: "Shade Story", text: "Available in 12 shades from nude to deep red, all suitable for Indonesian skin tones." },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "brand-sisley",
      name: "Sisley",
      logoUrl: logoSisley,
      brandKnowledge: [mockPdf("Sisley Phyto-Cosmetology Overview.pdf", 720)],
      categories: [
        {
          id: "cat-sisley-foundation", brandId: "brand-sisley", name: "Foundation",
          categoryKnowledge: [mockPdf("Foundation Shade Matching Guide.pdf", 510)],
          skus: [
            {
              id: "sku-sisley-real-flawless", categoryId: "cat-sisley-foundation",
              name: "Real Flawless Foundation", code: "SIS-RFF-30",
              price: 2450000, photoUrl: skuFoundation,
              description: "Liquid serum foundation with SPF 25, medium-buildable coverage, natural glow finish.",
              knowledgeCards: [
                { id: "kc-sis-1", coverUrl: kc4, title: "Skin Benefits", text: "Contains botanical extract that nourishes the skin while worn." },
                { id: "kc-sis-2", coverUrl: kc2, title: "Application", text: "Pour 1-2 drops on the back of hand, blend with a round brush from the center of the face." },
              ],
            },
          ],
        },
        {
          id: "cat-sisley-powder", brandId: "brand-sisley", name: "Powder",
          categoryKnowledge: [mockPdf("Powder Finish 101.pdf", 280)],
          skus: [
            {
              id: "sku-sisley-feather", categoryId: "cat-sisley-powder",
              name: "Real Flawless Feather Matte Powder Foundation", code: "SIS-FMP-10",
              price: 1850000, photoUrl: skuFeather,
              description: "Ultra-lightweight powder foundation, matte finish without cakiness, ideal for combination skin.",
              knowledgeCards: [
                { id: "kc-sis-3", coverUrl: kc2, title: "Layering Tips", text: "Apply with a kabuki brush for natural coverage, or a damp sponge for full coverage." },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "brand-rimmel",
      name: "Rimmel",
      logoUrl: logoRimmel,
      brandKnowledge: [
        mockPdf("Rimmel London Brand Story.pdf", 380),
        mockPdf("Rimmel Product Catalog 2026.pdf", 1200),
      ],
      categories: [
        {
          id: "cat-rimmel-powder", brandId: "brand-rimmel", name: "Powder",
          categoryKnowledge: [mockPdf("Setting Powder Best Practice.pdf", 220)],
          skus: [
            {
              id: "sku-rimmel-translucent-powder", categoryId: "cat-rimmel-powder",
              name: "Translucent Loose Setting Powder", code: "RIM-TLS-25",
              price: 189000, photoUrl: skuTranslucent,
              description: "Translucent loose setting powder, flashback-free, suitable for all skin tones.",
              knowledgeCards: [
                { id: "kc-rim-1", coverUrl: kc2, title: "No Flashback", text: "Formula free of talc and silica that reflects camera flash." },
                { id: "kc-rim-2", coverUrl: kc1, title: "Setting Technique", text: "Press with puff on T-zone, bake for 3 minutes for best results." },
              ],
            },
          ],
        },
        {
          id: "cat-rimmel-spray", brandId: "brand-rimmel", name: "Setting Spray",
          categoryKnowledge: [mockPdf("Setting Spray Knowledge.pdf", 190)],
          skus: [
            {
              id: "sku-rimmel-spray", categoryId: "cat-rimmel-spray",
              name: "Translucent Hydrating Setting Spray Ultra-Blur", code: "RIM-THS-100",
              price: 215000, photoUrl: skuSpray,
              description: "Hydrating setting spray with ultra-blur effect, locks makeup for up to 16 hours.",
              knowledgeCards: [
                { id: "kc-rim-3", coverUrl: kc4, title: "Long-wear Promise", text: "Clinically tested to last 16 hours without touch-ups for indoor activities." },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "brand-laura",
      name: "Laura Mercier",
      logoUrl: logoLaura,
      brandKnowledge: [mockPdf("Laura Mercier Heritage Deck.pdf", 540)],
      categories: [
        {
          id: "cat-laura-powder", brandId: "brand-laura", name: "Powder",
          categoryKnowledge: [mockPdf("Translucent Powder Iconic Guide.pdf", 460)],
          skus: [
            {
              id: "sku-laura-translucent", categoryId: "cat-laura-powder",
              name: "Translucent Loose Setting Powder", code: "LM-TLS-29",
              price: 745000, photoUrl: skuTranslucent,
              description: "The iconic loose setting powder, soft-focus finish, does not add color to the skin.",
              knowledgeCards: [
                { id: "kc-lm-1", coverUrl: kc1, title: "Iconic Status", text: "World best-seller since 1996, Laura Mercier's signature product." },
                { id: "kc-lm-2", coverUrl: kc2, title: "Universal Shade", text: "Translucent means it can be worn on all skin tones without altering the foundation's color." },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "brand-bm",
      name: "BareMinerals",
      logoUrl: logoBM,
      brandKnowledge: [mockPdf("BareMinerals Clean Beauty Pledge.pdf", 320)],
      categories: [
        {
          id: "cat-bm-blush", brandId: "brand-bm", name: "Blush",
          categoryKnowledge: [mockPdf("Blush Application Guide.pdf", 260)],
          skus: [
            {
              id: "sku-bm-color-infusion", categoryId: "cat-bm-blush",
              name: "Blush Color Infusion", code: "BM-BCI-06",
              price: 425000, photoUrl: skuBlush,
              description: "Powder blush mineral, pigmented, blendable, finish satin natural.",
              knowledgeCards: [
                { id: "kc-bm-1", coverUrl: kc1, title: "Mineral Formula", text: "Clean formula without parabens, talc, and fragrance, safe for sensitive skin." },
                { id: "kc-bm-2", coverUrl: kc4, title: "Application", text: "Tap brush, knock off excess, sweep from apple of cheek towards temples." },
              ],
            },
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
  updateCategory(brandId: string, categoryId: string, patch: Partial<Category>) {
    state = {
      brands: state.brands.map((b) => b.id !== brandId ? b : {
        ...b, categories: b.categories.map((c) => c.id !== categoryId ? c : { ...c, ...patch })
      })
    };
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
