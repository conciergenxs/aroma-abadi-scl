import { useSyncExternalStore } from "react";
// Currency is formatted in one place for the whole app — see lib/fmt.
export { fmtIDR as formatIDR } from "@/lib/fmt";

export type TxStatus = "Processed" | "Shipped" | "Cancelled";

export type TxLine = {
  skuId: string;
  skuCode: string;
  skuName: string;
  qty: number;
  unitPrice: number;
};

/** An order placed through ARMA, the WhatsApp AI assistant. That is the only
 * place transactions come from — there are no in-store or BA-recorded sales —
 * so an order has a delivery city but no store and no BA. */
export type Transaction = {
  id: string;
  invoice: string;
  date: string;
  customerId?: string;
  customerName: string;
  /** Where the order ships to. */
  city: string;
  brandName: string;
  brandNames: string[];
  items: TxLine[];
  /** Goods value: the lines before anything is added or taken off. This is the
   * base every promo and referral rule measures against — a percentage off or
   * a minimum spend is about what was bought, not about tax and fees. */
  subtotal: number;
  /** Order-level discount. Not every order has one. */
  discount: number;
  /** PPN at the Indonesian standard rate, charged on subtotal less discount. */
  tax: number;
  /** What the payment channel takes: a percentage for the card rails, a flat
   * fee for bank transfer and debit. */
  adminFee: number;
  /** What the customer actually paid: subtotal - discount + tax + adminFee. */
  total: number;
  paymentMethod: "QRIS" | "Debit" | "Credit Card" | "Transfer";
  status: TxStatus;
  note?: string;
};

export const PPN_RATE = 0.11;

/** Percentage rails charge a cut of the amount; the others take a flat fee. */
const ADMIN_FEE: Record<Transaction["paymentMethod"], { pct?: number; flat?: number }> = {
  QRIS: { pct: 0.007 },
  "Credit Card": { pct: 0.029 },
  Debit: { flat: 2500 },
  Transfer: { flat: 6500 },
};

/** Builds the money breakdown from the goods value. Kept in one place so the
 * peek never has to re-derive it and drift from what the store holds. */
export function priceOrder(
  subtotal: number,
  discount: number,
  paymentMethod: Transaction["paymentMethod"],
) {
  const net = Math.max(0, subtotal - discount);
  const tax = Math.round(net * PPN_RATE);
  const fee = ADMIN_FEE[paymentMethod];
  const adminFee = fee.flat ?? Math.round(net * (fee.pct ?? 0));
  return { subtotal, discount, tax, adminFee, total: net + tax + adminFee };
}

