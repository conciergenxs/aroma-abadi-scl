import { useState, useEffect } from "react";
import { contacts as seedContacts } from "./mock-data";
import { transactionsStore } from "./transactions-store";
import { promoStore, discountFor, type PromoRule } from "./promo-store";
import { wib } from "@/lib/wib";

export { wib };

// ── Referral programme ────────────────────────────────────────────────────────
// Referral codes are never configured here: every customer is issued a
// permanent code when they join (initials + join month/year) and it stays with
// them. A season decides two things only, for everyone at once — WHEN referral
// is switched on, and WHAT the referred customer gets. That "what" is a promo
// rule built right here, with no code of its own, because the code a customer
// types is always their referrer's personal one.

export type ReferralStatus = "active" | "scheduled" | "ended";

/** One referral code used on an ARMA order. */
export type ReferralUse = {
  id: string;
  referrerId: string;
  referrerName: string;
  /** The referrer's permanent code, as typed by the referred customer. */
  code: string;
  referredId: string;
  referredName: string;
  /** The referred customer's ARMA order the code was used on. */
  transactionId: string;
  invoice: string;
  items: { name: string; qty: number }[];
  orderValue: number;
  /** Rupiah the season's rule took off that order. */
  discountValue: number;
  usedAt: string;
};

export type ReferralSeason = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  /** Applies to every referral while the season runs. */
  rule: PromoRule;
  notes?: string;
  createdBy: { name: string; jobTitle: string };
  createdAt: string;
  uses: ReferralUse[];
};

/** Status is derived from the clock, never stored, so it can't go stale. */
export function getSeasonStatus(season: { startDate: string; endDate: string }): ReferralStatus {
  if (!season.startDate || !season.endDate) return "scheduled";
  const now = Date.now();
  const start = wib(season.startDate);
  const end = wib(season.endDate);
  if (Number.isNaN(start) || Number.isNaN(end)) return "scheduled";
  if (now < start) return "scheduled";
  if (now > end) return "ended";
  return "active";
}

export type SeasonReport = {
  uses: number;
  referrers: number;
  revenue: number;
  discountGiven: number;
};

export function seasonReport(season: ReferralSeason): SeasonReport {
  return {
    uses: season.uses.length,
    referrers: new Set(season.uses.map((u) => u.referrerId)).size,
    revenue: season.uses.reduce((sum, u) => sum + u.orderValue, 0),
    discountGiven: season.uses.reduce((sum, u) => sum + u.discountValue, 0),
  };
}

export type ReferralUseWithSeason = ReferralUse & { seasonId: string; seasonName: string };

/** Everything referral-related about one customer: whose code they used, and
 * who has used theirs. */
export function referralActivityFor(seasons: ReferralSeason[], contactId: string) {
  const all: ReferralUseWithSeason[] = seasons.flatMap((s) =>
    s.uses.map((u) => ({ ...u, seasonId: s.id, seasonName: s.name })),
  );
  return {
    usedCode: all.find((u) => u.referredId === contactId) ?? null,
    referred: all
      .filter((u) => u.referrerId === contactId)
      .sort((a, b) => +new Date(b.usedAt) - +new Date(a.usedAt)),
  };
}

// ── Seed ──────────────────────────────────────────────────────────────────────
// Built from the real ARMA orders so every referral points at a transaction
// that exists, made by the customer it names.

