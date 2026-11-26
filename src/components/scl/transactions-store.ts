import { useSyncExternalStore } from "react";
import { rng } from "@/lib/seed-rng";
import { todayWIBUtc } from "@/lib/wib";
// Currency is formatted in one place for the whole app — see lib/fmt.
export { fmtIDR as formatIDR } from "@/lib/fmt";

/**
 * Where an order has got to.
 *
 * Five of these are the fulfilment sequence the business actually runs, in
 * order: the customer owes, the money landed and the warehouse is packing,
 * the parcel is boxed and waiting on a courier, the courier has it, it
 * arrived. The two "waiting" stages are separate on purpose — one is blocked
 * on the customer, the other on the courier, and they go wrong for different
 * reasons.
 *
 * "Order Cancelled" is the sixth and is not a stage: an order leaves the
 * sequence for it and never comes back. It is kept because the figures need
 * somewhere to put an order that produced no money — see countsAsRevenue.
 *
 * These exact six, and the wording of each, come from the owner's status
 * sheet. Do not invent a seventh or re-word one here: the customer sees these
 * strings in WhatsApp, so the app and the message have to agree.
 */
export type TxStatus =
  | "Waiting for Payment"
  | "Payment Received"
  | "Waiting for Courier"
  | "On the Way"
  | "Delivered"
  | "Order Cancelled";

/** The fulfilment sequence, in the order it happens, with the exit at the end.
 * Typed as TxStatus so a stage added to the union without being placed here is
 * a compile error. This is also the order every status filter lists. */
export const TX_JOURNEY: TxStatus[] = [
  "Waiting for Payment",
  "Payment Received",
  "Waiting for Courier",
  "On the Way",
  "Delivered",
  "Order Cancelled",
];

/**
 * What each status is called where there is room, and what it tells the
 * customer.
 *
 * A chip in a table cell gets the short name — it has to sit beside five
 * other columns. A side peek or a detail page has a line to spare, so it
 * shows the long name and the sentence underneath, which is the same sentence
 * the customer reads in WhatsApp. One table, so the two can never drift.
 */
export const TX_STATUS_META: Record<TxStatus, { long: string; subtext: string }> = {
  "Waiting for Payment": {
    long: "Waiting for Payment",
    subtext: "Complete your payment to confirm the order.",
  },
  "Payment Received": {
    long: "Payment Received, Preparing Order",
    subtext: "We got your payment and are preparing your order.",
  },
  "Waiting for Courier": {
    long: "Packed & Waiting for Courier",
    subtext: "Your order is packed and waiting for courier pickup.",
  },
  "On the Way": {
    long: "On the Way to You",
    subtext: "The courier has picked up your order and is delivering it.",
  },
  Delivered: {
    long: "Delivered to You",
    subtext: "Your order has arrived.",
  },
  "Order Cancelled": {
    long: "Order Cancelled",
    subtext: "This order has been cancelled.",
  },
};

/**
 * Status for a seeded order, by cumulative weight.
 *
 * Delivered leads, because the seed stretches back to 2023 and a 2023 order
 * has finished. The live stages keep roughly a tenth each rather than the
 * handful strict realism would leave them: this is the spec the team builds
 * from, and a stage that appears twice in a thousand rows is a stage nobody
 * sees rendered. Every page that lists orders — a customer's history, a
 * SKU's — draws its first page from this mix, so the weights are what decides
 * whether those pages exercise all six chips or only the two most common.
 */
function rollStatus(roll: number): TxStatus {
  if (roll < 0.07) return "Order Cancelled";
  if (roll < 0.15) return "Waiting for Payment";
  if (roll < 0.26) return "Payment Received";
  if (roll < 0.37) return "Waiting for Courier";
  if (roll < 0.5) return "On the Way";
  return "Delivered";
}

/**
 * Whether an order counts as money taken.
 *
 * Not simply "anything but cancelled": an order waiting on payment has
 * produced no revenue either, and counting it would overstate every sales
 * figure on the Overview. Everything from Payment Received onwards has been
 * paid for — the warehouse does not pack against an unpaid order — so the
 * whole fulfilment tail counts, whether or not the parcel has arrived yet.
 */
export function countsAsRevenue(status: TxStatus | string): boolean {
  return status !== "Order Cancelled" && status !== "Waiting for Payment";
}

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

const DAY_MS = 86_400_000;

/** Stretches with no orders at all — a quiet fortnight, a supply gap, and one
 *  full month. Trading is not uniform, and the Sales Trend has to stay honest
 *  across the quiet: a month nobody bought in is still a month, and it belongs
 *  on the axis at zero rather than being closed up as if it never happened. */
