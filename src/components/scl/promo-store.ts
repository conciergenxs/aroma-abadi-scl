import { useState, useEffect } from "react";

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

const STORAGE_KEY = "aroma_promo_store_v3";

// ── In-memory state (module-level, never touches window during module init) ───

let _promos: PromoCode[] = seed();
let _loaded = false;
const _listeners = new Set<() => void>();

function _load() {
  if (_loaded) return;
  _loaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.promos && Array.isArray(parsed.promos)) {
        _promos = parsed.promos;
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ promos: _promos }));
    }
  } catch { /* ignore */ }
}

function _save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ promos: _promos })); } catch { /* ignore */ }
  _listeners.forEach((l) => l());
}

// ── Public store API ──────────────────────────────────────────────────────────

export const promoStore = {
  getPromos(): PromoCode[] { return _promos; },

  addPromo(data: Omit<PromoCode, "id" | "usages">): string {
    const id = `promo-${Date.now()}`;
    _promos = [{ ...data, id, usages: [] }, ..._promos];
    _save();
    return id;
  },

  updatePromo(id: string, data: Partial<Omit<PromoCode, "id" | "usages">>) {
    _promos = _promos.map((p) => (p.id === id ? { ...p, ...data } : p));
    _save();
  },

  deletePromo(id: string) {
    _promos = _promos.filter((p) => p.id !== id);
    _save();
  },

  subscribe(cb: () => void) {
    _listeners.add(cb);
    return () => _listeners.delete(cb);
  },
};

// ── React hook (client-only via useEffect) ────────────────────────────────────

export function usePromoStore() {
  const [promos, setPromos] = useState<PromoCode[]>(() => _promos);

  useEffect(() => {
    // Load from localStorage on first mount (client-only)
    _load();
    setPromos([..._promos]);

    // Subscribe to future changes
    const unsub = promoStore.subscribe(() => setPromos([..._promos]));
    return unsub;
  }, []);

  return { promos };
}
