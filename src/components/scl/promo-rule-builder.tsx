import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";
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
  { kind: "first-purchase", label: "First Purchase" },
];

const REWARD_OPTIONS: { kind: PromoReward["kind"]; label: string }[] = [
  { kind: "free-item", label: "Free Item(s)" },
  { kind: "percent-off", label: "% Discount" },
  { kind: "amount-off", label: "Rp Discount" },
  { kind: "free-shipping", label: "Free Shipping" },
  { kind: "bonus-points", label: "Bonus Points" },
];

// One preset per genuinely distinct condition × reward pairing — not variations
// on the same pairing (e.g. "Buy 2 Get 1" is just a qty tweak of "Buy 1 Get 1",
// which the qty field already covers, so it isn't a separate preset).
const PRESETS: { label: string; build: () => PromoRule }[] = [
  {
    label: "Buy 1 Get 1 Free",
    build: () => ({
      condition: { kind: "buy-item", qty: 1, item: { kind: "any" } },
      reward: { kind: "free-item", qty: 1, sameAsPurchased: true, item: { kind: "any" } },
    }),
  },
  {
    label: "% Off Total Purchase",
    build: () => ({
      condition: { kind: "any-purchase" },
      reward: { kind: "percent-off", percent: 20, appliesTo: { kind: "any" }, maxDiscount: null },
    }),
  },
  {
    label: "Rp Off This Purchase",
    build: () => ({
      condition: { kind: "buy-item", qty: 1, item: { kind: "any" } },
      reward: { kind: "amount-off", amount: 50000, timing: "immediate" },
    }),
  },
  {
    label: "Cashback Next Purchase",
    build: () => ({
      condition: { kind: "any-purchase" },
      reward: { kind: "amount-off", amount: 50000, timing: "next-purchase" },
    }),
  },
  {
    label: "Min. Spend → % Off",
    build: () => ({
      condition: { kind: "min-spend", amount: 500000 },
      reward: { kind: "percent-off", percent: 15, appliesTo: { kind: "any" }, maxDiscount: null },
    }),
  },
  {
    label: "Welcome Free Shipping",
    build: () => ({
      condition: { kind: "first-purchase" },
      reward: { kind: "free-shipping" },
    }),
  },
  {
    label: "Bonus Points on Purchase",
    build: () => ({
      condition: { kind: "any-purchase" },
      reward: { kind: "bonus-points", points: 100 },
    }),
  },
];

type SkuItem = { name: string; brand: string };

function useSkuItems(): SkuItem[] {
  const { brands } = useSkuStore();
  return useMemo(
    () => brands.flatMap((b) => b.categories.flatMap((c) => c.skus.map((s) => ({ name: s.name, brand: b.name })))),
    [brands],
  );
}

