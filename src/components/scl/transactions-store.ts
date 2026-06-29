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
  date: string; // ISO
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
    { city: "Jakarta", store: "Tunjungan Plaza" },
    { city: "Jakarta", store: "Pondok Indah Mall" },
    { city: "Bandung", store: "Paris van Java" },
    { city: "Bandung", store: "Trans Studio Mall" },
    { city: "Surabaya", store: "Pakuwon Mall" },
  ];
  const bas = ["Putri Anggraini", "Dewi Lestari", "Reza Wijaya", "Indah Permata", "Bagus Pratama"];
  const customers = ["Sari Wulandari", "Linda Hartono", "Maya Kusuma", "Andini Pertiwi", "Rina Susilo", "Bayu Hartanto", "Citra Halim", "Nadya Salsabila"];
  const skus = [
    { skuId: "sku-glow-velvet-03", skuCode: "AG-VR-03", skuName: "Velvet Rouge 03 Mauve", price: 189000, brand: "Aroma Glow" },
    { skuId: "sku-glow-velvet-05", skuCode: "AG-VR-05", skuName: "Velvet Rouge 05 Berry", price: 189000, brand: "Aroma Glow" },
    { skuId: "sku-glow-serum",     skuCode: "AG-GS-30", skuName: "Glow Serum 30ml",       price: 285000, brand: "Aroma Glow" },
    { skuId: "sku-velvet-cushion-01", skuCode: "AV-CC-01", skuName: "Velvet Cushion 01 Ivory", price: 245000, brand: "Aroma Velvet" },
    { skuId: "sku-velvet-cushion-02", skuCode: "AV-CC-02", skuName: "Velvet Cushion 02 Beige", price: 245000, brand: "Aroma Velvet" },
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
      customerName: cust,
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

const STORAGE_KEY = "aroma_tx_store_v1";

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
