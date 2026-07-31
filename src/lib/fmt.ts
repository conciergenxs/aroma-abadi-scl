/**
 * SSR-safe formatters — no locale-aware APIs (toLocaleString/toLocaleDateString
 * produce different output in Node vs browser, causing React hydration errors).
 */

const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** Rp 2.450.000 */
export function fmtIDR(n: number) {
  return "Rp " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * All extraction below uses the UTC getters (getUTCDate, not getDate). The
 * plain local-time getters reflect whichever timezone is executing the code —
 * Vercel's server and a browser in a different timezone disagree, so the same
 * ISO string renders different text on each side and React's hydration check
 * (which requires the server and first client render to match exactly) fails.
 * UTC getters are deterministic regardless of the runtime's local timezone.
 */

/** 07 Jul 2026 (ID) */
export function fmtDateID(iso: string | Date) {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2,"0")} ${MONTHS_ID[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** 07 Jul 2026 (EN) */
export function fmtDateEN(iso: string | Date) {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2,"0")} ${MONTHS_EN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** 07 Jul 2026, 14:05 */
export function fmtDateTimeID(iso: string | Date) {
  const d = new Date(iso);
  return `${fmtDateID(d)}, ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;
}

/** 1.234 (dot-separated thousand, no currency) */
export function fmtNum(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
