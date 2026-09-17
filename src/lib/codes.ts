// Code helpers shared by promo codes and referral codes. Kept free of app
// imports so any store can use them without creating an import cycle.

/** Four letters standing in for a person: two from each of the first two words
 * of their name ("Putri Anggraini" -> PUAN), or the first four letters of a
 * single-word name, padded with X so the slot is always exactly four wide. */
export function initialsFor(name: string): string {
  const words = name
    .replace(/[^A-Za-z ]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "XXXX";
  const base =
    words.length === 1 ? words[0].slice(0, 4) : words[0].slice(0, 2) + words[1].slice(0, 2);
  return `${base}XXXX`.slice(0, 4).toUpperCase();
}

/** A customer's permanent referral code: their initials plus the month and
 * year they joined — Putri Anggraini, joined July 2024 -> PUAN0724. */
export function referralCodeFor(name: string, joinedAt: string): string {
  const d = new Date(joinedAt);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${initialsFor(name)}${mm}${yy}`;
}

/** `base`, or `base` with the smallest numeric suffix that nobody holds yet. */
export function uniqueCode(base: string, taken: Set<string>): string {
  let code = base;
  for (let n = 2; taken.has(code); n += 1) code = `${base}${n}`;
  return code;
}
