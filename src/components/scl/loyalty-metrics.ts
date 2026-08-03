import { contacts } from "./mock-data";

/**
 * CRM & Loyalty Program Analytics — dummy/static data source for the
 * dedicated section on the Overview page (per PRODUCT_NOTES: this app is
 * frontend-only against a real backend Michael owns, so anything this
 * section needs that isn't already real data lives here as illustrative
 * static numbers — same convention overview-metrics.ts already uses for
 * `audienceSegmentation`/`totalConversations`).
 *
 * Everything here is intentionally distinct from overview-metrics.ts's own
 * metrics (contacts/broadcast/orders/conversion) per the spec's own
 * objective: this dashboard must not repeat what's already on Overview.
 */

// ── Tiers ────────────────────────────────────────────────────────────────
export type LoyaltyTier = "Bronze" | "Silver" | "Gold" | "Platinum";
export const LOYALTY_TIERS: LoyaltyTier[] = ["Bronze", "Silver", "Gold", "Platinum"];
export const TIER_COLOR: Record<LoyaltyTier, string> = {
  Bronze: "var(--chart-3)",
  Silver: "var(--chart-4)",
  Gold: "var(--chart-2)",
  Platinum: "var(--chart-1)",
};

export type TierFilter = "All" | LoyaltyTier;
/** "all" behaves like the full 12-month baseline for the monthly-series
 *  metrics below (this seed only has 12 months of history to begin with)
 *  — it only makes a real difference for the Top Advocates leaderboard,
 *  which carries a genuinely larger "all time" number per advocate. */
export type DateRangeFilter = 3 | 6 | 12 | "all";

export const DATE_RANGE_OPTIONS: { label: string; value: DateRangeFilter }[] = [
  { label: "Rolling 3 Months", value: 3 },
  { label: "Rolling 6 Months", value: 6 },
  { label: "Rolling 12 Months", value: 12 },
  { label: "All Time", value: "all" },
];

// ── Monthly time series (12 trailing months) — backs everything with a
// real trend line/sparkline. Rolling-window filters slice the tail; static
// rate/ranking data below is scaled by window/12 instead (same `scale`
// trick overview-metrics.ts uses for records with no real per-day source). ─
export const MONTHS = [
  "Sep 25", "Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26",
  "Mar 26", "Apr 26", "May 26", "Jun 26", "Jul 26", "Aug 26",
];

type MonthRow = {
  month: string;
  newMembers: number;
  upgrades: number;
  eligibleForReview: number;
  pointsIssued: number;
  pointsRedeemed: number;
};

const NEW_MEMBERS = [38, 40, 35, 46, 43, 45, 48, 51, 54, 47, 55, 53];
const UPGRADES = [48, 55, 42, 58, 50, 53, 56, 61, 59, 47, 63, 54];
const ELIGIBLE = [498, 512, 486, 527, 501, 515, 519, 533, 540, 508, 536, 522];
const POINTS_ISSUED = [228000, 241000, 219000, 255000, 248000, 262000, 271000, 284000, 296000, 268000, 305000, 292000];
const POINTS_REDEEMED = [108000, 122000, 101000, 131000, 126000, 138000, 145000, 152000, 158000, 140000, 163000, 149000];

export const MONTHLY: MonthRow[] = MONTHS.map((month, i) => ({
  month,
  newMembers: NEW_MEMBERS[i],
  upgrades: UPGRADES[i],
  eligibleForReview: ELIGIBLE[i],
  pointsIssued: POINTS_ISSUED[i],
  pointsRedeemed: POINTS_REDEEMED[i],
}));

function monthCount(window: DateRangeFilter): number {
  return window === "all" ? MONTHS.length : window;
}

function trailing<T>(arr: T[], window: DateRangeFilter): T[] {
  return arr.slice(arr.length - monthCount(window));
}

function sum(arr: number[]): number {
  return arr.reduce((s, n) => s + n, 0);
}

/** Baseline is a 12-month total; scaled by the selected rolling window's
 *  share of a year — same illustrative-scaling convention as
 *  overview-metrics.ts's `scaleStatic`, for metrics with no real
 *  per-month source. "all" maps to the full 12-month baseline (1:1). */
