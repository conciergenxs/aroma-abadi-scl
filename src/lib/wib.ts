/** Parse a `datetime-local` value ("YYYY-MM-DDTHH:mm") as Jakarta time.
 *
 * Bare `new Date("2026-10-01T00:00")` resolves in whatever timezone the
 * runtime happens to be in — UTC on the server, UTC+7 in the browser — so a
 * promo or season boundary would land on a different side of "now" in the SSR
 * render than in the hydrated one, and React would report a mismatch. Aroma
 * Abadi operates in one timezone, so pinning it here settles the question. */
export function wib(datetimeLocal: string) {
  return new Date(`${datetimeLocal}:00+07:00`).getTime();
}

/** Right now, shifted so the UTC parts of the returned Date read as Jakarta
 * wall-clock time. Pass it to the fmt* helpers (which read UTC parts) to print
 * today's date identically on the server and in the browser. */
export function nowWIB() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000);
}