function seed(): ReferralSeason[] {
  const seasons: ReferralSeason[] = [
    {
      id: "rs-q1-2027",
      name: "New Year Referral — Q1 2027",
      startDate: "2027-01-01T00:00",
      endDate: "2027-03-31T23:59",
      rule: {
        condition: { kind: "min-spend", amount: 400000 },
        reward: { kind: "amount-off", amount: 100000 },
      },
      notes: "Bigger flat reward to restart referrals after the holidays.",
      createdBy: { name: "Aria Kapoor", jobTitle: "Workspace Owner" },
      createdAt: "2026-09-12T09:00:00Z",
      uses: [],
    },
    {
      id: "rs-q4",
      name: "Holiday Referral — Q4",
      startDate: "2026-10-01T00:00",
      endDate: "2026-12-31T23:59",
      rule: {
        condition: { kind: "any-purchase" },
        reward: {
          kind: "percent-off",
          percent: 20,
          appliesTo: { kind: "any" },
          maxDiscount: 250000,
        },
      },
      notes: "Gifting season — a referred friend gets 20% off their order.",
      createdBy: { name: "Aria Kapoor", jobTitle: "Workspace Owner" },
      createdAt: "2026-09-10T09:00:00Z",
      uses: [],
    },
    {
      id: "rs-q3",
      name: "Beauty Club Referral — Q3",
      startDate: "2026-07-23T00:00",
      endDate: "2026-09-30T23:59",
      rule: {
        condition: { kind: "any-purchase" },
        reward: {
          kind: "percent-off",
          percent: 10,
          appliesTo: { kind: "any" },
          maxDiscount: 200000,
        },
      },
      notes: "Runs alongside the Beauty Club tier push.",
      createdBy: { name: "Luca Romano", jobTitle: "Marketing Manager" },
      createdAt: "2026-07-20T09:00:00Z",
      uses: [],
    },
    {
      id: "rs-kickoff",
      name: "Summer Kickoff Referral",
      startDate: "2026-07-01T00:00",
      endDate: "2026-07-22T23:59",
      rule: {
        condition: { kind: "min-spend", amount: 300000 },
        reward: { kind: "amount-off", amount: 75000 },
      },
      notes: "First season after ARMA checkout went live.",
      createdBy: { name: "Luca Romano", jobTitle: "Marketing Manager" },
      createdAt: "2026-06-26T09:00:00Z",
      uses: [],
    },
    {
      id: "rs-q2",
      name: "Launch Referral — Q2",
      startDate: "2026-04-01T00:00",
      endDate: "2026-06-30T23:59",
      rule: {
        condition: { kind: "any-purchase" },
        reward: { kind: "amount-off", amount: 50000 },
      },
      notes: "Ran before ARMA checkout went live, so no referral orders were recorded.",
      createdBy: { name: "Luca Romano", jobTitle: "Marketing Manager" },
      createdAt: "2026-03-20T09:00:00Z",
      uses: [],
    },
  ];

  const codeOf = new Map(seedContacts.map((c) => [c.id, c.referralCode]));
  const nameOf = new Map(seedContacts.map((c) => [c.id, c.name]));
  const referrerPool = ["c1", "c3", "c15", "c22", "c9", "c16", "c11", "c12", "c2", "c6"];

  // An order that already redeemed a promo code didn't also use a referral.
  const promoOrders = new Set(
    promoStore.getPromos().flatMap((p) => p.redemptions.map((r) => r.transactionId)),
  );
  const referredAlready = new Set<string>();
  const orders = [...transactionsStore.state.transactions]
    .filter((t) => t.customerId && t.status !== "Cancelled" && !promoOrders.has(t.id))
    // Newest first, so the season running now gets its referrals before older
    // seasons use up the same customers.
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  let turn = 0;
  for (const t of orders) {
    const referredId = t.customerId;
    if (!referredId) continue;
    // Each customer can only ever be referred once.
    if (referredAlready.has(referredId)) continue;
    const at = new Date(t.date).getTime();
    const season = seasons.find((s) => at >= wib(s.startDate) && at <= wib(s.endDate));
    if (!season) continue;

    let referrerId = referrerPool[turn % referrerPool.length];
    if (referrerId === referredId) referrerId = referrerPool[(turn + 1) % referrerPool.length];
    turn += 1;

    const code = codeOf.get(referrerId);
    if (!code) continue;
    const minSpend = season.rule.condition.kind === "min-spend" ? season.rule.condition.amount : 0;
    if (t.total < minSpend) continue;

    referredAlready.add(referredId);
    season.uses.push({
      id: `ru-${t.id}`,
      referrerId,
      referrerName: nameOf.get(referrerId) ?? referrerId,
      code,
      referredId,
      referredName: t.customerName,
      transactionId: t.id,
      invoice: t.invoice,
      items: t.items.map((i) => ({ name: i.skuName, qty: i.qty })),
      orderValue: t.total,
      discountValue: discountFor(season.rule, t.total),
      usedAt: t.date,
    });
  }
  return seasons;
}

// ── Store ─────────────────────────────────────────────────────────────────────
// v3: seasons carry their own promo rule and uses point at real ARMA orders.
const STORAGE_KEY = "aroma_referral_store_v5";

function isCurrentShape(seasons: unknown): seasons is ReferralSeason[] {
  return (
    Array.isArray(seasons) &&
    seasons.every(
      (s) => s && typeof s === "object" && "rule" in s && Array.isArray((s as ReferralSeason).uses),
    )
  );
}

let _seasons: ReferralSeason[] = seed();
let _loaded = false;
const _listeners = new Set<() => void>();

function _load() {
  if (_loaded) return;
  _loaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.seasons && isCurrentShape(parsed.seasons)) {
        _seasons = parsed.seasons;
        return;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ seasons: _seasons }));
  } catch {
    /* ignore */
  }
}

/** Load before any read or write, so a page that only writes can't save the
 * seed over what the browser already had. */
function _ensureLoaded() {
  if (typeof window === "undefined") return;
  _load();
}

function _save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ seasons: _seasons }));
  } catch {
    /* ignore */
  }
  _listeners.forEach((l) => l());
}

export const referralStore = {
  getSeasons(): ReferralSeason[] {
    _ensureLoaded();
    return _seasons;
  },

  addSeason(data: Omit<ReferralSeason, "id" | "uses" | "createdAt">): string {
    _ensureLoaded();
    const id = `rs-${Date.now()}`;
    _seasons = [{ ...data, id, createdAt: new Date().toISOString(), uses: [] }, ..._seasons];
    _save();
    return id;
  },

  updateSeason(id: string, data: Partial<Omit<ReferralSeason, "id" | "uses">>) {
    _ensureLoaded();
    _seasons = _seasons.map((s) => (s.id === id ? { ...s, ...data } : s));
    _save();
  },

  deleteSeason(id: string) {
    _ensureLoaded();
    _seasons = _seasons.filter((s) => s.id !== id);
    _save();
  },

  subscribe(cb: () => void) {
    _listeners.add(cb);
    return () => {
      _listeners.delete(cb);
    };
  },
};

/** Seasons load from localStorage a tick after mount so the server and the
 * first client render agree — same pattern as the promo store. */
/** `loaded` turns true once localStorage has been read — see usePromoStore. */
export function useReferralStore() {
  const [seasons, setSeasons] = useState<ReferralSeason[]>(_seasons);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    _load();
    setSeasons([..._seasons]);
    setLoaded(true);
    return referralStore.subscribe(() => setSeasons([..._seasons]));
  }, []);
  return { seasons, loaded };
}
