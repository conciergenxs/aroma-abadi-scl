import { useSyncExternalStore } from "react";

export type TxStatus = "Paid" | "Pending" | "Refunded";

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
  items: TxLine[];
  total: number;
  paymentMethod: "QRIS" | "Debit" | "Credit Card" | "Cash" | "Transfer";
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
  const customers: { id: string; name: string }[] = [
    { id: "c1",  name: "Putri Anggraini" },
    { id: "c9",  name: "Citra Halim" },
    { id: "c11", name: "Bayu Hartanto" },
    { id: "c12", name: "Nadya Salsabila" },
    { id: "c3",  name: "Siti Rahmawati" },
    { id: "c6",  name: "Indah Permata" },
    { id: "c16", name: "Lina Wulandari" },
    { id: "c20", name: "Zahra Aulia" },
    { id: "c2",  name: "Bagus Pratama" },
    { id: "c13", name: "Ayu Fitriani" },
    { id: "c15", name: "Tiara Hapsari" },
    { id: "c22", name: "Dian Puspita" },
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
  const payments: Transaction["paymentMethod"][] = ["QRIS", "Debit", "Credit Card", "Cash", "Transfer"];
  const statuses: TxStatus[] = ["Paid", "Paid", "Paid", "Pending", "Refunded"];

  const today = new Date();
  for (let i = 0; i < 36; i++) {
    const d = new Date(today.getTime() - i * 8 * 3600 * 1000);
    const s = stores[i % stores.length];
    const ba = bas[i % bas.length];
    const cust = customers[i % customers.length];
    const lineCount = 1 + (i % 3);
    const lines: TxLine[] = [];
    let total = 0;
    let brand = skus[0].brand;
    for (let l = 0; l < lineCount; l++) {
      const sku = skus[(i + l) % skus.length];
      const qty = 1 + ((i + l) % 2);
      lines.push({ skuId: sku.skuId, skuCode: sku.skuCode, skuName: sku.skuName, qty, unitPrice: sku.price });
      total += sku.price * qty;
      brand = sku.brand;
    }
    items.push({
      id: `tx-${1000 + i}`,
      invoice: `AA-${String(82200 + i).padStart(5, "0")}`,
      date: d.toISOString(),
      customerId: cust.id,
      customerName: cust.name,
      baName: ba,
      store: s.store,
      city: s.city,
      brandName: brand,
      items: lines,
      total,
      paymentMethod: payments[i % payments.length],
      status: statuses[i % statuses.length],
      note: i % 5 === 0 ? "Customer minta sample shade lain." : undefined,
    });
  }
  return items;
}

const STORAGE_KEY = "aroma_tx_store_v3";

function load(): { transactions: Transaction[] } {
  if (typeof window === "undefined") return { transactions: seed() };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
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
