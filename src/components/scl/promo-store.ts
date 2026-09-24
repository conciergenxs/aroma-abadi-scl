import { useState, useEffect } from "react";
import { wib } from "@/lib/wib";
import { fmtIDR, fmtNum } from "@/lib/fmt";
import { transactionsStore } from "./transactions-store";
import { initialsFor } from "@/lib/codes";

export { initialsFor };

export type PromoStatus = "active" | "expired" | "scheduled";

// ── Rule model — a composable Condition × Reward engine ───────────────────────
// Not a fixed catalog of promo "types" (that was the Odoo-style limitation).
// Any Condition can pair with any Reward, and every X/Y/Z slot inside each one
// (item, quantity, amount, percent, cap) is independently editable —
// so the same builder can express any promo shape: Buy 1 Get 1, Buy 2 Get 1
// different item, min-spend cashback, item-specific % off with a cap, etc.

/** A SKU named on a promo rule. The brand is part of the identity, not
 * decoration: this catalogue ships a "Translucent Loose Setting Powder" under
 * both Rimmel and Laura Mercier at very different prices, so a rule that named
 * the item by name alone could not say which one it meant — and a picker
 * matching on name alone ticked both. */
export type PromoItemRef = { name: string; brand: string };

/** Same SKU? Name alone is not an identity here — see PromoItemRef. */
export function sameItem(a: PromoItemRef, b: PromoItemRef): boolean {
  return a.name === b.name && a.brand === b.brand;
}

export type PromoItemScope =
  | { kind: "any" }
  | { kind: "any-in-brand"; brand: string }
  | { kind: "specific"; items: PromoItemRef[] };

/** One "N x item" line inside a Buy/Get group. */
export type PromoItemLine = { qty: number; item: PromoItemScope };

/** Up to MAX_ITEM_LINES lines sharing ONE join, so "buy 2 soap and 1 shampoo"
 * and "get 1 free, choose soap or shampoo" are both expressible. The join is
 * per group rather than per pair on purpose: mixed and/or chains need operator
 * precedence to read correctly, which is exactly what confuses non-technical
 * users — a single join can only ever mean one thing. */
export type PromoItemGroup = { join: "and" | "or"; lines: PromoItemLine[] };

export const MAX_ITEM_LINES = 5;

export function itemLine(qty = 1, item: PromoItemScope = { kind: "any" }): PromoItemLine {
  return { qty, item };
}

export function itemGroup(
  lines: PromoItemLine[] = [itemLine()],
  join: PromoItemGroup["join"] = "and",
): PromoItemGroup {
  return { join, lines };
}

// X — what the customer must do to qualify
export type PromoCondition =
  | { kind: "any-purchase" }
  | { kind: "buy-item"; group: PromoItemGroup }
  | { kind: "min-spend"; amount: number }
  | { kind: "first-purchase" };

// Y — what the customer gets
export type PromoReward =
  | { kind: "free-item"; group: PromoItemGroup }
  | { kind: "percent-off"; percent: number; appliesTo: PromoItemScope; maxDiscount: number | null }
  // Always off the purchase being made — there's no wallet or points balance
  // to carry value into a later order.
  | { kind: "amount-off"; amount: number }
  | { kind: "free-shipping" };

export type PromoRule = {
  condition: PromoCondition;
  reward: PromoReward;
};

export function defaultCondition(kind: PromoCondition["kind"]): PromoCondition {
  switch (kind) {
    case "any-purchase":
      return { kind };
    case "buy-item":
      return { kind, group: itemGroup() };
    case "min-spend":
      return { kind, amount: 500000 };
    case "first-purchase":
      return { kind };
  }
}

export function defaultReward(kind: PromoReward["kind"]): PromoReward {
  switch (kind) {
    case "free-item":
      return { kind, group: itemGroup() };
    case "percent-off":
      return { kind, percent: 10, appliesTo: { kind: "any" }, maxDiscount: null };
    case "amount-off":
      return { kind, amount: 50000 };
    case "free-shipping":
      return { kind };
  }
}

export function defaultRule(): PromoRule {
  return { condition: defaultCondition("any-purchase"), reward: defaultReward("percent-off") };
}

export function scopeLabel(scope: PromoItemScope, anyLabel = "Any Item"): string {
  if (scope.kind === "any") return anyLabel;
  // Brand-scoped means the brand's items, not the whole basket — so the
  // caller's "everything" wording ("Total Purchase") must not survive here,
  // or a 30%-off-Rimmel rule reads as 30% off the total.
  if (scope.kind === "any-in-brand") return `${scope.brand} Items`;
  // An explicit list that ended up empty means nothing is selected — saying
  // "Any Item" there would promise the opposite of what the rule does.
  if (scope.items.length === 0) return "No items selected";
  if (scope.items.length === 1) return scope.items[0].name;
  return `${scope.items[0].name} +${scope.items.length - 1} more`;
}

