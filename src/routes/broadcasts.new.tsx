import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { ChannelIcon } from "@/components/scl/channel-badge";
import { TemplatePicker } from "@/components/scl/template-picker";
import { connectedChannels, type Template } from "@/components/scl/mock-data";
import { useTemplatesStore } from "@/components/scl/templates-store";
import { useContactsStore, contactsStore } from "@/components/scl/contacts-store";
import { useSkuStore } from "@/components/scl/sku-store";

// Promo codes registry (mirrors promo-codes page + new page data)
const PROMO_REGISTRY: Record<string, { code: string; name: string; usageType: "one-to-one" | "one-to-many"; availableCodes: number }> = {
  "promo-1": { code: "AROMA20",    name: "20% Off All Brand",          usageType: "one-to-many", availableCodes: 999 },
  "promo-2": { code: "SISLEY150K", name: "Rp150.000 Off Sisley",       usageType: "one-to-one",  availableCodes: 500 },
  "promo-3": { code: "BEAUTY10",   name: "10% Off New Arrival",        usageType: "one-to-many", availableCodes: 999 },
  "promo-4": { code: "RIMMEL50K",  name: "Rimmel Rp50.000 Cashback",   usageType: "one-to-one",  availableCodes: 300 },
  "promo-5": { code: "DGVIP25",    name: "VIP D&G 25% Off",            usageType: "one-to-one",  availableCodes: 150 },
  "promo-6": { code: "BIRTHDAY30", name: "30% Birthday Gift",          usageType: "one-to-many", availableCodes: 999 },
};
import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  CalendarClock,
  Users,
  Search as SearchIcon,
  X as XIcon,
  Plus,
  Check,
  Trash2,
  Smile,
  AtSign,
  Send,
  Save,
  FileText,
  Pencil,
  ChevronRight,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/broadcasts/new")({
  head: () => ({ meta: [{ title: "Create Broadcast — SCL" }] }),
  component: CreateBroadcastPage,
});

type SendMode = "now" | "schedule";
type ContentMode = "template" | "manual";
type AudienceTab = "list" | "condition";

type Condition = {
  id: string;
  propertyKey: string;
  operator: "is" | "is_not" | "contains" | "not_empty" | "is_empty";
  value: string;
};

