/**
 * SSR-safe formatters — no locale-aware APIs (toLocaleString/toLocaleDateString
 * produce different output in Node vs browser, causing React hydration errors).
 */

const MONTHS_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Rp 2.450.000 */
export function fmtIDR(n: number) {
  return (
    "Rp " +
    Math.round(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
}

/**
 * Bare "YYYY-MM-DDTHH:mm" strings (what <input type="datetime-local"> and
 * some seed data produce) have no timezone marker, so `new Date(...)` parses
 * them as local time in whatever timezone happens to be executing — Vercel's
 * server and a browser in a different timezone disagree, so the same string
 * produces a different Date object on each side before any getter even runs.
 * UTC getters alone don't fix that; the parsing itself has to be
 * timezone-independent. Pulling the digits straight out of the string with a
 * regex sidesteps Date's ambiguous parsing entirely — for strings that do
 * carry a "Z"/offset (already-UTC data like createdAt/redeemedAt), this still
 * does the right thing: those digits already represent the UTC instant, so
 * echoing them back as-is is correct, not a coincidence.
 */
function dateParts(iso: string | Date) {
  if (typeof iso === "string") {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
    if (m) {
      return { y: +m[1], mo: +m[2] - 1, d: +m[3], h: m[4] ? +m[4] : 0, mi: m[5] ? +m[5] : 0 };
    }
  }
  const d = new Date(iso);
  return {
    y: d.getUTCFullYear(),
    mo: d.getUTCMonth(),
    d: d.getUTCDate(),
    h: d.getUTCHours(),
    mi: d.getUTCMinutes(),
  };
}

/** 07 Jul 2026 (ID) */
export function fmtDateID(iso: string | Date) {
  const p = dateParts(iso);
  return `${String(p.d).padStart(2, "0")} ${MONTHS_ID[p.mo]} ${p.y}`;
}

/** 07 Jul 2026 (EN) */
export function fmtDateEN(iso: string | Date) {
  const p = dateParts(iso);
  return `${String(p.d).padStart(2, "0")} ${MONTHS_EN[p.mo]} ${p.y}`;
}

/** 07 Jul 2026, 14:05 (ID) */
export function fmtDateTimeID(iso: string | Date) {
  const p = dateParts(iso);
  return `${fmtDateID(iso)}, ${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}

/** 07 Jul 2026, 14:05 (EN) */
export function fmtDateTimeEN(iso: string | Date) {
  const p = dateParts(iso);
  return `${fmtDateEN(iso)}, ${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}

/** 1.234 (dot-separated thousand, no currency) */
export function fmtNum(n: number) {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
