import { useEffect, useId, useMemo, useState } from "react";
import { TablePager, clampPage } from "./referral-ui";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Plus, Search, X } from "lucide-react";
import { useSkuStore } from "./sku-store";
import {
  type PromoRule,
  type PromoCondition,
  type PromoReward,
  type PromoItemScope,
  type PromoItemGroup,
  MAX_ITEM_LINES,
  itemLine,
  defaultCondition,
  defaultReward,
  describePromoRule,
} from "./promo-store";

// ── Sentence-builder UI for promo rules ────────────────────────────────────────
// A promo is "When [Condition] → Get [Reward]". Condition and Reward are each
// picked independently and every slot inside them (item, qty, amount, percent,
// cap) is freely editable — so this single builder can express any
// promo shape (Buy 1 Get 1, Buy 2 Get 1 of a different item, min-spend cashback,
// item-specific % off with a cap, etc.) instead of being limited to a fixed
// catalog of promo "types".

// Referral is no longer a promo condition — it has its own page, where one
// global setting governs every user's referral code.
const CONDITION_OPTIONS: SegmentedOption<PromoCondition["kind"]>[] = [
  { kind: "any-purchase", label: "Any Purchase" },
  { kind: "buy-item", label: "Buy Item(s)" },
  { kind: "min-spend", label: "Minimum Spend" },
  { kind: "first-purchase", label: "First Purchase" },
];

const REWARD_OPTIONS: SegmentedOption<PromoReward["kind"]>[] = [
  { kind: "free-item", label: "Free Item(s)" },
  { kind: "percent-off", label: "% Discount" },
  { kind: "amount-off", label: "Rp Discount" },
  { kind: "free-shipping", label: "Free Shipping" },
];