function scaleToWindow(baseline12mo: number, window: DateRangeFilter): number {
  return Math.max(0, Math.round(baseline12mo * (monthCount(window) / 12)));
}

// ── Top KPI Strip ────────────────────────────────────────────────────────
type TierKpis = {
  repeatPurchaseRate: number;
  referralConversionRate: number;
  pointsRedemptionRate: number;
  tierUpgradeRate: number;
};

const KPI_BY_TIER: Record<TierFilter, TierKpis> = {
  All: { repeatPurchaseRate: 0.61, referralConversionRate: 0.24, pointsRedemptionRate: 0.51, tierUpgradeRate: 0.18 },
  Bronze: { repeatPurchaseRate: 0.42, referralConversionRate: 0.15, pointsRedemptionRate: 0.33, tierUpgradeRate: 0.22 },
  Silver: { repeatPurchaseRate: 0.58, referralConversionRate: 0.21, pointsRedemptionRate: 0.47, tierUpgradeRate: 0.19 },
  Gold: { repeatPurchaseRate: 0.71, referralConversionRate: 0.29, pointsRedemptionRate: 0.58, tierUpgradeRate: 0.11 },
  Platinum: { repeatPurchaseRate: 0.84, referralConversionRate: 0.37, pointsRedemptionRate: 0.68, tierUpgradeRate: 0 },
};

export type SparkPoint = { month: string; value: number };

export function newMembersKpi(window: DateRangeFilter, tier: TierFilter) {
  // New members always enter the program at Bronze — a tier filter other
  // than All/Bronze has nothing to show, rather than a misleading number.
  const applies = tier === "All" || tier === "Bronze";
  const n = monthCount(window);
  const windowSlice = trailing(MONTHLY, window);
  const prevSlice = MONTHLY.slice(Math.max(0, MONTHLY.length - n * 2), MONTHLY.length - n);
  // A rolling-12-month (or All Time) window has no prior period of equal
  // length in this 12-month seed — comparing against zero would read as
  // "0% growth" instead of "no prior period to compare against".
  const hasPreviousPeriod = applies && window !== "all" && prevSlice.length === n;
  const current = applies ? sum(windowSlice.map((m) => m.newMembers)) : 0;
  const previous = hasPreviousPeriod ? sum(prevSlice.map((m) => m.newMembers)) : 0;
  const deltaPct = hasPreviousPeriod && previous > 0 ? (current - previous) / previous : 0;
  const spark: SparkPoint[] = windowSlice.map((m) => ({ month: m.month, value: applies ? m.newMembers : 0 }));
  return { value: current, deltaPct, spark, applies, hasPreviousPeriod };
}

export function tierUpgradeRateKpi(window: DateRangeFilter, tier: TierFilter) {
  const windowSlice = trailing(MONTHLY, window);
  const spark: SparkPoint[] = windowSlice.map((m) => ({ month: m.month, value: m.upgrades / m.eligibleForReview }));
  return { value: KPI_BY_TIER[tier].tierUpgradeRate, spark };
}

export function repeatPurchaseRateKpi(tier: TierFilter) {
  return KPI_BY_TIER[tier].repeatPurchaseRate;
}
export function referralConversionRateKpi(tier: TierFilter) {
  return KPI_BY_TIER[tier].referralConversionRate;
}
export function pointsRedemptionRateKpi(window: DateRangeFilter, tier: TierFilter) {
  if (tier !== "All") return KPI_BY_TIER[tier].pointsRedemptionRate;
  const windowSlice = trailing(MONTHLY, window);
  const issued = sum(windowSlice.map((m) => m.pointsIssued));
  const redeemed = sum(windowSlice.map((m) => m.pointsRedeemed));
  return issued > 0 ? redeemed / issued : 0;
}

// ── 1. Tier Overview ─────────────────────────────────────────────────────
export const TIER_DISTRIBUTION: { tier: LoyaltyTier; count: number }[] = [
  { tier: "Bronze", count: 1420 },
  { tier: "Silver", count: 980 },
  { tier: "Gold", count: 510 },
  { tier: "Platinum", count: 172 },
];

