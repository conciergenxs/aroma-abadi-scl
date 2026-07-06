import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { useState } from "react";
import { toast } from "sonner";

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [usageType, setUsageType] = useState<"one-to-one" | "one-to-many">("one-to-many");
  const [maxUsage, setMaxUsage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [odooId, setOdooId] = useState("");
  const [attachedTemplates, setAttachedTemplates] = useState<string[]>([]);

  const inputCls = "h-9 w-full rounded-md border border-border bg-[oklch(0.17_0_0)] px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40";
  const labelCls = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1";

  const toggleTemplate = (t: string) =>
    setAttachedTemplates((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const handleSave = () => {
    if (!code.trim() || !name.trim()) {
      toast.error("Code and Promo Name are required");
      return;
    }
    toast.success("Promo code created");
    navigate({ to: "/promo-codes" });
  };

  return (
    <AppShell backTo="/promo-codes" title="New Promo Code">
      <div className="max-w-2xl space-y-5">
        {/* Code */}
        <div>
          <label className={labelCls}>Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SUMMER20"
            className={inputCls}
          />
        </div>

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
            className="w-full rounded-md border border-border bg-[oklch(0.17_0_0)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
          />
        </div>

        {/* Usage Type */}
        <div>
          <label className={labelCls}>Usage Type</label>
          <select
            value={usageType}
            onChange={(e) => setUsageType(e.target.value as "one-to-one" | "one-to-many")}
            className={inputCls}
          >
            <option value="one-to-many">1-to-Many (shared code)</option>
            <option value="one-to-one">1-to-1 (unique per customer)</option>
          </select>
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
