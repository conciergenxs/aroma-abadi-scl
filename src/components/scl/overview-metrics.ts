import type { Transaction } from "./transactions-store";
import { countsAsRevenue } from "./transactions-store";
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

export type TrendGranularity = "day" | "month" | "year";

/**
 * A trend is only readable while its ticks are. Under a month the interesting
 * movement is day to day; past that a day per tick crowds the axis into a
 * smear, and past a year even months do. So the span picks the bucket:
 *
 *   under 30 days   -> one point per day
 *   30 days to a year -> one point per month
 *   a year or more  -> one point per year
 *
 * Buckets cover only the span asked for: a 1 Jan – 5 Feb range plots January
 * and February, not an empty December.
 *
 * One guard sits on top of that: a trend needs at least three points to be a
 * trend. A calendar year is twelve months, so the rule above buckets it by
 * year and leaves a single dot with no line through it; "Last 30 Days" lands
 * the same way across two months. Where the chosen bucket leaves fewer than
 * three, the span drops one level — the rule still decides, it just never
 * decides its way into a chart with nothing to read.
 */
const FINER: Record<TrendGranularity, TrendGranularity | null> = {
  year: "month",
  month: "day",
  day: null,
};

const MIN_TREND_POINTS = 3;

export function trendGranularityFor(start: string, end: string): TrendGranularity {
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;
  let granularity: TrendGranularity = days < 30 ? "day" : days < 365 ? "month" : "year";
  while (bucketSequence(start, end, granularity).length < MIN_TREND_POINTS) {
    const finer = FINER[granularity];
    if (!finer) break;
    granularity = finer;
  }
  return granularity;
}

/** The bucket an ISO day falls in, as the key the axis prints. */
function bucketOf(iso: string, granularity: TrendGranularity): string {
  const day = iso.slice(0, 10);
  if (granularity === "year") return day.slice(0, 4);
  if (granularity === "month") return day.slice(0, 7);
  return day;
}

/**
 * Every bucket the span covers, in order — including the ones nothing was
 * bought in. A trend that only plots the buckets that have sales draws a
 * quiet February as if it were adjacent to January, which moves every label
 * after it onto the wrong point and reads as a flat line rather than a gap.
 * So the axis is built from the calendar and the sales are hung on it.
 */
function bucketSequence(start: string, end: string, granularity: TrendGranularity): string[] {
  const out: string[] = [];
  if (!start || !end || end < start) return start ? [bucketOf(start, granularity)] : out;

  if (granularity === "year") {
    for (let y = Number(start.slice(0, 4)); y <= Number(end.slice(0, 4)); y++) out.push(String(y));
    return out;
  }

  if (granularity === "month") {
    let year = Number(start.slice(0, 4));
    let month = Number(start.slice(5, 7));
    const endYear = Number(end.slice(0, 4));
    const endMonth = Number(end.slice(5, 7));
    while (year < endYear || (year === endYear && month <= endMonth)) {
      out.push(`${year}-${String(month).padStart(2, "0")}`);
      if (month === 12) {
        month = 1;
        year += 1;
      } else {
        month += 1;
      }
    }
    return out;
  }

  // Parsed and stepped in UTC, so a daylight-saving boundary can never skip
  // or repeat a day.
  for (let t = Date.parse(start); t <= Date.parse(end); t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

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

/**
 * What share of the workspace a window represents — the multiplier every
 * illustrative figure is cut down by.
 *
 * Measured in orders, not in days. Trade has grown steadily here, so the last
 * thirty days hold about a tenth of every order ever placed while being only
 * a twenty-fifth of the calendar; scaling by days would report a busy recent
 * month as the quietest in the dataset, and leave "most asked" below "most
 * added to cart" — fewer people asking than buying. Days are the fallback for
 * a window with no orders in it at all, where there is no share to measure.
 */
export function computeRangeScale(
  transactions: Transaction[],
  range: DateRange,
  fullRange: DateRange,
): number {
  const within = transactions.filter((t) => inRange(t.date, range)).length;
  if (within > 0 && transactions.length > 0) {
    return Math.min(1, Math.max(0.02, within / transactions.length));
  }
  const dayCount = (r: DateRange) =>
    Math.round((new Date(r.end).getTime() - new Date(r.start).getTime()) / 86_400_000) + 1;
  const fullDays = dayCount(fullRange);
  if (fullDays <= 0) return 1;
  return Math.min(1, Math.max(0.02, dayCount(range) / fullDays));
}

function scaleStatic(baseline: number, scale: number): number {
  return Math.max(0, Math.round(baseline * scale));
}

// ── The window the Overview is allowed to read ──────────────────────────
/**
 * The furthest back any Overview figure may look.
 *
 * Every segment on this page is defined against "the last 6 months" — active,
 * sleeping, potential all turn on that boundary. A filter that could reach
 * back four years would be asking those definitions a question they cannot
 * answer, so the window is capped at six months and a longer request is
 * shortened rather than refused.
 */
export const MAX_RANGE_MONTHS = 6;

/**
 * The same day-of-month, N months earlier.
 *
 * Stepping by Date.UTC alone rolls an impossible day forward — 31 August less
 * six months is 31 February, which JavaScript hands back as 3 March and makes
 * the window two days short. The day is clamped to the length of the target
 * month instead.
 */
export function monthsBackIso(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const anchor = new Date(Date.UTC(y, m - 1 - months, 1));
  const daysInMonth = new Date(
    Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), Math.min(d, daysInMonth)))
    .toISOString()
    .slice(0, 10);
}

