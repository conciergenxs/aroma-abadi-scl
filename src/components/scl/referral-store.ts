import { useState, useEffect } from "react";

// ── Referral programme ────────────────────────────────────────────────────────
// Referral codes are NOT configured here. Every customer is issued a permanent
// code the moment they join — their initials plus the month/year they joined —
// and it never changes. What this page decides is far smaller and applies to
// everyone at once: WHEN referral is switched on, and WHICH promo the referred
// customer gets while it runs.

export type ReferralStatus = "active" | "scheduled" | "ended";

/** One use of a referral code: who referred whom, and the purchase it drove. */
export type ReferralUse = {
  id: string;
  referrerId: string;
  referrerName: string;
  /** The referrer's permanent code — recorded as used, never edited here. */
  code: string;
  referredId?: string;
  referredName: string;
  /** The transaction the referred customer made. */
  transactionId: string;
  invoice: string;
  items: string[];
  orderValue: number;
  /** Rupiah taken off by the season's promo. */
  discountValue: number;
  usedAt: string;
};

export type ReferralSeason = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  /** The promo every referral redeems while this season runs. One setting,
   * applied to every customer without exception. */
  promoId: string;
  notes?: string;
  createdBy: { name: string; jobTitle: string };
  createdAt: string;
  uses: ReferralUse[];
};

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

export function emptySeason(): Omit<ReferralSeason, "id" | "createdAt" | "uses"> {
  return {
    name: "",
    startDate: "",
    endDate: "",
    promoId: "",
    notes: "",
    createdBy: { name: "Aria Kapoor", jobTitle: "Workspace Owner" },
  };
}

// ── Seed ──────────────────────────────────────────────────────────────────────
// Codes follow the permanent convention: initials + join month/year.

