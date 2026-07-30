import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Gift, Wallet, Percent } from "lucide-react";
import { useSkuStore } from "./sku-store";
import { type PromoRule, type PromoItemScope, defaultRuleForType, describePromoRule } from "./promo-store";

// ── Sentence-builder UI for promo rules — pick a template, fill the blanks ────
// (X / Y / Z variables), see a live plain-language preview. Replaces the old
// Odoo-sourced promo fields entirely; everything here is local/static.

const RULE_TEMPLATES: { type: PromoRule["type"]; title: string; example: string; icon: typeof Gift }[] = [
  { type: "buy-x-get-y", title: "Buy X Get Y", example: "e.g. Buy 1 item, get 1 free", icon: Gift },
  { type: "buy-x-get-discount", title: "Buy X Get Discount", example: "e.g. Bundle, cashback, or Rp off", icon: Wallet },
  { type: "discount-percent", title: "Discount % on Total", example: "e.g. 20% off total purchase", icon: Percent },
];

function useSkuItemNames(): string[] {
  const { brands } = useSkuStore();
  return useMemo(
    () => brands.flatMap((b) => b.categories.flatMap((c) => c.skus.map((s) => s.name))),
    [brands],
  );
}

function ItemScopeEditor({
  scope,
  onChange,
  items,
  anyLabel = "Any Item",
}: {
  scope: PromoItemScope;
  onChange: (s: PromoItemScope) => void;
  items: string[];
  anyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = scope.kind === "specific" ? scope.items : [];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const label = scope.kind === "any" ? anyLabel : selected.length === 1 ? selected[0] : selected.length ? `${selected.length} items` : "Select items";

  return (
    <div ref={ref} className="relative inline-block align-middle">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-[220px] items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 h-8 text-[13px] font-medium text-foreground hover:bg-primary/15 transition-colors"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-30 w-72 rounded-lg border border-border bg-popover shadow-xl p-2">
          <button
            type="button"
            onClick={() => { onChange({ kind: "any" }); setOpen(false); }}
            className={`w-full flex items-center justify-between rounded px-2 py-1.5 text-[12px] text-left hover:bg-muted ${scope.kind === "any" ? "text-primary font-medium" : ""}`}
          >
            {anyLabel} {scope.kind === "any" && <Check className="h-3.5 w-3.5" />}
          </button>
          <div className="my-1 border-t border-border" />
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {items.map((it) => {
              const checked = selected.includes(it);
              return (
                <label key={it} className="flex items-center gap-2 rounded px-2 py-1.5 text-[12px] hover:bg-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    className="accent-[oklch(0.62_0.17_40)] h-3 w-3 shrink-0"
                    onChange={() => {
                      const next = checked ? selected.filter((x) => x !== it) : [...selected, it];
                      onChange(next.length ? { kind: "specific", items: next } : { kind: "any" });
                    }}
                  />
                  <span className="truncate">{it}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function InlineNumber({ value, onChange, suffix, min = 1 }: { value: number; onChange: (v: number) => void; suffix?: string; min?: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-1.5 h-8 align-middle">
      <input
        type="number"
        value={value}
        min={min}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
        className="w-10 bg-transparent text-[13px] font-medium text-center focus:outline-none"
      />
      {suffix && <span className="text-[12px] text-muted-foreground pr-0.5">{suffix}</span>}
    </span>
  );
}

function InlineCurrency({ value, onChange, placeholder }: { value: number; onChange: (v: number) => void; placeholder?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 h-8 align-middle">
      <span className="text-[12px] text-muted-foreground">Rp</span>
      <input
        type="number"
        value={value || ""}
        min={0}
        placeholder={placeholder}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-24 bg-transparent text-[13px] font-medium focus:outline-none"
      />
    </span>
  );
}

export function PromoRuleBuilder({ rule, onChange }: { rule: PromoRule; onChange: (r: PromoRule) => void }) {
  const items = useSkuItemNames();

  return (
    <div className="space-y-3">
      {/* Template picker */}
      <div className="grid grid-cols-3 gap-2">
        {RULE_TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          const active = rule.type === tpl.type;
          return (
            <button
              key={tpl.type}
              type="button"
              onClick={() => { if (rule.type !== tpl.type) onChange(defaultRuleForType(tpl.type)); }}
              className={`text-left rounded-lg border p-3 transition-colors ${active ? "border-primary bg-primary/10" : "border-border bg-card/40 hover:bg-card"}`}
            >
              <Icon className={`h-4 w-4 mb-1.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-[12px] font-semibold text-foreground">{tpl.title}</div>
              <div className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug">{tpl.example}</div>
            </button>
          );
        })}
      </div>

      {/* Inline sentence editor */}
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] p-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[13px] leading-8">
          {rule.type === "buy-x-get-y" && (
            <>
              <span className="text-muted-foreground">Buy</span>
              <InlineNumber value={rule.buyQty} onChange={(v) => onChange({ ...rule, buyQty: v })} />
              <ItemScopeEditor scope={rule.buyItem} onChange={(s) => onChange({ ...rule, buyItem: s })} items={items} />
              <span className="text-muted-foreground">Get</span>
              <InlineNumber value={rule.getQty} onChange={(v) => onChange({ ...rule, getQty: v })} />
              {rule.sameAsPurchased ? (
                <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2.5 h-8 text-[13px] font-medium">Same Item</span>
              ) : (
                <ItemScopeEditor scope={rule.getItem} onChange={(s) => onChange({ ...rule, getItem: s })} items={items} />
              )}
              <span className="text-muted-foreground">Free</span>
              <button
                type="button"
                onClick={() => onChange({ ...rule, sameAsPurchased: !rule.sameAsPurchased })}
                className="ml-1 text-[11px] text-primary hover:underline"
              >
                {rule.sameAsPurchased ? "use a different item instead" : "use the same item instead"}
              </button>
            </>
          )}

          {rule.type === "buy-x-get-discount" && (
            <>
              <span className="text-muted-foreground">Buy</span>
              <ItemScopeEditor scope={rule.buyItem} onChange={(s) => onChange({ ...rule, buyItem: s })} items={items} />
              <span className="text-muted-foreground">Get</span>
              <InlineCurrency value={rule.discountAmount} onChange={(v) => onChange({ ...rule, discountAmount: v })} />
              <select
                value={rule.variant}
                onChange={(e) => onChange({ ...rule, variant: e.target.value as typeof rule.variant })}
                className="h-8 rounded-md border border-primary/30 bg-primary/10 px-2 text-[13px] font-medium focus:outline-none"
              >
                <option value="immediate">off (this purchase)</option>
                <option value="cashback-next-purchase">cashback (next purchase)</option>
                <option value="bundle-price">as bundle price</option>
              </select>
            </>
          )}

          {rule.type === "discount-percent" && (
            <>
              <span className="text-muted-foreground">Get</span>
              <InlineNumber value={rule.discountPercent} onChange={(v) => onChange({ ...rule, discountPercent: v })} suffix="%" />
              <span className="text-muted-foreground">Off</span>
              <ItemScopeEditor scope={rule.scope} onChange={(s) => onChange({ ...rule, scope: s })} items={items} anyLabel="Total Purchase" />
            </>
          )}
        </div>

        {rule.type === "discount-percent" && (
          <div className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
            <span>Minimum spend (optional):</span>
            <InlineCurrency value={rule.minAmount ?? 0} onChange={(v) => onChange({ ...rule, minAmount: v || null })} placeholder="no minimum" />
          </div>
        )}
        {rule.type === "buy-x-get-discount" && (
          <div className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
            <span>Minimum spend (optional):</span>
            <InlineCurrency value={rule.minAmount ?? 0} onChange={(v) => onChange({ ...rule, minAmount: v || null })} placeholder="no minimum" />
          </div>
        )}

        <div className="mt-2.5 pt-2.5 border-t border-primary/20 text-[12px] text-muted-foreground">
          Preview: <span className="text-foreground font-medium">{describePromoRule(rule)}</span>
        </div>
      </div>
    </div>
  );
}
