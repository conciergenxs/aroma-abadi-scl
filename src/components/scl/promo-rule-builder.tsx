import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, ArrowRight } from "lucide-react";
import { useSkuStore } from "./sku-store";
import {
  type PromoRule,
  type PromoCondition,
  type PromoReward,
  type PromoItemScope,
  defaultCondition,
  defaultReward,
  describePromoRule,
} from "./promo-store";

// ── Sentence-builder UI for promo rules ────────────────────────────────────────
// A promo is "When [Condition] → Get [Reward]". Condition and Reward are each
// picked independently and every slot inside them (item, qty, amount, percent,
// cap, timing) is freely editable — so this single builder can express any
// promo shape (Buy 1 Get 1, Buy 2 Get 1 of a different item, min-spend cashback,
// item-specific % off with a cap, etc.) instead of being limited to a fixed
// catalog of promo "types".

const CONDITION_OPTIONS: { kind: PromoCondition["kind"]; label: string }[] = [
  { kind: "any-purchase", label: "Any Purchase" },
  { kind: "buy-item", label: "Buy Item(s)" },
  { kind: "min-spend", label: "Minimum Spend" },
];

const REWARD_OPTIONS: { kind: PromoReward["kind"]; label: string }[] = [
  { kind: "free-item", label: "Free Item(s)" },
  { kind: "percent-off", label: "% Discount" },
  { kind: "amount-off", label: "Rp Discount" },
];

const PRESETS: { label: string; build: () => PromoRule }[] = [
  {
    label: "Buy 1 Get 1 Free",
    build: () => ({
      condition: { kind: "buy-item", qty: 1, item: { kind: "any" } },
      reward: { kind: "free-item", qty: 1, sameAsPurchased: true, item: { kind: "any" } },
    }),
  },
  {
    label: "Buy 2 Get 1 Free",
    build: () => ({
      condition: { kind: "buy-item", qty: 2, item: { kind: "any" } },
      reward: { kind: "free-item", qty: 1, sameAsPurchased: true, item: { kind: "any" } },
    }),
  },
  {
    label: "20% Off Total",
    build: () => ({
      condition: { kind: "any-purchase" },
      reward: { kind: "percent-off", percent: 20, appliesTo: { kind: "any" }, maxDiscount: null },
    }),
  },
  {
    label: "Rp50,000 Cashback",
    build: () => ({
      condition: { kind: "any-purchase" },
      reward: { kind: "amount-off", amount: 50000, timing: "next-purchase" },
    }),
  },
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

function Segmented<T extends string>({ options, value, onChange }: { options: { kind: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.kind}
          type="button"
          onClick={() => { if (opt.kind !== value) onChange(opt.kind); }}
          className={`px-2.5 h-7 text-[11px] font-medium rounded transition-colors ${value === opt.kind ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ConditionEditor({ condition, onChange, items }: { condition: PromoCondition; onChange: (c: PromoCondition) => void; items: string[] }) {
  return (
    <div className="space-y-2">
      <Segmented options={CONDITION_OPTIONS} value={condition.kind} onChange={(kind) => onChange(defaultCondition(kind))} />
      <div className="flex flex-wrap items-center gap-1.5 text-[13px] leading-8">
        <span className="text-muted-foreground">When</span>
        {condition.kind === "any-purchase" && (
          <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2.5 h-8 text-[13px] font-medium">customer makes any purchase</span>
        )}
        {condition.kind === "buy-item" && (
          <>
            <span className="text-muted-foreground">customer buys</span>
            <InlineNumber value={condition.qty} onChange={(v) => onChange({ ...condition, qty: v })} />
            <ItemScopeEditor scope={condition.item} onChange={(s) => onChange({ ...condition, item: s })} items={items} />
          </>
        )}
        {condition.kind === "min-spend" && (
          <>
            <span className="text-muted-foreground">customer spends at least</span>
            <InlineCurrency value={condition.amount} onChange={(v) => onChange({ ...condition, amount: v })} />
          </>
        )}
      </div>
    </div>
  );
}

function RewardEditor({ reward, onChange, items }: { reward: PromoReward; onChange: (r: PromoReward) => void; items: string[] }) {
  return (
    <div className="space-y-2">
      <Segmented options={REWARD_OPTIONS} value={reward.kind} onChange={(kind) => onChange(defaultReward(kind))} />
      <div className="flex flex-wrap items-center gap-1.5 text-[13px] leading-8">
        <span className="text-muted-foreground">Get</span>
        {reward.kind === "free-item" && (
          <>
            <InlineNumber value={reward.qty} onChange={(v) => onChange({ ...reward, qty: v })} />
            {reward.sameAsPurchased ? (
              <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2.5 h-8 text-[13px] font-medium">Same Item</span>
            ) : (
              <ItemScopeEditor scope={reward.item} onChange={(s) => onChange({ ...reward, item: s })} items={items} />
            )}
            <span className="text-muted-foreground">free</span>
            <button
              type="button"
              onClick={() => onChange({ ...reward, sameAsPurchased: !reward.sameAsPurchased })}
              className="ml-1 text-[11px] text-primary hover:underline"
            >
              {reward.sameAsPurchased ? "use a different item instead" : "use the same item instead"}
            </button>
          </>
        )}
        {reward.kind === "percent-off" && (
          <>
            <InlineNumber value={reward.percent} onChange={(v) => onChange({ ...reward, percent: v })} suffix="%" />
            <span className="text-muted-foreground">off</span>
            <ItemScopeEditor scope={reward.appliesTo} onChange={(s) => onChange({ ...reward, appliesTo: s })} items={items} anyLabel="Total Purchase" />
          </>
        )}
        {reward.kind === "amount-off" && (
          <>
            <InlineCurrency value={reward.amount} onChange={(v) => onChange({ ...reward, amount: v })} />
            <select
              value={reward.timing}
              onChange={(e) => onChange({ ...reward, timing: e.target.value as PromoReward extends { kind: "amount-off" } ? never : never } as never)}
              className="h-8 rounded-md border border-primary/30 bg-primary/10 px-2 text-[13px] font-medium focus:outline-none"
            >
              <option value="immediate">off (this purchase)</option>
              <option value="next-purchase">cashback (next purchase)</option>
            </select>
          </>
        )}
      </div>
      {reward.kind === "percent-off" && (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>Max discount cap (optional):</span>
          <InlineCurrency value={reward.maxDiscount ?? 0} onChange={(v) => onChange({ ...reward, maxDiscount: v || null })} placeholder="no cap" />
        </div>
      )}
    </div>
  );
}

export function PromoRuleBuilder({ rule, onChange }: { rule: PromoRule; onChange: (r: PromoRule) => void }) {
  const items = useSkuItemNames();

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] p-3 space-y-3">
        <ConditionEditor condition={rule.condition} onChange={(condition) => onChange({ ...rule, condition })} items={items} />
        <div className="flex items-center gap-2 text-muted-foreground/50">
          <div className="flex-1 border-t border-dashed border-primary/20" />
          <ArrowRight className="h-3.5 w-3.5" />
          <div className="flex-1 border-t border-dashed border-primary/20" />
        </div>
        <RewardEditor reward={rule.reward} onChange={(reward) => onChange({ ...rule, reward })} items={items} />
        <div className="pt-2.5 border-t border-primary/20 text-[12px] text-muted-foreground">
          Preview: <span className="text-foreground font-medium">{describePromoRule(rule)}</span>
        </div>
      </div>

      <div>
        <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground/70 mb-1.5">Quick start</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.build())}
              className="rounded-full border border-border bg-card/60 px-3 h-7 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