/** "2 Soap and 1 Shampoo" / "1 Soap or 1 Shampoo" — the join reads as plain
 * English so the preview sentence stays legible to non-technical staff. */
export function describeItemGroup(g: PromoItemGroup): string {
  const parts = g.lines.map((l) => `${l.qty} ${scopeLabel(l.item)}`);
  if (parts.length === 0) return "Any Item";
  return parts.join(g.join === "and" ? " and " : " or ");
}

function describeCondition(c: PromoCondition): string {
  switch (c.kind) {
    case "any-purchase":
      return "Any Purchase";
    case "buy-item":
      return `Buy ${describeItemGroup(c.group)}`;
    case "min-spend":
      return `Spend min. ${fmtIDR(c.amount)}`;
    case "first-purchase":
      return "Customer's First Purchase";
  }
}

function describeReward(r: PromoReward): string {
  switch (r.kind) {
    case "free-item": {
      const body = describeItemGroup(r.group);
      // An "or" group on the reward side means the customer picks one of the
      // listed items, so say so rather than leaving "A or B" ambiguous.
      return r.group.join === "or" && r.group.lines.length > 1
        ? `Get ${body} Free (choose 1)`
        : `Get ${body} Free`;
    }
    case "percent-off": {
      const cap = r.maxDiscount ? ` (max ${fmtIDR(r.maxDiscount)})` : "";
      return `Get ${r.percent}% Off ${scopeLabel(r.appliesTo, "Total Purchase")}${cap}`;
    }
    case "amount-off":
      return `Get ${fmtIDR(r.amount)} Off`;
    case "free-shipping":
      return "Get Free Shipping";
  }
}

export function describePromoRule(rule: PromoRule): string {
  return `${describeCondition(rule.condition)} → ${describeReward(rule.reward)}`;
}

// ── What a reward hands out, in the unit that fits it ─────────────────────────
// "Discount Given" means nothing for a free item or free shipping, so reports
// describe each reward in its own terms. Shared by promo and referral reports.

export type RewardSummary = {
  kind: "discount" | "items" | "shipping";
  label: string;
  value: string;
  title?: string;
};

export function rewardSummary(rule: PromoRule, count: number, totalValue: number): RewardSummary {
  const reward = rule.reward;
  if (reward.kind === "free-item") {
    // Every line of an "and" group comes free; an "or" group gives one line.
    const qtys = reward.group.lines.map((l) => l.qty);
    const perUse =
      reward.group.join === "and"
        ? qtys.reduce((a, b) => a + b, 0)
        : Math.max(1, ...(qtys.length ? qtys : [1]));
    return {
      kind: "items",
      label: "Items Given Free",
      value: fmtNum(count * perUse),
      title: `${perUse} item${perUse === 1 ? "" : "s"} per use, from the rule`,
    };
  }
  if (reward.kind === "free-shipping") {
    return { kind: "shipping", label: "Shipping Covered", value: fmtIDR(totalValue) };
  }
  return { kind: "discount", label: "Discount Given", value: fmtIDR(totalValue) };
}

/** One line naming what a single use of this rule handed over — money off for
 * a discount, the items themselves for a free-item rule, and so on. */
export function benefitFor(rule: PromoRule, discountValue: number): string {
  const r = rule.reward;
  if (r.kind === "free-item") return `${describeItemGroup(r.group)} free`;
  if (r.kind === "free-shipping") return "Free shipping";
  return `−${fmtIDR(discountValue)}`;
}

/** Rupiah a rule takes off an order of `orderValue`. */
export function discountFor(rule: PromoRule, orderValue: number): number {
  const r = rule.reward;
  if (r.kind === "percent-off") {
    const off = Math.round((orderValue * r.percent) / 100);
    return r.maxDiscount ? Math.min(off, r.maxDiscount) : off;
  }
  if (r.kind === "amount-off") return Math.min(r.amount, orderValue);
  return 0;
}

// ── Redemption + ownership model ───────────────────────────────────────────────

export type PromoRedemption = {
  id: string;
  contactId: string;
  contactName: string;
  transactionId: string;
  invoice: string;
  discountValue: number;
  /** The ARMA conversation or broadcast the code was redeemed from — every
   * redemption happens in an ARMA chat on WhatsApp. */
  sourceName: string;
  redeemedAt: string;
};

export type AssignedCode = {
  code: string;
  contactId?: string;
  contactName?: string;
  redeemed: boolean;
  redeemedAt?: string;
  /** The Broadcast that issued this code — 1-to-1 recipients are chosen there,
   * never on the promo itself. */
  broadcastId?: string;
  broadcastName?: string;
  sentAt?: string;
};

/** The slot inside a 1-to-1 code format that Broadcast fills with the
 * recipient's initials, so every customer gets their own code off one pattern. */
export const CODE_INITIALS_TOKEN = "####";

export function defaultCodeFormat(code: string): string {
  return `${code}-${CODE_INITIALS_TOKEN}`;
}