// Tier Movement — one Sankey layer: tier at the start of the review cycle
// (left) → tier at the end of it (right). Every start-tier's outflows sum
// back to its own starting population.
export type TierFlow = { from: LoyaltyTier; to: LoyaltyTier; value: number };
export const TIER_MOVEMENT: TierFlow[] = [
  { from: "Bronze", to: "Bronze", value: 1180 },
  { from: "Bronze", to: "Silver", value: 320 },
  { from: "Silver", to: "Silver", value: 640 },
  { from: "Silver", to: "Gold", value: 210 },
  { from: "Silver", to: "Bronze", value: 100 },
  { from: "Gold", to: "Gold", value: 330 },
  { from: "Gold", to: "Platinum", value: 95 },
  { from: "Gold", to: "Silver", value: 55 },
  { from: "Platinum", to: "Platinum", value: 122 },
  { from: "Platinum", to: "Gold", value: 28 },
];

export const UPGRADE_JOURNEY = {
  totalUpgrades: 625, // 320 + 210 + 95
  avgDaysToUpgrade: 47,
  paths: [
    { path: "Bronze → Silver", count: 320, avgDays: 38 },
    { path: "Silver → Gold", count: 210, avgDays: 52 },
    { path: "Gold → Platinum", count: 95, avgDays: 61 },
  ],
};

export type MaintenanceRow = { tier: LoyaltyTier; maintained: number; gracePeriod: number; atRisk: number; decayed: number };
export const TIER_MAINTENANCE: MaintenanceRow[] = [
  { tier: "Bronze", maintained: 1180, gracePeriod: 140, atRisk: 60, decayed: 40 },
  { tier: "Silver", maintained: 640, gracePeriod: 110, atRisk: 45, decayed: 25 },
  { tier: "Gold", maintained: 330, gracePeriod: 60, atRisk: 20, decayed: 12 },
  { tier: "Platinum", maintained: 122, gracePeriod: 15, atRisk: 6, decayed: 2 },
];

// ── 2. Points & Benefits ─────────────────────────────────────────────────
export function pointsSummary(window: DateRangeFilter) {
  const windowSlice = trailing(MONTHLY, window);
  const issued = sum(windowSlice.map((m) => m.pointsIssued));
  const redeemed = sum(windowSlice.map((m) => m.pointsRedeemed));
  return {
    issued,
    redeemed,
    outstanding: 5_820_400, // Cumulative — never resets, independent of the window filter.
    redemptionRate: issued > 0 ? redeemed / issued : 0,
    series: windowSlice,
  };
}

const BENEFIT_USAGE_BASE: { benefit: string; count: number }[] = [
  { benefit: "Double Points Event", count: 3260 },
  { benefit: "Free Sample Set", count: 2670 },
  { benefit: "Free Shipping Voucher", count: 4820 },
  { benefit: "Birthday Gift", count: 2150 },
  { benefit: "Exclusive Product Access", count: 1380 },
  { benefit: "Priority Customer Service", count: 940 },
];

export function benefitUsage(window: DateRangeFilter) {
  return BENEFIT_USAGE_BASE
    .map((b) => ({ benefit: b.benefit, count: scaleToWindow(b.count, window) }))
    .sort((a, b) => b.count - a.count);
}

export const BENEFIT_EFFECTIVENESS: { benefit: string; repeatPurchaseUplift: number; revenueUplift: number; retentionUplift: number }[] = [
  { benefit: "Exclusive Product Access", repeatPurchaseUplift: 0.29, revenueUplift: 0.41, retentionUplift: 0.22 },
  { benefit: "Double Points Event", repeatPurchaseUplift: 0.34, revenueUplift: 0.28, retentionUplift: 0.19 },
  { benefit: "Birthday Gift", repeatPurchaseUplift: 0.22, revenueUplift: 0.14, retentionUplift: 0.31 },
  { benefit: "Free Sample Set", repeatPurchaseUplift: 0.18, revenueUplift: 0.11, retentionUplift: 0.15 },
  { benefit: "Free Shipping Voucher", repeatPurchaseUplift: 0.12, revenueUplift: 0.09, retentionUplift: 0.10 },
].sort((a, b) => b.revenueUplift - a.revenueUplift);

// ── 3. Referral & Advocacy ───────────────────────────────────────────────
const REFERRAL_FUNNEL_BASE = [
  { label: "Referral Shared", value: 5400 },
  { label: "Referral Clicked", value: 3160 },
  { label: "Referral Registered", value: 1780 },
  { label: "Successful Referral", value: 1296 },
];

