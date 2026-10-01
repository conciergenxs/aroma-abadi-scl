import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/scl/app-shell";
import { SclSelect } from "@/components/scl/scl-select";
import { SclManagedSelect } from "@/components/scl/scl-managed-select";
import { ChannelIcon } from "@/components/scl/channel-badge";
import {
  templatesStore,
  useTemplatesStore,
  TEMPLATE_GROUP_DOT,
} from "@/components/scl/templates-store";
import { connectedChannels, TEMPLATE_LANGUAGES, type Template } from "@/components/scl/mock-data";
import { BrandPicker } from "@/components/scl/brand-picker";
import { PromoCodePicker } from "@/components/scl/promo-code-picker";
import type { Brand } from "@/components/scl/sku-store";
import { usePromoStore, type PromoCode } from "@/components/scl/promo-store";
import {
  Save,
  Send,
  Plus,
  AtSign,
  Sparkles,
  Lightbulb,
  Image as ImageIcon,
  Video,
  FileText,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  Check,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/templates/new")({
  head: () => ({ meta: [{ title: "Create New Template — SCL" }] }),
  component: CreateTemplatePage,
});

const HEADER_OPTIONS = [
  { value: "none", label: "None" },
  {
    value: "text",
    label: "Text",
    icon: <FileText className="h-3.5 w-3.5 text-muted-foreground" />,
  },
  {
    value: "image",
    label: "Image",
    icon: <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />,
  },
  { value: "video", label: "Video", icon: <Video className="h-3.5 w-3.5 text-muted-foreground" /> },
];

const BUTTON_OPTIONS = [
  { value: "none", label: "None" },
  {
    value: "quick",
    label: "Quick Replies",
    icon: <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />,
  },
  {
    value: "cta",
    label: "Call to Action",
    icon: <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />,
  },
];

