import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, X as XIcon } from "lucide-react";
import { promoStore } from "@/components/scl/promo-store";

export const Route = createFileRoute("/promo-codes/new")({
  head: () => ({ meta: [{ title: "New Promo Code — SCL" }] }),
  component: NewPromoCodePage,
});

const MOCK_TEMPLATES = [
  "June Flash Sale Template",
  "Abandoned Cart Reminder",
  "VIP Welcome Series",
  "Birthday Special Message",
];

function NewPromoCodePage() {
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [codeFile, setCodeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [usageType, setUsageType] = useState<"one-to-one" | "one-to-many">("one-to-many");
  const [maxUsage, setMaxUsage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [odooId, setOdooId] = useState("");
  const [attachedTemplates, setAttachedTemplates] = useState<string[]>([]);

  const inputCls = "h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40";
  const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1";

  const toggleTemplate = (t: string) =>
    setAttachedTemplates((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const handleSave = () => {
    if (usageType === "one-to-many" && !code.trim()) {
      toast.error("Code is required for 1-to-Many promo");
      return;
    }
    if (usageType === "one-to-one" && !codeFile) {
      toast.error("Please upload a CSV file with unique codes");
      return;
    }
    if (!name.trim()) {
      toast.error("Promo Name is required");
      return;
    }
    promoStore.addPromo({
      code: usageType === "one-to-many" ? code.trim().toUpperCase() : (codeFile?.name ?? "BULK"),
      name: name.trim(),
      description: description.trim(),
      usageType,
      maxUsage: maxUsage ? Number(maxUsage) : null,
      startDate,
      endDate,
      status,
      odooId: odooId.trim(),
    });
    toast.success("Promo code created");
    navigate({ to: "/promo-codes" });
  };

  return (
    <AppShell backTo="/promo-codes" title="New Promo Code">
      <div className="max-w-2xl space-y-5">
        {/* Usage Type — moved up so code field can react */}
        <div>
          <label className={labelCls}>Usage Type</label>
          <div className="inline-flex rounded-md border border-border bg-background/40 p-0.5 gap-0.5">
            {(["one-to-many", "one-to-one"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setUsageType(t); setCode(""); setCodeFile(null); }}
                className={`px-3 h-8 text-[12px] font-medium rounded transition-colors ${usageType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t === "one-to-many" ? "1-to-Many (shared code)" : "1-to-1 (unique per customer)"}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {usageType === "one-to-many"
              ? "One code used by all recipients. Type the code below."
              : "Each recipient gets a unique code. Upload a CSV file with one code per row."}
          </p>
        </div>

        {/* Code — text input for 1-to-many, file upload for 1-to-1 */}
        {usageType === "one-to-many" ? (
          <div>
            <label className={labelCls}>Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER20"
              className={inputCls}
            />
          </div>
        ) : (
          <div>
            <label className={labelCls}>Upload Codes (CSV)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => setCodeFile(e.target.files?.[0] ?? null)}
            />
            {codeFile ? (
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-gray-200 bg-white text-sm">
                <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
                <span className="flex-1 truncate text-foreground">{codeFile.name}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">{(codeFile.size / 1024).toFixed(1)} KB</span>
                <button type="button" onClick={() => setCodeFile(null)} className="text-muted-foreground hover:text-destructive">
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 rounded-md border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors"
              >
                <Upload className="h-5 w-5" />
                <span className="text-xs font-medium">Click to upload CSV</span>
                <span className="text-[11px] text-muted-foreground/60">One unique code per row</span>
              </button>
            )}
          </div>
        )}

        {/* Promo Name */}
        <div>
          <label className={labelCls}>Promo Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer 20% Off"
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of this promo..."
            rows={3}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
          />
        </div>

        {/* Max Usage */}
        <div>
          <label className={labelCls}>Max Usage <span className="normal-case text-muted-foreground/60">(leave blank for unlimited)</span></label>
          <input
            type="number"
            value={maxUsage}
            onChange={(e) => setMaxUsage(e.target.value)}
            placeholder="e.g. 500"
            min={1}
            className={inputCls}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className={labelCls}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")} className={inputCls}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Odoo ID */}
        <div>
          <label className={labelCls}>Odoo ID</label>
          <input
            value={odooId}
            onChange={(e) => setOdooId(e.target.value)}
            placeholder="e.g. PC-2026-007"
            className={inputCls}
          />
        </div>

        {/* Attach to Templates */}
        <div className="rounded-xl border border-border bg-card/40 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Attach to Templates
          </div>
          <div className="space-y-2">
            {MOCK_TEMPLATES.map((t) => (
              <label key={t} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attachedTemplates.includes(t)}
                  onChange={() => toggleTemplate(t)}
                  className="accent-[oklch(0.62_0.17_40)] h-3.5 w-3.5"
                />
                <span className="text-sm">{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save Promo Code
          </button>
          <button
            onClick={() => navigate({ to: "/promo-codes" })}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-4 h-9 text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </AppShell>
  );
}
