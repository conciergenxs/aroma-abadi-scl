import type { Transaction } from "./transactions-store";
import { broadcasts } from "./mock-data";

// ── SKU code → brand lookup (transaction lines only carry skuCode/skuName) ──
const BRAND_BY_SKU_PREFIX: Record<string, string> = {
  DG: "Dolce & Gabbana",
  SIS: "Sisley",
  RIM: "Rimmel",
  LM: "Laura Mercier",
  BM: "BareMinerals",
};

function brandFromSkuCode(skuCode: string): string {
  return BRAND_BY_SKU_PREFIX[skuCode.split("-")[0]] ?? "Other";
}

// ── Date range filtering — drives the Overview page's date picker. ─────────
// Only transactions and "Sent" broadcasts carry real dates in this seed data,
// so those are filtered precisely; everything else (audience counts, total
// conversations, static product rankings) has no per-record date to filter
// by and is scaled proportionally to the selected range's share of the full
// dataset window instead.
export type DateRange = { start: string; end: string }; // inclusive, "YYYY-MM-DD"

function inRange(iso: string, range?: DateRange): boolean {
  if (!range) return true;
  const day = iso.slice(0, 10);
  return day >= range.start && day <= range.end;
}

export function getTransactionDateBounds(transactions: Transaction[]): DateRange {
  if (transactions.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    return { start: today, end: today };
  }
  const days = transactions.map((t) => t.date.slice(0, 10)).sort();
  return { start: days[0], end: days[days.length - 1] };
}

export function computeRangeScale(range: DateRange, fullRange: DateRange): number {
  const dayCount = (r: DateRange) =>
    Math.round((new Date(r.end).getTime() - new Date(r.start).getTime()) / 86_400_000) + 1;
  const fullDays = dayCount(fullRange);
  if (fullDays <= 0) return 1;
  return Math.min(1, Math.max(0.02, dayCount(range) / fullDays));
}

function scaleStatic(baseline: number, scale: number): number {
  return Math.max(0, Math.round(baseline * scale));
}

// ── A. Audience & Segmentation ──────────────────────────────────────────
// The seeded contact list has no real interaction-recency history to compute
// a 6-month window from, so these stay illustrative — but kept internally
// consistent: activeCustomers + potentialCustomers = activeContacts.
export const audienceSegmentation = {
  contacts: 3180,
  activeContacts: 1742,
  activeCustomers: 968,
  potentialCustomers: 774,
  sleepingCustomers: 412,
};

export function scaledAudienceSegmentation(scale: number) {
  return {
    contacts: scaleStatic(audienceSegmentation.contacts, scale),
    activeContacts: scaleStatic(audienceSegmentation.activeContacts, scale),
    activeCustomers: scaleStatic(audienceSegmentation.activeCustomers, scale),
    potentialCustomers: scaleStatic(audienceSegmentation.potentialCustomers, scale),
    sleepingCustomers: scaleStatic(audienceSegmentation.sleepingCustomers, scale),
  };
}

// ── B. Broadcast & Messaging — derived from the real broadcasts[] seed ──
export type BroadcastMetrics = {
  broadcastSent: number;
  reach: number;
  delivered: number;
  read: number;
  replied: number;
  messageReceived: number;
  deliveryRate: number;
  readRate: number;
};

export function computeBroadcastMetrics(range?: DateRange, scale = 1): BroadcastMetrics {
  const sent = broadcasts.filter((b) => b.status === "Sent" && (!range || inRange(b.sentAtDate ?? "", range)));
  const reach = sent.reduce((s, b) => s + b.reach, 0);
  const delivered = sent.reduce((s, b) => s + b.delivered, 0);
  const read = sent.reduce((s, b) => s + b.read, 0);
  const replied = sent.reduce((s, b) => s + (b.replied ?? 0), 0);
  return {
    broadcastSent: sent.length,
    reach,
    delivered,
    read,
    replied,
    // Inbound organic volume has no real per-record date to filter by —
    // kept proportional to the selected range, and above `replied` since
    // replies are a subset of all customer-initiated messages received.
    messageReceived: scaleStatic(2540, scale),
    deliveryRate: reach ? delivered / reach : 0,
    readRate: delivered ? read / delivered : 0,
  };
}

// ── C. Conversation & Product Intelligence ──────────────────────────────
// The seeded `conversations` list is just a handful of inbox-preview rows,
// not a real conversation log — using its length here would make Conversion
// Rate exceed 100% against the real transaction count. Kept illustrative,
// consistent with the other volume metrics that have no real backing array.
export const totalConversations = 1240;

