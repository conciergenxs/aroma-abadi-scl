import { useState, useEffect } from "react";
import { fmtIDR } from "@/lib/fmt";
import { initialsFor, CODE_INITIALS_TOKEN } from "./promo-store";

// ── Referral programme ────────────────────────────────────────────────────────
// Referral is NOT a promo code. A promo code is one campaign artefact handed to
// people; referral is a standing programme where every customer carries their
// own code. So the rules live here, once, and apply to every customer for the
// length of a season — the only things that vary per customer are the code
// itself and how many people they brought in.

/** What one side of a referral earns. Points deliberately aren't an option:
 * loyalty points are the loyalty programme's business, not referral's. */
export type ReferralBenefit =
  | { kind: "percent"; percent: number; maxDiscount: number | null }
  | { kind: "amount"; amount: number };

export type ReferralStatus = "active" | "scheduled" | "ended";

/** One referral hand-off: who invited whom, on which code, and whether it
 * turned into a purchase. */
export type Referral = {
  id: string;
  referrerId: string;
  referrerName: string;
  referredName: string;
  /** Set once the invited person exists as a contact. */
  referredId?: string;
  code: string;
  /** "invited" = code shared but not yet used. "converted" = it drove a sale. */
  status: "invited" | "converted";
  invitedAt: string;
  convertedAt?: string;
  /** Basket value of the converting purchase. */
  orderValue?: number;
  /** Rupiah value actually given away to each side. */
  referrerReward: number;
  referredReward: number;
};

export type ReferralSeason = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  /** Pattern every customer's code is minted from — the #### slot becomes
   * their initials, exactly like 1-to-1 promo codes. */
  codeFormat: string;
  referrerBenefit: ReferralBenefit;
  referredBenefit: ReferralBenefit;
  /** Minimum basket before a referral counts. null = any purchase counts. */
  minSpend: number | null;
  /** How many successful referrals one customer can be rewarded for. */
  maxUsesPerReferrer: number | null;
  /** Ceiling across the whole season. */
  maxTotalUses: number | null;
  notes?: string;
  createdBy: { name: string; jobTitle: string };
  createdAt: string;
  referrals: Referral[];
};

export function describeBenefit(b: ReferralBenefit): string {
  if (b.kind === "amount") return `${fmtIDR(b.amount)} off`;
  const cap = b.maxDiscount ? ` (max ${fmtIDR(b.maxDiscount)})` : "";
  return `${b.percent}% off${cap}`;
}

