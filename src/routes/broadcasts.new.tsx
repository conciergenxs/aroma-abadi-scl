import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { ChannelIcon } from "@/components/scl/channel-badge";
import { TemplatePicker } from "@/components/scl/template-picker";
import { connectedChannels, type Template, type Broadcast } from "@/components/scl/mock-data";
import { useTemplatesStore } from "@/components/scl/templates-store";
import { useLiveContacts, useContactsStore } from "@/components/scl/contacts-store";
import { fmtNum } from "@/lib/fmt";
import { useSkuStore } from "@/components/scl/sku-store";
import { broadcastsStore } from "@/components/scl/broadcasts-store";
import {
  usePromoStore,
  promoStore,
  defaultCodeFormat,
  fillCodeFormat,
  getPromoStatus,
} from "@/components/scl/promo-store";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { useEscapeKey } from "@/lib/use-escape-key";

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
  // Never message somebody who has been moved to Recently Deleted.
  const contacts = useLiveContacts();
  const { templates } = useTemplatesStore();
  const { brands } = useSkuStore();
  const { promos } = usePromoStore();
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
  /** Hand-edited recipient codes, keyed by contact id. */
  const [codeOverrides, setCodeOverrides] = useState<Record<string, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const channelKind = selectedChannel?.channel ?? "whatsapp";

  const previewBody = contentMode === "template" ? (template?.body ?? "") : manualBody;

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
    if (kind !== "draft" && blocker) {
      toast.error(blocker);
      return;
    }
    if (kind !== "draft" && linkedPromo && (duplicateCodes.size > 0 || codeProblems > 0)) {
      toast.error(
        blankCodes > 0
          ? "Every recipient needs a promo code"
          : conflictingCodes > 0
            ? "Some codes are already used by another active code"
            : "Every recipient needs a unique promo code",
      );
      return;
    }

    // Reach = unique contacts across the selected lists. Condition-based
    // audiences aren't matched here (no shared condition-evaluator exists
    // yet), so we're honest about that in the label rather than guessing.
    const listContactIds = new Set<string>();
    contacts.forEach((c) => {
      if (c.listIds.some((lid) => selectedLists.has(lid))) listContactIds.add(c.id);
    });
    const reach = listContactIds.size;
    const audienceLabel = audienceSummary
      ? audienceSummary.listNames.length > 0
        ? `${audienceSummary.listNames.join(", ")} · ${fmtNum(reach)}`
        : `Custom filter (${audienceSummary.conditionCount} condition${audienceSummary.conditionCount === 1 ? "" : "s"})`
      : "—";

    const status: Broadcast["status"] =
      kind === "draft" ? "Draft" : kind === "schedule" ? "Scheduled" : "Sent";
    const now = new Date();
    const nowLabel = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const id = `b-${now.getTime()}`;
    const recipientCodes = linkedPromo
      ? recipients.map((c) => ({ contactId: c.id, contactName: c.name, code: codeFor(c.id) }))
      : [];

    broadcastsStore.add({
      id,
      name: name.trim() || "Untitled broadcast",
      channel: channelKind,
      audience: audienceLabel,
      reach,
      delivered: status === "Sent" ? reach : 0,
      read: 0,
      clicks: 0,
      sentAt:
        status === "Sent"
          ? `Today · ${nowLabel}`
          : status === "Scheduled"
            ? `${scheduleDate} · ${scheduleTime}`
            : "—",
      sentAtDate: status === "Sent" ? now.toISOString().slice(0, 10) : undefined,
      status,
      channelId,
      listIds: Array.from(selectedLists),
      // Saved so reopening a draft brings its filter back instead of a blank
      // audience; the lists above are what actually decide who receives it.
      conditions: conditions.length ? conditions : undefined,
      totalAudience: reach,
      sendMode,
      scheduleDate: sendMode === "schedule" ? scheduleDate : undefined,
      scheduleTime: sendMode === "schedule" ? scheduleTime : undefined,
      createdBy: "Aria Kapoor",
      createdAt: `Today · ${nowLabel}`,
      contentMode,
      templateId: templateId ?? undefined,
      promoCodeId: linkedPromo?.id,
      // Kept for a scheduled send too, so the codes the user set aren't lost;
      // they are only handed out (written onto the promo) once it is sent.
      recipientCodes: status !== "Draft" && recipientCodes.length ? recipientCodes : undefined,
      body: previewBody,
      replied: 0,
      failed: 0,
    });

    // Codes only exist once they've actually gone out — a draft or a schedule
    // hasn't handed anything to anyone yet.
    if (linkedPromo && status === "Sent" && recipientCodes.length) {
      promoStore.assignCodesFromBroadcast(
        linkedPromo.id,
        { id, name: name.trim() || "Untitled broadcast", sentAt: now.toISOString() },
        recipientCodes,
      );
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

  // ── 1-to-1 promo codes ────────────────────────────────────────────────────
  // A 1-to-1 promo doesn't know its own recipients: the template names the
  // promo, and this is where we decide who gets it. Every recipient's code is
  // minted from the promo's format, with the #### slot filled by their
  // initials — and made unique if two people share initials.
  // The message itself — template or manual — says which promo goes out, so
  // calling a 1-to-1 code by hand works exactly like picking a template.
  const linkedPromo = useMemo(() => {
    const codes = [...previewBody.matchAll(/\{\{promo-([^}]+)\}\}/g)].map((m) => m[1].trim());
    for (const code of codes) {
      const promo = promos.find((p) => p.code.toUpperCase() === code.toUpperCase());
      if (promo?.usageType === "one-to-one") return promo;
    }
    return null;
  }, [previewBody, promos]);

  const recipients = useMemo(() => {
    if (!linkedPromo) return [];
    return contacts.filter((c) => c.listIds.some((lid) => selectedLists.has(lid)));
  }, [linkedPromo, contacts, selectedLists]);

  const generatedCodes = useMemo(() => {
    if (!linkedPromo) return new Map<string, string>();
    const format = linkedPromo.codeFormat ?? defaultCodeFormat(linkedPromo.code);
    const used = new Set<string>();
    const out = new Map<string, string>();
    recipients.forEach((c) => {
      const base = fillCodeFormat(format, c.name);
      let code = base;
      // Two "Putri Anggraini"-shaped names would otherwise collide on PUAN.
      for (let n = 2; used.has(code); n += 1) code = `${base}${n}`;
      used.add(code);
      out.set(c.id, code);
    });
    return out;
  }, [linkedPromo, recipients]);

  const codeFor = (contactId: string) =>
    codeOverrides[contactId] ?? generatedCodes.get(contactId) ?? "";

  // Hand-edited codes belong to the promo they were typed for — switching to a
  // template with a different promo must not carry them across.
  useEffect(() => setCodeOverrides({}), [linkedPromo?.id]);

  const blankCodes = recipients.filter((c) => !codeFor(c.id).trim()).length;

  // A code can be anything, as long as nothing else live answers to it: other
  // active promos, codes already issued elsewhere, or a customer's referral
  // code. Codes this broadcast is about to re-issue to the same people don't
  // count against it.
  const activeCodeOwners = useMemo(() => {
    const recipientIds = new Set(recipients.map((c) => c.id));
    const owners = new Map<string, string>();
    promos.forEach((p) => {
      if (getPromoStatus(p) !== "active") return;
      if (p.usageType === "one-to-many") owners.set(p.code.toUpperCase(), `promo ${p.code}`);
      (p.assignedCodes ?? []).forEach((a) => {
        if (p.id === linkedPromo?.id && a.contactId && recipientIds.has(a.contactId)) return;
        owners.set(a.code.toUpperCase(), `promo ${p.code}`);
      });
    });
    contacts.forEach((c) => {
      if (c.referralCode) owners.set(c.referralCode.toUpperCase(), `${c.name}'s referral code`);
    });
    return owners;
  }, [promos, contacts, recipients, linkedPromo]);

  const conflictFor = (contactId: string) =>
    activeCodeOwners.get(codeFor(contactId).trim().toUpperCase());
  const conflictingCodes = recipients.filter((c) => !!conflictFor(c.id)).length;

  // Recipient table — searchable and paged, since an audience can be large.
  const [codeQuery, setCodeQuery] = useState("");
  const [codePage, setCodePage] = useState(1);
  const [codePageSize, setCodePageSize] = useState(10);
  const matchingRecipients = useMemo(() => {
    const q = codeQuery.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (codeOverrides[c.id] ?? generatedCodes.get(c.id) ?? "").toLowerCase().includes(q),
    );
  }, [recipients, codeQuery, codeOverrides, generatedCodes]);
  const codeTotalPages = Math.max(1, Math.ceil(matchingRecipients.length / codePageSize));
  const safeCodePage = Math.min(codePage, codeTotalPages);
  const pagedRecipients = matchingRecipients.slice(
    (safeCodePage - 1) * codePageSize,
    safeCodePage * codePageSize,
  );

  const codeProblems = blankCodes + conflictingCodes;

  const duplicateCodes = useMemo(() => {
    const seen = new Map<string, number>();
    recipients.forEach((c) => {
      const code = codeFor(c.id).trim().toUpperCase();
      if (code) seen.set(code, (seen.get(code) ?? 0) + 1);
    });
    return new Set([...seen].filter(([, n]) => n > 1).map(([code]) => code));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipients, generatedCodes, codeOverrides]);

  // What still stands between this draft and a send — named, so the disabled
  // button can say why instead of just sitting there greyed out.
  const blocker = !selectedChannel
    ? "Pick the WhatsApp number this goes out from"
    : name.trim().length === 0
      ? "Give the broadcast a name"
      : previewBody.trim().length === 0
        ? "Write the message, or pick a template"
        : selectedLists.size === 0
          ? // Conditions narrow an audience but can't produce one on their own
            // yet — without a list there is nobody to send to.
            conditions.length > 0
            ? "Conditions refine an audience — pick at least one list to send to"
            : "Choose who this goes to"
          : sendMode === "schedule" && (!scheduleDate || !scheduleTime)
            ? "Set the date and time to send"
            : linkedPromo && blankCodes > 0
              ? "Every recipient needs a promo code"
              : linkedPromo && conflictingCodes > 0
                ? "Some codes clash with another code that is active right now"
                : linkedPromo && duplicateCodes.size > 0
                  ? "Two recipients have been given the same code"
                  : null;
  const valid = !blocker;

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
                  <div className="animate-fade-in rounded-lg border border-border bg-background/30 p-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
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
                          {audienceSummary.conditionCount} condition
                          {audienceSummary.conditionCount === 1 ? "" : "s"} applied
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setAudienceOpen(true)}
                      className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 transition-colors duration-150"
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
          <FormCard
            step={2}
            title="Content"
            description="Pick a pre-approved template or compose a manual message."
          >
            <div className="inline-flex rounded-md border border-border bg-background/40 p-1">
              {(["template", "manual"] as const).map((m) => {
                const sel = contentMode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setContentMode(m)}
                    className={`px-3 h-7 text-[12px] font-medium rounded ${
                      sel
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
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
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 hover:bg-gray-50 px-2 h-7 text-[11px] text-muted-foreground transition-colors duration-150"
                  >
                    <Smile className="h-3 w-3" /> Emoji
                  </button>
                  {/* Name — direct insert */}
                  <button
                    onClick={() => insertVariable("name")}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 hover:bg-gray-50 px-2 h-7 text-[11px] text-muted-foreground transition-colors duration-150"
                  >
                    <AtSign className="h-3 w-3" /> Name
                  </button>
                  {/* Brands — popup */}
                  <div className="relative">
                    <button
                      onClick={() => setVarPopup(varPopup === "brands" ? null : "brands")}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 hover:bg-gray-50 px-2 h-7 text-[11px] text-muted-foreground transition-colors duration-150"
                    >
                      <AtSign className="h-3 w-3" /> Brands{" "}
                      <ChevronRight className="h-2.5 w-2.5 ml-0.5" />
                    </button>
                    {varPopup === "brands" && (
                      <div className="absolute top-full left-0 mt-1 w-52 rounded-lg border border-border bg-popover shadow-xl z-30 overflow-hidden animate-fade-in">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Select Brand
                          </span>
                          <button
                            onClick={() => setVarPopup(null)}
                            className="tap h-5 w-5 grid place-items-center rounded text-muted-foreground hover:text-foreground transition-colors duration-150"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="max-h-44 overflow-y-auto py-1">
                          {brands.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => insertBrand(b.name)}
                              className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{b.name}</span>
                              <code className="ml-auto text-[10px] text-muted-foreground/60 font-mono truncate">
                                {"{{brands-" + b.name + "}}"}
                              </code>
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
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 hover:bg-gray-50 px-2 h-7 text-[11px] text-muted-foreground transition-colors duration-150"
                    >
                      <AtSign className="h-3 w-3" /> Promo Code{" "}
                      <ChevronRight className="h-2.5 w-2.5 ml-0.5" />
                    </button>
                    {varPopup === "promo" && (
                      <div className="absolute top-full left-0 mt-1 w-60 rounded-lg border border-border bg-popover shadow-xl z-30 overflow-hidden animate-fade-in">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Select Promo Code
                          </span>
                          <button
                            onClick={() => setVarPopup(null)}
                            className="tap h-5 w-5 grid place-items-center rounded text-muted-foreground hover:text-foreground transition-colors duration-150"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="max-h-44 overflow-y-auto py-1">
                          {promos.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => insertPromo(p.code)}
                              className="w-full text-left px-3 py-2 text-[12px] hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              <span className="font-mono text-[10px] font-semibold bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 shrink-0">
                                {p.code}
                              </span>
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

          {/* Section 3 — one unique promo code per recipient */}
          {linkedPromo && (
            <div key={linkedPromo.id} className="animate-slide-up">
              <FormCard
                step={3}
                title="Promo codes for each recipient"
                description="Each code defaults to the promo in your message, with #### replaced by the recipient's initials. Change any code to whatever you like, as long as no other active code uses it."
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground">
                  <span>
                    Promo{" "}
                    <Link
                      to="/promo-codes/$promoId"
                      params={{ promoId: linkedPromo.id }}
                      className="font-mono font-semibold text-primary hover:underline"
                    >
                      {linkedPromo.code}
                    </Link>
                  </span>
                  <span>
                    Default{" "}
                    <span className="font-mono text-foreground">
                      {linkedPromo.codeFormat ?? defaultCodeFormat(linkedPromo.code)}
                    </span>
                  </span>
                  <span>
                    {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
                  </span>
                  {Object.keys(codeOverrides).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCodeOverrides({})}
                      className="press ml-auto text-[12px] text-primary hover:underline transition-colors duration-150 animate-fade-in"
                    >
                      Reset all to default
                    </button>
                  )}
                </div>

                {recipients.length === 0 ? (
                  <p className="mt-3 text-[12px] text-muted-foreground italic">
                    Choose an audience above and each contact's code appears here.
                  </p>
                ) : (
                  <div className="mt-3 rounded-lg border border-border overflow-hidden">
                    <div className="p-2.5 border-b border-border bg-card/40">
                      <div className="relative">
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <input
                          value={codeQuery}
                          onChange={(e) => {
                            setCodeQuery(e.target.value);
                            setCodePage(1);
                          }}
                          placeholder="Search recipient or code..."
                          className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-[12px] transition-shadow focus:outline-none focus:ring-1 focus:ring-primary/40"
                        />
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Recipient
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Their code
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        key={`${safeCodePage}-${codePageSize}`}
                        className="divide-y divide-border/60 stagger"
                      >
                        {pagedRecipients.length === 0 ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-3 py-6 text-center text-[12px] text-muted-foreground italic"
                            >
                              No recipient matches "{codeQuery}"
                            </td>
                          </tr>
                        ) : (
                          pagedRecipients.map((c) => {
                            const code = codeFor(c.id);
                            const blank = !code.trim();
                            const dupe = !blank && duplicateCodes.has(code.trim().toUpperCase());
                            const owner = !blank ? conflictFor(c.id) : undefined;
                            const problem = blank
                              ? "Needs a code"
                              : dupe
                                ? "Same code as another recipient"
                                : owner
                                  ? `Already used by ${owner}`
                                  : null;
                            return (
                              <tr key={c.id}>
                                <td className="px-3 py-1.5 text-[12px] align-top pt-2.5">
                                  {c.name}
                                </td>
                                <td className="px-3 py-1.5">
                                  <input
                                    value={code}
                                    onChange={(e) =>
                                      setCodeOverrides((o) => ({
                                        ...o,
                                        [c.id]: e.target.value.toUpperCase(),
                                      }))
                                    }
                                    className={`h-7 w-full max-w-[260px] rounded border bg-background px-2 font-mono text-[12px] transition-colors duration-150 focus:outline-none focus:ring-1 ${
                                      problem
                                        ? "border-rose-400 focus:ring-rose-300"
                                        : "border-border focus:ring-primary/40"
                                    }`}
                                  />
                                  {problem && (
                                    <div className="mt-0.5 text-[10.5px] text-rose-600 animate-fade-in">
                                      {problem}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-border text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>Rows per page</span>
                        <select
                          value={codePageSize}
                          onChange={(e) => {
                            setCodePageSize(Number(e.target.value));
                            setCodePage(1);
                          }}
                          className="h-6 rounded border border-border bg-card px-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                          {[5, 10, 25, 50].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        {(codeProblems > 0 || duplicateCodes.size > 0) && (
                          <span className="text-rose-600 font-medium animate-fade-in">
                            {codeProblems + duplicateCodes.size} to fix
                          </span>
                        )}
                        <span>
                          {matchingRecipients.length === 0
                            ? "0 of 0"
                            : `${(safeCodePage - 1) * codePageSize + 1}–${Math.min(
                                safeCodePage * codePageSize,
                                matchingRecipients.length,
                              )} of ${matchingRecipients.length}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCodePage(Math.max(1, safeCodePage - 1))}
                          disabled={safeCodePage <= 1}
                          className="tap press h-6 w-6 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() => setCodePage(Math.min(codeTotalPages, safeCodePage + 1))}
                          disabled={safeCodePage >= codeTotalPages}
                          className="tap press h-6 w-6 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </FormCard>
            </div>
          )}

          {/* Save actions */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {blocker && (
              <span className="mr-auto text-[12px] text-destructive animate-fade-in">
                {blocker}
              </span>
            )}
            <button
              onClick={() => submit("draft")}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 hover:bg-card px-3 h-9 text-xs font-medium text-foreground transition-colors duration-150"
            >
              <Save className="h-3.5 w-3.5" /> Save draft
            </button>
            {sendMode === "schedule" ? (
              <button
                onClick={() => submit("schedule")}
                disabled={!valid}
                title={blocker ?? undefined}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                <CalendarClock className="h-3.5 w-3.5" /> Schedule broadcast
              </button>
            ) : (
              <button
                onClick={() => submit("send")}
                disabled={!valid}
                title={blocker ?? undefined}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
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
              <PhoneFrame
                channel={channelKind}
                senderName={selectedChannel?.name ?? "Your business"}
              >
                {previewBody.trim() ? (
                  <div className="space-y-1.5">
                    {contentMode === "template" &&
                      template?.headerType === "text" &&
                      template.headerText && (
                        <div className="font-semibold text-[12px]">{template.headerText}</div>
                      )}
                    <div className="whitespace-pre-wrap break-words">
                      {renderWithVars(previewBody)}
                    </div>
                    {contentMode === "template" && template?.footer && (
                      <div className="pt-1 text-[10px] text-muted-foreground">
                        {template.footer}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">
                    Message preview will appear here…
                  </div>
                )}
              </PhoneFrame>
            </div>
            <div className="px-4 py-3 border-t border-border text-[11px] text-muted-foreground">
              {name ? (
                <span className="font-medium text-foreground">{name}</span>
              ) : (
                "Untitled broadcast"
              )}
              {" · "}
              {audienceSummary
                ? `${audienceSummary.listNames.length} audience${audienceSummary.listNames.length === 1 ? "" : "s"}${
                    audienceSummary.conditionCount
                      ? ` · ${audienceSummary.conditionCount} condition(s)`
                      : ""
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
        selected
          ? "border-primary/40 bg-primary/10"
          : "border-border bg-background/30 hover:bg-gray-50"
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
        className="w-full inline-flex items-center justify-between gap-2 rounded-md border border-border bg-background/40 hover:bg-gray-50 px-3 h-10 text-[13px] transition-colors duration-150"
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
          <div className="animate-scale-in origin-top absolute z-40 mt-1 w-full rounded-md border border-border bg-popover shadow-lg overflow-hidden">
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
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 hover:bg-card px-2 h-7 text-[11px] transition-colors duration-150"
          >
            <Pencil className="h-3 w-3" /> Change
          </button>
          <button
            onClick={onClear}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-destructive transition-colors duration-150"
            aria-label="Clear template"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
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
  useEscapeKey(true, onClose);

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
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[88vh] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden modal-content"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Choose Audience</h2>
          </div>
          <button
            onClick={onClose}
            className="tap h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground transition-colors duration-150"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-3 border-b border-border flex items-center justify-between gap-3">
          <div className="inline-flex rounded-md border border-border bg-background/40 p-1">
            {(["list", "condition"] as const).map((t) => {
              const sel = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => onTabChange(t)}
                  className={`px-3 h-7 text-[12px] font-medium rounded ${
                    sel
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "list" ? "By Audience" : "By Condition"}
                </button>
              );
            })}
          </div>
          <Link
            to="/contacts/audience/new"
            search={{ from: "broadcast" }}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors duration-150"
          >
            <Plus className="h-3.5 w-3.5" /> Add New Audience
          </Link>
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
                          <div className="text-[11px] text-muted-foreground truncate">
                            {l.description}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                    No audience match.
                  </div>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {localLists.size} audience{localLists.size === 1 ? "" : "s"} selected
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                Build an audience using your contact properties. New properties added in Contacts
                appear here automatically.
              </p>
              <div className="space-y-2">
                {localConds.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-[1fr_140px_1fr_auto] gap-2 items-center"
                  >
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
                      onChange={(e) =>
                        updateCondition(c.id, { operator: e.target.value as Condition["operator"] })
                      }
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
                      className="h-9 w-9 grid place-items-center rounded-md border border-border bg-background/40 hover:text-destructive transition-colors duration-150"
                      aria-label="Remove condition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addCondition}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 px-3 h-8 text-[12px] text-muted-foreground hover:text-primary transition-colors duration-150"
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
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 hover:bg-card px-3 h-8 text-[12px] transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={confirm}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 h-8 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
            >
              <Check className="h-3.5 w-3.5" /> Apply audience
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
