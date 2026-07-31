import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, X, Wand2, Eye, Infinity as InfinityIcon } from "lucide-react";
import { PromoRuleBuilder } from "./promo-rule-builder";
import { defaultRule, type PromoRule, type PromoCode } from "./promo-store";
import { CsvCodesModal } from "./csv-codes-modal";

// ── Shared promo form — used by the Create modal, Edit modal, and the /new
// full-page flow so the field set can never drift out of sync between them. ──

export type PromoFormState = {
  code: string;
  codeFile: File | null;
  csvCodes: string[];
  name: string;
  description: string;
  usageType: "one-to-many" | "one-to-one";
  maxUsage: string;
  maxUsageUnlimited: boolean;
  startDate: string;
  endDate: string;
  rule: PromoRule;
};

export function emptyPromoForm(): PromoFormState {
  return {
    code: "",
    codeFile: null,
    csvCodes: [],
    name: "",
    description: "",
    usageType: "one-to-many",
    maxUsage: "",
    maxUsageUnlimited: true,
    startDate: "",
    endDate: "",
    rule: defaultRule(),
  };
}

export function promoFormFromExisting(promo: PromoCode): PromoFormState {
  return {
    code: promo.code,
    codeFile: null,
    csvCodes: [],
    name: promo.name,
    description: promo.description,
    usageType: promo.usageType,
    maxUsage: promo.maxUsage?.toString() ?? "",
    maxUsageUnlimited: promo.maxUsage == null,
    startDate: promo.startDate,
    endDate: promo.endDate,
    rule: promo.rule,
  };
}

export function validatePromoForm(form: PromoFormState): string | null {
  if (form.usageType === "one-to-many" && !form.code.trim()) return "Promo Code is required";
  // A CSV is only mandatory when there's no code assigned yet (brand-new 1-to-1
  // promo). Editing an existing 1-to-1 promo shouldn't force a re-upload.
  if (form.usageType === "one-to-one" && !form.codeFile && !form.code.trim()) return "Please upload a CSV file";
  if (!form.name.trim()) return "Promo Name is required";
  return null;
}

export function promoFormToPayload(form: PromoFormState): Pick<
  PromoCode,
  "code" | "name" | "description" | "rule" | "usageType" | "maxUsage" | "startDate" | "endDate"
> {
  return {
    code: form.usageType === "one-to-many"
      ? form.code.trim().toUpperCase()
      : (form.codeFile?.name || form.code.trim() || "BULK"),
    name: form.name.trim(),
    description: form.description.trim(),
    rule: form.rule,
    usageType: form.usageType,
    maxUsage: form.maxUsageUnlimited ? null : (form.maxUsage ? Number(form.maxUsage) : null),
    startDate: form.startDate,
    endDate: form.endDate,
  };
}

function generateCodeFromName(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 16);
}

async function parseCsvFile(file: File): Promise<string[]> {
  const text = await file.text();
  return text
    .split(/\r?\n/)
    .map((line) => line.split(",")[0]?.trim())
    .filter((line): line is string => !!line);
}

const inputCls = "h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";
const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1";

export function PromoFormFields({ form, setForm }: { form: PromoFormState; setForm: (f: PromoFormState) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const [viewingCsv, setViewingCsv] = useState(false);
  // Auto-sync the code from the name only until the user edits the code
  // directly — after that we stop overwriting their manual choice.
  const autoSyncCode = useRef(!form.code.trim());

  const set = <K extends keyof PromoFormState>(key: K, val: PromoFormState[K]) => setForm({ ...form, [key]: val });

  const handleNameChange = (val: string) => {
    if (autoSyncCode.current && form.usageType === "one-to-many") {
      setForm({ ...form, name: val, code: generateCodeFromName(val) });
    } else {
      set("name", val);
    }
  };

  const handleCodeChange = (val: string) => {
    autoSyncCode.current = false;
    set("code", val.toUpperCase());
  };

  const regenerateCode = () => {
    if (!form.name.trim()) { toast.error("Enter a Promo Name first"); return; }
    autoSyncCode.current = true;
    set("code", generateCodeFromName(form.name));
  };

  const handleFile = async (file: File | null) => {
    if (!file) { setForm({ ...form, codeFile: null, csvCodes: [] }); return; }
    try {
      const codes = await parseCsvFile(file);
      setForm({ ...form, codeFile: file, csvCodes: codes });
    } catch {
      toast.error("Couldn't read that CSV file");
    }
  };

  return (
    <div className="space-y-4">
      {/* Promo Name + Usage Type */}
      <div className="flex items-end gap-4">
        <div className="flex-1 min-w-0">
          <label className={labelCls}>Promo Name</label>
          <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Summer 20% Off" className={inputCls} />
        </div>
        <div className="shrink-0">
          <label className={labelCls}>Usage Type</label>
          <div className="inline-flex h-9 items-center rounded-md border border-border bg-muted/40 p-0.5 gap-0.5">
            {(["one-to-many", "one-to-one"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, usageType: t, code: "", codeFile: null, csvCodes: [] })}
                className={`px-3 h-7 text-[12px] font-medium rounded transition-colors whitespace-nowrap ${form.usageType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t === "one-to-many" ? "1-to-Many" : "1-to-1 (unique)"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Promo Code + Max Usage */}
      <div className="grid grid-cols-2 gap-4">
        {form.usageType === "one-to-many" ? (
          <div className="animate-fade-in">
            <label className={labelCls}>Promo Code</label>
            <div className="flex items-center gap-1.5">
              <input value={form.code} onChange={(e) => handleCodeChange(e.target.value)} placeholder="e.g. SUMMER20" className={inputCls} />
              <button
                type="button"
                title="Generate from name"
                onClick={regenerateCode}
                className="h-9 w-9 shrink-0 grid place-items-center rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Wand2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <label className={labelCls}>Promo Code — Upload CSV</label>
            <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            {form.codeFile ? (
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-card text-sm animate-scale-in">
                <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
                <span className="flex-1 truncate">{form.codeFile.name}</span>
                <button type="button" title="View codes" onClick={() => setViewingCsv(true)} className="text-muted-foreground hover:text-primary shrink-0">
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => handleFile(null)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-9 rounded-md border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center gap-1.5 text-muted-foreground transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="text-xs">Click to upload CSV</span>
              </button>
            )}
          </div>
        )}

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
                onChange={(e) => setForm({ ...form, maxUsageUnlimited: e.target.checked, maxUsage: e.target.checked ? "" : form.maxUsage })}
                className="accent-[oklch(0.62_0.17_40)] h-3.5 w-3.5"
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

      {viewingCsv && form.codeFile && (
        <CsvCodesModal fileName={form.codeFile.name} codes={form.csvCodes} onClose={() => setViewingCsv(false)} />
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