export type RankedProduct = { name: string; brand: string; count: number };

export const mostAskedProducts: RankedProduct[] = [
  { name: "Real Flawless Foundation", brand: "Sisley", count: 214 },
  { name: "Caviar Hydra-Crème Lipstick 42g", brand: "Dolce & Gabbana", count: 176 },
  { name: "Translucent Loose Setting Powder", brand: "Laura Mercier", count: 158 },
  { name: "Blush Color Infusion", brand: "BareMinerals", count: 121 },
  { name: "Translucent Hydrating Setting Spray Ultra-Blur", brand: "Rimmel", count: 96 },
];

export const mostUnfulfilledProducts: RankedProduct[] = [
  { name: "Velvet Rouge Shade 03", brand: "Limited restock", count: 42 },
  { name: "Laura Mercier Translucent Powder", brand: "Laura Mercier", count: 27 },
  { name: "Glow Serum — 3-bottle bundle", brand: "Limited restock", count: 19 },
  { name: "Vitamin C Serum", brand: "Limited restock", count: 11 },
  { name: "Real Flawless Feather Matte Powder Foundation", brand: "Sisley", count: 7 },
];

export function scaledTotalConversations(scale: number): number {
  return scaleStatic(totalConversations, scale);
}

export function scaleRankedProducts(items: RankedProduct[], scale: number): RankedProduct[] {
  return items.map((item) => ({ ...item, count: scaleStatic(item.count, scale) }));
}

// ── D. Orders & Sales — fully derived from the real transactions[] seed ──
export type OrdersAndSales = {
  totalOrders: number;
  totalTransactions: number;
  totalSales: number;
  totalQty: number;
  qtyByBrand: { brand: string; qty: number }[];
  mostAddedToCart: RankedProduct[];
  dailySales: { date: string; sales: number }[];
};

export function computeOrdersAndSales(transactions: Transaction[], range?: DateRange): OrdersAndSales {
  const scoped = range ? transactions.filter((t) => inRange(t.date, range)) : transactions;
  const totalOrders = scoped.length;
  const paid = scoped.filter((t) => t.status !== "Cancelled");
  const totalTransactions = paid.length;
  const totalSales = paid.reduce((s, t) => s + t.total, 0);

  const qtyByBrandMap = new Map<string, number>();
  const skuMap = new Map<string, RankedProduct>();
  const salesByDay = new Map<string, number>();
  let totalQty = 0;

  for (const t of paid) {
    const day = t.date.slice(0, 10);
    salesByDay.set(day, (salesByDay.get(day) ?? 0) + t.total);

    for (const line of t.items) {
      totalQty += line.qty;
      const brand = brandFromSkuCode(line.skuCode);
      qtyByBrandMap.set(brand, (qtyByBrandMap.get(brand) ?? 0) + line.qty);

      const existing = skuMap.get(line.skuId);
      if (existing) existing.count += line.qty;
      else skuMap.set(line.skuId, { name: line.skuName, brand, count: line.qty });
    }
  }

  const qtyByBrand = Array.from(qtyByBrandMap.entries())
    .map(([brand, qty]) => ({ brand, qty }))
    .sort((a, b) => b.qty - a.qty);

  const mostAddedToCart = Array.from(skuMap.values()).sort((a, b) => b.count - a.count).slice(0, 5);

  const dailySales = Array.from(salesByDay.entries())
    .map(([date, sales]) => ({ date, sales }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { totalOrders, totalTransactions, totalSales, totalQty, qtyByBrand, mostAddedToCart, dailySales };
}

// ── E. Averages / Basket Economics ──────────────────────────────────────
export const avgMessagesBetweenTransaction = 6.4;

export function computeAverages(orders: OrdersAndSales) {
  return {
    avgOrderValue: orders.totalOrders ? orders.totalSales / orders.totalOrders : 0,
    avgSellingPrice: orders.totalQty ? orders.totalSales / orders.totalQty : 0,
    avgBasketSize: orders.totalOrders ? orders.totalQty / orders.totalOrders : 0,
  };
}

// ── F. Funnel / Rate Metrics ────────────────────────────────────────────
export function computeFunnelRates(broadcast: BroadcastMetrics, conversationsCount: number, transactionsCount: number) {
  return {
    conversationRate: broadcast.reach ? broadcast.replied / broadcast.reach : 0,
    conversionRate: conversationsCount ? transactionsCount / conversationsCount : 0,
  };
}