function seed(): Transaction[] {
  const items: Transaction[] = [];
  const cities = ["Jakarta", "Jakarta", "Bandung", "Surabaya", "Tangerang"];
  // skuIndices: indices into skus[] that match each customer's brand(s)
  const customers: { id: string; name: string; skuIndices: number[] }[] = [
    { id: "c1", name: "Putri Anggraini", skuIndices: [1, 2, 0] }, // sisley + dg
    { id: "c9", name: "Citra Halim", skuIndices: [5] }, // laura
    { id: "c11", name: "Bayu Hartanto", skuIndices: [1, 2, 3, 4] }, // sisley + rimmel
    { id: "c12", name: "Nadya Salsabila", skuIndices: [5] }, // laura
    { id: "c3", name: "Siti Rahmawati", skuIndices: [1, 2] }, // sisley
    { id: "c6", name: "Indah Permata", skuIndices: [0, 1, 2] }, // dg + sisley
    { id: "c16", name: "Lina Wulandari", skuIndices: [0, 5] }, // dg + laura
    { id: "c20", name: "Zahra Aulia", skuIndices: [0] }, // dg
    { id: "c2", name: "Bagus Pratama", skuIndices: [3, 4] }, // rimmel
    { id: "c13", name: "Ayu Fitriani", skuIndices: [0] }, // dg
    { id: "c15", name: "Tiara Hapsari", skuIndices: [1, 2] }, // sisley
    { id: "c22", name: "Dian Puspita", skuIndices: [1, 2] }, // sisley
  ];
  const skus = [
    {
      skuId: "sku-dg-caviar-42",
      skuCode: "DG-CHC-42",
      skuName: "Caviar Hydra-Crème Lipstick 42g",
      price: 685000,
      brand: "Dolce & Gabbana",
    },
    {
      skuId: "sku-sisley-real-flawless",
      skuCode: "SIS-RFF-30",
      skuName: "Real Flawless Foundation",
      price: 2450000,
      brand: "Sisley",
    },
    {
      skuId: "sku-sisley-feather",
      skuCode: "SIS-FMP-10",
      skuName: "Real Flawless Feather Matte Powder Foundation",
      price: 1850000,
      brand: "Sisley",
    },
    {
      skuId: "sku-rimmel-translucent-powder",
      skuCode: "RIM-TLS-25",
      skuName: "Translucent Loose Setting Powder",
      price: 189000,
      brand: "Rimmel",
    },
    {
      skuId: "sku-rimmel-spray",
      skuCode: "RIM-THS-100",
      skuName: "Translucent Hydrating Setting Spray Ultra-Blur",
      price: 215000,
      brand: "Rimmel",
    },
    {
      skuId: "sku-laura-translucent",
      skuCode: "LM-TLS-29",
      skuName: "Translucent Loose Setting Powder",
      price: 745000,
      brand: "Laura Mercier",
    },
    {
      skuId: "sku-bm-color-infusion",
      skuCode: "BM-BCI-06",
      skuName: "Blush Color Infusion",
      price: 425000,
      brand: "BareMinerals",
    },
  ];
  const payments: Transaction["paymentMethod"][] = ["QRIS", "Debit", "Credit Card", "Transfer"];
  const statuses: TxStatus[] = ["Processed", "Shipped", "Shipped", "Processed", "Cancelled"];

  // Use a fixed epoch so server and client produce identical dates (avoids SSR hydration mismatch)
  const BASE_EPOCH = 1785369600000; // 2026-07-30 00:00:00 UTC — fixed, never changes; kept anchored to "today" so the Overview date picker's range actually reaches the present
  for (let i = 0; i < 36; i++) {
    const d = new Date(BASE_EPOCH - i * 8 * 3600 * 1000);
    const cust = customers[i % customers.length];
    const lineCount = 1 + (i % 3);
    const lines: TxLine[] = [];
    let subtotal = 0;
    const brandSet = new Set<string>();
    for (let l = 0; l < lineCount; l++) {
      // Pick SKU from this customer's allowed brand SKUs
      const allowedIdx = cust.skuIndices[(i + l) % cust.skuIndices.length];
      const sku = skus[allowedIdx];
      const qty = 1 + ((i + l) % 2);
      lines.push({
        skuId: sku.skuId,
        skuCode: sku.skuCode,
        skuName: sku.skuName,
        qty,
        unitPrice: sku.price,
      });
      subtotal += sku.price * qty;
      brandSet.add(sku.brand);
    }
    const brandNames = Array.from(brandSet);
    // Roughly a quarter of orders carry a discount, so the row has something to
    // show without appearing on every single order.
    const paymentMethod = payments[i % payments.length];
    const discount = i % 4 === 1 ? Math.round((subtotal * 0.1) / 1000) * 1000 : 0;
    const money = priceOrder(subtotal, discount, paymentMethod);
    items.push({
      id: `tx-${1000 + i}`,
      invoice: `AA-${String(82200 + i).padStart(5, "0")}`,
      date: d.toISOString(),
      customerId: cust.id,
      customerName: cust.name,
      city: cities[i % cities.length],
      brandName: brandNames[0],
      brandNames,
      items: lines,
      ...money,
      paymentMethod,
      status: statuses[i % statuses.length],
      note: i % 5 === 0 ? "Customer minta sample shade lain lewat ARMA." : undefined,
    });
  }
  return items;
}

// v13: orders carry a money breakdown — subtotal, discount, PPN, admin fee.
const STORAGE_KEY = "aroma_tx_store_v13";

function load(): { transactions: Transaction[] } {
  if (typeof window === "undefined") return { transactions: seed() };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { transactions: Transaction[] };
      // Migrate: ensure brandNames exists on every transaction
      const migrated = parsed.transactions.map((t) => {
        // A payload written before v13 has `total` holding the goods value and
        // no breakdown, so rebuild it rather than rendering blank money rows.
        const money =
          t.subtotal === undefined
            ? priceOrder(t.total, 0, t.paymentMethod)
            : {
                subtotal: t.subtotal,
                discount: t.discount,
                tax: t.tax,
                adminFee: t.adminFee,
                total: t.total,
              };
        return {
          ...t,
          ...money,
          brandNames: t.brandNames ?? (t.brandName ? [t.brandName] : []),
        };
      });
      return { transactions: migrated };
    }
  } catch {
    /* ignore */
  }
  const initial = { transactions: seed() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {
    /* ignore */
  }
  return initial;
}

let state = load();
const listeners = new Set<() => void>();
const emit = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => state;

// What SSR actually rendered (server has no localStorage) — a stable
// reference distinct from `state` so useSyncExternalStore can detect that
// the client's real (localStorage-backed) value differs and correctly
// re-render after hydration, instead of leaving stale server-rendered DOM
// stuck on screen. See promo-store.ts for the same fix via a different
// (useState+useEffect) mechanism.
const SERVER_SNAPSHOT: { transactions: Transaction[] } = { transactions: seed() };
const getServerSnapshot = () => SERVER_SNAPSHOT;

export const transactionsStore = {
  get state() {
    return state;
  },
  reseed() {
    state = { transactions: seed() };
    emit();
  },
};

export function useTransactionsStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** The colours an order's status wears — shared so the same order never looks
 * different in the table than it does in the side peek. */
export function txStatusBadge(status: string) {
  if (status === "Shipped") return "border-emerald-700 bg-emerald-600 text-white";
  if (status === "Cancelled") return "border-rose-700 bg-rose-600 text-white";
  return "border-sky-700 bg-sky-600 text-white"; // Processed
}
