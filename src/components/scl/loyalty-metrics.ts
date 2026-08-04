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
 *
 * Every count-type metric below is a function of `monthsBack` (a plain
 * 1-12 number) so the Global Filter's Date Range control — Rolling 3/6/12
 * Months, All Time, or a Custom range — visibly tallies through the whole
 * section instead of some cards staying frozen. Genuine rate/percentage
 * metrics (repeat purchase rate, benefit uplift, referral quality) stay
 * tier-scoped but window-independent — a rate isn't meant to change just
 * because a wider window was selected, only tier segmentation moves it.
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

/** UI-facing Date Range selection. "custom" pairs with a separately-held
 *  {start,end} — resolved down to a plain `monthsBack` number (see
 *  resolveMonthsBack below) before any data function here ever sees it, so
 *  the actual metrics logic only has to deal with one dimension. */
export type DateRangeFilter = 3 | 6 | 12 | "all" | "custom";

export const DATE_RANGE_PRESETS: { label: string; value: DateRangeFilter }[] = [
  { label: "Rolling 3 Months", value: 3 },
  { label: "Rolling 6 Months", value: 6 },
  { label: "Rolling 12 Months", value: 12 },
  { label: "All Time", value: "all" },
];

/** The synthetic monthly series below only covers Sep 2025 – Aug 2026 — a
 *  custom range is clamped to that window and converted to an equivalent
 *  month count (~30-day buckets) so it can reuse the exact same scaling
 *  every other filter option already goes through. */
export const CUSTOM_RANGE_MIN = "2025-09-01";
export const CUSTOM_RANGE_MAX = "2026-08-31";

export function resolveMonthsBack(filter: DateRangeFilter, customRange: { start: string; end: string } | null): number {
  if (filter === "all") return MONTHS.length;
  if (filter === "custom") {
    if (!customRange) return MONTHS.length;
    const start = customRange.start < CUSTOM_RANGE_MIN ? CUSTOM_RANGE_MIN : customRange.start;
    const end = customRange.end > CUSTOM_RANGE_MAX ? CUSTOM_RANGE_MAX : customRange.end;
    const days = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1;
    return Math.min(MONTHS.length, Math.max(1, Math.round(days / 30)));
  }
  return filter;
}

// ── Monthly time series (12 trailing months) — backs everything with a
// real trend line/sparkline. `monthsBack` slices the tail; static
// rate/ranking data below is scaled by monthsBack/12 instead (same `scale`
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

function trailing<T>(arr: T[], monthsBack: number): T[] {
  return arr.slice(Math.max(0, arr.length - monthsBack));
}

function sum(arr: number[]): number {
  return arr.reduce((s, n) => s + n, 0);
}

/** Baseline is a 12-month total; scaled by the selected window's share of
 *  a year — same illustrative-scaling convention as overview-metrics.ts's
 *  `scaleStatic`, for metrics with no real per-month source. */