// Searchable, multi-select item picker — portaled via FloatingMenu so it's
// never clipped by an ancestor's overflow (table cells, modal scroll areas,
// the rule-builder's own bordered box, etc.) and always renders on top.
function ItemScopeEditor({
  scope,
  onChange,
  items,
  anyLabel = "Any Item",
}: {
  scope: PromoItemScope;
  onChange: (s: PromoItemScope) => void;
  items: SkuItem[];
  anyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const selected = scope.kind === "specific" ? scope.items : [];

  const brands = useMemo(() => Array.from(new Set(items.map((it) => it.brand))).sort(), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const matchesBrand = brandFilter === "all" || it.brand === brandFilter;
      const matchesSearch = !q || it.name.toLowerCase().includes(q) || it.brand.toLowerCase().includes(q);
      return matchesBrand && matchesSearch;
    });
  }, [items, search, brandFilter]);

  const label =
    scope.kind === "any" ? anyLabel :
    scope.kind === "any-in-brand" ? `${anyLabel} (${scope.brand})` :
    selected.length === 1 ? selected[0] : selected.length ? `${selected.length} items` : "Select items";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex max-w-[220px] items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 h-8 text-[13px] font-medium text-foreground hover:bg-primary/15 transition-colors align-middle"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 modal-backdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg max-h-[80vh] flex flex-col bg-card border border-border rounded-xl shadow-2xl modal-content">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="text-sm font-semibold text-foreground">Select Items</div>
              <button type="button" onClick={() => setOpen(false)} className="h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search items..."
                  className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setBrandFilter("all")}
                  className={`px-2.5 h-7 rounded-full text-[11px] font-medium border transition-colors ${brandFilter === "all" ? "border-primary/40 bg-primary/15 text-foreground" : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card"}`}
                >
                  All Brands
                </button>
                {brands.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrandFilter(b)}
                    className={`px-2.5 h-7 rounded-full text-[11px] font-medium border transition-colors ${brandFilter === b ? "border-primary/40 bg-primary/15 text-foreground" : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card"}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => { onChange({ kind: "any" }); setOpen(false); }}
                className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-[13px] text-left hover:bg-muted ${scope.kind === "any" ? "text-primary font-medium" : ""}`}
              >
                {anyLabel} {scope.kind === "any" && <Check className="h-4 w-4" />}
              </button>
              <div className="my-1 border-t border-border" />
              {filtered.length === 0 ? (
                <p className="px-3 py-8 text-[13px] text-muted-foreground text-center italic">No items match your filters</p>
              ) : (
                <div className="stagger">
                  {filtered.map((it) => {
                    const checked = selected.includes(it.name);
                    return (
                      <label key={`${it.brand}::${it.name}`} className="flex items-center gap-3 rounded-md px-3 py-2 text-[13px] hover:bg-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          className="accent-[oklch(0.62_0.17_40)] h-3.5 w-3.5 shrink-0"
                          onChange={() => {
                            const next = checked ? selected.filter((x) => x !== it.name) : [...selected, it.name];
                            onChange(next.length ? { kind: "specific", items: next } : { kind: "any" });
                          }}
                        />
                        <span className="flex-1 min-w-0 truncate">{it.name}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{it.brand}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-border flex justify-end shrink-0">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-primary text-primary-foreground px-4 h-9 text-[14px] font-medium hover:bg-primary/90 transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
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

function ConditionEditor({ condition, onChange, items }: { condition: PromoCondition; onChange: (c: PromoCondition) => void; items: SkuItem[] }) {
  return (
    <div className="space-y-2">
      <Segmented options={CONDITION_OPTIONS} value={condition.kind} onChange={(kind) => onChange(defaultCondition(kind))} />
      <div key={condition.kind} className="flex flex-wrap items-center gap-1.5 text-[13px] leading-8 animate-fade-in">
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
        {condition.kind === "first-purchase" && (
          <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2.5 h-8 text-[13px] font-medium">customer makes their first purchase</span>
        )}
      </div>
    </div>
  );
}

function RewardEditor({ reward, onChange, items }: { reward: PromoReward; onChange: (r: PromoReward) => void; items: SkuItem[] }) {
  return (
    <div className="space-y-2">
      <Segmented options={REWARD_OPTIONS} value={reward.kind} onChange={(kind) => onChange(defaultReward(kind))} />
      <div key={reward.kind} className="flex flex-wrap items-center gap-1.5 text-[13px] leading-8 animate-fade-in">
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
              onChange={(e) => onChange({ ...reward, timing: e.target.value as "immediate" | "next-purchase" })}
              className="h-8 rounded-md border border-primary/30 bg-primary/10 px-2 text-[13px] font-medium focus:outline-none"
            >
              <option value="immediate">off (this purchase)</option>
              <option value="next-purchase">cashback (next purchase)</option>
            </select>
          </>
        )}
        {reward.kind === "free-shipping" && (
          <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2.5 h-8 text-[13px] font-medium">free shipping</span>
        )}
        {reward.kind === "bonus-points" && (
          <>
            <InlineNumber value={reward.points} onChange={(v) => onChange({ ...reward, points: v })} min={10} />
            <span className="text-muted-foreground">bonus loyalty points</span>
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
  const items = useSkuItems();

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] overflow-hidden">
        {/* Big preview */}
        <div className="px-4 py-4 text-center border-b border-dashed border-primary/20 bg-primary/[0.05]">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Preview</div>
          <div key={describePromoRule(rule)} className="text-[15px] md:text-lg font-semibold text-foreground leading-snug animate-fade-in">
            {describePromoRule(rule)}
          </div>
        </div>

        {/* Condition (rule 1) + Reward (rule 2) side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-dashed divide-primary/20">
          <div className="p-3">
            <ConditionEditor condition={rule.condition} onChange={(condition) => onChange({ ...rule, condition })} items={items} />
          </div>
          <div className="p-3">
            <RewardEditor reward={rule.reward} onChange={(reward) => onChange({ ...rule, reward })} items={items} />
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground/70 mb-1.5">Quick Template</div>
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