// One preset per genuinely distinct condition × reward pairing — not variations
// on the same pairing (e.g. "Buy 2 Get 1" is just a qty tweak of "Buy 1 Get 1",
// which the qty field already covers, so it isn't a separate preset).
const PRESETS: { label: string; build: () => PromoRule }[] = [
  {
    label: "Buy 1 Get 1 Free",
    build: () => ({
      condition: { kind: "buy-item", group: { join: "and", lines: [itemLine()] } },
      reward: { kind: "free-item", group: { join: "and", lines: [itemLine()] } },
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
    label: "Rp Off Purchase",
    build: () => ({
      condition: { kind: "buy-item", group: { join: "and", lines: [itemLine()] } },
      reward: { kind: "amount-off", amount: 50000 },
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
];

type SkuItem = { name: string; brand: string };

function useSkuItems(): SkuItem[] {
  const { brands } = useSkuStore();
  return useMemo(
    () =>
      brands.flatMap((b) =>
        b.categories.flatMap((c) => c.skus.map((s) => ({ name: s.name, brand: b.name }))),
      ),
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
  single = false,
}: {
  scope: PromoItemScope;
  onChange: (s: PromoItemScope) => void;
  items: SkuItem[];
  anyLabel?: string;
  /** One choice only, as radios. A Buy/Get line already means "this many of
   * this one thing" — a second SKU on the same line is what the next line is
   * for — so ticking several here would say something the rule can't express.
   * The percent-off scope stays a checklist, where a list is the point. */
  single?: boolean;
}) {
  const radioGroup = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const selected = scope.kind === "specific" ? scope.items : [];

  // Reopening the picker starts from the full catalogue — a filter left over
  // from last time reads as "these are all the SKUs there are".
  useEffect(() => {
    if (!open) {
      setSearch("");
      setBrandFilter("all");
    }
  }, [open]);

  // Narrowing the list invalidates whatever page you were on.
  useEffect(() => {
    setPage(1);
  }, [search, brandFilter]);

  const brands = useMemo(() => Array.from(new Set(items.map((it) => it.brand))).sort(), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const matchesBrand = brandFilter === "all" || it.brand === brandFilter;
      const matchesSearch =
        !q || it.name.toLowerCase().includes(q) || it.brand.toLowerCase().includes(q);
      return matchesBrand && matchesSearch;
    });
  }, [items, search, brandFilter]);

  // The catalogue is paged, but "select all matching" and the Any Item row
  // still mean the whole filtered set, not just the rows on screen.
  const safePage = clampPage(page, filtered.length, pageSize);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const label =
    scope.kind === "any"
      ? anyLabel
      : scope.kind === "any-in-brand"
        ? `${anyLabel} (${scope.brand})`
        : selected.length === 1
          ? selected[0]
          : selected.length
            ? `${selected.length} items`
            : "Select items";

  const isBrandScoped = brandFilter !== "all";
  const rowChecked = isBrandScoped
    ? scope.kind === "any-in-brand" && scope.brand === brandFilter
    : scope.kind === "any";
  const noSearch = !search.trim();
  // "Any Item [in Brand]" covers every item in the current filter as long
  // as nothing's narrowing it further with a search — so every row below
  // should read as checked too, without actually rewriting the rule into
  // a giant explicit list.
  const impliedByAny = rowChecked && noSearch;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press inline-flex max-w-[220px] items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 h-8 text-[13px] font-medium text-foreground hover:bg-primary/15 hover:border-primary/50 transition-colors align-middle"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 modal-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-card border border-border rounded-xl shadow-2xl modal-content">
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="text-sm font-semibold text-foreground">
                  {single ? "Select Item" : "Select Items"}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="tap h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground transition-colors duration-150"
                >
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
                {(() => {
                  const rowLabel = isBrandScoped ? `${anyLabel} in ${brandFilter}` : anyLabel;
                  // Checking this box with no search narrowing the view
                  // selects literally everything in the current brand scope
                  // — which is exactly what "Any Item [in Brand]" already
                  // means, so the box should read as checked (and toggling
                  // it should collapse to/from that rule kind) instead of
                  // ever writing out every single item name.
                  const allFilteredSelected =
                    filtered.length > 0 &&
                    (impliedByAny || filtered.every((it) => selected.includes(it.name)));
                  return (
                    <div className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted transition-colors duration-150">
                      <input
                        type={single ? "radio" : "checkbox"}
                        name={single ? radioGroup : undefined}
                        checked={single ? rowChecked : allFilteredSelected}
                        title={
                          single
                            ? "Any item counts, with no particular SKU named"
                            : "Select all items matching the current search/brand filter"
                        }
                        className="accent-[oklch(0.62_0.17_40)] h-3.5 w-3.5 shrink-0"
                        onChange={() => {
                          if (single) {
                            onChange(
                              isBrandScoped
                                ? { kind: "any-in-brand", brand: brandFilter }
                                : { kind: "any" },
                            );
                            return;
                          }
                          if (impliedByAny) {
                            onChange({ kind: "specific", items: [] });
                          } else if (allFilteredSelected) {
                            const next = selected.filter(
                              (name) => !filtered.some((it) => it.name === name),
                            );
                            onChange(
                              next.length ? { kind: "specific", items: next } : { kind: "any" },
                            );
                          } else if (noSearch) {
                            onChange(
                              isBrandScoped
                                ? { kind: "any-in-brand", brand: brandFilter }
                                : { kind: "any" },
                            );
                          } else {
                            const next = Array.from(
                              new Set([...selected, ...filtered.map((it) => it.name)]),
                            );
                            onChange({ kind: "specific", items: next });
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onChange(
                            isBrandScoped
                              ? { kind: "any-in-brand", brand: brandFilter }
                              : { kind: "any" },
                          );
                          setOpen(false);
                        }}
                        className={`flex-1 min-w-0 flex items-center justify-between text-[13px] text-left ${rowChecked ? "text-primary font-medium" : ""}`}
                      >
                        {rowLabel} {rowChecked && <Check className="h-4 w-4" />}
                      </button>
                    </div>
                  );
                })()}
                <div className="my-1 border-t border-border" />
                {filtered.length === 0 ? (
                  <p className="px-3 py-8 text-[13px] text-muted-foreground text-center italic">
                    No items match your filters
                  </p>
                ) : (
                  <div className="animate-fade-in">
                    {paged.map((it) => {
                      // Covered by the active "Any Item [in Brand]" rule —
                      // shows checked like every other row, without this
                      // item actually being in an explicit list.
                      const checked = single
                        ? scope.kind === "specific" && scope.items[0] === it.name
                        : impliedByAny || selected.includes(it.name);
                      return (
                        <label
                          key={`${it.brand}::${it.name}`}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-[13px] hover:bg-muted cursor-pointer transition-colors duration-150"
                        >
                          <input
                            type={single ? "radio" : "checkbox"}
                            name={single ? radioGroup : undefined}
                            checked={checked}
                            className="accent-[oklch(0.62_0.17_40)] h-3.5 w-3.5 shrink-0"
                            onChange={() => {
                              if (single) {
                                // Swap the one choice; closing is Done's job,
                                // so a mis-click can be corrected in place.
                                onChange({ kind: "specific", items: [it.name] });
                                return;
                              }
                              if (impliedByAny) {
                                // Opting this one item out of "Any Item [in
                                // Brand]" — keep everything else in the
                                // current filter explicitly selected.
                                const next = filtered
                                  .filter((x) => x.name !== it.name)
                                  .map((x) => x.name);
                                onChange({ kind: "specific", items: next });
                                return;
                              }
                              const next = checked
                                ? selected.filter((x) => x !== it.name)
                                : [...selected, it.name];
                              onChange(
                                next.length ? { kind: "specific", items: next } : { kind: "any" },
                              );
                            }}
                          />
                          <span className="flex-1 min-w-0 truncate">{it.name}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {it.brand}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              {filtered.length > 0 && (
                <div className="border-t border-border shrink-0">
                  <TablePager
                    page={safePage}
                    pageSize={pageSize}
                    total={filtered.length}
                    onPage={setPage}
                    onPageSize={setPageSize}
                  />
                </div>
              )}
              <div className="p-3 border-t border-border flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md bg-primary text-primary-foreground px-4 h-9 text-[14px] font-medium hover:bg-primary/90 transition-colors"
                >
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

function InlineNumber({
  value,
  onChange,
  suffix,
  min = 1,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-1.5 h-8 align-middle">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) =>
          onChange(Math.min(max ?? Infinity, Math.max(min, Number(e.target.value) || min)))
        }
        className="w-10 bg-transparent text-[13px] font-medium text-center focus:outline-none"
      />
      {suffix && <span className="text-[12px] text-muted-foreground pr-0.5">{suffix}</span>}
    </span>
  );
}

function InlineCurrency({
  value,
  onChange,
  placeholder,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 h-8 align-middle">
      <span className="text-[12px] text-muted-foreground">Rp</span>
      <input
        type="number"
        value={value || ""}
        min={0}
        placeholder={placeholder}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-24 bg-transparent text-[13px] font-medium focus:outline-none"
      />
    </span>
  );
}

type SegmentedOption<T extends string> = { kind: T; label: string };

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.kind}
          type="button"
          onClick={() => {
            if (opt.kind !== value) onChange(opt.kind);
          }}
          className={`tap press px-2.5 h-7 text-[11px] font-medium rounded transition-all duration-150 ${
            value === opt.kind
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Buy/Get item group — pick and/or once for the whole group, then set the
// quantity and SKU of each item inline. One join for the group (not per pair)
// keeps the rule unambiguous: mixed and/or chains need operator precedence to
// read correctly, which is exactly what trips up non-technical staff. ──
function ItemGroupEditor({
  group,
  onChange,
  items,
  verb,
}: {
  group: PromoItemGroup;
  onChange: (g: PromoItemGroup) => void;
  items: SkuItem[];
  verb: "buy" | "get";
}) {
  const lines = group.lines.length ? group.lines : [itemLine()];
  const atMax = lines.length >= MAX_ITEM_LINES;

  const setLine = (i: number, next: Partial<(typeof lines)[number]>) =>
    onChange({ ...group, lines: lines.map((l, idx) => (idx === i ? { ...l, ...next } : l)) });

  const explanation =
    verb === "buy"
      ? group.join === "and"
        ? "Customer has to buy every item below."
        : "Buying any one of the items below is enough."
      : group.join === "and"
        ? "Customer gets every item below."
        : "Customer picks one of the items below.";

  return (
    <div className="rounded-lg border border-border bg-card/40 p-2.5 space-y-2">
      {/* The and/or picker governs the whole group — set it first, then fill
          in the amounts and SKUs below. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Condition</span>
        <Segmented
          options={[
            { kind: "and", label: "and" },
            { kind: "or", label: "or" },
          ]}
          value={group.join}
          onChange={(join) => onChange({ ...group, join })}
        />
        <span key={group.join} className="text-[10.5px] text-muted-foreground animate-fade-in">
          {explanation}
        </span>
      </div>

      <div className="border-t border-border" />

      <div className="flex flex-wrap items-center gap-y-2 pt-0.5">
        {lines.map((line, i) => (
          <span key={i} className="inline-flex items-center gap-1 animate-scale-in">
            {i > 0 && (
              <span
                key={group.join}
                className="mx-2.5 text-[12px] font-semibold text-primary animate-fade-in"
              >
                {group.join}
              </span>
            )}
            <InlineNumber value={line.qty} onChange={(v) => setLine(i, { qty: v })} />
            <ItemScopeEditor
              scope={line.item}
              onChange={(item) => setLine(i, { item })}
              items={items}
              single
            />
            {lines.length > 1 && (
              <button
                type="button"
                onClick={() => onChange({ ...group, lines: lines.filter((_, idx) => idx !== i) })}
                title="Remove this SKU"
                className="tap press h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        <button
          type="button"
          disabled={atMax}
          onClick={() => onChange({ ...group, lines: [...lines, itemLine()] })}
          title={atMax ? `Up to ${MAX_ITEM_LINES} SKUs` : "Add another SKU"}
          className="press icon-pop ml-2 h-8 w-8 grid place-items-center rounded-md border border-dashed border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/70 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/** "When customer buys" / "Get" with the SKU limit on the same line, so the
 * heading and its constraint read together. */
function GroupHeading({ label, atMax }: { label: string; atMax: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`text-[10.5px] transition-colors duration-200 ${atMax ? "text-primary font-medium" : "text-muted-foreground"}`}
      >
        {atMax ? `Maximum ${MAX_ITEM_LINES} SKUs reached` : `Up to ${MAX_ITEM_LINES} SKUs`}
      </span>
    </div>
  );
}

function ConditionEditor({
  condition,
  onChange,
  items,
}: {
  condition: PromoCondition;
  onChange: (c: PromoCondition) => void;
  items: SkuItem[];
}) {
  return (
    <div className="space-y-2">
      <Segmented
        options={CONDITION_OPTIONS}
        value={condition.kind}
        onChange={(kind) => onChange(defaultCondition(kind))}
      />
      <div key={condition.kind} className="text-[13px] leading-8 animate-fade-in">
        {condition.kind === "buy-item" ? (
          <div className="space-y-1.5">
            <GroupHeading
              label="When customer buys"
              atMax={condition.group.lines.length >= MAX_ITEM_LINES}
            />
            <ItemGroupEditor
              group={condition.group}
              onChange={(group) => onChange({ ...condition, group })}
              items={items}
              verb="buy"
            />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground">When</span>
            {condition.kind === "any-purchase" && (
              <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2.5 h-8 text-[13px] font-medium">
                customer makes any purchase
              </span>
            )}
            {condition.kind === "min-spend" && (
              <>
                <span className="text-muted-foreground">customer spends at least</span>
                <InlineCurrency
                  value={condition.amount}
                  onChange={(v) => onChange({ ...condition, amount: v })}
                />
              </>
            )}
            {condition.kind === "first-purchase" && (
              <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2.5 h-8 text-[13px] font-medium">
                customer makes their first purchase
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RewardEditor({
  reward,
  onChange,
  items,
}: {
  reward: PromoReward;
  onChange: (r: PromoReward) => void;
  items: SkuItem[];
}) {
  return (
    <div className="space-y-2">
      <Segmented
        options={REWARD_OPTIONS}
        value={reward.kind}
        onChange={(kind) => onChange(defaultReward(kind))}
      />
      <div
        key={reward.kind}
        className="flex flex-wrap items-center gap-1.5 text-[13px] leading-8 animate-fade-in"
      >
        {reward.kind !== "free-item" && <span className="text-muted-foreground">Get</span>}
        {reward.kind === "percent-off" && (
          <>
            <InlineNumber
              value={reward.percent}
              onChange={(v) => onChange({ ...reward, percent: v })}
              suffix="%"
              max={100}
            />
            <span className="text-muted-foreground">off</span>
            <ItemScopeEditor
              scope={reward.appliesTo}
              onChange={(s) => onChange({ ...reward, appliesTo: s })}
              items={items}
              anyLabel="Total Purchase"
            />
          </>
        )}
        {reward.kind === "amount-off" && (
          <>
            <InlineCurrency
              value={reward.amount}
              onChange={(v) => onChange({ ...reward, amount: v })}
            />
            <span className="text-muted-foreground">off</span>
          </>
        )}
        {reward.kind === "free-shipping" && (
          <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2.5 h-8 text-[13px] font-medium">
            free shipping
          </span>
        )}
      </div>
      {reward.kind === "free-item" && (
        <div className="space-y-1.5">
          <GroupHeading label="Get" atMax={reward.group.lines.length >= MAX_ITEM_LINES} />
          <ItemGroupEditor
            group={reward.group}
            onChange={(group) => onChange({ ...reward, group })}
            items={items}
            verb="get"
          />
        </div>
      )}
      {reward.kind === "percent-off" && (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>Max discount cap (optional):</span>
          <InlineCurrency
            value={reward.maxDiscount ?? 0}
            onChange={(v) => onChange({ ...reward, maxDiscount: v || null })}
            placeholder="no cap"
          />
        </div>
      )}
    </div>
  );
}

export function PromoRuleBuilder({
  rule,
  onChange,
}: {
  rule: PromoRule;
  onChange: (r: PromoRule) => void;
}) {
  const items = useSkuItems();

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] overflow-hidden">
        {/* Big preview */}
        <div className="px-4 py-4 text-center border-b border-dashed border-primary/20 bg-primary/[0.05]">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
            Preview
          </div>
          <div
            key={describePromoRule(rule)}
            className="text-[15px] md:text-lg font-semibold text-foreground leading-snug animate-fade-in"
          >
            {describePromoRule(rule)}
          </div>
        </div>

        {/* Condition (rule 1) + Reward (rule 2) side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-dashed divide-primary/20">
          <div className="p-3">
            <ConditionEditor
              condition={rule.condition}
              onChange={(condition) => onChange({ ...rule, condition })}
              items={items}
            />
          </div>
          <div className="p-3">
            <RewardEditor
              reward={rule.reward}
              onChange={(reward) => onChange({ ...rule, reward })}
              items={items}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground/70 mb-1.5">
          Quick Template
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.build())}
              className="tap press rounded-full border border-border bg-card/60 px-3 h-7 text-[11px] font-medium text-muted-foreground transition-all duration-150 hover:text-foreground hover:bg-card"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