const QUIET_STRETCHES: [string, string][] = [
  ["2023-07-03", "2023-07-19"],
  ["2024-09-05", "2024-09-22"],
  ["2025-02-10", "2025-02-27"],
  ["2025-08-01", "2025-08-31"],
  ["2026-05-04", "2026-05-20"],
];

/** The twelve customers above are the ones the promo and referral seeds name;
 *  these widen the base for the generated history, so two years of orders are
 *  not twelve people buying thirty times each. */
const EXTRA_CUSTOMERS: { id: string; name: string; skuIndices: number[] }[] = [
  { id: "c5", name: "Rizky Maulana", skuIndices: [3, 4, 6, 0] },
  { id: "c7", name: "Andika Saputra", skuIndices: [0, 3, 4, 1] },
  { id: "c18", name: "Nita Kurniasari", skuIndices: [1, 2, 5, 6] },
  { id: "c21", name: "Mira Rahmawati", skuIndices: [5, 6, 0, 2, 3] },
  { id: "c31", name: "Mia Hartanti", skuIndices: [1, 5, 6, 4] },
  { id: "c32", name: "Fauzan Akbar", skuIndices: [3, 4, 0, 6] },
  { id: "c33", name: "Nadia Pramesti", skuIndices: [2, 1, 5, 0, 6] },
  { id: "c34", name: "Bintang Ramadan", skuIndices: [0, 4, 3, 2] },
  { id: "c35", name: "Clara Santika", skuIndices: [5, 2, 1, 6, 3] },
  { id: "c36", name: "Ariel Wijaya", skuIndices: [4, 3, 6, 1] },
  { id: "c37", name: "Fina Rahayu", skuIndices: [6, 0, 5, 2] },
  { id: "c38", name: "Dodi Kurnia", skuIndices: [3, 0, 1, 4, 5] },
];