/** The six-month window ending on `end`, inclusive of both ends — so a window
 *  ending 19 Nov starts 20 May, not 19 May, and covers exactly six months. */
export function maxWindowFor(end: string): DateRange {
  const [y, m, d] = monthsBackIso(end, MAX_RANGE_MONTHS).split("-").map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10),
    end,
  };
}

/**
 * What the page will actually read, given what was asked for.
 *
 * A range longer than six months is not an error — the owner's rule is to
 * take the last six months of it. `clipped` is what the caller needs to say
 * so out loud, because silently returning different dates than the ones
 * typed is how a dashboard loses someone's trust.
 */
export function clipToMaxWindow(range: DateRange): { range: DateRange; clipped: boolean } {
  const limit = maxWindowFor(range.end).start;
  if (range.start >= limit) return { range, clipped: false };
  return { range: { start: limit, end: range.end }, clipped: true };
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

export type AudienceSnapshot = {
  contacts: number;
  activeContacts: number;
  activeCustomers: number;
  potentialCustomers: number;
  sleepingCustomers: number;
};

/**
 * How much of the workspace existed by a given day.
 *
 * Measured in orders rather than in days, for the same reason computeRangeScale
 * is: trade here has grown steadily, so a date two thirds of the way along the
 * calendar is well past two thirds of the business. Orders are the only
 * per-record dated history this seed has, so they stand in for how the
 * contact book filled up.
 */
function historyShareAsOf(transactions: Transaction[], iso: string): number {
  if (transactions.length === 0) return 1;
  const upTo = transactions.filter((t) => t.date.slice(0, 10) <= iso).length;
  return Math.min(1, Math.max(0, upTo / transactions.length));
}

/** The audience as it stood at the end of a given day. */
export function audienceAsOf(transactions: Transaction[], iso: string): AudienceSnapshot {
  const share = historyShareAsOf(transactions, iso);
  // The two sub-segments are rounded first and the parent is their sum, so
  // the invariant the tiles are read against — active customers plus
  // potential customers make up every active contact — survives rounding.
  const activeCustomers = scaleStatic(audienceSegmentation.activeCustomers, share);
  const potentialCustomers = scaleStatic(audienceSegmentation.potentialCustomers, share);
  return {
    contacts: scaleStatic(audienceSegmentation.contacts, share),
    activeContacts: activeCustomers + potentialCustomers,
    activeCustomers,
    potentialCustomers,
    sleepingCustomers: scaleStatic(audienceSegmentation.sleepingCustomers, share),
  };
}

/**
 * Audience over a window, read as two measurements rather than one total.
 *
 * A segment is a standing count, not something that accumulates: there is no
 * such thing as "3,180 contacts during October". What a date range can
 * honestly say about a standing count is where it started and where it
 * finished, so every Audience tile carries both and names the two dates
 * underneath. A one-day window has nothing to compare against, so it shows
 * the single figure it actually has.
 */
export type AudienceReading = {
  start: AudienceSnapshot;
  end: AudienceSnapshot;
  range: DateRange;
  singleDay: boolean;
};

export function computeAudienceReading(
  transactions: Transaction[],
  range: DateRange,
): AudienceReading {
  return {
    start: audienceAsOf(transactions, range.start),
    end: audienceAsOf(transactions, range.end),
    range,
    singleDay: range.start === range.end,
  };
}

// ── B. Broadcast & Messaging — derived from the real broadcasts[] seed ──
/**
 * Measured in messages, not in campaigns.
 *
 * "Broadcast Sent" used to count sends — 24 of them — while the rate beneath
 * it was a ratio of message volumes, so the three tiles in that row were not
 * on the same footing and Delivery Rate could not be checked against them by
 * eye. The owner's metric sheet settles it: Sent is how many messages went
 * out, Reach is how many were received, and Delivery Rate is one over the
 * other. `campaignsSent` is kept for anywhere that genuinely means "how many
 * broadcasts did we run".
 */
export type BroadcastMetrics = {
  /** Messages sent. */
  broadcastSent: number;
  /** Messages received by a contact — the recipients. */
  reach: number;
  read: number;
  replied: number;
  messageReceived: number;
  campaignsSent: number;
  deliveryRate: number;
  readRate: number;
};

export function computeBroadcastMetrics(range?: DateRange, scale = 1): BroadcastMetrics {
  const sent = broadcasts.filter(
    (b) => b.status === "Sent" && (!range || inRange(b.sentAtDate ?? "", range)),
  );
  // In the seed a broadcast's `reach` is the size of the send and `delivered`
  // is how much of it landed, which is exactly Sent and Reach in the owner's
  // vocabulary. Renamed here rather than in the seed so the Broadcast pages,
  // which speak of a send's reach, keep reading the field they expect.
  const messagesSent = sent.reduce((s, b) => s + b.reach, 0);
  const received = sent.reduce((s, b) => s + b.delivered, 0);
  const read = sent.reduce((s, b) => s + b.read, 0);
  const replied = sent.reduce((s, b) => s + (b.replied ?? 0), 0);
  return {
    broadcastSent: messagesSent,
    reach: received,
    read,
    replied,
    campaignsSent: sent.length,
    // Inbound organic volume has no real per-record date to filter by —
    // kept proportional to the selected range, and above `replied` since
    // replies are a subset of all customer-initiated messages received.
    messageReceived: scaleStatic(72_000, scale),
    deliveryRate: messagesSent ? received / messagesSent : 0,
    readRate: received ? read / received : 0,
  };
}

// ── C. Conversation & Product Intelligence ──────────────────────────────
// The seeded `conversations` list is just a handful of inbox-preview rows,
// not a real conversation log — using its length here would make Conversion
// Rate exceed 100% against the real transaction count. Kept illustrative,
// consistent with the other volume metrics that have no real backing array.
export const totalConversations = 38_800;

export type RankedProduct = { name: string; brand: string; count: number };

export const mostAskedProducts: RankedProduct[] = [
  { name: "Real Flawless Foundation", brand: "Sisley", count: 1180 },
  { name: "Caviar Hydra-Crème Lipstick 42g", brand: "Dolce & Gabbana", count: 964 },
  { name: "Translucent Loose Setting Powder", brand: "Laura Mercier", count: 842 },
  { name: "Blush Color Infusion", brand: "BareMinerals", count: 673 },
  { name: "Translucent Hydrating Setting Spray Ultra-Blur", brand: "Rimmel", count: 519 },
];

export const mostUnfulfilledProducts: RankedProduct[] = [
  { name: "Velvet Rouge Shade 03", brand: "Limited restock", count: 214 },
  { name: "Laura Mercier Translucent Powder", brand: "Laura Mercier", count: 142 },
  { name: "Glow Serum — 3-bottle bundle", brand: "Limited restock", count: 98 },
  { name: "Vitamin C Serum", brand: "Limited restock", count: 61 },
  { name: "Real Flawless Feather Matte Powder Foundation", brand: "Sisley", count: 33 },
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
  /** How the trend is bucketed — the span decides, so a year of data never
   *  arrives as 365 ticks. */
  trendGranularity: TrendGranularity;
  salesTrend: { bucket: string; sales: number }[];
};

export function computeOrdersAndSales(
  transactions: Transaction[],
  range?: DateRange,
): OrdersAndSales {
  const scoped = range ? transactions.filter((t) => inRange(t.date, range)) : transactions;
  // Without an explicit range the span is whatever the data covers, so the
  // lifetime view buckets itself rather than drawing every day on record.
  const days = scoped.map((t) => t.date.slice(0, 10)).sort();
  const spanStart = range?.start ?? days[0] ?? "";
  const spanEnd = range?.end ?? days[days.length - 1] ?? spanStart;
  const trendGranularity = spanStart ? trendGranularityFor(spanStart, spanEnd) : "day";
  const totalOrders = scoped.length;
  const paid = scoped.filter((t) => countsAsRevenue(t.status));
  const totalTransactions = paid.length;
  const totalSales = paid.reduce((s, t) => s + t.total, 0);

  const qtyByBrandMap = new Map<string, number>();
  const skuMap = new Map<string, RankedProduct>();
  const salesByBucket = new Map<string, number>();
  let totalQty = 0;

  for (const t of paid) {
    const day = t.date.slice(0, 10);
    const bucket = bucketOf(t.date, trendGranularity);
    salesByBucket.set(bucket, (salesByBucket.get(bucket) ?? 0) + t.total);

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

  const mostAddedToCart = Array.from(skuMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const salesTrend = bucketSequence(spanStart, spanEnd, trendGranularity).map((bucket) => ({
    bucket,
    sales: salesByBucket.get(bucket) ?? 0,
  }));

  return {
    totalOrders,
    totalTransactions,
    totalSales,
    totalQty,
    qtyByBrand,
    mostAddedToCart,
    trendGranularity,
    salesTrend,
  };
}

// ── E. Averages / Basket Economics ──────────────────────────────────────
export const avgMessagesBetweenTransaction = 6.4;

/**
 * Per order, not per paid transaction.
 *
 * The owner's metric sheet divides both of these by Orders. It is the harder
 * denominator — every abandoned and cancelled order drags the average down —
 * and that is the point: it is what an incoming order is worth on average,
 * which is the number you plan stock and staffing against.
 */
export function computeAverages(orders: OrdersAndSales) {
  return {
    avgOrderValue: orders.totalOrders ? orders.totalSales / orders.totalOrders : 0,
    avgSellingPrice: orders.totalQty ? orders.totalSales / orders.totalQty : 0,
    avgBasketSize: orders.totalOrders ? orders.totalQty / orders.totalOrders : 0,
  };
}

// ── F. Funnel / Rate Metrics ────────────────────────────────────────────
export function computeFunnelRates(
  broadcast: BroadcastMetrics,
  conversationsCount: number,
  transactionsCount: number,
) {
  return {
    // Replies over messages sent, not over messages received: the question
    // the rate answers is what a broadcast earns you, and you pay for the
    // whole send whether or not every message lands.
    conversationRate: broadcast.broadcastSent ? broadcast.replied / broadcast.broadcastSent : 0,
    conversionRate: conversationsCount ? transactionsCount / conversationsCount : 0,
  };
}