/** Turn a format into one person's code. Falls back to appending the initials
 * when the format has lost its slot, so a hand-edited format can't silently
 * hand the same code to everyone. */
export function fillCodeFormat(format: string, name: string): string {
  const initials = initialsFor(name);
  const filled = format.includes(CODE_INITIALS_TOKEN)
    ? format.replace(CODE_INITIALS_TOKEN, initials)
    : `${format}-${initials}`;
  return filled.toUpperCase();
}

export type PromoCode = {
  id: string;
  code: string;
  name: string;
  description: string;
  rule: PromoRule;
  usageType: "one-to-one" | "one-to-many";
  /** 1-to-Many only — a 1-to-1 promo is capped by how many recipients a
   * Broadcast sends it to, so both of these stay null there. */
  maxUsage: number | null;
  /** How many times one customer may redeem this promo. null = no per-customer cap. */
  limitPerUser: number | null;
  /** 1-to-1 only: the pattern each recipient's code is minted from, e.g.
   * "SISLEY150K-####". See CODE_INITIALS_TOKEN. */
  codeFormat?: string;
  startDate: string;
  endDate: string;
  createdBy: { name: string; jobTitle: string };
  createdAt: string;
  redemptions: PromoRedemption[];
  assignedCodes?: AssignedCode[];
};

// Status is never stored — it's always derived from the current time vs. the
// promo's date range, so it can't drift out of sync with reality.
export function getPromoStatus(promo: { startDate: string; endDate: string }): PromoStatus {
  if (!promo.startDate || !promo.endDate) return "scheduled";
  const now = Date.now();
  // Read as Jakarta time so the badge is the same in the SSR render and after
  // hydration — see lib/wib.
  const start = wib(promo.startDate);
  const end = wib(promo.endDate);
  if (Number.isNaN(start) || Number.isNaN(end)) return "scheduled";
  if (now < start) return "scheduled";
  if (now > end) return "expired";
  return "active";
}

