import { useRef } from "react";
import { Infinity as InfinityIcon } from "lucide-react";
import { PromoRuleBuilder } from "./promo-rule-builder";
import {
  defaultCodeFormat,
  defaultRule,
  type PromoRule,
  type PromoCode,
  type PromoItemScope,
} from "./promo-store";

// ── Shared promo form — used by the Create page and the Edit page so the
// field set can never drift out of sync between them. ──

export type PromoFormState = {
  code: string;
  name: string;
  description: string;
  usageType: "one-to-many" | "one-to-one";
  maxUsage: string;
  maxUsageUnlimited: boolean;
  /** How many times one customer may redeem this promo. */
  limitPerUser: string;
  limitPerUserUnlimited: boolean;
  /** 1-to-1 only: the per-recipient code pattern, set in the code step. */
  codeFormat: string;
  startDate: string;
  endDate: string;
  rule: PromoRule;
};

export function emptyPromoForm(): PromoFormState {
  return {
    code: "",
    name: "",
    description: "",
    usageType: "one-to-many",
    maxUsage: "",
    maxUsageUnlimited: true,
    limitPerUser: "",
    limitPerUserUnlimited: true,
    codeFormat: "",
    startDate: "",
    endDate: "",
    rule: defaultRule(),
  };
}

export function promoFormFromExisting(promo: PromoCode): PromoFormState {
  return {
    code: promo.code,
    name: promo.name,
    description: promo.description,
    usageType: promo.usageType,
    maxUsage: promo.maxUsage?.toString() ?? "",
    maxUsageUnlimited: promo.maxUsage == null,
    limitPerUser: promo.limitPerUser?.toString() ?? "",
    limitPerUserUnlimited: promo.limitPerUser == null,
    codeFormat: promo.codeFormat ?? "",
    startDate: promo.startDate,
    endDate: promo.endDate,
    rule: promo.rule,
  };
}

function emptyScope(scope: PromoItemScope): boolean {
  return scope.kind === "specific" && scope.items.length === 0;
}

/** `existing` lets the caller reject a code another promo already holds —
 * the promo being edited is excluded by id. */
export function validatePromoForm(
  form: PromoFormState,
  existing: PromoCode[] = [],
  selfId?: string,
): string | null {
  if (!form.name.trim()) return "Promo Name is required";
  if (!form.startDate || !form.endDate) return "Start and End dates are required";
  if (new Date(form.endDate) <= new Date(form.startDate))
    return "End date must be after the start date";

  // A cap of 0 would mean a promo nobody can use, which is never what's meant.
  if (!form.maxUsageUnlimited && form.maxUsage && Number(form.maxUsage) < 1)
    return "Max Usage must be at least 1";
  if (!form.limitPerUserUnlimited && form.limitPerUser && Number(form.limitPerUser) < 1)
    return "Limit Per User must be at least 1";

  // An item list the user emptied would silently match nothing.
  const { condition, reward } = form.rule;
  if (condition.kind === "buy-item" && condition.group.lines.some((l) => emptyScope(l.item)))
    return "Pick at least one item for every line under 'When customer buys'";
  if (reward.kind === "free-item" && reward.group.lines.some((l) => emptyScope(l.item)))
    return "Pick at least one item for every free item";
  if (reward.kind === "percent-off" && emptyScope(reward.appliesTo))
    return "Pick what the discount applies to";

  const code = form.code.trim().toUpperCase();
  if (code && existing.some((p) => p.id !== selfId && p.code.toUpperCase() === code))
    return `Another promo already uses the code ${code}`;

  // 1-to-1 deliberately has no usage caps: how many codes exist is decided by
  // how many recipients a Broadcast sends it to.
  return null;
}

export function promoFormToPayload(
  form: PromoFormState,
): Pick<
  PromoCode,
  | "code"
  | "name"
  | "description"
  | "rule"
  | "usageType"
  | "maxUsage"
  | "limitPerUser"
  | "codeFormat"
  | "startDate"
  | "endDate"
> {
  const oneToOne = form.usageType === "one-to-one";
  const code = form.code.trim().toUpperCase();
  return {
    code,
    name: form.name.trim(),
    description: form.description.trim(),
    rule: form.rule,
    usageType: form.usageType,
    // Usage caps belong to 1-to-Many; a 1-to-1 promo is bounded by its
    // Broadcast recipients and each code is single-use by definition.
    maxUsage: oneToOne
      ? null
      : form.maxUsageUnlimited
        ? null
        : form.maxUsage
          ? Number(form.maxUsage)
          : null,
    limitPerUser: oneToOne
      ? null
      : form.limitPerUserUnlimited || !form.limitPerUser
        ? null
        : Number(form.limitPerUser),
    codeFormat: oneToOne ? form.codeFormat || defaultCodeFormat(code) : undefined,
    startDate: form.startDate,
    endDate: form.endDate,
  };
}

const inputCls =
  "h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";
const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1";
export const PROMO_NAME_MAX_LENGTH = 40;
export const PROMO_CODE_MAX_LENGTH = 20;

