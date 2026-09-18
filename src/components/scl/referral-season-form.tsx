import { useRef } from "react";
import { PromoRuleBuilder } from "./promo-rule-builder";
import { defaultRule, describePromoRule, type PromoRule } from "./promo-store";
import type { ReferralSeason } from "./referral-store";

// ── Shared referral-season form — used by the New and Edit pages so the field
// set can't drift between them. A season is only ever: a name, when it runs,
// and the promo rule every referral gets while it runs. ──

export type SeasonFormState = {
  name: string;
  startDate: string;
  endDate: string;
  rule: PromoRule;
  notes: string;
};

export function emptySeasonForm(): SeasonFormState {
  return { name: "", startDate: "", endDate: "", rule: defaultRule(), notes: "" };
}

export function seasonFormFromExisting(season: ReferralSeason): SeasonFormState {
  return {
    name: season.name,
    startDate: season.startDate,
    endDate: season.endDate,
    rule: season.rule,
    notes: season.notes ?? "",
  };
}

/** One setting applies to every customer at a time, so seasons can't overlap —
 * otherwise nobody could say which rule a referral redeems. */
export function validateSeasonForm(
  form: SeasonFormState,
  seasons: ReferralSeason[],
  selfId?: string,
): string | null {
  if (!form.name.trim()) return "Season name is required";
  if (!form.startDate || !form.endDate) return "Start and End dates are required";
  const start = new Date(form.startDate).getTime();
  const end = new Date(form.endDate).getTime();
  if (end <= start) return "End date must be after the start date";
  const clash = seasons.find(
    (s) =>
      s.id !== selfId &&
      start <= new Date(s.endDate).getTime() &&
      end >= new Date(s.startDate).getTime(),
  );
  if (clash) return `These dates overlap "${clash.name}"`;
  return null;
}

export function seasonFormToPayload(form: SeasonFormState) {
  return {
    name: form.name.trim(),
    startDate: form.startDate,
    endDate: form.endDate,
    rule: form.rule,
    notes: form.notes.trim() || undefined,
  };
}

const inputCls =
  "h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground transition-shadow focus:outline-none focus:ring-1 focus:ring-primary/40";
const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1";

export function SeasonFormFields({
  form,
  setForm,
  started,
}: {
  form: SeasonFormState;
  setForm: (f: SeasonFormState) => void;
  /** A season that has already begun can only be shortened or extended, and
   * have its notes edited — customers have already been promised the rest. */
  started?: boolean;
}) {
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof SeasonFormState>(key: K, val: SeasonFormState[K]) =>
    setForm({ ...form, [key]: val });

  const lockedCls =
    "h-9 w-full rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 cursor-not-allowed select-none";

  return (
    <div className="space-y-4">
      {started && (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 text-[12px] text-muted-foreground animate-fade-in">
          <span className="font-medium text-foreground">This season has already started</span> —
          only its end date and notes can still change.
        </div>
      )}

      <div>
        <label className={labelCls}>Season Name</label>
        <input
          autoFocus={!started}
          value={form.name}
          disabled={started}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Beauty Club Referral — Q3"
          className={started ? lockedCls : inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 stagger">
        <div>
          <label className={labelCls}>Starts</label>
          <input
            ref={startRef}
            type="datetime-local"
            value={form.startDate}
            max={form.endDate || undefined}
            disabled={started}
            onChange={(e) => set("startDate", e.target.value)}
            onClick={() => !started && startRef.current?.showPicker?.()}
            className={started ? lockedCls : inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Ends</label>
          <input
            ref={endRef}
            type="datetime-local"
            value={form.endDate}
            min={form.startDate || undefined}
            onChange={(e) => set("endDate", e.target.value)}
            onClick={() => endRef.current?.showPicker?.()}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>What a referral gets</label>
        {started ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3">
            <div className="text-sm font-medium text-foreground">
              {describePromoRule(form.rule)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Locked — referrals already made under this season were promised this reward.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2 text-[12px] text-muted-foreground">
              No code to set — customers share their own permanent referral code. This rule applies
              to every referral while the season runs.
            </p>
            <PromoRuleBuilder rule={form.rule} onChange={(r) => set("rule", r)} />
          </>
        )}
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="Anything the team should know about this season..."
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm resize-none transition-shadow focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>
    </div>
  );
}