/** Status is derived from the clock, never stored, so it can't go stale. */
export function getSeasonStatus(season: { startDate: string; endDate: string }): ReferralStatus {
  if (!season.startDate || !season.endDate) return "scheduled";
  const now = Date.now();
  const start = new Date(season.startDate).getTime();
  const end = new Date(season.endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return "scheduled";
  if (now < start) return "scheduled";
  if (now > end) return "ended";
  return "active";
}

/** One customer's code for a season. Two customers sharing initials get a
 * numeric suffix, so a code always points at exactly one person. */
export function referralCodesFor(
  season: Pick<ReferralSeason, "codeFormat">,
  people: { id: string; name: string }[],
): Map<string, string> {
  const used = new Set<string>();
  const out = new Map<string, string>();
  people.forEach((p) => {
    const base = (
      season.codeFormat.includes(CODE_INITIALS_TOKEN)
        ? season.codeFormat.replace(CODE_INITIALS_TOKEN, initialsFor(p.name))
        : `${season.codeFormat}-${initialsFor(p.name)}`
    ).toUpperCase();
    let code = base;
    for (let n = 2; used.has(code); n += 1) code = `${base}${n}`;
    used.add(code);
    out.set(p.id, code);
  });
  return out;
}

export type SeasonReport = {
  invited: number;
  converted: number;
  conversionRate: number;
  revenue: number;
  rewardGiven: number;
  topReferrers: { id: string; name: string; invited: number; converted: number; reward: number }[];
};

export function seasonReport(season: ReferralSeason): SeasonReport {
  const converted = season.referrals.filter((r) => r.status === "converted");
  const byReferrer = new Map<string, SeasonReport["topReferrers"][number]>();
  season.referrals.forEach((r) => {
    const row = byReferrer.get(r.referrerId) ?? {
      id: r.referrerId,
      name: r.referrerName,
      invited: 0,
      converted: 0,
      reward: 0,
    };
    row.invited += 1;
    if (r.status === "converted") {
      row.converted += 1;
      row.reward += r.referrerReward;
    }
    byReferrer.set(r.referrerId, row);
  });
  return {
    invited: season.referrals.length,
    converted: converted.length,
    conversionRate: season.referrals.length
      ? Math.round((converted.length / season.referrals.length) * 100)
      : 0,
    revenue: converted.reduce((sum, r) => sum + (r.orderValue ?? 0), 0),
    rewardGiven: converted.reduce((sum, r) => sum + r.referrerReward + r.referredReward, 0),
    topReferrers: [...byReferrer.values()].sort(
      (a, b) => b.converted - a.converted || b.invited - a.invited,
    ),
  };
}

export function emptySeason(): Omit<ReferralSeason, "id" | "createdAt" | "referrals"> {
  return {
    name: "",
    startDate: "",
    endDate: "",
    codeFormat: `AROMA-${CODE_INITIALS_TOKEN}`,
    referrerBenefit: { kind: "amount", amount: 50000 },
    referredBenefit: { kind: "percent", percent: 10, maxDiscount: null },
    minSpend: 250000,
    maxUsesPerReferrer: 5,
    maxTotalUses: null,
    notes: "",
    createdBy: { name: "Aria Kapoor", jobTitle: "Workspace Owner" },
  };
}

// ── Seed ──────────────────────────────────────────────────────────────────────

function seed(): ReferralSeason[] {
  const pct = (v: number) => ({ kind: "percent" as const, percent: v, maxDiscount: null });
  const rp = (v: number) => ({ kind: "amount" as const, amount: v });

  return [
    {
      id: "rs-2",
      name: "Beauty Club Referral — Q3",
      startDate: "2026-07-01T00:00",
      endDate: "2026-09-30T23:59",
      codeFormat: `AROMA-${CODE_INITIALS_TOKEN}`,
      referrerBenefit: rp(50000),
      referredBenefit: pct(15),
      minSpend: 250000,
      maxUsesPerReferrer: 5,
      maxTotalUses: 500,
      notes: "Runs alongside the Beauty Club tier push. Reward is credited after the friend pays.",
      createdBy: { name: "Luca Romano", jobTitle: "Marketing Manager" },
      createdAt: "2026-06-24T09:00:00Z",
      referrals: [
        {
          id: "rf-201",
          referrerId: "c1",
          referrerName: "Putri Anggraini",
          referredName: "Alya Rahmadhani",
          code: "AROMA-PUAN",
          status: "converted",
          invitedAt: "2026-07-04T10:12:00Z",
          convertedAt: "2026-07-06T14:20:00Z",
          orderValue: 1250000,
          referrerReward: 50000,
          referredReward: 187500,
        },
        {
          id: "rf-202",
          referrerId: "c1",
          referrerName: "Putri Anggraini",
          referredName: "Gita Permatasari",
          code: "AROMA-PUAN",
          status: "converted",
          invitedAt: "2026-07-18T08:40:00Z",
          convertedAt: "2026-07-19T16:05:00Z",
          orderValue: 680000,
          referrerReward: 50000,
          referredReward: 102000,
        },
        {
          id: "rf-203",
          referrerId: "c3",
          referrerName: "Siti Rahmawati",
          referredName: "Fani Oktaviani",
          code: "AROMA-SIRA",
          status: "converted",
          invitedAt: "2026-07-22T11:00:00Z",
          convertedAt: "2026-07-25T09:35:00Z",
          orderValue: 2150000,
          referrerReward: 50000,
          referredReward: 322500,
        },
        {
          id: "rf-204",
          referrerId: "c3",
          referrerName: "Siti Rahmawati",
          referredName: "Rara Anindita",
          code: "AROMA-SIRA",
          status: "invited",
          invitedAt: "2026-08-02T13:15:00Z",
          referrerReward: 0,
          referredReward: 0,
        },
        {
          id: "rf-205",
          referrerId: "c15",
          referrerName: "Tiara Hapsari",
          referredName: "Melati Puspa",
          code: "AROMA-TIHA",
          status: "converted",
          invitedAt: "2026-08-05T09:20:00Z",
          convertedAt: "2026-08-08T19:45:00Z",
          orderValue: 940000,
          referrerReward: 50000,
          referredReward: 141000,
        },
        {
          id: "rf-206",
          referrerId: "c16",
          referrerName: "Lina Wulandari",
          referredName: "Hana Syifa",
          code: "AROMA-LIWU",
          status: "invited",
          invitedAt: "2026-08-14T15:30:00Z",
          referrerReward: 0,
          referredReward: 0,
        },
        {
          id: "rf-207",
          referrerId: "c22",
          referrerName: "Dian Puspita",
          referredName: "Kirana Dewi",
          code: "AROMA-DIPU",
          status: "converted",
          invitedAt: "2026-08-21T10:05:00Z",
          convertedAt: "2026-08-23T12:40:00Z",
          orderValue: 1480000,
          referrerReward: 50000,
          referredReward: 222000,
        },
        {
          id: "rf-208",
          referrerId: "c9",
          referrerName: "Citra Halim",
          referredName: "Nabila Ayu",
          code: "AROMA-CIHA",
          status: "invited",
          invitedAt: "2026-09-02T08:10:00Z",
          referrerReward: 0,
          referredReward: 0,
        },
      ],
    },
    {
      id: "rs-1",
      name: "Launch Referral — Q2",
      startDate: "2026-04-01T00:00",
      endDate: "2026-06-30T23:59",
      codeFormat: `AROMA-${CODE_INITIALS_TOKEN}`,
      referrerBenefit: rp(35000),
      referredBenefit: pct(10),
      minSpend: 150000,
      maxUsesPerReferrer: 3,
      maxTotalUses: 300,
      notes: "First run of the programme — kept the rewards small while we learned the numbers.",
      createdBy: { name: "Luca Romano", jobTitle: "Marketing Manager" },
      createdAt: "2026-03-20T09:00:00Z",
      referrals: [
        {
          id: "rf-101",
          referrerId: "c2",
          referrerName: "Bagus Pratama",
          referredName: "Yoga Prasetya",
          code: "AROMA-BAPR",
          status: "converted",
          invitedAt: "2026-04-11T10:00:00Z",
          convertedAt: "2026-04-13T11:25:00Z",
          orderValue: 520000,
          referrerReward: 35000,
          referredReward: 52000,
        },
        {
          id: "rf-102",
          referrerId: "c11",
          referrerName: "Bayu Hartanto",
          referredName: "Dimas Argya",
          code: "AROMA-BAHA",
          status: "converted",
          invitedAt: "2026-05-02T14:30:00Z",
          convertedAt: "2026-05-04T10:15:00Z",
          orderValue: 1130000,
          referrerReward: 35000,
          referredReward: 113000,
        },
        {
          id: "rf-103",
          referrerId: "c12",
          referrerName: "Nadya Salsabila",
          referredName: "Intan Maharani",
          code: "AROMA-NASA",
          status: "invited",
          invitedAt: "2026-06-19T09:45:00Z",
          referrerReward: 0,
          referredReward: 0,
        },
      ],
    },
    {
      id: "rs-3",
      name: "Holiday Referral — Q4",
      startDate: "2026-10-01T00:00",
      endDate: "2026-12-31T23:59",
      codeFormat: `AROMAXMAS-${CODE_INITIALS_TOKEN}`,
      referrerBenefit: pct(20),
      referredBenefit: pct(20),
      minSpend: 500000,
      maxUsesPerReferrer: 10,
      maxTotalUses: null,
      notes: "Both sides get the same reward for the gifting season.",
      createdBy: { name: "Aria Kapoor", jobTitle: "Workspace Owner" },
      createdAt: "2026-09-10T09:00:00Z",
      referrals: [],
    },
  ];
}

// ── Store ─────────────────────────────────────────────────────────────────────
// Bump this whenever the ReferralSeason shape changes, so a browser holding an
// older shape re-seeds instead of rendering stale data against new code.
const STORAGE_KEY = "aroma_referral_store_v1";

function isCurrentShape(seasons: unknown): seasons is ReferralSeason[] {
  return (
    Array.isArray(seasons) &&
    seasons.every(
      (s) =>
        s &&
        typeof s === "object" &&
        "codeFormat" in s &&
        Array.isArray((s as ReferralSeason).referrals),
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
    return _seasons;
  },

  addSeason(data: Omit<ReferralSeason, "id" | "referrals" | "createdAt">): string {
    const id = `rs-${Date.now()}`;
    _seasons = [{ ...data, id, createdAt: new Date().toISOString(), referrals: [] }, ..._seasons];
    _save();
    return id;
  },

  updateSeason(id: string, data: Partial<Omit<ReferralSeason, "id" | "referrals">>) {
    _seasons = _seasons.map((s) => (s.id === id ? { ...s, ...data } : s));
    _save();
  },

  deleteSeason(id: string) {
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
export function useReferralStore() {
  const [seasons, setSeasons] = useState<ReferralSeason[]>(_seasons);
  useEffect(() => {
    _load();
    setSeasons([..._seasons]);
    return referralStore.subscribe(() => setSeasons([..._seasons]));
  }, []);
  return { seasons };
}