export function PromoFormFields({
  form,
  setForm,
}: {
  form: PromoFormState;
  setForm: (f: PromoFormState) => void;
}) {
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof PromoFormState>(key: K, val: PromoFormState[K]) =>
    setForm({ ...form, [key]: val });

  const setUsageType = (t: PromoFormState["usageType"]) => setForm({ ...form, usageType: t });

  return (
    <div className="space-y-4">
      {/* Promo Name + Usage Type */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <label className={labelCls}>Promo Name</label>
            <span
              className={`text-[10px] tabular-nums transition-colors duration-200 ${
                PROMO_NAME_MAX_LENGTH - form.name.length <= 5
                  ? "text-amber-600 font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {PROMO_NAME_MAX_LENGTH - form.name.length} characters left
            </span>
          </div>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value.slice(0, PROMO_NAME_MAX_LENGTH))}
            maxLength={PROMO_NAME_MAX_LENGTH}
            placeholder="e.g. Summer 20% Off"
            className={inputCls}
          />
        </div>
        <div className="shrink-0">
          <label className={labelCls}>Usage Type</label>
          <div className="inline-flex h-9 items-center rounded-md border border-border bg-muted/40 p-0.5 gap-0.5">
            {(["one-to-many", "one-to-one"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setUsageType(t)}
                className={`px-3 h-7 text-[12px] font-medium rounded transition-colors whitespace-nowrap ${form.usageType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t === "one-to-many" ? "1-to-Many" : "1-to-1 (unique)"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Max Usage + Limit Per User — a total cap and a per-customer cap, each
          with the same "Unlimited" escape hatch. 1-to-1 has neither: its size
          is whatever Broadcast sends, and each code works once. */}
      {form.usageType === "one-to-one" ? (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 text-[12px] text-muted-foreground animate-fade-in">
          <span className="font-medium text-foreground">Recipients are chosen in Broadcast</span> —
          each one gets their own single-use code.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger animate-fade-in">
          <div>
            <label className={labelCls}>Max Usage</label>
            <div className="h-9 w-full flex items-center gap-2 rounded-md border border-border bg-card pl-3 pr-2 transition-colors focus-within:ring-1 focus-within:ring-primary/40">
              <div className="relative flex-1 min-w-0 h-full">
                <input
                  type="number"
                  value={form.maxUsage}
                  disabled={form.maxUsageUnlimited}
                  onChange={(e) => set("maxUsage", e.target.value)}
                  placeholder={form.maxUsageUnlimited ? "" : "e.g. 500"}
                  min={1}
                  className="w-full h-full bg-transparent text-sm text-foreground focus:outline-none disabled:cursor-not-allowed"
                />
                {form.maxUsageUnlimited && (
                  <div className="absolute inset-0 flex items-center pointer-events-none text-muted-foreground animate-fade-in">
                    <InfinityIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="w-px h-5 bg-border shrink-0" />
              <label className="flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.maxUsageUnlimited}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxUsageUnlimited: e.target.checked,
                      maxUsage: e.target.checked ? "" : form.maxUsage,
                    })
                  }
                  className="accent-[oklch(0.62_0.17_40)] h-3.5 w-3.5"
                />
                Unlimited
              </label>
            </div>
          </div>

          <div>
            <label className={labelCls}>Limit Per User</label>
            <div className="h-9 w-full flex items-center gap-2 rounded-md border border-border bg-card pl-3 pr-2 transition-colors focus-within:ring-1 focus-within:ring-primary/40">
              <div className="relative flex-1 min-w-0 h-full">
                <input
                  type="number"
                  value={form.limitPerUser}
                  disabled={form.limitPerUserUnlimited}
                  onChange={(e) => set("limitPerUser", e.target.value)}
                  placeholder={form.limitPerUserUnlimited ? "" : "e.g. 1"}
                  min={1}
                  className="w-full h-full bg-transparent text-sm text-foreground focus:outline-none disabled:cursor-not-allowed"
                />
                {form.limitPerUserUnlimited && (
                  <div className="absolute inset-0 flex items-center pointer-events-none text-muted-foreground animate-fade-in">
                    <InfinityIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="w-px h-5 bg-border shrink-0" />
              <label className="flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.limitPerUserUnlimited}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      limitPerUserUnlimited: e.target.checked,
                      limitPerUser: e.target.checked ? "" : form.limitPerUser,
                    })
                  }
                  className="accent-[oklch(0.62_0.17_40)] h-3.5 w-3.5"
                />
                Unlimited
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Start / End Date+Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger">
        <div>
          <label className={labelCls}>Start Date &amp; Time</label>
          <input
            ref={startDateRef}
            type="datetime-local"
            value={form.startDate}
            max={form.endDate || undefined}
            onChange={(e) => set("startDate", e.target.value)}
            onClick={() => startDateRef.current?.showPicker?.()}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>End Date &amp; Time</label>
          <input
            ref={endDateRef}
            type="datetime-local"
            value={form.endDate}
            min={form.startDate || undefined}
            onChange={(e) => set("endDate", e.target.value)}
            onClick={() => endDateRef.current?.showPicker?.()}
            className={inputCls}
          />
        </div>
      </div>

      {/* Promo Rule */}
      <div>
        <label className={labelCls}>Promo Rule</label>
        <PromoRuleBuilder rule={form.rule} onChange={(r) => set("rule", r)} />
      </div>
    </div>
  );
}

// ── Shared full-page action bar — sticks to the bottom of the viewport so the
// primary action is always reachable regardless of form length. Cancel sits
// left, the primary action right, matching standard form-footer convention. ──
export function PromoFormActionBar({
  onCancel,
  onSubmit,
  submitLabel,
  disabled,
  reason,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  disabled?: boolean;
  /** Why the form can't be submitted yet — shown next to the button, because a
   * greyed-out button with no explanation is a dead end. */
  reason?: string | null;
}) {
  return (
    <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-3.5 flex items-center justify-between">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-4 h-9 text-[14px] text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
      >
        Cancel
      </button>
      <div className="flex items-center gap-3 min-w-0">
        {disabled && reason && (
          <span className="text-[12px] text-destructive truncate animate-fade-in">{reason}</span>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          title={disabled ? (reason ?? "Fill in the required fields to continue") : undefined}
          className="press inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