export function referralFunnel(window: DateRangeFilter) {
  return REFERRAL_FUNNEL_BASE.map((s) => ({ ...s, value: scaleToWindow(s.value, window) }));
}

// Top Advocates — real contacts (name/avatar/phone stay sourced from
// mock-data's `contacts`, single source of truth), paired with an
// illustrative tier (derived from their real pointBalance) and referral
// numbers for both leaderboard windows.
type AdvocateSeed = {
  contactId: string;
  tier: LoyaltyTier;
  referrals: { rolling12m: number; allTime: number };
  revenue: { rolling12m: number; allTime: number };
};

const TOP_ADVOCATES_SEED: AdvocateSeed[] = [
  { contactId: "c16", tier: "Platinum", referrals: { rolling12m: 14, allTime: 22 }, revenue: { rolling12m: 18_200_000, allTime: 29_400_000 } },
  { contactId: "c6", tier: "Platinum", referrals: { rolling12m: 12, allTime: 19 }, revenue: { rolling12m: 15_600_000, allTime: 25_100_000 } },
  { contactId: "c11", tier: "Gold", referrals: { rolling12m: 10, allTime: 17 }, revenue: { rolling12m: 12_400_000, allTime: 21_800_000 } },
  { contactId: "c1", tier: "Gold", referrals: { rolling12m: 9, allTime: 14 }, revenue: { rolling12m: 11_100_000, allTime: 17_900_000 } },
  { contactId: "c20", tier: "Gold", referrals: { rolling12m: 7, allTime: 12 }, revenue: { rolling12m: 8_600_000, allTime: 15_200_000 } },
  { contactId: "c3", tier: "Silver", referrals: { rolling12m: 6, allTime: 10 }, revenue: { rolling12m: 6_900_000, allTime: 12_400_000 } },
  { contactId: "c13", tier: "Silver", referrals: { rolling12m: 5, allTime: 8 }, revenue: { rolling12m: 5_700_000, allTime: 9_600_000 } },
  { contactId: "c15", tier: "Silver", referrals: { rolling12m: 4, allTime: 7 }, revenue: { rolling12m: 4_400_000, allTime: 7_800_000 } },
  { contactId: "c12", tier: "Bronze", referrals: { rolling12m: 3, allTime: 5 }, revenue: { rolling12m: 3_100_000, allTime: 5_200_000 } },
  { contactId: "c7", tier: "Bronze", referrals: { rolling12m: 2, allTime: 4 }, revenue: { rolling12m: 2_000_000, allTime: 3_900_000 } },
];

export type Advocate = {
  contactId: string;
  name: string;
  avatar: string;
  phone: string;
  tier: LoyaltyTier;
  referrals: number;
  revenue: number;
};

/** Every rolling window (3/6/12 months) reads the same "recent window"
 *  advocate numbers — only "All Time" switches to the larger cumulative
 *  figures. There's no separate leaderboard control anymore; it follows
 *  the same Date Range filter as everything else. */
export function topAdvocates(window: DateRangeFilter, tier: TierFilter): Advocate[] {
  const useAllTime = window === "all";
  return TOP_ADVOCATES_SEED
    .filter((a) => tier === "All" || a.tier === tier)
    .map((a) => {
      const contact = contacts.find((c) => c.id === a.contactId);
      return {
        contactId: a.contactId,
        name: contact?.name ?? "Unknown",
        avatar: contact?.avatar ?? "?",
        phone: contact?.phone ?? "",
        tier: a.tier,
        referrals: useAllTime ? a.referrals.allTime : a.referrals.rolling12m,
        revenue: useAllTime ? a.revenue.allTime : a.revenue.rolling12m,
      };
    })
    .sort((a, b) => b.referrals - a.referrals);
}

export const ADVOCACY_REVENUE = {
  revenueFromReferral: 1_840_500_000,
  referralCLV: 8_420_000,
  referralAOV: 1_260_000,
};

export const REFERRAL_QUALITY = {
  repeatPurchaseRate: 0.58,
  retentionRate: 0.72,
  aov: 1_260_000,
};