// Lets 1-to-1 codes be shared anywhere outside the app (email, chat, print).
export function downloadAssignedCodesCsv(promoCode: string, assignedCodes: AssignedCode[]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["Code", "Recipient", "Status", "Redeemed At"].map(escape).join(",");
  const rows = assignedCodes.map((a) =>
    [a.code, a.contactName ?? "Unassigned", a.redeemed ? "Redeemed" : "Not yet", a.redeemedAt ?? ""]
      .map(escape)
      .join(","),
  );
  downloadCsv(`${promoCode || "promo"}-codes.csv`, [header, ...rows].join("\n"));
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// The 1-to-Many counterpart of the download above: those promos have a single
// shared code, so the log of who redeemed it is what's worth exporting.
export function downloadRedemptionsCsv(promoCode: string, redemptions: PromoRedemption[]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["Customer", "Invoice", "Source", "Discount", "Redeemed At"].map(escape).join(",");
  const rows = redemptions.map((r) =>
    [r.contactName, r.invoice, r.sourceName, String(r.discountValue), r.redeemedAt]
      .map(escape)
      .join(","),
  );
  downloadCsv(`${promoCode || "promo"}-redemptions.csv`, [header, ...rows].join("\n"));
}

// Cross-reference the transactions store so redemption logs point at real,
// clickable-consistent invoices/customers instead of made-up references.
function tx(id: string) {
  const found = transactionsStore.state.transactions.find((t) => t.id === id);
  if (!found) throw new Error(`promo-store seed: unknown transaction ${id}`);
  return found;
}

function seed(): PromoCode[] {
  /** One redemption, with the customer, invoice and date taken straight off
   * the order so the log can never name a transaction that doesn't exist.
   * `value` is only passed where the rule hands over something other than
   * money — the retail price of a free item, or the shipping it covered —
   * because discountFor() correctly reports those as zero rupiah off. */
  const redeem = (
    seq: string,
    txId: string,
    rule: PromoRule,
    sourceName: string,
    value?: number,
  ): PromoRedemption => {
    const t = tx(txId);
    return {
      id: `rdm-${seq}`,
      contactId: t.customerId!,
      contactName: t.customerName,
      transactionId: t.id,
      invoice: t.invoice,
      discountValue: value ?? discountFor(rule, t.total),
      sourceName,
      redeemedAt: t.date,
    };
  };

  const t1000 = tx("tx-1000"); // Putri Anggraini
  const t1004 = tx("tx-1004"); // Siti Rahmawati
  const t1005 = tx("tx-1005"); // Indah Permata
  const t1010 = tx("tx-1010"); // Tiara Hapsari
  const t1011 = tx("tx-1011"); // Dian Puspita
  const t1012 = tx("tx-1012"); // Putri Anggraini (2nd visit)
  const t1002 = tx("tx-1002"); // Bayu Hartanto
  const t1014 = tx("tx-1014"); // Bayu Hartanto (2nd visit)
  const t1006 = tx("tx-1006"); // Lina Wulandari
  const t1008 = tx("tx-1008"); // Bagus Pratama
  const t1020 = tx("tx-1020"); // Bagus Pratama (2nd visit)
  const t1003 = tx("tx-1003"); // Nadya Salsabila
  const t1022 = tx("tx-1022"); // Tiara Hapsari (first order)
  const t1001 = tx("tx-1001"); // Citra Halim

  // ── Every condition against every reward ────────────────────────────────
  // Four conditions (Any Purchase, Buy Item(s), Minimum Spend, First
  // Purchase) times four rewards (Free Item(s), % Discount, Rp Discount,
  // Free Shipping) is sixteen combinations, and each one is seeded here so
  // the list, the detail page and the rule builder can be seen against every
  // shape they have to render — including the reward tile, which changes
  // from rupiah to a count of items to shipping covered.
  //
  // Orders in this workspace all fall in late July 2026, so a promo that has
  // redemptions has to be open over that window: the ones still running
  // started in July and close later in the year, the ones that closed ran
  // inside it, and the ones that haven't started yet have no redemptions at
  // all — which is exactly what a scheduled promo looks like.
  const ANY_PURCHASE: PromoCondition = { kind: "any-purchase" };
  const FIRST_PURCHASE: PromoCondition = { kind: "first-purchase" };
  const oneLine = (name: string, brand: string, qty = 1): PromoItemGroup => ({
    join: "and",
    lines: [{ qty, item: { kind: "specific", items: [{ name, brand }] } }],
  });
  const brandLine = (brand: string, qty = 1): PromoItemGroup => ({
    join: "and",
    lines: [{ qty, item: { kind: "any-in-brand", brand } }],
  });

  const RULES = {
    anyPercentOff: {
      condition: ANY_PURCHASE,
      reward: { kind: "percent-off", percent: 20, appliesTo: { kind: "any" }, maxDiscount: null },
    },
    buySisleyAmountOff: {
      condition: { kind: "buy-item", group: brandLine("Sisley") },
      reward: { kind: "amount-off", amount: 150000 },
    },
    buyDgFreeItem: {
      condition: {
        kind: "buy-item",
        group: oneLine("Caviar Hydra-Crème Lipstick 42g", "Dolce & Gabbana"),
      },
      reward: {
        kind: "free-item",
        group: oneLine("Caviar Hydra-Crème Lipstick 42g", "Dolce & Gabbana"),
      },
    },
    anyFreeItem: {
      condition: ANY_PURCHASE,
      reward: {
        kind: "free-item",
        group: oneLine("Translucent Loose Setting Powder", "Rimmel"),
      },
    },
    anyAmountOff: { condition: ANY_PURCHASE, reward: { kind: "amount-off", amount: 50000 } },
    anyFreeShipping: { condition: ANY_PURCHASE, reward: { kind: "free-shipping" } },
    buyPercentOff: {
      condition: { kind: "buy-item", group: brandLine("Rimmel", 2) },
      reward: {
        kind: "percent-off",
        percent: 30,
        appliesTo: { kind: "any-in-brand", brand: "Rimmel" },
        maxDiscount: 150000,
      },
    },
    buyFreeShipping: {
      condition: { kind: "buy-item", group: brandLine("Sisley") },
      reward: { kind: "free-shipping" },
    },
    minFreeItem: {
      condition: { kind: "min-spend", amount: 2000000 },
      reward: { kind: "free-item", group: oneLine("Blush Color Infusion", "BareMinerals") },
    },
    minPercentOff: {
      condition: { kind: "min-spend", amount: 1500000 },
      reward: {
        kind: "percent-off",
        percent: 15,
        appliesTo: { kind: "any" },
        maxDiscount: 500000,
      },
    },
    minAmountOff: {
      condition: { kind: "min-spend", amount: 1000000 },
      reward: { kind: "amount-off", amount: 100000 },
    },
    minFreeShipping: {
      condition: { kind: "min-spend", amount: 500000 },
      reward: { kind: "free-shipping" },
    },
    firstFreeItem: {
      condition: FIRST_PURCHASE,
      reward: {
        kind: "free-item",
        group: oneLine("Translucent Hydrating Setting Spray Ultra-Blur", "Rimmel"),
      },
    },
    firstPercentOff: {
      condition: FIRST_PURCHASE,
      reward: {
        kind: "percent-off",
        percent: 15,
        appliesTo: { kind: "any" },
        maxDiscount: 300000,
      },
    },
    firstAmountOff: { condition: FIRST_PURCHASE, reward: { kind: "amount-off", amount: 75000 } },
    firstFreeShipping: { condition: FIRST_PURCHASE, reward: { kind: "free-shipping" } },
  } satisfies Record<string, PromoRule>;

  const LUCA = { name: "Luca Romano", jobTitle: "Marketing Manager" };
  const ARIA = { name: "Aria Kapoor", jobTitle: "Workspace Owner" };
  const NOOR = { name: "Noor Hassan", jobTitle: "Customer Insights" };

  return [
    {
      id: "promo-1",
      code: "AROMA20",
      name: "20% Off All Brands",
      description: "20% discount across all brands. Code shared via broadcast or template.",
      rule: RULES.anyPercentOff,
      usageType: "one-to-many",
      maxUsage: 500,
      limitPerUser: 1,
      startDate: "2026-06-01T00:00",
      endDate: "2026-08-31T23:59",
      createdBy: { name: "Luca Romano", jobTitle: "Marketing Manager" },
      createdAt: "2026-05-28T09:00:00Z",
      redemptions: [
        redeem("1a", "tx-1015", RULES.anyPercentOff, "June Flash Sale"),
        redeem("1b", "tx-1018", RULES.anyPercentOff, "VIP Customer Blast"),
      ],
    },
    {
      id: "promo-2",
      code: "SISLEY150K",
      name: "Sisley Rp150k Off",
      description: "Rp150,000 off any Sisley product. Single-use code issued per customer.",
      rule: RULES.buySisleyAmountOff,
      usageType: "one-to-one",
      maxUsage: null,
      limitPerUser: null,
      codeFormat: "SISLEY150K-####",
      startDate: "2026-07-01T00:00",
      endDate: "2026-08-15T23:59",
      createdBy: { name: "Noor Hassan", jobTitle: "Customer Insights" },
      createdAt: "2026-06-25T10:00:00Z",
      redemptions: [
        redeem("2a", "tx-1005", RULES.buySisleyAmountOff, "Sisley Summer Sale"),
        redeem("2b", "tx-1010", RULES.buySisleyAmountOff, "Abandoned Cart Reminder"),
      ],
      // Issued by a Broadcast — the last four characters are each recipient's
      // initials, minted from codeFormat above.
      assignedCodes: [
        {
          code: `SISLEY150K-${initialsFor(t1005.customerName)}`,
          contactId: t1005.customerId!,
          contactName: t1005.customerName,
          redeemed: true,
          redeemedAt: t1005.date,
          broadcastId: "b-sisley-1to1",
          broadcastName: "Sisley Summer Sale — Personal Codes",
          sentAt: "2026-07-02T09:00:00Z",
        },
        {
          code: `SISLEY150K-${initialsFor(t1010.customerName)}`,
          contactId: t1010.customerId!,
          contactName: t1010.customerName,
          redeemed: true,
          redeemedAt: t1010.date,
          broadcastId: "b-sisley-1to1",
          broadcastName: "Sisley Summer Sale — Personal Codes",
          sentAt: "2026-07-02T09:00:00Z",
        },
        {
          code: `SISLEY150K-${initialsFor(t1004.customerName)}`,
          contactId: t1004.customerId!,
          contactName: t1004.customerName,
          redeemed: false,
          broadcastId: "b-sisley-1to1",
          broadcastName: "Sisley Summer Sale — Personal Codes",
          sentAt: "2026-07-02T09:00:00Z",
        },
        {
          code: `SISLEY150K-${initialsFor(t1011.customerName)}`,
          contactId: t1011.customerId!,
          contactName: t1011.customerName,
          redeemed: false,
          broadcastId: "b-sisley-1to1",
          broadcastName: "Sisley Summer Sale — Personal Codes",
          sentAt: "2026-07-02T09:00:00Z",
        },
      ],
    },
    {
      id: "promo-3",
      code: "HEMAT50K",
      name: "Rp50k Off Any Order",
      description: "Flat Rp50,000 off any order, no minimum. Ran alongside the mid-year campaign.",
      rule: RULES.anyAmountOff,
      usageType: "one-to-many",
      maxUsage: 400,
      limitPerUser: 1,
      startDate: "2026-06-15T00:00",
      endDate: "2026-08-20T23:59",
      createdBy: LUCA,
      createdAt: "2026-06-12T09:00:00Z",
      redemptions: [],
    },
    {
      id: "promo-4",
      code: "GRATISONGKIR",
      name: "Free Shipping — All Orders",
      description: "Shipping is on us for every ARMA order, anywhere in Indonesia.",
      rule: RULES.anyFreeShipping,
      usageType: "one-to-many",
      maxUsage: null,
      limitPerUser: null,
      startDate: "2026-07-01T00:00",
      endDate: "2026-12-31T23:59",
      createdBy: ARIA,
      createdAt: "2026-06-28T08:00:00Z",
      redemptions: [
        redeem("4a", "tx-1030", RULES.anyFreeShipping, "Free Ongkir Campaign", 30000),
        redeem("4b", "tx-1031", RULES.anyFreeShipping, "ARMA Product Consult", 35000),
      ],
    },
    {
      id: "promo-5",
      code: "RIMMEL30",
      name: "Rimmel 30% Off — Buy 2",
      description:
        "Buy any two Rimmel products and take 30% off the Rimmel items, up to Rp150,000.",
      rule: RULES.buyPercentOff,
      usageType: "one-to-many",
      maxUsage: 200,
      limitPerUser: 1,
      startDate: "2026-07-05T00:00",
      endDate: "2026-09-05T23:59",
      createdBy: LUCA,
      createdAt: "2026-07-01T09:30:00Z",
      redemptions: [
        redeem("5a", "tx-1002", RULES.buyPercentOff, "Rimmel Bundle Push"),
        redeem("5b", "tx-1008", RULES.buyPercentOff, "Rimmel Bundle Push"),
      ],
    },
    {
      id: "promo-6",
      code: "DGBOGO",
      name: "Dolce & Gabbana Buy 1 Get 1",
      description:
        "Buy any Caviar Hydra-Crème Lipstick, get a second one free. In-store and via WhatsApp order.",
      rule: RULES.buyDgFreeItem,
      usageType: "one-to-many",
      maxUsage: 150,
      limitPerUser: 3,
      startDate: "2026-07-10T00:00",
      endDate: "2026-08-10T23:59",
      createdBy: { name: "Aria Kapoor", jobTitle: "Workspace Owner" },
      createdAt: "2026-07-08T08:30:00Z",
      redemptions: [
        redeem("6a", "tx-1006", RULES.buyDgFreeItem, "Lipstick BOGO Blast", 685000),
        redeem("6b", "tx-1007", RULES.buyDgFreeItem, "ARMA Product Consult", 685000),
      ],
    },
    {
      id: "promo-7",
      code: "ARMAGIFT",
      name: "Free Setting Powder",
      description: "A free Translucent Loose Setting Powder with any ARMA order while stocks last.",
      rule: RULES.anyFreeItem,
      usageType: "one-to-many",
      maxUsage: 300,
      limitPerUser: 1,
      startDate: "2026-07-01T00:00",
      endDate: "2026-11-30T23:59",
      createdBy: ARIA,
      createdAt: "2026-06-26T10:00:00Z",
      redemptions: [],
    },
    {
      id: "promo-8",
      code: "SISLEYONGKIR",
      name: "Sisley — Free Shipping",
      description:
        "Buy any Sisley product and shipping is covered. Starts with the year-end Sisley push.",
      rule: RULES.buyFreeShipping,
      usageType: "one-to-many",
      maxUsage: 250,
      limitPerUser: 2,
      startDate: "2026-10-01T00:00",
      endDate: "2026-12-15T23:59",
      createdBy: NOOR,
      createdAt: "2026-09-14T09:00:00Z",
      redemptions: [],
    },
    {
      id: "promo-9",
      code: "SPEND2JT",
      name: "Spend Rp2jt, Get a Free Blush",
      description: "Spend Rp2,000,000 in one order and a Blush Color Infusion comes free.",
      rule: RULES.minFreeItem,
      usageType: "one-to-many",
      maxUsage: 180,
      limitPerUser: 1,
      startDate: "2026-07-10T00:00",
      endDate: "2026-10-31T23:59",
      createdBy: LUCA,
      createdAt: "2026-07-07T09:00:00Z",
      redemptions: [],
    },
    {
      id: "promo-10",
      code: "BELANJA15",
      name: "15% Off Over Rp1,5jt",
      description: "Spend Rp1,500,000 and take 15% off the order, capped at Rp500,000.",
      rule: RULES.minPercentOff,
      usageType: "one-to-many",
      maxUsage: null,
      limitPerUser: 2,
      startDate: "2026-07-01T00:00",
      endDate: "2026-12-31T23:59",
      createdBy: ARIA,
      createdAt: "2026-06-27T11:00:00Z",
      redemptions: [
        redeem("10a", "tx-1011", RULES.minPercentOff, "Basket Booster"),
        redeem("10b", "tx-1013", RULES.minPercentOff, "ARMA Product Consult"),
      ],
    },
    {
      id: "promo-11",
      code: "MIN1JT100K",
      name: "Rp100k Off Over Rp1jt",
      description: "Spend Rp1,000,000 in one order and take Rp100,000 off.",
      rule: RULES.minAmountOff,
      usageType: "one-to-many",
      maxUsage: 350,
      limitPerUser: 1,
      startDate: "2026-07-01T00:00",
      endDate: "2026-09-10T23:59",
      createdBy: NOOR,
      createdAt: "2026-06-29T09:00:00Z",
      redemptions: [],
    },
    {
      id: "promo-12",
      code: "ONGKIR500K",
      name: "Free Shipping Over Rp500k",
      description: "Orders from Rp500,000 ship free. Planned for the new-year restock.",
      rule: RULES.minFreeShipping,
      usageType: "one-to-many",
      maxUsage: null,
      limitPerUser: null,
      startDate: "2026-10-05T00:00",
      endDate: "2027-01-05T23:59",
      createdBy: ARIA,
      createdAt: "2026-09-16T08:30:00Z",
      redemptions: [],
    },
    {
      id: "promo-13",
      code: "WELCOMEGIFT",
      name: "Welcome Gift — First Order",
      description:
        "A free setting spray on a customer's very first ARMA order. Issued personally per recipient.",
      rule: RULES.firstFreeItem,
      usageType: "one-to-one",
      maxUsage: null,
      limitPerUser: null,
      startDate: "2026-07-15T00:00",
      endDate: "2026-12-31T23:59",
      createdBy: NOOR,
      createdAt: "2026-07-11T10:00:00Z",
      redemptions: [
        redeem("13a", "tx-1012", RULES.firstFreeItem, "Welcome Series", 215000),
        redeem("13b", "tx-1022", RULES.firstFreeItem, "Welcome Series", 215000),
      ],
      // A 1-to-1 code can only be redeemed by someone a Broadcast issued it
      // to, so the recipients list has to contain the two who redeemed.
      assignedCodes: [
        {
          code: `WELCOME-${initialsFor(t1012.customerName)}`,
          contactId: t1012.customerId!,
          contactName: t1012.customerName,
          redeemed: true,
          redeemedAt: t1012.date,
          broadcastId: "b-welcome-1to1",
          broadcastName: "Welcome Series — Personal Codes",
          sentAt: "2026-07-16T09:00:00Z",
        },
        {
          code: `WELCOME-${initialsFor(t1022.customerName)}`,
          contactId: t1022.customerId!,
          contactName: t1022.customerName,
          redeemed: true,
          redeemedAt: t1022.date,
          broadcastId: "b-welcome-1to1",
          broadcastName: "Welcome Series — Personal Codes",
          sentAt: "2026-07-16T09:00:00Z",
        },
        {
          code: `WELCOME-${initialsFor(t1003.customerName)}`,
          contactId: t1003.customerId!,
          contactName: t1003.customerName,
          redeemed: false,
          broadcastId: "b-welcome-1to1",
          broadcastName: "Welcome Series — Personal Codes",
          sentAt: "2026-07-16T09:00:00Z",
        },
        {
          code: `WELCOME-${initialsFor(t1006.customerName)}`,
          contactId: t1006.customerId!,
          contactName: t1006.customerName,
          redeemed: false,
          broadcastId: "b-welcome-1to1",
          broadcastName: "Welcome Series — Personal Codes",
          sentAt: "2026-07-16T09:00:00Z",
        },
      ],
      codeFormat: "WELCOME-####",
    },
    {
      id: "promo-14",
      code: "NEWBIE15",
      name: "15% Off Your First Order",
      description: "New customers take 15% off their first ARMA order, up to Rp300,000.",
      rule: RULES.firstPercentOff,
      usageType: "one-to-many",
      maxUsage: null,
      limitPerUser: 1,
      startDate: "2026-07-01T00:00",
      endDate: "2026-12-31T23:59",
      createdBy: LUCA,
      createdAt: "2026-06-25T09:00:00Z",
      redemptions: [
        redeem("14a", "tx-1025", RULES.firstPercentOff, "Welcome Series"),
        redeem("14b", "tx-1026", RULES.firstPercentOff, "Welcome Series"),
      ],
    },
    {
      id: "promo-15",
      code: "FIRST75K",
      name: "Rp75k Off Your First Order",
      description: "Rp75,000 off a first ARMA order. Queued behind the current welcome offer.",
      rule: RULES.firstAmountOff,
      // Issued per recipient, and the only 1-to-1 promo that hasn't started —
      // without it, Scheduled x 1-to-1 is a filter pair with nothing in it.
      usageType: "one-to-one",
      maxUsage: null,
      limitPerUser: null,
      codeFormat: "FIRST75K-####",
      startDate: "2026-10-01T00:00",
      endDate: "2026-12-31T23:59",
      createdBy: NOOR,
      createdAt: "2026-09-15T09:00:00Z",
      redemptions: [],
    },
    {
      id: "promo-16",
      code: "FIRSTONGKIR",
      name: "First Order Ships Free",
      description:
        "Shipping covered on a customer's first ARMA order. Opens with the new-year intake.",
      rule: RULES.firstFreeShipping,
      usageType: "one-to-many",
      maxUsage: null,
      limitPerUser: 1,
      startDate: "2026-11-01T00:00",
      endDate: "2027-01-31T23:59",
      createdBy: ARIA,
      createdAt: "2026-09-18T08:00:00Z",
      redemptions: [],
    },
  ];
}

// Bump this whenever the PromoCode/PromoRule shape changes — otherwise browsers
// with an older cached shape in localStorage will load stale data that crashes
// against the current code (e.g. rule.condition/reward missing on old records).
const STORAGE_KEY = "aroma_promo_store_v15";

function isCurrentShape(promos: unknown): promos is PromoCode[] {
  return (
    Array.isArray(promos) &&
    promos.every(
      (p) =>
        p &&
        typeof p === "object" &&
        "rule" in p &&
        (p as PromoCode).rule?.condition?.kind !== undefined &&
        (p as PromoCode).rule?.reward?.kind !== undefined &&
        // The version bump is not the only guard: a "specific" scope whose
        // items are bare strings is the pre-PromoItemRef shape, and it renders
        // as "Buy 1 undefined" rather than failing loudly.
        itemScopesAreRefs((p as PromoCode).rule),
    )
  );
}

/** Every item scope in a rule carries {name, brand} objects, not bare names. */
function itemScopesAreRefs(rule: PromoRule): boolean {
  const scopes: PromoItemScope[] = [];
  const collect = (g: PromoItemGroup) => g.lines.forEach((l) => scopes.push(l.item));
  if (rule.condition.kind === "buy-item") collect(rule.condition.group);
  if (rule.reward.kind === "free-item") collect(rule.reward.group);
  if (rule.reward.kind === "percent-off") scopes.push(rule.reward.appliesTo);
  return scopes.every(
    (s) =>
      s.kind !== "specific" ||
      s.items.every((i) => i !== null && typeof i === "object" && typeof i.name === "string"),
  );
}

// ── In-memory state (module-level, never touches window during module init) ───

let _promos: PromoCode[] = seed();
let _loaded = false;
const _listeners = new Set<() => void>();

function _load() {
  if (_loaded) return;
  _loaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.promos && isCurrentShape(parsed.promos)) {
        _promos = parsed.promos;
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ promos: _promos }));
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ promos: _promos }));
    }
  } catch {
    /* ignore */
  }
}

