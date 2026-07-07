import { useSyncExternalStore } from "react";

export type PromoStatus = "active" | "expired" | "inactive";

export type PromoUsage = {
  sourceType: "template" | "broadcast";
  sourceName: string;
  usedAt: string;
};

export type PromoCode = {
  id: string;
  code: string;
  name: string;
  description: string;
  usageType: "one-to-one" | "one-to-many";
  maxUsage: number | null;
  startDate: string;
  endDate: string;
  status: PromoStatus;
  usages: PromoUsage[];
  odooId: string;
};

function seed(): PromoCode[] {
  return [
    {
      id: "promo-1",
      code: "AROMA20",
      name: "20% Off All Brands",
      description: "20% discount across all brands. Code shared via broadcast or template.",
      usageType: "one-to-many",
      maxUsage: 500,
      startDate: "2026-06-01",
      endDate: "2026-07-31",
      status: "active",
      odooId: "PC-2026-001",
      usages: [
        { sourceType: "template", sourceName: "June Flash Sale", usedAt: "2026-06-10T10:30:00Z" },
        { sourceType: "broadcast", sourceName: "VIP Customer Blast", usedAt: "2026-06-15T14:00:00Z" },
        { sourceType: "template", sourceName: "End of Month Promo", usedAt: "2026-06-28T09:00:00Z" },
      ],
    },
    {
      id: "promo-2",
      code: "SISLEY150K",
      name: "Sisley Rp150k Off",
      description: "Rp150,000 off Sisley products. Single-use code issued per customer.",
      usageType: "one-to-one",
      maxUsage: 200,
      startDate: "2026-07-01",
      endDate: "2026-07-15",
      status: "active",
      odooId: "PC-2026-002",
      usages: [
        { sourceType: "broadcast", sourceName: "Sisley Summer Sale", usedAt: "2026-07-01T08:00:00Z" },
        { sourceType: "template", sourceName: "Abandoned Cart Reminder", usedAt: "2026-07-03T12:00:00Z" },
      ],
    },
    {
      id: "promo-3",
      code: "BEAUTY10",
      name: "10% Off New Arrivals",
      description: "10% discount on new arrival products. No minimum purchase required.",
      usageType: "one-to-many",
      maxUsage: null,
      startDate: "2026-05-01",
      endDate: "2026-05-31",
      status: "expired",
      odooId: "PC-2026-003",
      usages: [
        { sourceType: "template", sourceName: "New Arrival May", usedAt: "2026-05-03T09:30:00Z" },
        { sourceType: "broadcast", sourceName: "All Contacts Blast", usedAt: "2026-05-07T10:00:00Z" },
        { sourceType: "broadcast", sourceName: "Mid-May Reminder", usedAt: "2026-05-16T13:00:00Z" },
        { sourceType: "template", sourceName: "May Closing Sale", usedAt: "2026-05-30T15:00:00Z" },
      ],
    },
    {
      id: "promo-4",
      code: "LAURA50K",
      name: "Laura Mercier Rp50k Off",
      description: "Rp50,000 off any Laura Mercier product. No minimum purchase.",
      usageType: "one-to-many",
      maxUsage: 100,
      startDate: "2026-07-05",
      endDate: "2026-07-20",
      status: "active",
      odooId: "PC-2026-004",
      usages: [],
    },
    {
      id: "promo-5",
      code: "RIMMEL30",
      name: "Rimmel 30% Off",
      description: "30% off all Rimmel London products for loyalty customers.",
      usageType: "one-to-many",
      maxUsage: 300,
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      status: "expired",
      odooId: "PC-2026-005",
      usages: [
        { sourceType: "broadcast", sourceName: "April Loyalty Blast", usedAt: "2026-04-01T09:00:00Z" },
      ],
    },
  ];
}

const STORAGE_KEY = "aroma_promo_store_v1";

function load(): { promos: PromoCode[] } {
  if (typeof window === "undefined") return { promos: seed() };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as { promos: PromoCode[] };
  } catch { /* ignore */ }
  const initial = { promos: seed() };
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial)); } catch { /* ignore */ }
  return initial;
}

let state = load();
const listeners = new Set<() => void>();

const emit = () => {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
};

const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const getSnapshot = () => state;

export const promoStore = {
  get state() { return state; },

  addPromo(data: Omit<PromoCode, "id" | "usages">) {
    const id = `promo-${Date.now()}`;
    state = { promos: [{ ...data, id, usages: [] }, ...state.promos] };
    emit();
    return id;
  },

  updatePromo(id: string, data: Partial<Omit<PromoCode, "id" | "usages">>) {
    state = {
      promos: state.promos.map((p) => p.id === id ? { ...p, ...data } : p),
    };
    emit();
  },

  deletePromo(id: string) {
    state = { promos: state.promos.filter((p) => p.id !== id) };
    emit();
  },
};

export function usePromoStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
