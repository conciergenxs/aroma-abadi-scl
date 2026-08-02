import { useMemo, useState } from "react";
import { Wand2, X } from "lucide-react";
import type { PromoCondition, PromoReward, AssignedCode } from "./promo-store";
import { type PromoFormState, PROMO_CODE_MAX_LENGTH } from "./promo-form-fields";

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

function generateIndividualCodes(baseCode: string, count: number): AssignedCode[] {
  const digits = String(count).length;
  return Array.from({ length: count }, (_, i) => ({
    code: `${baseCode}-${String(i + 1).padStart(digits, "0")}`,
    redeemed: false,
  }));
}

const PAGE_SIZE = 10;

export function PromoCodeSetupModal({
  form,
  onCancel,
  onConfirm,
}: {
  form: PromoFormState;
  onCancel: () => void;
  onConfirm: (code: string, assignedCodes?: AssignedCode[]) => void;
}) {
  const suggested = useMemo(() => generatePromoCodeSuggestion(form), [form]);
  const [code, setCode] = useState(form.code.trim() || suggested);
  const [page, setPage] = useState(1);

  const isOneToOne = form.usageType === "one-to-one";
  const maxUsage = Number(form.maxUsage) || 0;

  const individualCodes = useMemo(
    () => (isOneToOne && code.trim() ? generateIndividualCodes(code.trim().toUpperCase(), maxUsage) : []),
    [isOneToOne, code, maxUsage],
  );

  const totalPages = Math.max(1, Math.ceil(individualCodes.length / PAGE_SIZE));
  const pagedCodes = individualCodes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCodeChange = (val: string) => {
    setCode(val.toUpperCase().slice(0, PROMO_CODE_MAX_LENGTH));
    setPage(1);
  };

  const handleConfirm = () => {
    if (!code.trim()) return;
    onConfirm(code.trim().toUpperCase(), isOneToOne ? individualCodes : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col bg-card border border-border rounded-xl shadow-2xl modal-content">
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Set Promo Code</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isOneToOne ? "Suggested from your promo details — this becomes the prefix for each individual code" : "Suggested from your promo details, editable if you'd like something else"}
            </p>
          </div>
          <button onClick={onCancel} className="h-7 w-7 grid place-items-center rounded hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-1 border-b border-border shrink-0">
          <label className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Promo Code</label>
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
              className="h-9 w-9 shrink-0 grid place-items-center rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Wand2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-[10px] text-muted-foreground text-right">{PROMO_CODE_MAX_LENGTH - code.length} characters left</div>
        </div>

        {isOneToOne && (
          <div className="flex-1 overflow-y-auto">
            {code.trim() ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border sticky top-0 bg-card">
                        <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Code</th>
                        <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">#</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {pagedCodes.map((c, i) => (
                        <tr key={c.code}>
                          <td className="px-4 py-1.5">
                            <code className="font-mono text-[12px] bg-muted/60 border border-border rounded px-1.5 py-0.5">{c.code}</code>
                          </td>
                          <td className="px-4 py-1.5 text-right text-[11px] text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-border">
                  <span className="text-[11px] text-muted-foreground">{individualCodes.length} codes total (read-only, generated from max usage)</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                      className="h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors">‹</button>
                    <span className="text-[11px] text-muted-foreground px-1">{page} / {totalPages}</span>
                    <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                      className="h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors">›</button>
                  </div>
                </div>
              </>
            ) : (
              <p className="px-4 py-8 text-[13px] text-muted-foreground text-center italic">Enter a code above to preview the {maxUsage} generated codes</p>
            )}
          </div>
        )}

        <div className="p-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
          <button type="button" onClick={onCancel} className="h-9 px-4 rounded-md border border-border text-[14px] text-foreground hover:bg-muted transition-colors">
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
