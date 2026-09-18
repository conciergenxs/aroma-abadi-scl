import { useMemo, useState } from "react";
import { Megaphone, Wand2, X } from "lucide-react";
import type { PromoCondition, PromoReward } from "./promo-store";
import { CODE_INITIALS_TOKEN, defaultCodeFormat, fillCodeFormat } from "./promo-store";
import { type PromoFormState, PROMO_CODE_MAX_LENGTH } from "./promo-form-fields";
import { usePromoStore } from "./promo-store";

const CONDITION_CODE: Record<PromoCondition["kind"], string> = {
  "any-purchase": "ANY",
  "buy-item": "BUY",
  "min-spend": "SPD",
  "first-purchase": "1ST",
};

const REWARD_CODE: Record<PromoReward["kind"], string> = {
  "free-item": "FRE",
  "percent-off": "PCT",
  "amount-off": "AMT",
  "free-shipping": "SHP",
  "bonus-points": "PTS",
};

function extractMMDD(datetimeLocal: string): string {
  const m = datetimeLocal.match(/^\d{4}-(\d{2})-(\d{2})/);
  return m ? `${m[1]}${m[2]}` : "0000";
}

/** Format: <3-letter name prefix><start MMDD>-<end MMDD>-<condition><reward>, e.g. SUM0701-0731-ANYPCT */
export function generatePromoCodeSuggestion(form: PromoFormState): string {
  const namePrefix = (form.name.replace(/[^a-zA-Z]/g, "").slice(0, 3) || "PRM").toUpperCase();
  const start = extractMMDD(form.startDate);
  const end = extractMMDD(form.endDate);
  const ruleCode = `${CONDITION_CODE[form.rule.condition.kind]}${REWARD_CODE[form.rule.reward.kind]}`;
  return `${namePrefix}${start}-${end}-${ruleCode}`.slice(0, PROMO_CODE_MAX_LENGTH);
}

// Seeded customers, used purely to show what the pattern produces for a real
// name before any Broadcast has gone out.
const SAMPLE_NAMES = ["Putri Anggraini", "Bayu Hartanto", "Citra Halim"];

export function PromoCodeSetupModal({
  form,
  onCancel,
  onConfirm,
}: {
  form: PromoFormState;
  onCancel: () => void;
  onConfirm: (code: string, codeFormat?: string) => void;
}) {
  const { promos } = usePromoStore();
  const suggested = useMemo(() => generatePromoCodeSuggestion(form), [form]);
  const [code, setCode] = useState(form.code.trim() || suggested);
  const isOneToOne = form.usageType === "one-to-one";

  const handleCodeChange = (val: string) => {
    setCode(val.toUpperCase().slice(0, PROMO_CODE_MAX_LENGTH));
  };

  const taken = promos.find((p) => p.code.toUpperCase() === code.trim().toUpperCase());

  const handleConfirm = () => {
    if (!code.trim() || taken) return;
    const trimmed = code.trim().toUpperCase();
    // 1-to-1 recipients still get a personal code, but the pattern is derived
    // here rather than configured — Broadcast is where individual codes are
    // actually edited.
    onConfirm(trimmed, isOneToOne ? defaultCodeFormat(trimmed) : undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col bg-card border border-border rounded-xl shadow-2xl modal-content">
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Set Promo Code</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isOneToOne
                ? "Suggested from your promo details — this is the code your Template will use"
                : "Suggested from your promo details, editable if you'd like something else"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="tap h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground transition-colors duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-1 border-b border-border shrink-0">
          <div className="flex items-baseline justify-between gap-2">
            <label className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
              Promo Code
            </label>
            <span
              className={`text-[10px] tabular-nums transition-colors duration-200 ${
                PROMO_CODE_MAX_LENGTH - code.length <= 3
                  ? "text-amber-600 font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {PROMO_CODE_MAX_LENGTH - code.length} characters left
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="e.g. SUMMER20"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm font-mono tracking-wide text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              type="button"
              title="Reset to suggested code"
              onClick={() => handleCodeChange(suggested)}
              className="press icon-pop h-9 w-9 shrink-0 grid place-items-center rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Wand2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {isOneToOne && (
          <div className="flex-1 overflow-y-auto p-4 animate-fade-in">
            <div className="rounded-md border border-border bg-card/60 px-3 py-2.5 text-[12px] text-muted-foreground space-y-1.5">
              <p>
                Your <strong className="text-foreground">Template</strong> uses{" "}
                <code className="font-mono text-foreground bg-muted border border-border rounded px-1">
                  {`{{promo-${code.trim().toUpperCase() || "CODE"}}}`}
                </code>
                .
              </p>
              <p>
                In <strong className="text-foreground">Broadcast</strong>, each recipient gets{" "}
                <code className="font-mono text-foreground bg-muted border border-border rounded px-1">
                  {code.trim().toUpperCase() || "CODE"}-####
                </code>{" "}
                by default — only <strong className="text-foreground">####</strong> changes, filled
                with their initials. You can also replace a code with anything (e.g.{" "}
                <span className="font-mono text-foreground">COOKIES2103</span>), as long as no other
                active code uses it.
              </p>
            </div>
          </div>
        )}

        <div className="p-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 rounded-md border border-border text-[14px] text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!code.trim()}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Confirm &amp; Launch Promo
          </button>
        </div>
      </div>
    </div>
  );
}