/** Every entry point loads first: a page that only writes (e.g. creating a
 * promo straight from /promo-codes/new) would otherwise save the seed over
 * whatever the browser already had. */
function _ensureLoaded() {
  if (typeof window === "undefined") return;
  _load();
}

function _save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ promos: _promos }));
  } catch {
    /* ignore */
  }
  _listeners.forEach((l) => l());
}

// ── Public store API ──────────────────────────────────────────────────────────

export const promoStore = {
  getPromos(): PromoCode[] {
    _ensureLoaded();
    return _promos;
  },

  addPromo(data: Omit<PromoCode, "id" | "redemptions">): string {
    _ensureLoaded();
    const id = `promo-${Date.now()}`;
    _promos = [{ ...data, id, redemptions: [] }, ..._promos];
    _save();
    return id;
  },

  updatePromo(id: string, data: Partial<Omit<PromoCode, "id" | "redemptions" | "assignedCodes">>) {
    _ensureLoaded();
    _promos = _promos.map((p) => (p.id === id ? { ...p, ...data } : p));
    _save();
  },

  /** Record the codes a Broadcast just handed out.
   *
   * One person holds exactly one code per promo, so a later broadcast that
   * reaches somebody who already has a code REPLACES it rather than adding a
   * second — except when they have already redeemed theirs, which is a fact
   * about the past and must not be rewritten. */
  assignCodesFromBroadcast(
    promoId: string,
    broadcast: { id: string; name: string; sentAt: string },
    entries: { contactId: string; contactName: string; code: string }[],
  ) {
    _ensureLoaded();
    _promos = _promos.map((p) => {
      if (p.id !== promoId) return p;
      const existing = p.assignedCodes ?? [];
      const byContact = new Map<string, AssignedCode>();
      existing.forEach((a) => {
        if (a.contactId) byContact.set(a.contactId, a);
      });
      entries.forEach((e) => {
        const before = byContact.get(e.contactId);
        if (before?.redeemed) return;
        byContact.set(e.contactId, {
          code: e.code,
          contactId: e.contactId,
          contactName: e.contactName,
          redeemed: false,
          broadcastId: broadcast.id,
          broadcastName: broadcast.name,
          sentAt: broadcast.sentAt,
        });
      });
      // Codes with no contact attached can't be matched up, so carry them over
      // untouched rather than dropping them.
      const unassigned = existing.filter((a) => !a.contactId);
      return { ...p, assignedCodes: [...unassigned, ...byContact.values()] };
    });
    _save();
  },

  deletePromo(id: string) {
    _ensureLoaded();
    _promos = _promos.filter((p) => p.id !== id);
    _save();
  },

  subscribe(cb: () => void) {
    _listeners.add(cb);
    return () => {
      _listeners.delete(cb);
    };
  },
};

// ── React hook (client-only via useEffect) ────────────────────────────────────

/** `loaded` turns true once localStorage has been read. Until then the promos
 * returned are the seed — an edit form must wait for it before deciding there
 * is nothing to adopt, or it will save the seed over the real record. */
export function usePromoStore() {
  const [promos, setPromos] = useState<PromoCode[]>(() => _promos);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage on first mount (client-only)
    _load();
    setPromos([..._promos]);
    setLoaded(true);

    // Subscribe to future changes
    const unsub = promoStore.subscribe(() => setPromos([..._promos]));
    return unsub;
  }, []);

  return { promos, loaded };
}