function CreateBroadcastPage() {
  const navigate = useNavigate();
  const { lists } = useContactsStore();
  const { templates } = useTemplatesStore();
  const { brands } = useSkuStore();
  const [varPopup, setVarPopup] = useState<"brands" | "promo" | null>(null);

  // Section 1
  const [channelId, setChannelId] = useState<string>(connectedChannels[0]?.id ?? "");
  const selectedChannel = connectedChannels.find((c) => c.id === channelId) ?? null;
  const [name, setName] = useState("");
  const [sendMode, setSendMode] = useState<SendMode>("now");
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("09:00");

  // Audience
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [audienceTab, setAudienceTab] = useState<AudienceTab>("list");
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [conditions, setConditions] = useState<Condition[]>([]);

  // Content
  const [contentMode, setContentMode] = useState<ContentMode>("template");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const template = templates.find((t) => t.id === templateId) ?? null;
  const [manualBody, setManualBody] = useState("");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const channelKind = selectedChannel?.channel ?? "whatsapp";

  const previewBody = contentMode === "template" ? template?.body ?? "" : manualBody;

  const valid =
    !!selectedChannel &&
    name.trim().length > 0 &&
    (selectedLists.size > 0 || conditions.length > 0) &&
    previewBody.trim().length > 0 &&
    (sendMode === "now" || (!!scheduleDate && !!scheduleTime));

  const insertVariable = (key: string) => {
    const token = `{{${key}}}`;
    setContentMode("manual");
    const el = textareaRef.current;
    if (!el) {
      setManualBody((b) => b + token);
      return;
    }
    const start = el.selectionStart ?? manualBody.length;
    const end = el.selectionEnd ?? manualBody.length;
    const next = manualBody.slice(0, start) + token + manualBody.slice(end);
    setManualBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const insertBrand = (brandName: string) => {
    insertVariable(`brands-${brandName}`);
    setVarPopup(null);
  };

  const insertPromo = (code: string) => {
    insertVariable(`promo-${code}`);
    setVarPopup(null);
  };

  const submit = (kind: "draft" | "send" | "schedule") => {
    if (kind !== "draft" && !valid) {
      toast.error("Please complete all required fields");
      return;
    }
    if (kind !== "draft" && promoValidation && !promoValidation.ok) {
      toast.error(`Not enough promo codes: ${promoValidation.available} available, ${promoValidation.audienceCount} recipients`);
      return;
    }
    const label =
      kind === "draft"
        ? "Draft saved"
        : kind === "schedule"
        ? `Broadcast scheduled for ${scheduleDate} ${scheduleTime}`
        : "Broadcast sent";
    toast.success(label);
    navigate({ to: "/broadcasts" });
  };

  const audienceSummary = useMemo(() => {
    const listNames = lists.filter((l) => selectedLists.has(l.id)).map((l) => l.name);
    if (listNames.length === 0 && conditions.length === 0) return null;
    return { listNames, conditionCount: conditions.length };
  }, [lists, selectedLists, conditions]);

  // Promo code validation
  const promoValidation = useMemo(() => {
    if (contentMode !== "template" || !template?.promoCodeId) return null;
    const promo = PROMO_REGISTRY[template.promoCodeId];
    if (!promo || promo.usageType !== "one-to-one") return null;
    // Count unique contacts across selected lists
    const allContacts = contactsStore.state.contacts;
    const contactIds = new Set<string>();
    allContacts.forEach(c => {
      if (c.listIds.some(lid => selectedLists.has(lid))) contactIds.add(c.id);
    });
    const audienceCount = contactIds.size;
    const available = promo.availableCodes;
    if (audienceCount === 0) return null;
    const ok = available >= audienceCount;
    return { promo, audienceCount, available, ok };
  }, [contentMode, template, selectedLists]);

  return (
    <AppShell backTo="/broadcasts">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Add New Broadcast</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left — form */}
        <div className="space-y-6">
          {/* Section 1 — Settings */}
          <FormCard
            step={1}
            title="WhatsApp broadcast settings"
            description="Pick the channel, name the campaign and decide when to send."
          >
            <Field label="Channel" required>
              <ChannelDropdown value={channelId} onChange={setChannelId} />
            </Field>

            <Field label="Broadcast name" required hint="For internal reference only.">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Winter Drop — VIP Early Access"
                className="w-full h-10 rounded-md border border-border bg-background/40 px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </Field>

            <Field label="Broadcast time" required>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <RadioCard
                    selected={sendMode === "now"}
                    onClick={() => setSendMode("now")}
                    title="Send now"
                    desc="Broadcast goes out immediately"
                    icon={<Send className="h-3.5 w-3.5" />}
                  />
                  <RadioCard
                    selected={sendMode === "schedule"}
                    onClick={() => setSendMode("schedule")}
                    title="Schedule"
                    desc="Pick a date and time"
                    icon={<CalendarClock className="h-3.5 w-3.5" />}
                  />
                </div>
                {sendMode === "schedule" && (
                  <div className="rounded-lg border border-border bg-background/30 p-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1">Date</div>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full h-9 rounded-md border border-border bg-background/40 px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1">Time</div>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full h-9 rounded-md border border-border bg-background/40 px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground pb-2 sm:pb-2.5">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </div>
                  </div>
                )}
              </div>
            </Field>

            <Field label="Audience" required>
              {audienceSummary ? (
                <div className="rounded-lg border border-border bg-background/30 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[12px] text-foreground/90 space-y-1">
                      {audienceSummary.listNames.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {audienceSummary.listNames.map((n) => (
                            <span
                              key={n}
                              className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                            >
                              <Users className="h-3 w-3 mr-1" /> {n}
                            </span>
                          ))}
                        </div>
                      )}
                      {audienceSummary.conditionCount > 0 && (
                        <div className="text-[11px] text-muted-foreground">
                          {audienceSummary.conditionCount} condition{audienceSummary.conditionCount === 1 ? "" : "s"} applied
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setAudienceOpen(true)}
                      className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAudienceOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 px-3 h-10 text-xs font-medium text-muted-foreground hover:text-primary transition"
                >
                  <Users className="h-3.5 w-3.5" /> Choose Audience
                </button>
              )}
            </Field>
          </FormCard>

          {/* Section 2 — Content */}
          <FormCard step={2} title="Content" description="Pick a pre-approved template or compose a manual message.">
            <div className="inline-flex rounded-md border border-border bg-background/40 p-1">
              {(["template", "manual"] as const).map((m) => {
                const sel = contentMode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setContentMode(m)}
                    className={`px-3 h-7 text-[12px] font-medium rounded ${
                      sel ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "template" ? "Template" : "Manual"}
                  </button>
                );
              })}
            </div>

            {contentMode === "template" ? (
              <div className="space-y-3">
                {template ? (
                  <TemplateSummary
                    template={template}
                    onChange={() => setTemplatePickerOpen(true)}
                    onClear={() => setTemplateId(null)}
                  />
                ) : (
                  <button
                    onClick={() => setTemplatePickerOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 px-3 h-10 text-xs font-medium text-muted-foreground hover:text-primary transition"
                  >
                    <FileText className="h-3.5 w-3.5" /> Choose Template
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  ref={textareaRef}
                  value={manualBody}
                  onChange={(e) => setManualBody(e.target.value)}
                  placeholder={`Write your ${channelKind} message…`}
                  className="w-full min-h-[140px] rounded-md border border-border bg-background/40 p-3 text-[13px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary/40 resize-y"
                />
                <div className="flex flex-wrap items-center gap-1.5 relative">
                  <button
                    onClick={() => setManualBody((b) => b + " 🎉")}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 hover:bg-gray-50 px-2 h-7 text-[11px] text-muted-foreground"
                  >
                    <Smile className="h-3 w-3" /> Emoji
                  </button>
                  {/* Name — direct insert */}
                  <button
                    onClick={() => insertVariable("name")}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 hover:bg-gray-50 px-2 h-7 text-[11px] text-muted-foreground"
                  >
                    <AtSign className="h-3 w-3" /> Name
                  </button>
                  {/* Brands — popup */}
                  <div className="relative">
                    <button
                      onClick={() => setVarPopup(varPopup === "brands" ? null : "brands")}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 hover:bg-gray-50 px-2 h-7 text-[11px] text-muted-foreground"
                    >
                      <AtSign className="h-3 w-3" /> Brands <ChevronRight className="h-2.5 w-2.5 ml-0.5" />
                    </button>
                    {varPopup === "brands" && (
                      <div className="absolute top-full left-0 mt-1 w-52 rounded-lg border border-border bg-popover shadow-xl z-30 overflow-hidden animate-fade-in">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Select Brand</span>
                          <button onClick={() => setVarPopup(null)} className="h-5 w-5 grid place-items-center rounded text-muted-foreground hover:text-foreground"><XIcon className="h-3 w-3" /></button>
                        </div>
                        <div className="max-h-44 overflow-y-auto py-1">
                          {brands.map((b) => (
                            <button key={b.id} onClick={() => insertBrand(b.name)}
                              className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-colors flex items-center gap-2">
                              <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{b.name}</span>
                              <code className="ml-auto text-[10px] text-muted-foreground/60 font-mono truncate">{"{{brands-" + b.name + "}}"}</code>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Promo Code — popup */}
                  <div className="relative">
                    <button
                      onClick={() => setVarPopup(varPopup === "promo" ? null : "promo")}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 hover:bg-gray-50 px-2 h-7 text-[11px] text-muted-foreground"
                    >
                      <AtSign className="h-3 w-3" /> Promo Code <ChevronRight className="h-2.5 w-2.5 ml-0.5" />
                    </button>
                    {varPopup === "promo" && (
                      <div className="absolute top-full left-0 mt-1 w-60 rounded-lg border border-border bg-popover shadow-xl z-30 overflow-hidden animate-fade-in">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Select Promo Code</span>
                          <button onClick={() => setVarPopup(null)} className="h-5 w-5 grid place-items-center rounded text-muted-foreground hover:text-foreground"><XIcon className="h-3 w-3" /></button>
                        </div>
                        <div className="max-h-44 overflow-y-auto py-1">
                          {Object.values(PROMO_REGISTRY).map((p) => (
                            <button key={p.code} onClick={() => insertPromo(p.code)}
                              className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-colors flex items-center gap-2">
                              <span className="font-mono text-[10px] font-semibold bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 shrink-0">{p.code}</span>
                              <span className="truncate text-muted-foreground">{p.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </FormCard>

          {/* Promo code validation banner */}
          {promoValidation && (
            <div className={`rounded-lg border px-4 py-3 text-[12px] flex items-start gap-3 ${promoValidation.ok ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-700" : "border-rose-500/30 bg-rose-500/8 text-rose-700"}`}>
              <span className="text-lg leading-none">{promoValidation.ok ? "✓" : "⚠"}</span>
              <div>
                <div className="font-semibold mb-0.5">
                  {promoValidation.ok ? "Promo codes available" : "Not enough promo codes"}
                </div>
                <div className="text-[11px] opacity-80">
                  Template uses <span className="font-mono font-semibold">{promoValidation.promo.code}</span> (1-to-1).{" "}
                  {promoValidation.available} codes available · {promoValidation.audienceCount} recipients selected.
                  {!promoValidation.ok && ` You need ${promoValidation.audienceCount - promoValidation.available} more unique codes.`}
                </div>
              </div>
            </div>
          )}

          {/* Save actions */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => submit("draft")}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 hover:bg-card px-3 h-9 text-xs font-medium text-foreground"
            >
              <Save className="h-3.5 w-3.5" /> Save draft
            </button>
            {sendMode === "schedule" ? (
              <button
                onClick={() => submit("schedule")}
                disabled={!valid || (promoValidation !== null && !promoValidation.ok)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CalendarClock className="h-3.5 w-3.5" /> Schedule broadcast
              </button>
            ) : (
              <button
                onClick={() => submit("send")}
                disabled={!valid || (promoValidation !== null && !promoValidation.ok)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" /> Send broadcast
              </button>
            )}
          </div>
        </div>

        {/* Right — sticky preview */}
        <div className="lg:sticky lg:top-6">
          <div className="rounded-xl border border-border bg-card/60 glass overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ChannelIcon channel={channelKind} className="h-4 w-4" />
                <span className="text-sm font-medium">Live preview</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                WhatsApp
              </span>
            </div>
            <div className="p-5 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent)]">
              <PhoneFrame channel={channelKind} senderName={selectedChannel?.name ?? "Your business"}>
                {previewBody.trim() ? (
                  <div className="whitespace-pre-wrap break-words">{renderWithVars(previewBody)}</div>
                ) : (
                  <div className="text-muted-foreground italic">Message preview will appear here…</div>
                )}
              </PhoneFrame>
            </div>
            <div className="px-4 py-3 border-t border-border text-[11px] text-muted-foreground">
              {name ? <span className="font-medium text-foreground">{name}</span> : "Untitled broadcast"}
              {" · "}
              {audienceSummary
                ? `${audienceSummary.listNames.length} audience${audienceSummary.listNames.length === 1 ? "" : "s"}${
                    audienceSummary.conditionCount ? ` · ${audienceSummary.conditionCount} condition(s)` : ""
                  }`
                : "No audience selected"}
            </div>
          </div>
        </div>
      </div>

      {/* Audience modal */}
      {audienceOpen && (
        <AudienceModal
          tab={audienceTab}
          onTabChange={setAudienceTab}
          selectedLists={selectedLists}
          setSelectedLists={setSelectedLists}
          conditions={conditions}
          setConditions={setConditions}
          onClose={() => setAudienceOpen(false)}
        />
      )}

      <TemplatePicker
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onInsert={(body, tpl) => {
          if (tpl) {
            setTemplateId(tpl.id);
            setContentMode("template");
          } else {
            setContentMode("manual");
            setManualBody(body);
          }
        }}
      />
    </AppShell>
  );
}

/* ----------------------------- Sub-components ----------------------------- */

function FormCard({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 glass">
      <div className="flex items-start gap-3 px-5 py-4 border-b border-border">
        <div className="h-6 w-6 rounded-full bg-primary/15 text-primary text-[11px] font-semibold grid place-items-center border border-primary/30">
          {step}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-medium">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-medium text-muted-foreground">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </div>
      {children}
      {hint && <div className="text-[10px] text-muted-foreground/70">{hint}</div>}
    </div>
  );
}

function RadioCard({
  selected,
  onClick,
  title,
  desc,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 text-left rounded-lg border p-3 transition ${
        selected ? "border-primary/40 bg-primary/10" : "border-border bg-background/30 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-3.5 w-3.5 rounded-full border ${
            selected ? "border-primary bg-primary" : "border-muted-foreground/50"
          } grid place-items-center`}
        >
          {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium">
          {icon}
          {title}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1 ml-5">{desc}</p>
    </button>
  );
}

function ChannelDropdown({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = connectedChannels.find((c) => c.id === value);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full inline-flex items-center justify-between gap-2 rounded-md border border-border bg-background/40 hover:bg-gray-50 px-3 h-10 text-[13px]"
      >
        {selected ? (
          <span className="inline-flex items-center gap-2">
            <ChannelIcon channel={selected.channel} className="h-4 w-4" />
            <span className="font-medium">{selected.name}</span>
            <span className="text-muted-foreground text-[11px]">{selected.handle}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Select a connected channel…</span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 mt-1 w-full rounded-md border border-border bg-popover shadow-lg overflow-hidden">
            {connectedChannels.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-gray-50 ${
                  value === c.id ? "bg-primary/10" : ""
                }`}
              >
                <ChannelIcon channel={c.channel} className="h-4 w-4" />
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground text-[11px] ml-auto">{c.handle}</span>
                {value === c.id && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TemplateSummary({
  template,
  onChange,
  onClear,
}: {
  template: Template;
  onChange: () => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ChannelIcon channel={template.channel} className="h-4 w-4" />
            <span className="text-[13px] font-medium truncate">{template.name}</span>
            <span className="text-[10px] text-muted-foreground rounded-full border border-border px-1.5 py-0.5">
              {template.category}
            </span>
          </div>
          <p className="mt-1.5 text-[12px] text-muted-foreground line-clamp-3">{template.body}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onChange}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 hover:bg-card px-2 h-7 text-[11px]"
          >
            <Pencil className="h-3 w-3" /> Change
          </button>
          <button
            onClick={onClear}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-destructive"
            aria-label="Clear template"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function VariablePicker({
  properties,
  onPick,
}: {
  properties: { key: string; name: string }[];
  onPick: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 hover:bg-gray-50 px-2 h-7 text-[11px] text-muted-foreground"
      >
        <AtSign className="h-3 w-3" /> Insert variable
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 mt-1 w-56 max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
            {properties.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  onPick(p.key);
                  setOpen(false);
                }}
                className="w-full text-left flex items-center justify-between gap-2 px-3 py-1.5 text-[12px] hover:bg-gray-50"
              >
                <span>{p.name}</span>
                <code className="text-[10px] text-primary">{`{{${p.key}}}`}</code>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PhoneFrame({
  channel,
  senderName,
  children,
}: {
  channel: "whatsapp" | "instagram";
  senderName: string;
  children: React.ReactNode;
}) {
  const isWa = channel === "whatsapp";
  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[28px] border border-border bg-background/60 p-3 shadow-xl">
      <div className="rounded-[20px] bg-background overflow-hidden">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <ChannelIcon channel={channel} className="h-5 w-5" />
          <div className="min-w-0">
            <div className="text-[12px] font-semibold truncate">{senderName}</div>
            <div className="text-[10px] text-muted-foreground">{"WhatsApp Business"}</div>
          </div>
        </div>
        <div className="min-h-[180px] p-3 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]">
          <div
            className={`max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-[12px] leading-relaxed ${
              isWa
                ? "bg-emerald-500/15 border border-emerald-500/20 text-foreground"
                : "bg-pink-500/10 border border-pink-500/20 text-foreground"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderWithVars(body: string) {
  const parts = body.split(/(\{\{[^}]+\}\})/g);
  return parts.map((p, i) =>
    /^\{\{[^}]+\}\}$/.test(p) ? (
      <span key={i} className="rounded bg-primary/15 px-1 py-0.5 text-primary font-medium">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

/* -------------------------------- Audience -------------------------------- */

function AudienceModal({
  tab,
  onTabChange,
  selectedLists,
  setSelectedLists,
  conditions,
  setConditions,
  onClose,
}: {
  tab: AudienceTab;
  onTabChange: (t: AudienceTab) => void;
  selectedLists: Set<string>;
  setSelectedLists: (s: Set<string>) => void;
  conditions: Condition[];
  setConditions: (c: Condition[]) => void;
  onClose: () => void;
}) {
  const { lists, properties } = useContactsStore();
  const [query, setQuery] = useState("");
  const [localLists, setLocalLists] = useState<Set<string>>(new Set(selectedLists));
  const [localConds, setLocalConds] = useState<Condition[]>(conditions);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lists;
    return lists.filter((l) => l.name.toLowerCase().includes(q));
  }, [lists, query]);

  const toggleList = (id: string) => {
    const next = new Set(localLists);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setLocalLists(next);
  };

  const addCondition = () => {
    const first = properties[0];
    if (!first) return;
    setLocalConds([
      ...localConds,
      { id: `cd-${Date.now()}`, propertyKey: first.key, operator: "is", value: "" },
    ]);
  };

  const updateCondition = (id: string, patch: Partial<Condition>) => {
    setLocalConds(localConds.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeCondition = (id: string) => {
    setLocalConds(localConds.filter((c) => c.id !== id));
  };

  const confirm = () => {
    setSelectedLists(localLists);
    setConditions(localConds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[88vh] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Choose Audience</h2>
          </div>
          <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-3 border-b border-border">
          <div className="inline-flex rounded-md border border-border bg-background/40 p-1">
            {(["list", "condition"] as const).map((t) => {
              const sel = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => onTabChange(t)}
                  className={`px-3 h-7 text-[12px] font-medium rounded ${
                    sel ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "list" ? "By Audience" : "By Condition"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          {tab === "list" ? (
            <div className="space-y-3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search audience…"
                  className="w-full h-9 rounded-md border border-border bg-background/40 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <div className="rounded-lg border border-border divide-y divide-border">
                {filtered.map((l) => {
                  const sel = localLists.has(l.id);
                  return (
                    <label
                      key={l.id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer ${
                        sel ? "bg-primary/5" : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => toggleList(l.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium truncate">{l.name}</div>
                        {l.description && (
                          <div className="text-[11px] text-muted-foreground truncate">{l.description}</div>
                        )}
                      </div>
                    </label>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="px-3 py-8 text-center text-xs text-muted-foreground">No audience match.</div>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {localLists.size} audience{localLists.size === 1 ? "" : "s"} selected
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Build an audience using your contact properties. New properties added in Contacts appear here automatically.
              </p>
              <div className="space-y-2">
                {localConds.map((c) => (
                  <div key={c.id} className="grid grid-cols-[1fr_140px_1fr_auto] gap-2 items-center">
                    <select
                      value={c.propertyKey}
                      onChange={(e) => updateCondition(c.id, { propertyKey: e.target.value })}
                      className="h-9 rounded-md border border-border bg-background/40 px-2 text-[12px]"
                    >
                      {properties.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={c.operator}
                      onChange={(e) => updateCondition(c.id, { operator: e.target.value as Condition["operator"] })}
                      className="h-9 rounded-md border border-border bg-background/40 px-2 text-[12px]"
                    >
                      <option value="is">is</option>
                      <option value="is_not">is not</option>
                      <option value="contains">contains</option>
                      <option value="not_empty">is not empty</option>
                      <option value="is_empty">is empty</option>
                    </select>
                    <input
                      value={c.value}
                      onChange={(e) => updateCondition(c.id, { value: e.target.value })}
                      disabled={c.operator === "not_empty" || c.operator === "is_empty"}
                      placeholder="Value"
                      className="h-9 rounded-md border border-border bg-background/40 px-2 text-[12px] disabled:opacity-40"
                    />
                    <button
                      onClick={() => removeCondition(c.id)}
                      className="h-9 w-9 grid place-items-center rounded-md border border-border bg-background/40 hover:text-destructive"
                      aria-label="Remove condition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addCondition}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 px-3 h-8 text-[12px] text-muted-foreground hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> Add condition
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <div className="text-[11px] text-muted-foreground">
            {tab === "list"
              ? `${localLists.size} audience(s) selected`
              : `${localConds.length} condition(s) defined`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 hover:bg-card px-3 h-8 text-[12px]"
            >
              Cancel
            </button>
            <button
              onClick={confirm}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 h-8 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Check className="h-3.5 w-3.5" /> Apply audience
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}