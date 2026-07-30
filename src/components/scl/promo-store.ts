import { useState, useEffect } from "react";
import { fmtIDR } from "@/lib/fmt";
import { transactionsStore } from "./transactions-store";

export type PromoStatus = "active" | "expired" | "inactive";

// ── Rule model — promos are built from plain-language X/Y/Z variables ─────────
// instead of being sourced from Odoo. Three POS-aligned promo types:
//   1. Buy X Get Y            (BOGO — same or different item)
//   2. Buy X Get Discount     (fixed Rp off: bundling / cashback / straight discount)
//   3. Discount % on Total    (percentage off cart or a specific item)

export type PromoItemScope = { kind: "any" } | { kind: "specific"; items: string[] };

export type PromoRule =
  | {
      type: "buy-x-get-y";
      buyQty: number;
      buyItem: PromoItemScope;
      getQty: number;
      getItem: PromoItemScope;
      sameAsPurchased: boolean;
    }
  | {
      type: "buy-x-get-discount";
      buyItem: PromoItemScope;
      minAmount: number | null;
      discountAmount: number;
      variant: "immediate" | "cashback-next-purchase" | "bundle-price";
    }
  | {
      type: "discount-percent";
      discountPercent: number;
      minAmount: number | null;
      scope: PromoItemScope;
    };

export function defaultRuleForType(type: PromoRule["type"]): PromoRule {
  switch (type) {
    case "buy-x-get-y":
      return { type, buyQty: 1, buyItem: { kind: "any" }, getQty: 1, getItem: { kind: "any" }, sameAsPurchased: true };
    case "buy-x-get-discount":
      return { type, buyItem: { kind: "any" }, minAmount: null, discountAmount: 50000, variant: "immediate" };
    case "discount-percent":
      return { type, discountPercent: 10, minAmount: null, scope: { kind: "any" } };
  }
}

function scopeLabel(scope: PromoItemScope): string {
  if (scope.kind === "any" || scope.items.length === 0) return "Any Item";
  if (scope.items.length === 1) return scope.items[0];
  return `${scope.items[0]} +${scope.items.length - 1} more`;
}

export function describePromoRule(rule: PromoRule): string {
  switch (rule.type) {
    case "buy-x-get-y": {
      const buy = `Buy ${rule.buyQty} ${scopeLabel(rule.buyItem)}`;
      const get = rule.sameAsPurchased
        ? `Get ${rule.getQty} Same Item Free`
        : `Get ${rule.getQty} ${scopeLabel(rule.getItem)} Free`;
      return `${buy} → ${get}`;
    }
    case "buy-x-get-discount": {
      const buy = rule.minAmount
        ? `Buy ${scopeLabel(rule.buyItem)} (min. ${fmtIDR(rule.minAmount)})`
        : `Buy ${scopeLabel(rule.buyItem)}`;
      const reward =
        rule.variant === "cashback-next-purchase"
          ? `Get ${fmtIDR(rule.discountAmount)} Cashback for Next Purchase`
          : rule.variant === "bundle-price"
            ? `Get ${fmtIDR(rule.discountAmount)} Off as Bundle`
            : `Get ${fmtIDR(rule.discountAmount)} Off`;
      return `${buy} → ${reward}`;
    }
    case "discount-percent": {
      const scope = rule.scope.kind === "any" ? "Total Purchase" : scopeLabel(rule.scope);
      const min = rule.minAmount ? ` (min. ${fmtIDR(rule.minAmount)})` : "";
      return `Get ${rule.discountPercent}% Off ${scope}${min}`;
    }
  }
}

// ── Redemption + ownership model ───────────────────────────────────────────────

export type PromoRedemption = {
  id: string;
  contactId: string;
  contactName: string;
  transactionId: string;
  invoice: string;
  discountValue: number;
  channel: "template" | "broadcast" | "manual" | "pos";
  sourceName: string;
  store: string;
  redeemedAt: string;
};

export type AssignedCode = {
  code: string;
  contactId: string;
  contactName: string;
  redeemed: boolean;
  redeemedAt?: string;
};

export type PromoCode = {
  id: string;
  code: string;
  name: string;
  description: string;
  rule: PromoRule;
  usageType: "one-to-one" | "one-to-many";
  maxUsage: number | null;
  startDate: string;
  endDate: string;
  status: PromoStatus;
  createdBy: { name: string; jobTitle: string };
  createdAt: string;
  redemptions: PromoRedemption[];
  assignedCodes?: AssignedCode[];
};

// Cross-reference the transactions store so redemption logs point at real,
// clickable-consistent invoices/customers instead of made-up references.
function tx(id: string) {
  const found = transactionsStore.state.transactions.find((t) => t.id === id);
  if (!found) throw new Error(`promo-store seed: unknown transaction ${id}`);
  return found;
}