function CreateTemplatePage() {
  const navigate = useNavigate();
  const { groups, categories } = useTemplatesStore();

  // Variable popup state
  const [varPopup, setVarPopup] = useState<"brands" | "promo" | null>(null);

  // Settings
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Marketing");
  const [language, setLanguage] = useState<string>("en_US");
  const [groupId, setGroupId] = useState<string>("none");
  const [channelId, setChannelId] = useState<string>(connectedChannels[0]?.id ?? "");
  const selectedChannel = connectedChannels.find((c) => c.id === channelId) ?? null;


  // Content
  const [headerType, setHeaderType] = useState<string>("none");
  const [headerText, setHeaderText] = useState("");
  const [headerMedia, setHeaderMedia] = useState<{ url: string; name: string } | null>(null);
  const headerFileRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [buttonType, setButtonType] = useState<string>("none");
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const channelKind = selectedChannel?.channel ?? "whatsapp";

  const groupOptions = useMemo(
    () => [
      { value: "none", label: "No group" },
      ...groups.map((g) => ({
        value: g.id,
        label: g.name,
        dot: TEMPLATE_GROUP_DOT[g.color],
      })),
    ],
    [groups],
  );

  const languageOptions = useMemo(
    () => TEMPLATE_LANGUAGES.map((l) => ({ value: l.code, label: l.name })),
    [],
  );

  const channelOptions = useMemo(
    () =>
      connectedChannels.map((c) => ({
        value: c.id,
        label: c.name,
        trailing: c.handle,
        icon: <ChannelIcon channel={c.channel} className="h-4 w-4" />,
      })),
    [],
  );

  const valid = name.trim().length > 0 && body.trim().length > 0;

  // Read the link straight from the body so it can never disagree with it:
  // deleting a token unlinks it, and typing one by hand links it. A 1-to-1
  // promo wins when there are several, because that's the one Broadcast
  // has to mint per-recipient codes for.
  const { promos } = usePromoStore();
  const linkedPromoId = (() => {
    const codes = [...body.matchAll(/\{\{promo-([^}]+)\}\}/g)].map((m) => m[1].trim());
    const found = codes
      .map((code) => promos.find((p) => p.code.toUpperCase() === code.toUpperCase()))
      .filter((p): p is PromoCode => !!p);
    return (found.find((p) => p.usageType === "one-to-one") ?? found[0])?.id;
  })();

  const insertVariable = (token: string) => {
    const el = bodyRef.current;
    if (!el) {
      setBody((b) => b + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const insertBrand = (brand: Brand) => {
    insertVariable(`{{brands-${brand.name}}}`);
    setVarPopup(null);
  };

  const insertPromo = (promo: PromoCode) => {
    insertVariable(`{{promo-${promo.code}}}`);
    setVarPopup(null);
  };


  const submit = (kind: "draft" | "submit") => {
    if (!valid) {
      toast.error("Template name and body are required");
      return;
    }
    templatesStore.addTemplate({
      name: name.trim(),
      category,
      channel: channelKind,
      status: kind === "draft" ? "Draft" : "Pending",
      body: body.trim(),
      groupId: groupId === "none" ? undefined : groupId,
      language,
      headerType: headerType as "none" | "text" | "image" | "video",
      headerText: headerType === "text" ? headerText.trim() || undefined : undefined,
      footer: footer.trim() || undefined,
      promoCodeId: linkedPromoId,
    });
    toast.success(kind === "draft" ? "Draft saved" : "Template submitted for review");
    navigate({ to: "/templates" });
  };

  return (
    <AppShell backTo="/templates">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Create New Template</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start page-enter">
        {/* Left — form */}
        <div className="space-y-6">
          <FormCard
            step={1}
            title="Settings"
            description="Identify the template and pick how it appears in your library."
          >
            <Field label="Template Name" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Winter Drop — VIP Early Access"
                className="w-full h-10 rounded-md border border-border bg-white px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Category" required>
                <SclManagedSelect
                  value={category}
                  onChange={setCategory}
                  options={categoryOptions}
                  onAdd={(name) => {
                    templatesStore.addCategory(name);
                    setCategory(name);
                    toast.success("Category added");
                  }}
                  onRename={(v, name) => {
                    const c = categories.find((x) => x.name === v);
                    if (!c) return;
                    templatesStore.renameCategory(c.id, name);
                    if (category === v) setCategory(name);
                    toast.success("Category renamed");
                  }}
                  onDelete={(v) => {
                    const c = categories.find((x) => x.name === v);
                    if (!c) return;
                    if (categories.length === 1) {
                      toast.error("Keep at least one category.");
                      return;
                    }
                    templatesStore.deleteCategory(c.id);
                    if (category === v) {
                      setCategory(categories.find((x) => x.id !== c.id)!.name);
                    }
                    toast.success("Category deleted");
                  }}
                  addLabel="Add New Category"
                  namePlaceholder="Category name…"
                  ariaLabel="Category"
                />
              </Field>
              <Field label="Channel" required>
                <SclSelect value={channelId} onChange={setChannelId} options={channelOptions} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Template Group (Optional)">
                <SclManagedSelect
                  value={groupId}
                  onChange={setGroupId}
                  options={groupOptions}
                  onAdd={(name) => {
                    const g = templatesStore.addGroup(name);
                    setGroupId(g.id);
                    toast.success("Group created");
                  }}
                  onRename={(v, name) => {
                    templatesStore.renameGroup(v, name);
                    toast.success("Group renamed");
                  }}
                  onDelete={(v) => {
                    templatesStore.deleteGroup(v);
                    if (groupId === v) setGroupId("none");
                    toast.success("Group deleted");
                  }}
                  addLabel="Add New Group"
                  namePlaceholder="Group name…"
                  ariaLabel="Template group"
                />
              </Field>

              <Field label="Language">
                <SclSelect value={language} onChange={setLanguage} options={languageOptions} />
              </Field>

              <Field label="Header Type (Optional)">
                <SclSelect value={headerType} onChange={setHeaderType} options={HEADER_OPTIONS} />
                {headerType === "text" && (
                  <input
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    placeholder="Header text"
                    className="mt-2 w-full h-9 rounded-md border border-border bg-white px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                )}
                {(headerType === "image" || headerType === "video") && (
                  <div className="mt-2 animate-fade-in">
                    <input
                      ref={headerFileRef}
                      type="file"
                      accept={headerType === "image" ? "image/*" : "video/*"}
                      className="hidden"
                      onChange={handleHeaderFile}
                    />
                    {headerMedia ? (
                      <div className="flex items-center gap-3 rounded-md border border-border bg-background/30 p-2">
                        {headerType === "image" ? (
                          <img
                            src={headerMedia.url}
                            alt=""
                            className="img-fade h-12 w-12 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <video
                            src={headerMedia.url}
                            className="h-12 w-12 shrink-0 rounded object-cover"
                            muted
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12px] font-medium">{headerMedia.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {headerType === "image" ? "Image" : "Video"} header
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => headerFileRef.current?.click()}
                          className="press shrink-0 rounded border border-border bg-card/60 px-2.5 h-7 text-[11px] hover:bg-card transition-colors"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeaderMedia(null)}
                          aria-label="Remove header media"
                          className="press grid h-7 w-7 shrink-0 place-items-center rounded border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => headerFileRef.current?.click()}
                        className="press flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed border-border bg-background/30 p-4 text-center hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        {headerType === "image" ? (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Video className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="text-[12px] font-medium text-foreground">
                          Upload {headerType === "image" ? "image" : "video"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {headerType === "image"
                            ? "JPG, PNG or WebP · 1.91:1 works best"
                            : "MP4 · up to 16 MB"}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </Field>
            </div>
          </FormCard>

          <FormCard
            step={2}
            title="Content"
            description="Write the body, add variables and optional footer or buttons."
          >
            <Field
              label="Message Body"
              required
              hint="Use {{variable}} tokens — they get replaced when sending."
            >
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Hi {{name}}, …`}
                className="w-full min-h-[160px] rounded-md border border-border bg-white p-3 text-[13px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary/40 resize-y"
              />
              <div className="mt-2 flex flex-wrap items-center gap-1.5 relative">
                {/* Name — direct insert */}
                <button
                  onClick={() => insertVariable("{{name}}")}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-white hover:bg-white px-2 h-7 text-[11px] text-muted-foreground transition-colors duration-150"
                >
                  <AtSign className="h-3 w-3" /> Name
                </button>
                {/* Brands — opens the large BrandPicker modal below */}
                <button
                  onClick={() => setVarPopup("brands")}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-white hover:bg-white px-2 h-7 text-[11px] text-muted-foreground transition-colors duration-150"
                >
                  <AtSign className="h-3 w-3" /> Brands{" "}
                  <ChevronRight className="h-2.5 w-2.5 ml-0.5" />
                </button>
                {/* Promo Code — opens the large PromoCodePicker modal below */}
                <button
                  onClick={() => setVarPopup("promo")}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-white hover:bg-white px-2 h-7 text-[11px] text-muted-foreground transition-colors duration-150"
                >
                  <AtSign className="h-3 w-3" /> Promo Code{" "}
                  <ChevronRight className="h-2.5 w-2.5 ml-0.5" />
                </button>
              </div>
            </Field>

            <Field
              label="Footer (Optional)"
              hint="Short closing line, e.g. 'Reply STOP to opt out'."
            >
              <input
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
                placeholder="Footer text"
                className="w-full h-9 rounded-md border border-border bg-white px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </Field>

            <Field label="Button Type (Optional)">
              <SclSelect value={buttonType} onChange={setButtonType} options={BUTTON_OPTIONS} />
              {buttonType === "quick" && (
                <input
                  value={buttonLabel}
                  onChange={(e) => setButtonLabel(e.target.value)}
                  placeholder="Quick reply label"
                  className="mt-2 w-full h-9 rounded-md border border-border bg-white px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              )}
              {buttonType === "cta" && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={buttonLabel}
                    onChange={(e) => setButtonLabel(e.target.value)}
                    placeholder="Button label"
                    className="h-9 rounded-md border border-border bg-white px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <input
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="https://…"
                    className="h-9 rounded-md border border-border bg-white px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              )}
            </Field>
          </FormCard>

          <FormCard
            step={3}
            title="Guidance"
            description="Reference these before submitting for approval."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GuideBlock
                icon={<Lightbulb className="h-3.5 w-3.5 text-amber-300" />}
                title="Best Practices"
                items={[
                  "Keep marketing tone clear and respectful.",
                  "Avoid all-caps or excessive emojis.",
                  "Personalize with the recipient's name.",
                  "Always include an opt-out for promos.",
                ]}
              />
              <GuideBlock
                icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
                title="Variables Guide"
                items={[
                  "Use {{name}} for the contact name.",
                  "Use {{1}}, {{2}} for positional values.",
                  "Variables come from Contact Properties.",
                  "Always provide a fallback value at send.",
                ]}
              />
            </div>
          </FormCard>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => submit("draft")}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 hover:bg-card px-3 h-9 text-xs font-medium transition-colors duration-150"
            >
              <Save className="h-3.5 w-3.5" /> Save draft
            </button>
            <button
              onClick={() => submit("submit")}
              disabled={!valid}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <Send className="h-3.5 w-3.5" /> Submit for review
            </button>
          </div>
        </div>

        {/* Right — sticky preview */}
        <div className="lg:sticky lg:top-6">
          <div className="rounded-xl border border-border bg-card/60 glass overflow-hidden animate-fade-in">
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
                {headerType === "text" && headerText && (
                  <div className="font-semibold text-[12px] mb-1.5">{headerText}</div>
                )}
                {headerType === "image" && (
                  <div className="mb-2 h-20 w-full rounded bg-white/[0.05] border border-border grid place-items-center text-[10px] text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                )}
                {headerType === "video" && (
                  <div className="mb-2 h-20 w-full rounded bg-white/[0.05] border border-border grid place-items-center text-[10px] text-muted-foreground">
                    <Video className="h-4 w-4" />
                  </div>
                )}
                {body.trim() ? (
                  <div className="whitespace-pre-wrap break-words">{renderWithVars(body)}</div>
                ) : (
                  <div className="text-muted-foreground italic">Message body will appear here…</div>
                )}
                {footer && <div className="mt-2 text-[10px] text-muted-foreground">{footer}</div>}
              </PhoneFrame>
              {(buttonType === "quick" || buttonType === "cta") && buttonLabel && (
                <div className="mx-auto mt-2 w-full max-w-[300px] px-3">
                  <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 h-9 text-sm text-primary">
                    {buttonType === "cta" ? (
                      <ExternalLink className="h-3 w-3" />
                    ) : (
                      <Phone className="h-3 w-3" />
                    )}
                    {buttonLabel}
                  </button>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-border text-[11px] text-muted-foreground">
              {name ? (
                <span className="font-medium text-foreground">{name}</span>
              ) : (
                "Untitled template"
              )}
              {" · "}
              {category}
              {" · "}
              {TEMPLATE_LANGUAGES.find((l) => l.code === language)?.name ?? language}
            </div>
          </div>
        </div>
      </div>

      <BrandPicker
        open={varPopup === "brands"}
        onClose={() => setVarPopup(null)}
        onSelect={insertBrand}
      />
      <PromoCodePicker
        open={varPopup === "promo"}
        onClose={() => setVarPopup(null)}
        onSelect={insertPromo}
      />
    </AppShell>
  );
}

/* ---------- Sub-components ---------- */

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

function GuideBlock({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-border bg-background/30 p-3">
      <div className="flex items-center gap-1.5 text-[12px] font-semibold mb-2">
        {icon}
        {title}
      </div>
      <ul className="space-y-1 text-[11px] text-muted-foreground leading-relaxed">
        {items.map((it) => (
          <li key={it} className="flex gap-1.5">
            <span className="text-primary">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
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
