/**
 * Template variables.
 *
 * A body stores its variables as raw tokens — `{{name}}`, `{{promo-SISLEY150K}}`
 * — because that is what gets substituted when the message is actually sent.
 * Nothing shows them that way: every preview renders the human label instead,
 * so a reader sees "Customer Name" rather than a token they have to decode.
 *
 * Numbered placeholders (`{{1}}`, `{{2}}`) used to live in the seed data. They
 * could not be labelled correctly — the same `{{1}}` meant the customer in one
 * template and an order number in another — so they were replaced by named
 * tokens and should not come back.
 */
const VARIABLE_LABELS: Record<string, string> = {
  name: "Customer Name",
  order: "Order Number",
  tracking: "Tracking Link",
  product: "Product",
  "class-time": "Class Time",
  instructor: "Instructor",
  ticket: "Ticket Number",
};

/** Strips the braces from `{{token}}`; passes a bare token through unchanged. */
export function variableToken(raw: string): string {
  return raw.replace(/^\{\{/, "").replace(/\}\}$/, "").trim();
}

/** The human name for a variable, e.g. `{{promo-SISLEY150K}}` → "Promo Code · SISLEY150K". */
export function variableLabel(raw: string): string {
  const token = variableToken(raw);
  if (VARIABLE_LABELS[token]) return VARIABLE_LABELS[token];
  if (token.startsWith("brands-")) return `Brand · ${token.slice("brands-".length)}`;
  if (token.startsWith("promo-")) return `Promo Code · ${token.slice("promo-".length)}`;
  // An unknown token still reads better as itself than as empty braces.
  return token;
}
