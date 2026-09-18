import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ExternalLink, X } from "lucide-react";
import { fmtDateTimeEN } from "@/lib/fmt";
import { formatIDR, txStatusBadge, type Transaction } from "./transactions-store";
import { useEscapeKey } from "@/lib/use-escape-key";

// ── Transaction side peek ─────────────────────────────────────────────────────
// Opened from any table that names an ARMA order, so the full order can be read
// without losing the page behind it. Portaled to <body> because several of its
// callers live inside backdrop-filtered cards, which would otherwise become the
// containing block for a fixed overlay and clip it.

function PeekRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground shrink-0">
        {label}
      </span>
      <div className="text-sm text-right">{children}</div>
    </div>
  );
}

export function TransactionPeek({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  useEscapeKey(true, onClose);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      <div className="flex-1 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-l border-border overflow-y-auto slide-in-right shadow-2xl">
        <div className="p-5 border-b border-border flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Invoice</div>
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

        <div className="p-5 space-y-4 text-sm">
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
          <PeekRow label="Ship To">
            <span className="font-medium">{tx.city}</span>
          </PeekRow>
          <PeekRow label="Payment Method">
            <span className="font-medium">{tx.paymentMethod}</span>
          </PeekRow>
          <PeekRow label="Status">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${txStatusBadge(tx.status)}`}
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
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Items</div>
            <ul className="divide-y divide-border rounded-md border border-border overflow-hidden">
              {tx.items.map((i, idx) => (
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
                    <div className="text-xs text-muted-foreground">
                      {i.skuCode} · {i.qty} pcs · {formatIDR(i.unitPrice)}
                    </div>
                  </div>
                  <div className="text-right font-medium tabular-nums text-sm">
                    {formatIDR(i.unitPrice * i.qty)}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between mt-3 text-sm font-semibold border-t border-border pt-3">
              <span>Total</span>
              <span>{formatIDR(tx.total)}</span>
            </div>
          </div>

          <Link
            to="/transactions"
            search={{ tx: tx.id }}
            onClick={onClose}
            className="press icon-nudge inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open in Transactions
          </Link>
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