function seed(): PromoCode[] {
  const t1000 = tx("tx-1000"); // Putri Anggraini
  const t1004 = tx("tx-1004"); // Siti Rahmawati
  const t1005 = tx("tx-1005"); // Indah Permata
  const t1010 = tx("tx-1010"); // Tiara Hapsari
  const t1011 = tx("tx-1011"); // Dian Puspita
  const t1012 = tx("tx-1012"); // Putri Anggraini (2nd visit)
  const t1002 = tx("tx-1002"); // Bayu Hartanto
  const t1014 = tx("tx-1014"); // Bayu Hartanto (2nd visit)
  const t1006 = tx("tx-1006"); // Lina Wulandari
  const t1008 = tx("tx-1008"); // Bagus Pratama
  const t1020 = tx("tx-1020"); // Bagus Pratama (2nd visit)
  const t1003 = tx("tx-1003"); // Nadya Salsabila
  const t1001 = tx("tx-1001"); // Citra Halim

  return [
    {
      id: "promo-1",
      code: "AROMA20",
      name: "20% Off All Brands",
      description: "20% discount across all brands. Code shared via broadcast or template.",
      rule: { type: "discount-percent", discountPercent: 20, minAmount: null, scope: { kind: "any" } },
      usageType: "one-to-many",
      maxUsage: 500,
      startDate: "2026-06-01",
      endDate: "2026-07-31",
      status: "active",
      createdBy: { name: "Luca Romano", jobTitle: "Marketing Manager" },
      createdAt: "2026-05-28T09:00:00Z",
      redemptions: [
        {
          id: "rdm-1a", contactId: t1000.customerId!, contactName: t1000.customerName,
          transactionId: t1000.id, invoice: t1000.invoice, discountValue: Math.round(t1000.total * 0.2),
          channel: "template", sourceName: "June Flash Sale", store: t1000.store, redeemedAt: t1000.date,
        },
        {
          id: "rdm-1b", contactId: t1006.customerId!, contactName: t1006.customerName,
          transactionId: t1006.id, invoice: t1006.invoice, discountValue: Math.round(t1006.total * 0.2),
          channel: "broadcast", sourceName: "VIP Customer Blast", store: t1006.store, redeemedAt: t1006.date,
        },
        {
          id: "rdm-1c", contactId: t1012.customerId!, contactName: t1012.customerName,
          transactionId: t1012.id, invoice: t1012.invoice, discountValue: Math.round(t1012.total * 0.2),
          channel: "template", sourceName: "End of Month Promo", store: t1012.store, redeemedAt: t1012.date,
        },
      ],
    },
    {
      id: "promo-2",
      code: "SISLEY150K",
      name: "Sisley Rp150k Off",
      description: "Rp150,000 off any Sisley product. Single-use code issued per customer.",
      rule: {
        type: "buy-x-get-discount",
        buyItem: { kind: "specific", items: ["Sisley Real Flawless Foundation"] },
        minAmount: 1000000,
        discountAmount: 150000,
        variant: "immediate",
      },
      usageType: "one-to-one",
      maxUsage: 200,
      startDate: "2026-07-01",
      endDate: "2026-07-15",
      status: "active",
      createdBy: { name: "Noor Hassan", jobTitle: "Customer Insights" },
      createdAt: "2026-06-25T10:00:00Z",
      redemptions: [
        {
          id: "rdm-2a", contactId: t1004.customerId!, contactName: t1004.customerName,
          transactionId: t1004.id, invoice: t1004.invoice, discountValue: 150000,
          channel: "broadcast", sourceName: "Sisley Summer Sale", store: t1004.store, redeemedAt: t1004.date,
        },
        {
          id: "rdm-2b", contactId: t1005.customerId!, contactName: t1005.customerName,
          transactionId: t1005.id, invoice: t1005.invoice, discountValue: 150000,
          channel: "template", sourceName: "Abandoned Cart Reminder", store: t1005.store, redeemedAt: t1005.date,
        },
      ],
      assignedCodes: [
        { code: "SISLEY150K-C1", contactId: t1004.customerId!, contactName: t1004.customerName, redeemed: true, redeemedAt: t1004.date },
        { code: "SISLEY150K-C2", contactId: t1005.customerId!, contactName: t1005.customerName, redeemed: true, redeemedAt: t1005.date },
        { code: "SISLEY150K-C3", contactId: t1010.customerId!, contactName: t1010.customerName, redeemed: false },
        { code: "SISLEY150K-C4", contactId: t1011.customerId!, contactName: t1011.customerName, redeemed: false },
      ],
    },
    {
      id: "promo-3",
      code: "BEAUTY10",
      name: "10% Off New Arrivals",
      description: "10% discount on new arrival products. No minimum purchase required.",
      rule: { type: "discount-percent", discountPercent: 10, minAmount: null, scope: { kind: "any" } },
      usageType: "one-to-many",
      maxUsage: null,
      startDate: "2026-05-01",
      endDate: "2026-05-31",
      status: "expired",
      createdBy: { name: "Luca Romano", jobTitle: "Marketing Manager" },
      createdAt: "2026-04-27T09:00:00Z",
      redemptions: [
        {
          id: "rdm-3a", contactId: t1001.customerId!, contactName: t1001.customerName,
          transactionId: t1001.id, invoice: t1001.invoice, discountValue: Math.round(t1001.total * 0.1),
          channel: "template", sourceName: "New Arrival May", store: t1001.store, redeemedAt: t1001.date,
        },
        {
          id: "rdm-3b", contactId: t1003.customerId!, contactName: t1003.customerName,
          transactionId: t1003.id, invoice: t1003.invoice, discountValue: Math.round(t1003.total * 0.1),
          channel: "broadcast", sourceName: "All Contacts Blast", store: t1003.store, redeemedAt: t1003.date,
        },
      ],
    },
    {
      id: "promo-4",
      code: "LAURA50K",
      name: "Laura Mercier Rp50k Off",
      description: "Rp50,000 off any Laura Mercier product. No minimum purchase.",
      rule: {
        type: "buy-x-get-discount",
        buyItem: { kind: "specific", items: ["Laura Mercier Translucent Loose Setting Powder"] },
        minAmount: null,
        discountAmount: 50000,
        variant: "immediate",
      },
      usageType: "one-to-many",
      maxUsage: 100,
      startDate: "2026-07-05",
      endDate: "2026-07-20",
      status: "active",
      createdBy: { name: "Noor Hassan", jobTitle: "Customer Insights" },
      createdAt: "2026-07-02T11:00:00Z",
      redemptions: [],
    },
    {
      id: "promo-5",
      code: "RIMMEL30",
      name: "Rimmel 30% Off",
      description: "30% off all Rimmel London products for loyalty customers.",
      rule: {
        type: "discount-percent",
        discountPercent: 30,
        minAmount: null,
        scope: { kind: "specific", items: ["Rimmel Translucent Loose Setting Powder", "Rimmel Translucent Hydrating Setting Spray Ultra-Blur"] },
      },
      usageType: "one-to-many",
      maxUsage: 300,
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      status: "expired",
      createdBy: { name: "Luca Romano", jobTitle: "Marketing Manager" },
      createdAt: "2026-03-27T09:00:00Z",
      redemptions: [
        {
          id: "rdm-5a", contactId: t1008.customerId!, contactName: t1008.customerName,
          transactionId: t1008.id, invoice: t1008.invoice, discountValue: Math.round(t1008.total * 0.3),
          channel: "broadcast", sourceName: "April Loyalty Blast", store: t1008.store, redeemedAt: t1008.date,
        },
      ],
    },
    {
      id: "promo-6",
      code: "DGBOGO",
      name: "Dolce & Gabbana Buy 1 Get 1",
      description: "Buy any Caviar Hydra-Crème Lipstick, get a second one free. In-store and via WhatsApp order.",
      rule: {
        type: "buy-x-get-y",
        buyQty: 1,
        buyItem: { kind: "specific", items: ["Caviar Hydra-Crème Lipstick 42g"] },
        getQty: 1,
        getItem: { kind: "any" },
        sameAsPurchased: true,
      },
      usageType: "one-to-many",
      maxUsage: 150,
      startDate: "2026-07-10",
      endDate: "2026-08-10",
      status: "active",
      createdBy: { name: "Aria Kapoor", jobTitle: "Workspace Owner" },
      createdAt: "2026-07-08T08:30:00Z",
      redemptions: [
        {
          id: "rdm-6a", contactId: t1002.customerId!, contactName: t1002.customerName,
          transactionId: t1002.id, invoice: t1002.invoice, discountValue: 685000,
          channel: "pos", sourceName: "Point of Sale", store: t1002.store, redeemedAt: t1002.date,
        },
        {
          id: "rdm-6b", contactId: t1014.customerId!, contactName: t1014.customerName,
          transactionId: t1014.id, invoice: t1014.invoice, discountValue: 685000,
          channel: "manual", sourceName: "Manual entry by BA", store: t1014.store, redeemedAt: t1014.date,
        },
        {
          id: "rdm-6c", contactId: t1020.customerId!, contactName: t1020.customerName,
          transactionId: t1020.id, invoice: t1020.invoice, discountValue: 685000,
          channel: "pos", sourceName: "Point of Sale", store: t1020.store, redeemedAt: t1020.date,
        },
      ],
    },
  ];
}

const STORAGE_KEY = "aroma_promo_store_v4";

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

  addPromo(data: Omit<PromoCode, "id" | "redemptions" | "assignedCodes">): string {
    const id = `promo-${Date.now()}`;
    _promos = [{ ...data, id, redemptions: [] }, ..._promos];
    _save();
    return id;
  },

  updatePromo(id: string, data: Partial<Omit<PromoCode, "id" | "redemptions" | "assignedCodes">>) {
    _promos = _promos.map((p) => (p.id === id ? { ...p, ...data } : p));
    _save();
  },

  deletePromo(id: string) {
    _promos = _promos.filter((p) => p.id !== id);
    _save();
  },

  subscribe(cb: () => void) {
    _listeners.add(cb);
    return () => { _listeners.delete(cb); };
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
