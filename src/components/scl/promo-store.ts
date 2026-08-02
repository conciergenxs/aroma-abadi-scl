import { useState, useEffect } from "react";
import { fmtIDR } from "@/lib/fmt";
import { transactionsStore } from "./transactions-store";

export type PromoStatus = "active" | "expired" | "inactive";

// ── Rule model — a composable Condition × Reward engine ───────────────────────
// Not a fixed catalog of promo "types" (that was the Odoo-style limitation).
// Any Condition can pair with any Reward, and every X/Y/Z slot inside each one
// (item, quantity, amount, percent, cap, timing) is independently editable —
// so the same builder can express any promo shape: Buy 1 Get 1, Buy 2 Get 1
// different item, min-spend cashback, item-specific % off with a cap, etc.

export type PromoItemScope =
  | { kind: "any" }
  | { kind: "any-in-brand"; brand: string }
  | { kind: "specific"; items: string[] };

// X — what the customer must do to qualify
export type PromoCondition =
  | { kind: "any-purchase" }
  | { kind: "buy-item"; qty: number; item: PromoItemScope }
  | { kind: "min-spend"; amount: number }
  | { kind: "first-purchase" };

// Y — what the customer gets
export type PromoReward =
  | { kind: "free-item"; qty: number; sameAsPurchased: boolean; item: PromoItemScope }
  | { kind: "percent-off"; percent: number; appliesTo: PromoItemScope; maxDiscount: number | null }
  | { kind: "amount-off"; amount: number; timing: "immediate" | "next-purchase" }
  | { kind: "free-shipping" }
  | { kind: "bonus-points"; points: number };

export type PromoRule = {
  condition: PromoCondition;
  reward: PromoReward;
};

export function defaultCondition(kind: PromoCondition["kind"]): PromoCondition {
  switch (kind) {
    case "any-purchase": return { kind };
    case "buy-item": return { kind, qty: 1, item: { kind: "any" } };
    case "min-spend": return { kind, amount: 500000 };
    case "first-purchase": return { kind };
  }
}

export function defaultReward(kind: PromoReward["kind"]): PromoReward {
  switch (kind) {
    case "free-item": return { kind, qty: 1, sameAsPurchased: true, item: { kind: "any" } };
    case "percent-off": return { kind, percent: 10, appliesTo: { kind: "any" }, maxDiscount: null };
    case "amount-off": return { kind, amount: 50000, timing: "immediate" };
    case "free-shipping": return { kind };
    case "bonus-points": return { kind, points: 100 };
  }
}

export function defaultRule(): PromoRule {
  return { condition: defaultCondition("any-purchase"), reward: defaultReward("percent-off") };
}

function scopeLabel(scope: PromoItemScope, anyLabel = "Any Item"): string {
  if (scope.kind === "any") return anyLabel;
  if (scope.kind === "any-in-brand") return `${anyLabel} (${scope.brand})`;
  if (scope.items.length === 0) return anyLabel;
  if (scope.items.length === 1) return scope.items[0];
  return `${scope.items[0]} +${scope.items.length - 1} more`;
}

function describeCondition(c: PromoCondition): string {
  switch (c.kind) {
    case "any-purchase": return "Any Purchase";
    case "buy-item": return `Buy ${c.qty} ${scopeLabel(c.item)}`;
    case "min-spend": return `Spend min. ${fmtIDR(c.amount)}`;
    case "first-purchase": return "Customer's First Purchase";
  }
}

function describeReward(r: PromoReward): string {
  switch (r.kind) {
    case "free-item":
      return r.sameAsPurchased ? `Get ${r.qty} Same Item Free` : `Get ${r.qty} ${scopeLabel(r.item)} Free`;
    case "percent-off": {
      const cap = r.maxDiscount ? ` (max ${fmtIDR(r.maxDiscount)})` : "";
      return `Get ${r.percent}% Off ${scopeLabel(r.appliesTo, "Total Purchase")}${cap}`;
    }
    case "amount-off":
      return r.timing === "next-purchase"
        ? `Get ${fmtIDR(r.amount)} Cashback for Next Purchase`
        : `Get ${fmtIDR(r.amount)} Off`;
    case "free-shipping": return "Get Free Shipping";
    case "bonus-points": return `Get ${r.points} Bonus Points`;
  }
}

export function describePromoRule(rule: PromoRule): string {
  return `${describeCondition(rule.condition)} → ${describeReward(rule.reward)}`;
}

// ── Redemption + ownership model ───────────────────────────────────────────────

export type PromoRedemption = {
  id: string;
  contactId: string;
  contactName: string;
  transactionId: string;
  invoice: string;
  discountValue: number;
  channel: "instagram" | "tiktok" | "whatsapp";
  sourceName: string;
  store: string;
  redeemedAt: string;
};