function seed(): Transaction[] {
  const items: Transaction[] = [];
  const cities = ["Jakarta", "Jakarta", "Bandung", "Surabaya", "Tangerang"];
  // skuIndices: indices into skus[] that match each customer's brand(s)
  const customers: { id: string; name: string; skuIndices: number[] }[] = [
    // Every customer shops across at least four of the seven SKUs. Baskets are
    // built by cycling this list, so a short list caps how many *different*
    // products an order can hold no matter how many lines it has — which is why
    // single-SKU customers used to produce one-item orders every time.
    { id: "c1", name: "Putri Anggraini", skuIndices: [1, 2, 0, 5, 3] },
    { id: "c9", name: "Citra Halim", skuIndices: [5, 1, 2, 6] },
    { id: "c11", name: "Bayu Hartanto", skuIndices: [1, 2, 3, 4, 5, 0] },
    { id: "c12", name: "Nadya Salsabila", skuIndices: [5, 0, 1, 4] },
    { id: "c3", name: "Siti Rahmawati", skuIndices: [1, 2, 6, 0, 3] },
    { id: "c6", name: "Indah Permata", skuIndices: [0, 1, 2, 6, 4] },
    { id: "c16", name: "Lina Wulandari", skuIndices: [0, 5, 1, 2, 3] },
    { id: "c20", name: "Zahra Aulia", skuIndices: [0, 3, 4, 6] },
    { id: "c2", name: "Bagus Pratama", skuIndices: [3, 4, 6, 1, 5] },
    { id: "c13", name: "Ayu Fitriani", skuIndices: [0, 2, 5, 6] },
    { id: "c15", name: "Tiara Hapsari", skuIndices: [1, 2, 5, 6, 0] },
    { id: "c22", name: "Dian Puspita", skuIndices: [1, 2, 3, 0, 4, 6] },
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
  const historyCustomers = [...customers, ...EXTRA_CUSTOMERS];
  const payments: Transaction["paymentMethod"][] = ["QRIS", "Debit", "Credit Card", "Transfer"];
  // The fixed block sits in July 2026, months back, so it is mostly finished
  // business with the odd cancellation — not a parade of live stages.
  const statuses: TxStatus[] = [
    "Delivered",
    "On the Way",
    "Delivered",
    "Waiting for Courier",
    "Order Cancelled",
  ];

  // Use a fixed epoch so server and client produce identical dates (avoids SSR hydration mismatch)
  const BASE_EPOCH = 1785369600000; // 2026-07-30 00:00:00 UTC — fixed, never changes; kept anchored to "today" so the Overview date picker's range actually reaches the present
  for (let i = 0; i < 36; i++) {
    const d = new Date(BASE_EPOCH - i * 8 * 3600 * 1000);
    const cust = customers[i % customers.length];
    const lineCount = 1 + (i % 7);
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
    // No discount is invented here. An order is only discounted because a promo
    // or referral code was redeemed on it, and those stores set it through
    // applyCodeDiscounts once they know which order used which code.
    const paymentMethod = payments[i % payments.length];
    const money = priceOrder(subtotal, 0, paymentMethod);
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

  // ── The history behind that fortnight ──────────────────────────────────
  // The block above is the workspace's recent, dense activity, and the promo
  // and referral seeds point at it by id. Everything before and after it is
  // generated here so the Overview covers a real stretch of trading — from
  // 1 Jan 2024 to today — and the Sales Trend can be read at every window the
  // date filter offers, not just the one fortnight that used to exist. It
  // starts four calendar years back and ends today, so the lifetime view has
  // four yearly points to draw; see trendGranularityFor.
  const history: Transaction[] = [];
  const rand = rng(20250101);
  const firstDay = Date.UTC(2023, 0, 1);
  const lastDay = todayWIBUtc();
  const span = Math.max(1, lastDay - firstDay);

  for (let t = firstDay; t <= lastDay; t += DAY_MS) {
    const d = new Date(t);
    const iso = d.toISOString().slice(0, 10);
    // The fixed block already owns these days.
    if (iso >= "2026-07-18" && iso <= "2026-07-30") continue;
    if (QUIET_STRETCHES.some(([from, to]) => iso >= from && iso <= to)) continue;

    // Orders a day: a business that grew, busier into the weekend, and busier
    // again before Lebaran and over the year-end gifting season.
    const progress = (t - firstDay) / span;
    const dow = d.getUTCDay();
    const weekend = dow === 0 || dow === 5 || dow === 6 ? 1.35 : 0.85;
    const month = d.getUTCMonth() + 1;
    const season = month === 3 ? 1.65 : month === 12 ? 1.4 : month === 6 ? 1.15 : 1;
    const expected = (0.15 + 1.5 * progress * progress) * weekend * season;
    let orderCount = Math.floor(expected);
    if (rand() < expected - orderCount) orderCount += 1;

    for (let n = 0; n < orderCount; n++) {
      const cust = historyCustomers[Math.floor(rand() * historyCustomers.length)];
      const lineCount = 1 + Math.floor(rand() * 5);
      const lines: TxLine[] = [];
      let subtotal = 0;
      const brandSet = new Set<string>();
      for (let l = 0; l < lineCount; l++) {
        const sku = skus[cust.skuIndices[Math.floor(rand() * cust.skuIndices.length)]];
        if (lines.some((line) => line.skuId === sku.skuId)) continue;
        const qty = 1 + Math.floor(rand() * 3);
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
      // An order placed somewhere between 08:00 and 21:00 WIB.
      const hour = 1 + Math.floor(rand() * 13); // WIB 08:00–21:00 is UTC 01:00–14:00
      const paymentMethod = payments[Math.floor(rand() * payments.length)];
      const money = priceOrder(subtotal, 0, paymentMethod);
      const roll = rand();
      history.push({
        id: "",
        invoice: "",
        date: new Date(t + hour * 3600 * 1000 + Math.floor(rand() * 60) * 60000).toISOString(),
        customerId: cust.id,
        customerName: cust.name,
        city: cities[Math.floor(rand() * cities.length)],
        brandName: Array.from(brandSet)[0],
        brandNames: Array.from(brandSet),
        items: lines,
        ...money,
        paymentMethod,
        // Weighted towards Complete, because almost every order in the seed
        // is months old and a months-old order has finished. The live stages
        // still get a few hundred orders between them, which is what the
        // status filter and the pipeline figures need to have something to
        // count.
        status: rollStatus(roll),
      });
    }
  }

  // Invoice numbers run with the calendar, and the fixed block holds
  // AA-82200 to AA-82235 — so the history before it counts up to AA-82199 and
  // the history after it carries on from AA-82236.
  history.sort((a, b) => a.date.localeCompare(b.date));
  const before = history.filter((t) => t.date < "2026-07-18");
  const after = history.filter((t) => t.date > "2026-07-30");
  before.forEach((t, i) => {
    t.id = `tx-h${String(i + 1).padStart(4, "0")}`;
    t.invoice = `AA-${String(82200 - before.length + i).padStart(5, "0")}`;
  });
  after.forEach((t, i) => {
    t.id = `tx-h${String(before.length + i + 1).padStart(4, "0")}`;
    t.invoice = `AA-${String(82236 + i).padStart(5, "0")}`;
  });

  // The freshest orders walk the whole journey.
  //
  // Status was rolled per order with no regard for how old the order is, so
  // which stages showed up at the top of the table was luck: on a ten-row
  // first page "Paid" could be missing entirely, and a reader would conclude
  // the stage did not exist. These are also the orders where every stage is
  // genuinely in play — this week's orders really are spread from awaiting
  // payment through delivered — so walking the most recent ones around the
  // journey is both what the list needs to show and what the week looks like.
  // Everything older keeps its rolled status.
  // A month, not a week. A week is about a dozen orders, enough to fill the
  // Transactions table's own first page but not enough to reach the narrower
  // lists — one customer's history, one SKU's — which draw from a slice of
  // the same orders and so saw only whichever stages happened to land in it.
  const recentFrom = new Date(lastDay - 29 * DAY_MS).toISOString().slice(0, 10);
  const recent = history
    .filter((t) => t.date.slice(0, 10) >= recentFrom)
    .sort((a, b) => a.date.localeCompare(b.date));
  recent.forEach((t, i) => {
    t.status = TX_JOURNEY[i % TX_JOURNEY.length];
  });

  // Newest first, the order the Transactions table and the peek expect.
  return [...items, ...history].sort((a, b) => b.date.localeCompare(a.date));
}

// v13: orders carry a money breakdown — subtotal, discount, PPN, admin fee.
// v15: every customer shops several SKUs, so plenty of orders hold more than
// the three products the table shows and more than the five the peek pages.
// v16: discounts come from redeemed codes instead of being invented per order.
// v17: the seed covers more than one fortnight, so the Sales Trend has
// something to say at every window the date filter offers.
// v18: it starts in Jan 2024 — three calendar years, which is what the
// lifetime view needs before it buckets by year instead of by month.
// v19: back to Jan 2023, so the longest range the date filter can offer is
// four years and the lifetime axis carries four yearly points.
// v21: the last week of orders walks the stages in turn, so the first page
// of the Transactions table shows every status rather than whichever ones the
// dice happened to deal it.
// v22: the real status list — Waiting for Payment, Processed, Waiting for
// Pickup, Picked Up, Sending, Complete, plus Cancelled as the exit.
// v23: the journey walk covers a month and the live stages carry more weight,
// so the narrower order lists show every chip too, not just the table.
// v20: orders carry the five-stage status, Waiting for Payment included.
const STORAGE_KEY = "aroma_tx_store_v24";

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

/** Promo and referral each know which orders their codes were used on, but
 * neither knows about the other. Their contributions are kept apart and merged
 * on every call, so whichever loads second cannot erase the first's discounts. */
const codeDiscountSources = new Map<string, Map<string, number>>();

export const transactionsStore = {
  /** Sets the discount redeemed codes took off each order and re-prices it.
   * Without this an order's total would ignore the very discount shown beside
   * the code. Assigns rather than adds, so reloading cannot compound it. */
  applyCodeDiscounts(source: "promo" | "referral", byTransaction: Map<string, number>) {
    codeDiscountSources.set(source, byTransaction);
    const merged = new Map<string, number>();
    for (const contribution of codeDiscountSources.values()) {
      for (const [txId, amount] of contribution) merged.set(txId, amount);
    }
    let changed = false;
    const next = state.transactions.map((t) => {
      const discount = merged.get(t.id) ?? 0;
      if (t.discount === discount) return t;
      changed = true;
      return { ...t, ...priceOrder(t.subtotal, discount, t.paymentMethod) };
    });
    if (!changed) return;
    state = { ...state, transactions: next };
    emit();
  },
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
/**
 * The chip for a status. One hue each, and far enough apart that the two
 * waiting stages can never be mistaken for one another at a glance. Every
 * chip also carries its name, so colour is a second cue and never the only
 * one.
 *
 * Waiting for Courier is the neutral grey on purpose: it is the one stage
 * where nothing is happening and nobody is working on the order.
 */
export function txStatusBadge(status: string) {
  if (status === "Waiting for Payment") return "border-amber-600 bg-amber-500 text-white";
  if (status === "Payment Received") return "border-sky-700 bg-sky-600 text-white";
  if (status === "Waiting for Courier") return "border-slate-600 bg-slate-500 text-white";
  if (status === "On the Way") return "border-violet-700 bg-violet-600 text-white";
  if (status === "Order Cancelled") return "border-rose-700 bg-rose-600 text-white";
  return "border-emerald-700 bg-emerald-600 text-white"; // Delivered
}
