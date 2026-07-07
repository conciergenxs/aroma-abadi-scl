import { useSyncExternalStore } from "react";

export type TxStatus = "Processed" | "Shipped" | "Cancelled";

export type TxLine = {
  skuId: string;
  skuCode: string;
  skuName: string;
  qty: number;
  unitPrice: number;
};

export type Transaction = {
  id: string;
  invoice: string;
  date: string;
  customerId?: string;
  customerName: string;
  baName: string;
  store: string;
  city: string;
  brandName: string;
  brandNames: string[];
  items: TxLine[];
  total: number;
  paymentMethod: "QRIS" | "Debit" | "Credit Card" | "Transfer";
  status: TxStatus;
  note?: string;
};

function seed(): Transaction[] {
  const items: Transaction[] = [];
  const stores: { city: string; store: string }[] = [
    { city: "Jakarta", store: "Plaza Indonesia" },
    { city: "Jakarta", store: "Pondok Indah Mall" },
    { city: "Bandung", store: "Paris van Java" },
    { city: "Bandung", store: "Trans Studio Mall" },
    { city: "Surabaya", store: "Pakuwon Mall" },
  ];
  const bas = ["Dewi Lestari", "Maya Kusuma", "Reza Wijaya", "Hesti Andriani", "Indra Wahyudi", "Wulan Sari", "Kevin Nugroho"];
  // skuIndices: indices into skus[] that match each customer's brand(s)
  const customers: { id: string; name: string; skuIndices: number[] }[] = [
    { id: "c1",  name: "Putri Anggraini", skuIndices: [1, 2, 0] },    // sisley + dg
    { id: "c9",  name: "Citra Halim",     skuIndices: [5] },           // laura
    { id: "c11", name: "Bayu Hartanto",   skuIndices: [1, 2, 3, 4] }, // sisley + rimmel
    { id: "c12", name: "Nadya Salsabila", skuIndices: [5] },           // laura
    { id: "c3",  name: "Siti Rahmawati",  skuIndices: [1, 2] },        // sisley
    { id: "c6",  name: "Indah Permata",   skuIndices: [0, 1, 2] },     // dg + sisley
    { id: "c16", name: "Lina Wulandari",  skuIndices: [0, 5] },        // dg + laura
    { id: "c20", name: "Zahra Aulia",     skuIndices: [0] },           // dg
    { id: "c2",  name: "Bagus Pratama",   skuIndices: [3, 4] },        // rimmel
    { id: "c13", name: "Ayu Fitriani",    skuIndices: [0] },           // dg
    { id: "c15", name: "Tiara Hapsari",   skuIndices: [1, 2] },        // sisley
    { id: "c22", name: "Dian Puspita",    skuIndices: [1, 2] },        // sisley
  ];
  const skus = [
    { skuId: "sku-dg-caviar-42", skuCode: "DG-CHC-42", skuName: "Caviar Hydra-Crème Lipstick 42g", price: 685000, brand: "Dolce & Gabbana" },
    { skuId: "sku-sisley-real-flawless", skuCode: "SIS-RFF-30", skuName: "Real Flawless Foundation", price: 2450000, brand: "Sisley" },
    { skuId: "sku-sisley-feather", skuCode: "SIS-FMP-10", skuName: "Real Flawless Feather Matte Powder Foundation", price: 1850000, brand: "Sisley" },
    { skuId: "sku-rimmel-translucent-powder", skuCode: "RIM-TLS-25", skuName: "Translucent Loose Setting Powder", price: 189000, brand: "Rimmel" },
    { skuId: "sku-rimmel-spray", skuCode: "RIM-THS-100", skuName: "Translucent Hydrating Setting Spray Ultra-Blur", price: 215000, brand: "Rimmel" },
    { skuId: "sku-laura-translucent", skuCode: "LM-TLS-29", skuName: "Translucent Loose Setting Powder", price: 745000, brand: "Laura Mercier" },
    { skuId: "sku-bm-color-infusion", skuCode: "BM-BCI-06", skuName: "Blush Color Infusion", price: 425000, brand: "BareMinerals" },
  ];
  const payments: Transaction["paymentMethod"][] = ["QRIS", "Debit", "Credit Card", "Transfer"];
  const statuses: TxStatus[] = ["Processed", "Shipped", "Shipped", "Processed", "Cancelled"];

  // Use a fixed epoch so server and client produce identical dates (avoids SSR hydration mismatch)
  const BASE_EPOCH = 1751846400000; // 2025-07-07 00:00:00 UTC — fixed, never changes
  for (let i = 0; i < 36; i++) {
    const d = new Date(BASE_EPOCH - i * 8 * 3600 * 1000);
    const s = stores[i % stores.length];
    const ba = bas[i % bas.length];
    const cust = customers[i % customers.length];
    const lineCount = 1 + (i % 3);
    const lines: TxLine[] = [];
    let total = 0;
    const brandSet = new Set<string>();
    for (let l = 0; l < lineCount; l++) {
      // Pick SKU from this customer's allowed brand SKUs
      const allowedIdx = cust.skuIndices[(i + l) % cust.skuIndices.length];
      const sku = skus[allowedIdx];
      const qty = 1 + ((i + l) % 2);
      lines.push({ skuId: sku.skuId, skuCode: sku.skuCode, skuName: sku.skuName, qty, unitPrice: sku.price });
      total += sku.price * qty;
      brandSet.add(sku.brand);
    }
    const brandNames = Array.from(brandSet);
    items.push({
      id: `tx-${1000 + i}`,
      invoice: `AA-${String(82200 + i).padStart(5, "0")}`,
      date: d.toISOString(),
      customerId: cust.id,
      customerName: cust.name,
      baName: ba,
      store: s.store,
      city: s.city,
      brandName: brandNames[0],
      brandNames,
      items: lines,
      total,
      paymentMethod: payments[i % payments.length],
      status: statuses[i % statuses.length],
      note: i % 5 === 0 ? "Customer minta sample shade lain." : undefined,
    });
  }
  return items;
}

const STORAGE_KEY = "aroma_tx_store_v7";

function load(): { transactions: Transaction[] } {
  if (typeof window === "undefined") return { transactions: seed() };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { transactions: Transaction[] };
      // Migrate: ensure brandNames exists on every transaction
      const migrated = parsed.transactions.map((t) => ({
        ...t,
        brandNames: t.brandNames ?? (t.brandName ? [t.brandName] : []),
      }));
      return { transactions: migrated };
    }
  } catch { /* ignore */ }
  const initial = { transactions: seed() };
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

export const transactionsStore = {
  get state() { return state; },
  reseed() { state = { transactions: seed() }; emit(); },
};

export function useTransactionsStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function formatIDR(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}
