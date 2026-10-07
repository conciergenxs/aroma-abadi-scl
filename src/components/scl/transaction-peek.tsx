import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { fmtDateTimeEN } from "@/lib/fmt";
import { formatIDR, txStatusBadge, type Transaction } from "./transactions-store";
import { benefitFor, usePromoStore } from "./promo-store";
import { useReferralStore } from "./referral-store";
import { useEscapeKey } from "@/lib/use-escape-key";

// ── Transaction side peek ─────────────────────────────────────────────────────
// Opened from any table that names an ARMA order, so the full order can be read
// without losing the page behind it. Portaled to <body> because several of its
// callers live inside backdrop-filtered cards, which would otherwise become the
// containing block for a fixed overlay and clip it.

const LABEL = "text-[11px] uppercase tracking-wide text-muted-foreground";

function PeekRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className={`${LABEL} shrink-0`}>{label}</span>
      <div className="text-[13px] text-right">{children}</div>
    </div>
  );
}

export function TransactionPeek({
  tx,
  onClose,
  showOpenInTransactions = true,
}: {
  tx: Transaction;
  onClose: () => void;
  /** Hidden where the jump leads nowhere new: the transactions page already has
   * this order open. Everywhere else the link is the way back to it. */
  showOpenInTransactions?: boolean;
}) {
  useEscapeKey(true, onClose);

  // The order's own lines, five to a page. Long baskets would otherwise push
  // the money summary off the bottom of the panel.
  const ITEMS_PER_PAGE = 5;
  const [itemPage, setItemPage] = useState(1);
  const itemPages = Math.max(1, Math.ceil(tx.items.length / ITEMS_PER_PAGE));
  const safeItemPage = Math.min(itemPage, itemPages);
  const pagedItems = tx.items.slice(
    (safeItemPage - 1) * ITEMS_PER_PAGE,
    safeItemPage * ITEMS_PER_PAGE,
  );
  // The panel stays mounted when the table opens a different order, so the page
  // has to follow the order rather than persist across them.
  useEffect(() => setItemPage(1), [tx.id]);

  // An order carries at most one code — the referral seeding skips any order a
  // promo already claimed — so the first match is the answer.
  const { promos } = usePromoStore();
  const { seasons } = useReferralStore();
  const codeUsed = useMemo(() => {
    for (const promo of promos) {
      const hit = promo.redemptions.find((r) => r.transactionId === tx.id);
      if (hit) {
        return {
          kind: "Promo Code",
          code: promo.code,
          benefit: benefitFor(promo.rule, hit.discountValue),
        };
      }
    }
    for (const season of seasons) {
      const hit = season.uses.find((u) => u.transactionId === tx.id);
      if (hit) {
        return {
          kind: "Referral Code",
          code: hit.code,
          benefit: benefitFor(season.rule, hit.discountValue),
        };
      }
    }
    return null;
  }, [promos, seasons, tx.id]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      <div className="flex-1 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="flex w-full max-w-md flex-col bg-background border-l border-border slide-in-right shadow-2xl">
        <div className="shrink-0 p-5 border-b border-border flex items-start justify-between gap-3">
          <div>
            <div className={LABEL}>Invoice</div>
            <div className="text-base font-semibold">{tx.invoice}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{fmtDateTimeEN(tx.date)}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="press h-8 w-8 grid place-items-center rounded hover:bg-gray-100 text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4 text-[13px]">
          <PeekRow label="Customer">
            {tx.customerId ? (
              <Link
                to="/contacts/$contactId"
                params={{ contactId: tx.customerId }}
                onClick={onClose}
                className="font-medium text-primary hover:underline transition-colors"
              >
                {tx.customerName}
              </Link>
            ) : (
              <span className="font-medium">{tx.customerName}</span>
            )}
          </PeekRow>
          <PeekRow label="Brand">
            <div className="flex flex-wrap gap-1 justify-end">
              {(tx.brandNames ?? [tx.brandName]).map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center rounded-full border border-border bg-background/40 px-2 py-0.5 text-[11px] font-medium"
                >
                  {b}
                </span>
              ))}
            </div>
          </PeekRow>
          <PeekRow label="Ordered Via">
            <span className="font-medium">ARMA · WhatsApp</span>
          </PeekRow>
          <PeekRow label="Payment Method">
            <span className="font-medium">{tx.paymentMethod}</span>
          </PeekRow>
          <PeekRow label="Status">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${txStatusBadge(tx.status)}`}
            >
              {tx.status}
            </span>
          </PeekRow>
          {tx.note && (
            <PeekRow label="Order Note">
              <span className="text-muted-foreground italic">{tx.note}</span>
            </PeekRow>
          )}

          <div>
            <div className={`${LABEL} mb-2`}>Items</div>
            <ul className="divide-y divide-border rounded-md border border-border overflow-hidden">
              {pagedItems.map((i, idx) => (
                <li
                  key={idx}
                  className="px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      to="/sku-detail/$skuId"
                      params={{ skuId: i.skuId }}
                      onClick={onClose}
                      className="font-medium text-[13px] hover:text-primary hover:underline transition-colors"
                    >
                      {i.skuName}
                    </Link>
                    <div className="text-[11px] text-muted-foreground">
                      {i.skuCode} · {i.qty} pcs · {formatIDR(i.unitPrice)}
                    </div>
                  </div>
                  <div className="text-right font-medium tabular-nums text-[13px]">
                    {formatIDR(i.unitPrice * i.qty)}
                  </div>
                </li>
              ))}
            </ul>
            {itemPages > 1 && (
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setItemPage((n) => Math.max(1, n - 1))}
                  disabled={safeItemPage <= 1}
                  aria-label="Previous items page"
                  className="press grid h-6 w-6 place-items-center rounded border border-border bg-card/40 enabled:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="tabular-nums">
                  {safeItemPage} / {itemPages}
                </span>
                <button
                  type="button"
                  onClick={() => setItemPage((n) => Math.min(itemPages, n + 1))}
                  disabled={safeItemPage >= itemPages}
                  aria-label="Next items page"
                  className="press grid h-6 w-6 place-items-center rounded border border-border bg-card/40 enabled:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* The money is the answer the panel exists to give, so it stays put
            while the detail above it scrolls. */}
        <div className="shrink-0 border-t border-border bg-background px-5 pt-5 pb-[calc(1.25rem+10px)] space-y-3">
          <div>
            <div className={LABEL}>{codeUsed?.kind ?? "Promo Code"}</div>
            {codeUsed ? (
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[12px] font-semibold text-primary">
                  {codeUsed.code}
                </span>
                <span className="text-[13px] font-medium">{codeUsed.benefit}</span>
              </div>
            ) : (
              <div className="mt-1.5 text-[13px] text-muted-foreground">
                No code used on this order.
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
            <span className="text-[13px] font-semibold">Total</span>
            <span className="text-[14px] font-semibold tabular-nums">{formatIDR(tx.total)}</span>
          </div>
          {showOpenInTransactions && (
            <Link
              to="/transactions"
              search={{ tx: tx.id }}
              onClick={onClose}
              className="press icon-nudge inline-flex items-center gap-1.5 pt-1 text-[13px] text-primary hover:underline transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open in Transactions
            </Link>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** The cell every table uses to name an ARMA order: invoice above, the date it
 * happened below, both opening the side peek. */
export function TransactionCell({
  invoice,
  date,
  onOpen,
  disabled,
}: {
  invoice: string;
  date: string;
  onOpen: () => void;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div title="This order is no longer in the transaction records">
        <div className="text-[12px] font-mono text-foreground/90">{invoice}</div>
        <div className="text-[10px] text-muted-foreground">{fmtDateTimeEN(date)}</div>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      title="View transaction details"
      className="press text-left group"
    >
      <div className="text-[12px] font-mono text-primary group-hover:underline">{invoice}</div>
      <div className="text-[10px] text-muted-foreground">{fmtDateTimeEN(date)}</div>
    </button>
  );
}