export type AssignedCode = {
  code: string;
  contactId?: string;
  contactName?: string;
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
  /** Contact audiences (from Contacts) this promo is restricted to. Empty/absent = everyone. */
  audienceIds?: string[];
  createdBy: { name: string; jobTitle: string };
  createdAt: string;
  redemptions: PromoRedemption[];
  assignedCodes?: AssignedCode[];
};

// Status is never stored — it's always derived from the current time vs. the
// promo's date range, so it can't drift out of sync with reality.
export function getPromoStatus(promo: { startDate: string; endDate: string }): PromoStatus {
  if (!promo.startDate || !promo.endDate) return "inactive";
  const now = Date.now();
  const start = new Date(promo.startDate).getTime();
  const end = new Date(promo.endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return "inactive";
  if (now < start) return "inactive";
  if (now > end) return "expired";
  return "active";
}

// Lets 1-to-1 codes be shared anywhere outside the app (email, chat, print).
export function downloadAssignedCodesCsv(promoCode: string, assignedCodes: AssignedCode[]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["Code", "Owner", "Status", "Redeemed At"].map(escape).join(",");
  const rows = assignedCodes.map((a) =>
    [a.code, a.contactName ?? "Unassigned", a.redeemed ? "Redeemed" : "Not yet", a.redeemedAt ?? ""].map(escape).join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${promoCode || "promo"}-codes.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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
      rule: {
        condition: { kind: "any-purchase" },
        reward: { kind: "percent-off", percent: 20, appliesTo: { kind: "any" }, maxDiscount: null },
      },
      usageType: "one-to-many",
      maxUsage: 500,
      startDate: "2026-06-01T00:00",
      endDate: "2026-08-31T23:59",
      createdBy: { name: "Luca Romano", jobTitle: "Marketing Manager" },
      createdAt: "2026-05-28T09:00:00Z",
      redemptions: [
        {
          id: "rdm-1a", contactId: t1000.customerId!, contactName: t1000.customerName,
          transactionId: t1000.id, invoice: t1000.invoice, discountValue: Math.round(t1000.total * 0.2),
          channel: "whatsapp", sourceName: "June Flash Sale", store: t1000.store, redeemedAt: t1000.date,
        },
        {
          id: "rdm-1b", contactId: t1006.customerId!, contactName: t1006.customerName,
          transactionId: t1006.id, invoice: t1006.invoice, discountValue: Math.round(t1006.total * 0.2),
          channel: "whatsapp", sourceName: "VIP Customer Blast", store: t1006.store, redeemedAt: t1006.date,
        },
        {
          id: "rdm-1c", contactId: t1012.customerId!, contactName: t1012.customerName,
          transactionId: t1012.id, invoice: t1012.invoice, discountValue: Math.round(t1012.total * 0.2),
          channel: "instagram", sourceName: "End of Month Promo", store: t1012.store, redeemedAt: t1012.date,
        },
      ],
    },
    {
      id: "promo-2",
      code: "SISLEY150K",
      name: "Sisley Rp150k Off",
      description: "Rp150,000 off any Sisley product. Single-use code issued per customer.",
      rule: {
        condition: { kind: "buy-item", qty: 1, item: { kind: "specific", items: ["Sisley Real Flawless Foundation"] } },
        reward: { kind: "amount-off", amount: 150000, timing: "immediate" },
      },
      usageType: "one-to-one",
      maxUsage: 200,
      startDate: "2026-07-01T00:00",
      endDate: "2026-08-15T23:59",
      createdBy: { name: "Noor Hassan", jobTitle: "Customer Insights" },
      createdAt: "2026-06-25T10:00:00Z",
      redemptions: [
        {
          id: "rdm-2a", contactId: t1004.customerId!, contactName: t1004.customerName,
          transactionId: t1004.id, invoice: t1004.invoice, discountValue: 150000,
          channel: "instagram", sourceName: "Sisley Summer Sale", store: t1004.store, redeemedAt: t1004.date,
        },
        {
          id: "rdm-2b", contactId: t1005.customerId!, contactName: t1005.customerName,
          transactionId: t1005.id, invoice: t1005.invoice, discountValue: 150000,
          channel: "whatsapp", sourceName: "Abandoned Cart Reminder", store: t1005.store, redeemedAt: t1005.date,
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
      rule: {
        condition: { kind: "any-purchase" },
        reward: { kind: "percent-off", percent: 10, appliesTo: { kind: "any" }, maxDiscount: null },
      },
      usageType: "one-to-many",
      maxUsage: null,
      startDate: "2026-05-01T00:00",
      endDate: "2026-05-31T23:59",
      createdBy: { name: "Luca Romano", jobTitle: "Marketing Manager" },
      createdAt: "2026-04-27T09:00:00Z",
      redemptions: [
        {
          id: "rdm-3a", contactId: t1001.customerId!, contactName: t1001.customerName,
          transactionId: t1001.id, invoice: t1001.invoice, discountValue: Math.round(t1001.total * 0.1),
          channel: "tiktok", sourceName: "New Arrival May", store: t1001.store, redeemedAt: t1001.date,
        },
        {
          id: "rdm-3b", contactId: t1003.customerId!, contactName: t1003.customerName,
          transactionId: t1003.id, invoice: t1003.invoice, discountValue: Math.round(t1003.total * 0.1),
          channel: "whatsapp", sourceName: "All Contacts Blast", store: t1003.store, redeemedAt: t1003.date,
        },
      ],
    },
    {
      id: "promo-4",
      code: "LAURA50K",
      name: "Laura Mercier Rp50k Off",
      description: "Rp50,000 off any Laura Mercier product. No minimum purchase.",
      rule: {
        condition: { kind: "buy-item", qty: 1, item: { kind: "specific", items: ["Laura Mercier Translucent Loose Setting Powder"] } },
        reward: { kind: "amount-off", amount: 50000, timing: "immediate" },
      },
      usageType: "one-to-many",
      maxUsage: 100,
      startDate: "2026-07-05T00:00",
      endDate: "2026-08-20T23:59",
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
        condition: { kind: "any-purchase" },
        reward: {
          kind: "percent-off",
          percent: 30,
          appliesTo: { kind: "specific", items: ["Rimmel Translucent Loose Setting Powder", "Rimmel Translucent Hydrating Setting Spray Ultra-Blur"] },
          maxDiscount: null,
        },
      },
      usageType: "one-to-many",
      maxUsage: 300,
      startDate: "2026-04-01T00:00",
      endDate: "2026-04-30T23:59",
      createdBy: { name: "Luca Romano", jobTitle: "Marketing Manager" },
      createdAt: "2026-03-27T09:00:00Z",
      redemptions: [
        {
          id: "rdm-5a", contactId: t1008.customerId!, contactName: t1008.customerName,
          transactionId: t1008.id, invoice: t1008.invoice, discountValue: Math.round(t1008.total * 0.3),
          channel: "instagram", sourceName: "April Loyalty Blast", store: t1008.store, redeemedAt: t1008.date,
        },
      ],
    },
    {
      id: "promo-6",
      code: "DGBOGO",
      name: "Dolce & Gabbana Buy 1 Get 1",
      description: "Buy any Caviar Hydra-Crème Lipstick, get a second one free. In-store and via WhatsApp order.",
      rule: {
        condition: { kind: "buy-item", qty: 1, item: { kind: "specific", items: ["Caviar Hydra-Crème Lipstick 42g"] } },
        reward: { kind: "free-item", qty: 1, sameAsPurchased: true, item: { kind: "any" } },
      },
      usageType: "one-to-many",
      maxUsage: 150,
      startDate: "2026-07-10T00:00",
      endDate: "2026-08-10T23:59",
      createdBy: { name: "Aria Kapoor", jobTitle: "Workspace Owner" },
      createdAt: "2026-07-08T08:30:00Z",
      redemptions: [
        {
          id: "rdm-6a", contactId: t1002.customerId!, contactName: t1002.customerName,
          transactionId: t1002.id, invoice: t1002.invoice, discountValue: 685000,
          channel: "whatsapp", sourceName: "Point of Sale", store: t1002.store, redeemedAt: t1002.date,
        },
        {
          id: "rdm-6b", contactId: t1014.customerId!, contactName: t1014.customerName,
          transactionId: t1014.id, invoice: t1014.invoice, discountValue: 685000,
          channel: "instagram", sourceName: "Manual entry by BA", store: t1014.store, redeemedAt: t1014.date,
        },
        {
          id: "rdm-6c", contactId: t1020.customerId!, contactName: t1020.customerName,
          transactionId: t1020.id, invoice: t1020.invoice, discountValue: 685000,
          channel: "tiktok", sourceName: "Point of Sale", store: t1020.store, redeemedAt: t1020.date,
        },
      ],
    },
  ];
}

// Bump this whenever the PromoCode/PromoRule shape changes — otherwise browsers
// with an older cached shape in localStorage will load stale data that crashes
// against the current code (e.g. rule.condition/reward missing on old records).
const STORAGE_KEY = "aroma_promo_store_v6";

function isCurrentShape(promos: unknown): promos is PromoCode[] {
  return Array.isArray(promos) && promos.every(
    (p) => p && typeof p === "object" && "rule" in p &&
      (p as PromoCode).rule?.condition?.kind !== undefined &&
      (p as PromoCode).rule?.reward?.kind !== undefined,
  );
}

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
      if (parsed?.promos && isCurrentShape(parsed.promos)) {
        _promos = parsed.promos;
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ promos: _promos }));
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

  addPromo(data: Omit<PromoCode, "id" | "redemptions">): string {
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
