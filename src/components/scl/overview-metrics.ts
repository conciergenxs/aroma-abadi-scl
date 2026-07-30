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

export const audienceDonutData = [
  { name: "Active Customers", value: audienceSegmentation.activeCustomers, color: "var(--chart-1)" },
  { name: "Potential Customers", value: audienceSegmentation.potentialCustomers, color: "var(--chart-2)" },
  { name: "Sleeping Customers", value: audienceSegmentation.sleepingCustomers, color: "var(--chart-3)" },
  {
    name: "Other Contacts",
    value: audienceSegmentation.contacts - audienceSegmentation.activeContacts - audienceSegmentation.sleepingCustomers,
    color: "var(--chart-4)",
  },
];

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

export function computeBroadcastMetrics(): BroadcastMetrics {
  const sent = broadcasts.filter((b) => b.status === "Sent");
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
    // Inbound organic volume — kept above `replied` since replies are a
    // subset of all customer-initiated messages received.
    messageReceived: 2540,
    deliveryRate: reach ? delivered / reach : 0,
    readRate: delivered ? read / delivered : 0,
  };
}

// ── C. Conversation & Product Intelligence ──────────────────────────────
export const totalConversations = conversations.length;

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
];

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

export function computeOrdersAndSales(transactions: Transaction[]): OrdersAndSales {
  const totalOrders = transactions.length;
  const paid = transactions.filter((t) => t.status !== "Cancelled");
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

  const mostAddedToCart = Array.from(skuMap.values()).sort((a, b) => b.count - a.count);

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