function scaleToWindow(baseline12mo: number, monthsBack: number): number {
  return Math.max(0, Math.round(baseline12mo * (monthsBack / 12)));
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

function prevSliceFor(monthsBack: number): MonthRow[] {
  return MONTHLY.slice(Math.max(0, MONTHLY.length - monthsBack * 2), MONTHLY.length - monthsBack);
}

export function newMembersKpi(monthsBack: number, tier: TierFilter) {
  // New members always enter the program at Bronze — a tier filter other
  // than All/Bronze has nothing to show, rather than a misleading number.
  const applies = tier === "All" || tier === "Bronze";
  const windowSlice = trailing(MONTHLY, monthsBack);
  const prevSlice = prevSliceFor(monthsBack);
  // No prior period of equal length exists once the window covers this
  // 12-month seed's entire history — comparing against zero would read as
  // "0% growth" instead of "no prior period to compare against".
  const hasPreviousPeriod = applies && prevSlice.length === monthsBack;
  const current = applies ? sum(windowSlice.map((m) => m.newMembers)) : 0;
  const previous = hasPreviousPeriod ? sum(prevSlice.map((m) => m.newMembers)) : 0;
  const deltaPct = hasPreviousPeriod && previous > 0 ? (current - previous) / previous : 0;
  const spark: SparkPoint[] = windowSlice.map((m) => ({ month: m.month, value: applies ? m.newMembers : 0 }));
  return { value: current, deltaPct, spark, applies, hasPreviousPeriod };
}

export function tierUpgradeRateKpi(monthsBack: number, tier: TierFilter) {
  const windowSlice = trailing(MONTHLY, monthsBack);
  const prevSlice = prevSliceFor(monthsBack);
  const hasPreviousPeriod = prevSlice.length === monthsBack;
  // Scale the tier-agnostic monthly trend by this tier's relative rate
  // (e.g. Platinum has nowhere left to upgrade to, so its ratio is 0).
  const tierRatio = KPI_BY_TIER.All.tierUpgradeRate > 0 ? KPI_BY_TIER[tier].tierUpgradeRate / KPI_BY_TIER.All.tierUpgradeRate : 0;
  const rateOf = (rows: MonthRow[]) => {
    const upgrades = sum(rows.map((m) => m.upgrades));
    const eligible = sum(rows.map((m) => m.eligibleForReview));
    return (eligible > 0 ? upgrades / eligible : 0) * tierRatio;
  };
  const current = rateOf(windowSlice);
  const previous = hasPreviousPeriod ? rateOf(prevSlice) : 0;
  const deltaPct = hasPreviousPeriod && previous > 0 ? (current - previous) / previous : 0;
  const spark: SparkPoint[] = windowSlice.map((m) => ({ month: m.month, value: (m.upgrades / m.eligibleForReview) * tierRatio }));
  return { value: current, deltaPct, spark, hasPreviousPeriod };
}

export function repeatPurchaseRateKpi(tier: TierFilter) {
  return KPI_BY_TIER[tier].repeatPurchaseRate;
}
export function referralConversionRateKpi(tier: TierFilter) {
  return KPI_BY_TIER[tier].referralConversionRate;
}
export function pointsRedemptionRateKpi(monthsBack: number, tier: TierFilter) {
  if (tier !== "All") return KPI_BY_TIER[tier].pointsRedemptionRate;
  const windowSlice = trailing(MONTHLY, monthsBack);
  const issued = sum(windowSlice.map((m) => m.pointsIssued));
  const redeemed = sum(windowSlice.map((m) => m.pointsRedeemed));
  return issued > 0 ? redeemed / issued : 0;
}

// ── 1. Tier Overview ─────────────────────────────────────────────────────
// Point-in-Time (current tier composition) — intentionally independent of
// the Date Range filter, per the dashboard's own Timeframe Definition.
export const TIER_DISTRIBUTION: { tier: LoyaltyTier; count: number }[] = [
  { tier: "Bronze", count: 1420 },
  { tier: "Silver", count: 980 },
  { tier: "Gold", count: 510 },
  { tier: "Platinum", count: 172 },
];

// Tier Movement — one Sankey layer: tier at the start of the review cycle
// (left) → tier at the end of it (right). Every start-tier's outflows sum
// back to its own starting population. Fixed per-cycle snapshot, same as
// Tier Distribution above — not scaled by the Date Range filter.
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

const UPGRADE_JOURNEY_BASE = {
  avgDaysToUpgrade: 47, // an average time-to-upgrade, not a count — stays constant.
  paths: [
    { path: "Bronze → Silver", count: 320, avgDays: 38 },
    { path: "Silver → Gold", count: 210, avgDays: 52 },
    { path: "Gold → Platinum", count: 95, avgDays: 61 },
  ],
};

export function upgradeJourney(monthsBack: number) {
  const paths = UPGRADE_JOURNEY_BASE.paths.map((p) => ({ ...p, count: scaleToWindow(p.count, monthsBack) }));
  return {
    totalUpgrades: paths.reduce((s, p) => s + p.count, 0),
    avgDaysToUpgrade: UPGRADE_JOURNEY_BASE.avgDaysToUpgrade,
    paths,
  };
}

export type MaintenanceRow = { tier: LoyaltyTier; maintained: number; gracePeriod: number; atRisk: number; decayed: number };
export const TIER_MAINTENANCE: MaintenanceRow[] = [
  { tier: "Bronze", maintained: 1180, gracePeriod: 140, atRisk: 60, decayed: 40 },
  { tier: "Silver", maintained: 640, gracePeriod: 110, atRisk: 45, decayed: 25 },
  { tier: "Gold", maintained: 330, gracePeriod: 60, atRisk: 20, decayed: 12 },
  { tier: "Platinum", maintained: 122, gracePeriod: 15, atRisk: 6, decayed: 2 },
];

// ── 2. Points & Benefits ─────────────────────────────────────────────────
export function pointsSummary(monthsBack: number) {
  const windowSlice = trailing(MONTHLY, monthsBack);
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

export function benefitUsage(monthsBack: number) {
  return BENEFIT_USAGE_BASE
    .map((b) => ({ benefit: b.benefit, count: scaleToWindow(b.count, monthsBack) }))
    .sort((a, b) => b.count - a.count);
}

// Benefit uplift percentages — genuine rates, not counts, so they don't
// scale with the Date Range window (same reasoning as the KPI rates above).
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

export function referralFunnel(monthsBack: number) {
  return REFERRAL_FUNNEL_BASE.map((s) => ({ ...s, value: scaleToWindow(s.value, monthsBack) }));
}

// Top Advocates — real contacts (name stays sourced from mock-data's
// `contacts`, single source of truth), paired with an illustrative tier
// (derived from their real pointBalance), a dummy profile photo, and
// referral numbers for both the rolling window and All Time.
type AdvocateSeed = {
  contactId: string;
  tier: LoyaltyTier;
  photo: string;
  referrals: { rolling12m: number; allTime: number };
  revenue: { rolling12m: number; allTime: number };
};

const TOP_ADVOCATES_SEED: AdvocateSeed[] = [
  { contactId: "c16", tier: "Platinum", photo: "https://i.pravatar.cc/150?img=47", referrals: { rolling12m: 14, allTime: 22 }, revenue: { rolling12m: 18_200_000, allTime: 29_400_000 } },
  { contactId: "c6", tier: "Platinum", photo: "https://i.pravatar.cc/150?img=32", referrals: { rolling12m: 12, allTime: 19 }, revenue: { rolling12m: 15_600_000, allTime: 25_100_000 } },
  { contactId: "c11", tier: "Gold", photo: "https://i.pravatar.cc/150?img=13", referrals: { rolling12m: 10, allTime: 17 }, revenue: { rolling12m: 12_400_000, allTime: 21_800_000 } },
  { contactId: "c1", tier: "Gold", photo: "https://i.pravatar.cc/150?img=45", referrals: { rolling12m: 9, allTime: 14 }, revenue: { rolling12m: 11_100_000, allTime: 17_900_000 } },
  { contactId: "c20", tier: "Gold", photo: "https://i.pravatar.cc/150?img=44", referrals: { rolling12m: 7, allTime: 12 }, revenue: { rolling12m: 8_600_000, allTime: 15_200_000 } },
  { contactId: "c3", tier: "Silver", photo: "https://i.pravatar.cc/150?img=48", referrals: { rolling12m: 6, allTime: 10 }, revenue: { rolling12m: 6_900_000, allTime: 12_400_000 } },
  { contactId: "c13", tier: "Silver", photo: "https://i.pravatar.cc/150?img=26", referrals: { rolling12m: 5, allTime: 8 }, revenue: { rolling12m: 5_700_000, allTime: 9_600_000 } },
  { contactId: "c15", tier: "Silver", photo: "https://i.pravatar.cc/150?img=25", referrals: { rolling12m: 4, allTime: 7 }, revenue: { rolling12m: 4_400_000, allTime: 7_800_000 } },
  { contactId: "c12", tier: "Bronze", photo: "https://i.pravatar.cc/150?img=20", referrals: { rolling12m: 3, allTime: 5 }, revenue: { rolling12m: 3_100_000, allTime: 5_200_000 } },
  { contactId: "c7", tier: "Bronze", photo: "https://i.pravatar.cc/150?img=14", referrals: { rolling12m: 2, allTime: 4 }, revenue: { rolling12m: 2_000_000, allTime: 3_900_000 } },
];

export type Advocate = {
  contactId: string;
  name: string;
  photo: string;
  tier: LoyaltyTier;
  referrals: number;
  revenue: number;
};

/** allTime switches to the larger cumulative figures; otherwise the
 *  "recent window" figures scale down proportionally to monthsBack, same
 *  as every other count-type metric in this section. */
export function topAdvocates(monthsBack: number, allTime: boolean, tier: TierFilter): Advocate[] {
  return TOP_ADVOCATES_SEED
    .filter((a) => tier === "All" || a.tier === tier)
    .map((a) => {
      const contact = contacts.find((c) => c.id === a.contactId);
      return {
        contactId: a.contactId,
        name: contact?.name ?? "Unknown",
        photo: a.photo,
        tier: a.tier,
        referrals: allTime ? a.referrals.allTime : scaleToWindow(a.referrals.rolling12m, monthsBack),
        revenue: allTime ? a.revenue.allTime : scaleToWindow(a.revenue.rolling12m, monthsBack),
      };
    })
    .sort((a, b) => b.referrals - a.referrals);
}

const ADVOCACY_REVENUE_BASE = {
  revenueFromReferral: 1_840_500_000, // 12-month baseline — a total contribution, scales with the window.
  referralCLV: 8_420_000, // per-customer average — a rate, stays constant.
  referralAOV: 1_260_000, // per-order average — a rate, stays constant.
};

export function advocacyRevenue(monthsBack: number) {
  return {
    revenueFromReferral: scaleToWindow(ADVOCACY_REVENUE_BASE.revenueFromReferral, monthsBack),
    referralCLV: ADVOCACY_REVENUE_BASE.referralCLV,
    referralAOV: ADVOCACY_REVENUE_BASE.referralAOV,
  };
}

// Referred-customer quality — genuine rates/averages, not counts, so
// (like Benefit Effectiveness above) these stay window-independent.
export const REFERRAL_QUALITY = {
  repeatPurchaseRate: 0.58,
  retentionRate: 0.72,
  aov: 1_260_000,
};