function seed(): ReferralSeason[] {
  return [
    {
      id: "rs-2",
      name: "Beauty Club Referral — Q3",
      startDate: "2026-07-01T00:00",
      endDate: "2026-09-30T23:59",
      promoId: "promo-3",
      notes: "Referred customers redeem the New Arrivals promo. Reward lands after they pay.",
      createdBy: { name: "Luca Romano", jobTitle: "Marketing Manager" },
      createdAt: "2026-06-24T09:00:00Z",
      uses: [
        {
          id: "ru-201",
          referrerId: "c1",
          referrerName: "Putri Anggraini",
          code: "PUAN0724",
          referredName: "Alya Rahmadhani",
          transactionId: "tx-1000",
          invoice: "AA-82200",
          items: ["Caviar Hydra-Crème Lipstick 42g", "Blush Color Infusion"],
          orderValue: 1250000,
          discountValue: 125000,
          usedAt: "2026-07-06T14:20:00Z",
        },
        {
          id: "ru-202",
          referrerId: "c1",
          referrerName: "Putri Anggraini",
          code: "PUAN0724",
          referredName: "Gita Permatasari",
          transactionId: "tx-1012",
          invoice: "AA-82212",
          items: ["Real Flawless Foundation"],
          orderValue: 680000,
          discountValue: 68000,
          usedAt: "2026-07-19T16:05:00Z",
        },
        {
          id: "ru-203",
          referrerId: "c3",
          referrerName: "Siti Rahmawati",
          code: "SIRA0125",
          referredName: "Fani Oktaviani",
          transactionId: "tx-1004",
          invoice: "AA-82204",
          items: ["Real Flawless Feather Matte Powder Foundation", "Translucent Loose Setting Powder"],
          orderValue: 2150000,
          discountValue: 215000,
          usedAt: "2026-07-25T09:35:00Z",
        },
        {
          id: "ru-204",
          referrerId: "c15",
          referrerName: "Tiara Hapsari",
          code: "TIHA0325",
          referredName: "Melati Puspa",
          transactionId: "tx-1010",
          invoice: "AA-82210",
          items: ["Translucent Hydrating Setting Spray Ultra-Blur"],
          orderValue: 940000,
          discountValue: 94000,
          usedAt: "2026-08-08T19:45:00Z",
        },
        {
          id: "ru-205",
          referrerId: "c22",
          referrerName: "Dian Puspita",
          code: "DIPU1124",
          referredName: "Kirana Dewi",
          transactionId: "tx-1011",
          invoice: "AA-82211",
          items: ["Caviar Hydra-Crème Lipstick 42g"],
          orderValue: 1480000,
          discountValue: 148000,
          usedAt: "2026-08-23T12:40:00Z",
        },
        {
          id: "ru-206",
          referrerId: "c16",
          referrerName: "Lina Wulandari",
          code: "LIWU0824",
          referredName: "Hana Syifa",
          transactionId: "tx-1006",
          invoice: "AA-82206",
          items: ["Blush Color Infusion", "Real Flawless Foundation"],
          orderValue: 1370000,
          discountValue: 137000,
          usedAt: "2026-08-29T11:15:00Z",
        },
        {
          id: "ru-207",
          referrerId: "c9",
          referrerName: "Citra Halim",
          code: "CIHA0225",
          referredName: "Nabila Ayu",
          transactionId: "tx-1001",
          invoice: "AA-82201",
          items: ["Translucent Loose Setting Powder"],
          orderValue: 760000,
          discountValue: 76000,
          usedAt: "2026-09-02T08:10:00Z",
        },
        {
          id: "ru-208",
          referrerId: "c3",
          referrerName: "Siti Rahmawati",
          code: "SIRA0125",
          referredName: "Rara Anindita",
          transactionId: "tx-1005",
          invoice: "AA-82205",
          items: ["Real Flawless Foundation", "Translucent Hydrating Setting Spray Ultra-Blur"],
          orderValue: 1920000,
          discountValue: 192000,
          usedAt: "2026-09-08T13:15:00Z",
        },
      ],
    },
    {
      id: "rs-1",
      name: "Launch Referral — Q2",
      startDate: "2026-04-01T00:00",
      endDate: "2026-06-30T23:59",
      promoId: "promo-4",
      notes: "First run of the programme — a flat Rp50.000 off for the referred customer.",
      createdBy: { name: "Luca Romano", jobTitle: "Marketing Manager" },
      createdAt: "2026-03-20T09:00:00Z",
      uses: [
        {
          id: "ru-101",
          referrerId: "c2",
          referrerName: "Bagus Pratama",
          code: "BAPR0324",
          referredName: "Yoga Prasetya",
          transactionId: "tx-1008",
          invoice: "AA-82208",
          items: ["Translucent Loose Setting Powder"],
          orderValue: 520000,
          discountValue: 50000,
          usedAt: "2026-04-13T11:25:00Z",
        },
        {
          id: "ru-102",
          referrerId: "c11",
          referrerName: "Bayu Hartanto",
          code: "BAHA0524",
          referredName: "Dimas Argya",
          transactionId: "tx-1002",
          invoice: "AA-82202",
          items: ["Caviar Hydra-Crème Lipstick 42g", "Real Flawless Foundation"],
          orderValue: 1130000,
          discountValue: 50000,
          usedAt: "2026-05-04T10:15:00Z",
        },
        {
          id: "ru-103",
          referrerId: "c12",
          referrerName: "Nadya Salsabila",
          code: "NASA0624",
          referredName: "Intan Maharani",
          transactionId: "tx-1003",
          invoice: "AA-82203",
          items: ["Blush Color Infusion"],
          orderValue: 430000,
          discountValue: 50000,
          usedAt: "2026-06-19T09:45:00Z",
        },
      ],
    },
    {
      id: "rs-3",
      name: "Holiday Referral — Q4",
      startDate: "2026-10-01T00:00",
      endDate: "2026-12-31T23:59",
      promoId: "promo-1",
      notes: "Gifting season — referred customers get the 20% off promo.",
      createdBy: { name: "Aria Kapoor", jobTitle: "Workspace Owner" },
      createdAt: "2026-09-10T09:00:00Z",
      uses: [],
    },
  ];
}

// ── Store ─────────────────────────────────────────────────────────────────────
// Bump when the ReferralSeason shape changes, so a browser holding an older
// shape re-seeds instead of rendering stale data against new code.
const STORAGE_KEY = "aroma_referral_store_v2";

function isCurrentShape(seasons: unknown): seasons is ReferralSeason[] {
  return (
    Array.isArray(seasons) &&
    seasons.every(
      (s) => s && typeof s === "object" && "promoId" in s && Array.isArray((s as ReferralSeason).uses),
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

  addSeason(data: Omit<ReferralSeason, "id" | "uses" | "createdAt">): string {
    const id = `rs-${Date.now()}`;
    _seasons = [{ ...data, id, createdAt: new Date().toISOString(), uses: [] }, ..._seasons];
    _save();
    return id;
  },

  updateSeason(id: string, data: Partial<Omit<ReferralSeason, "id" | "uses">>) {
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
