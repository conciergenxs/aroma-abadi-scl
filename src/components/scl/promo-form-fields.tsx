import { useRef, useState } from "react";
import { Check, ChevronDown, Users, X as XIcon, Infinity as InfinityIcon } from "lucide-react";
import { PromoRuleBuilder } from "./promo-rule-builder";
import { defaultRule, type PromoRule, type PromoCode } from "./promo-store";
import type { ContactList } from "./mock-data";

// ── Shared promo form — used by the Create page and the Edit page so the
// field set can never drift out of sync between them. ──

export type PromoFormState = {
  code: string;
  name: string;
  description: string;
  usageType: "one-to-many" | "one-to-one";
  maxUsage: string;
  maxUsageUnlimited: boolean;
  startDate: string;
  endDate: string;
  rule: PromoRule;
  /** Contact audiences this promo is restricted to. Empty = everyone. */
  audienceIds: string[];
};

export function emptyPromoForm(): PromoFormState {
  return {
    code: "",
    name: "",
    description: "",
    usageType: "one-to-many",
    maxUsage: "",
    maxUsageUnlimited: true,
    startDate: "",
    endDate: "",
    rule: defaultRule(),
    audienceIds: [],
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
    startDate: promo.startDate,
    endDate: promo.endDate,
    rule: promo.rule,
    audienceIds: promo.audienceIds ?? [],
  };
}

export function validatePromoForm(form: PromoFormState): string | null {
  if (!form.name.trim()) return "Promo Name is required";
  if (!form.startDate || !form.endDate) return "Start and End dates are required";
  if (form.usageType === "one-to-one" && (form.maxUsageUnlimited || !form.maxUsage.trim())) {
    return "Max Usage is required for 1-to-1 codes";
  }
  return null;
}

export function promoFormToPayload(form: PromoFormState): Pick<
  PromoCode,
  "code" | "name" | "description" | "rule" | "usageType" | "maxUsage" | "startDate" | "endDate" | "audienceIds"
> {
  return {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    description: form.description.trim(),
    rule: form.rule,
    usageType: form.usageType,
    maxUsage: form.maxUsageUnlimited ? null : (form.maxUsage ? Number(form.maxUsage) : null),
    startDate: form.startDate,
    endDate: form.endDate,
    audienceIds: form.audienceIds,
  };
}

const inputCls = "h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";
const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1";
export const PROMO_NAME_MAX_LENGTH = 40;
export const PROMO_CODE_MAX_LENGTH = 20;

export function PromoFormFields({ form, setForm, audiences }: { form: PromoFormState; setForm: (f: PromoFormState) => void; audiences: ContactList[] }) {
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof PromoFormState>(key: K, val: PromoFormState[K]) => setForm({ ...form, [key]: val });

  const setUsageType = (t: PromoFormState["usageType"]) => {
    // 1-to-1 needs a concrete count to generate that many individual codes,
    // so Unlimited can't apply there — force it off when switching in.
    setForm({ ...form, usageType: t, maxUsageUnlimited: t === "one-to-one" ? false : form.maxUsageUnlimited });
  };

  return (
    <div className="space-y-4">
      {/* Promo Name + Usage Type */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <label className={labelCls}>Promo Name</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value.slice(0, PROMO_NAME_MAX_LENGTH))}
            maxLength={PROMO_NAME_MAX_LENGTH}
            placeholder="e.g. Summer 20% Off"
            className={inputCls}
          />
          <div className="mt-1 text-[10px] text-muted-foreground text-right">{PROMO_NAME_MAX_LENGTH - form.name.length} characters left</div>
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

      {/* Audience Segment + Max Usage */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Audience Segment</label>
          <AudienceSegmentPicker
            audiences={audiences}
            selectedIds={form.audienceIds}
            onChange={(ids) => set("audienceIds", ids)}
          />
        </div>

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
            <label className={`flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground ${form.usageType === "one-to-one" ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                checked={form.maxUsageUnlimited}
                disabled={form.usageType === "one-to-one"}
                onChange={(e) => setForm({ ...form, maxUsageUnlimited: e.target.checked, maxUsage: e.target.checked ? "" : form.maxUsage })}
                className="accent-[oklch(0.62_0.17_40)] h-3.5 w-3.5 disabled:cursor-not-allowed"
              />
              Unlimited
            </label>
          </div>
        </div>
      </div>

      {/* Start / End Date+Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Start Date &amp; Time</label>
          <input
            ref={startDateRef}
            type="datetime-local"
            value={form.startDate}
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

function AudienceSegmentPicker({
  audiences,
  selectedIds,
  onChange,
}: {
  audiences: ContactList[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = selectedIds.length === 0
    ? "Any Audience"
    : selectedIds.length === 1
      ? audiences.find((a) => a.id === selectedIds[0])?.name ?? "1 audience"
      : `${selectedIds.length} audiences`;

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-9 w-full flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 text-sm text-left hover:bg-muted/40 transition-colors"
      >
        <span className={`truncate flex items-center gap-1.5 ${selectedIds.length ? "text-foreground" : "text-muted-foreground"}`}>
          <Users className="h-3.5 w-3.5 shrink-0" /> {label}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 mt-1 w-full min-w-[240px] max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-xl">
            <button
              type="button"
              onClick={() => onChange([])}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px] text-left hover:bg-muted ${selectedIds.length === 0 ? "text-primary font-medium" : ""}`}
            >
              Any Audience {selectedIds.length === 0 && <Check className="h-3.5 w-3.5" />}
            </button>
            <div className="my-1 border-t border-border" />
            {audiences.length === 0 ? (
              <p className="px-3 py-4 text-[12px] text-muted-foreground text-center italic">No audiences yet — create one on the Contacts page</p>
            ) : (
              audiences.map((a) => {
                const checked = selectedIds.includes(a.id);
                return (
                  <label key={a.id} className="flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(a.id)}
                      className="accent-[oklch(0.62_0.17_40)] h-3.5 w-3.5 shrink-0"
                    />
                    <span className="truncate">{a.name}</span>
                  </label>
                );
              })
            )}
          </div>
        </>
      )}
      {selectedIds.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {selectedIds.map((id) => {
            const a = audiences.find((x) => x.id === id);
            if (!a) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 pl-2 pr-1 h-5 text-[10px] text-foreground">
                {a.name}
                <button type="button" onClick={() => toggle(id)} className="h-3.5 w-3.5 grid place-items-center rounded-full hover:bg-primary/20">
                  <XIcon className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Shared full-page action bar — sticks to the bottom of the viewport so the
// primary action is always reachable regardless of form length. Cancel sits
// left, the primary action right, matching standard form-footer convention. ──
export function PromoFormActionBar({ onCancel, onSubmit, submitLabel }: { onCancel: () => void; onSubmit: () => void; submitLabel: string }) {
  return (
    <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-3.5 flex items-center justify-between">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-4 h-9 text-[14px] text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {submitLabel}
      </button>
    </div>
  );
}
