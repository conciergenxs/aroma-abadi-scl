import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { useMemo, useRef, useState } from "react";
import { FloatingMenu } from "@/components/scl/floating-menu";
import {
  ChevronDown,
  Upload,
  X,
  Check,
  Download,
  Copy,
  QrCode,
  Search,
  Plus,
  Trash2,
  Bot,
  UserPlus,
  Shield,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { WHATSAPP_CHANNELS } from "@/routes/channels";
import { InviteModal, useWorkspaceAgents } from "@/components/scl/invite-modal";
import { ConfirmDialog } from "@/components/scl/confirm-dialog";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — SCL" }] }),
  component: SettingsPage,
});

// ---------- Navigation structure ----------

type NavItem = { id: string; label: string; enabled?: boolean };
type NavSection = { id: string; label: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    id: "preferences",
    label: "Your preferences",
    items: [{ id: "general", label: "General", enabled: true }],
  },
  {
    id: "company",
    label: "Company settings",
    items: [
      { id: "company-details", label: "Company Details", enabled: true },
      { id: "user-management", label: "User Management", enabled: true },
      { id: "team-management", label: "Team Management" },
      { id: "roles", label: "Roles & Permissions" },
      { id: "inbox-settings", label: "Inbox Settings" },
      { id: "feature-previews", label: "Feature Previews" },
    ],
  },
  {
    id: "billing",
    label: "Plans & billing",
    items: [
      { id: "subscription", label: "Subscription" },
      { id: "payment-methods", label: "Payment Methods" },
      { id: "add-ons", label: "Add-ons" },
      { id: "invoices", label: "Invoices" },
    ],
  },
  {
    id: "data",
    label: "Data management",
    items: [
      { id: "labels", label: "Labels" },
      { id: "contact-properties", label: "Contact Properties" },
      { id: "lifecycle", label: "Customer Lifecycle" },
      { id: "deleted-contacts", label: "Recently Deleted Contacts" },
    ],
  },
];

function SettingsPage() {
  const [active, setActive] = useState("general");
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV.map((s) => [s.id, true])),
  );

  return (
    <AppShell title="Settings" subtitle="Manage your workspace preferences and configuration">
      <div className="grid grid-cols-[260px_1fr] gap-6 items-start">
        <aside className="rounded-xl border border-border bg-card/60 glass p-2 h-fit sticky top-0 self-start">
          {NAV.map((section) => {
            const isOpen = open[section.id];
            return (
              <div key={section.id} className="mb-1">
                <button
                  onClick={() => setOpen((o) => ({ ...o, [section.id]: !o[section.id] }))}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                >
                  <span>{section.label}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${isOpen ? "" : "-rotate-90"}`}
                  />
                </button>
                {isOpen && (
                  <div className="mt-1 space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = active === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => item.enabled && setActive(item.id)}
                          disabled={!item.enabled}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition flex items-center justify-between ${
                            isActive
                              ? "bg-primary/15 text-foreground border border-primary/30"
                              : item.enabled
                              ? "text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent"
                              : "text-muted-foreground/40 cursor-not-allowed border border-transparent"
                          }`}
                        >
                          <span>{item.label}</span>
                          {!item.enabled && (
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/40">
                              Soon
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        <div className="space-y-6 min-w-0 self-start">
          {active === "general" && <GeneralPage />}
          {active === "company-details" && <CompanyDetailsPage />}
          {active === "user-management" && <UserManagementPage />}
          {active !== "general" &&
            active !== "company-details" &&
            active !== "user-management" && <ComingSoonPanel id={active} />}
        </div>
      </div>
    </AppShell>
  );
}

// ---------- General Page ----------

const GENERAL_TABS = ["Profile", "WhatsApp QR Code"] as const;
type GeneralTab = (typeof GENERAL_TABS)[number];

function GeneralPage() {
  const [tab, setTab] = useState<GeneralTab>("Profile");

  return (
    <div className="space-y-5">
      <div className="px-1 pt-0.5">
        <h2 className="text-xl font-semibold leading-tight m-0">General</h2>
        <p className="text-xs text-muted-foreground mt-1 m-0">
          Your personal profile and conversation entry points
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-border">
        {GENERAL_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-3 py-2 text-sm transition ${
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
            {tab === t && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {tab === "Profile" ? <ProfileTab /> : <WhatsAppQrTab />}
    </div>
  );
}

// ---------- Profile Tab ----------

const TEAM_OPTIONS = ["Customer Support", "Sales", "Marketing", "Operations"];

function ProfileTab() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [first, setFirst] = useState("Aria");
  const [last, setLast] = useState("Kapoor");
  const [username, setUsername] = useState("aria.kapoor");
  const [phone, setPhone] = useState("+62 811 5500 0001");
  const [job, setJob] = useState("Workspace Owner");
  const [teams, setTeams] = useState<string[]>(["Customer Support", "Marketing"]);
  const [link, setLink] = useState("aria-kapoor");
  const fileRef = useRef<HTMLInputElement>(null);

  const fullName = `${first} ${last}`.trim();

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setAvatar(url);
    toast.success("Avatar updated");
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Profile">
        <div className="p-5 flex items-center gap-5">
          <div className="relative h-20 w-20 rounded-full border border-border bg-gradient-to-br from-primary/30 to-primary/0 grid place-items-center overflow-hidden">
            {avatar ? (
              <img src={avatar} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-semibold">
                {first[0]}
                {last[0]}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold">{fullName}</div>
            <div className="text-xs text-muted-foreground">{job}</div>
            <div className="mt-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white/[0.03] px-3 py-1.5 text-xs font-medium hover:bg-white/[0.06]"
              >
                <Upload className="h-3.5 w-3.5" /> Upload avatar
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onUpload}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Personal information">
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="First name" value={first} onChange={setFirst} />
          <TextField label="Last name" value={last} onChange={setLast} />
          <TextField label="Email" value="aria.kapoor@scl.app" onChange={() => {}} readOnly />
          <TextField label="Username" value={username} onChange={setUsername} />
          <TextField label="Phone number" value={phone} onChange={setPhone} />
          <TextField label="Job title" value={job} onChange={setJob} />
        </div>
      </SectionCard>

      <SectionCard title="Teams">
        <div className="p-5">
          <TeamMultiSelect value={teams} onChange={setTeams} />
        </div>
      </SectionCard>

      <SectionCard title="Unique link">
        <div className="p-5 space-y-2">
          <div className="flex items-center rounded-md border border-border bg-background/60 overflow-hidden focus-within:ring-1 focus-within:ring-primary/40">
            <span className="px-3 text-xs text-muted-foreground border-r border-border">
              scl.app/u/
            </span>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="flex-1 h-9 bg-transparent px-3 text-sm focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Used for direct assignment and QR code routing.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`mt-1 h-9 w-full rounded-md border border-border bg-background/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 ${
          readOnly ? "text-muted-foreground cursor-not-allowed" : ""
        }`}
      />
    </label>
  );
}

function TeamMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const toggle = (t: string) =>
    onChange(value.includes(t) ? value.filter((v) => v !== t) : [...value, t]);

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className="flex flex-wrap items-center gap-1.5 min-h-9 rounded-md border border-border bg-background/60 px-2 py-1.5 cursor-pointer focus-within:ring-1 focus-within:ring-primary/40"
      >
        {value.length === 0 && (
          <span className="text-sm text-muted-foreground px-1">Select teams…</span>
        )}
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-xs"
          >
            {t}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggle(t);
              }}
              className="hover:text-foreground/80"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <ChevronDown className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <FloatingMenu
        anchorRef={triggerRef}
        open={open}
        onClose={() => setOpen(false)}
        className="rounded-md border border-border bg-popover glass shadow-xl p-1"
      >
        {TEAM_OPTIONS.map((t) => {
          const checked = value.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-white/[0.04]"
            >
              <span
                className={`h-4 w-4 rounded border grid place-items-center ${
                  checked
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border"
                }`}
              >
                {checked && <Check className="h-3 w-3" />}
              </span>
              <span>{t}</span>
            </button>
          );
        })}
      </FloatingMenu>
    </div>
  );
}

// ---------- WhatsApp QR Tab ----------

function WhatsAppQrTab() {
  const [message, setMessage] = useState(
    "Hi, I would like to learn more about your services.",
  );
  const [channelId, setChannelId] = useState(WHATSAPP_CHANNELS[0].id);
  const channel =
    WHATSAPP_CHANNELS.find((c) => c.id === channelId) ?? WHATSAPP_CHANNELS[0];

  const waLink = useMemo(() => {
    const phone = channel.phone.replace(/[^\d]/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }, [channel, message]);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&bgcolor=ffffff&data=${encodeURIComponent(
    waLink,
  )}`;

  const copy = async () => {
    await navigator.clipboard.writeText(waLink);
    toast.success("WhatsApp link copied");
  };

  const download = async () => {
    try {
      const res = await fetch(qrSrc);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `whatsapp-qr-${channel.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("QR code downloaded");
    } catch {
      toast.error("Could not download QR code");
    }
  };

  return (
    <div className="space-y-5">
      <SectionCard title="WhatsApp QR code">
        <div className="p-5 text-sm text-muted-foreground">
          Customers can scan this QR code or open the generated link to start a WhatsApp
          conversation with your team — pre-filled with the message below.
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
        <div className="space-y-5">
          <SectionCard title="Configuration">
            <div className="p-5 space-y-4">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Pre-filled message
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                />
              </label>

              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  WhatsApp channel
                </span>
                <div className="relative mt-1">
                  <select
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    className="h-9 w-full appearance-none rounded-md border border-border bg-background/60 px-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                  >
                    {WHATSAPP_CHANNELS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.phone}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </label>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Preview">
          <div className="p-5 flex flex-col items-center text-center gap-3">
            <div className="rounded-lg border border-border bg-white p-2">
              <img
                src={qrSrc}
                alt={`QR for ${channel.name}`}
                className="h-[240px] w-[240px] block"
              />
            </div>
            <div>
              <div className="text-sm font-semibold flex items-center gap-1.5 justify-center">
                <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
                {channel.name}
              </div>
              <div className="text-xs text-muted-foreground">{channel.phone}</div>
            </div>
            <div className="flex items-center gap-2 pt-1 w-full">
              <button
                onClick={download}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-md border border-border bg-white/[0.03] text-xs font-medium hover:bg-white/[0.06]"
              >
                <Download className="h-3.5 w-3.5" /> Download QR
              </button>
              <button
                onClick={copy}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
              >
                <Copy className="h-3.5 w-3.5" /> Copy link
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ---------- Coming soon ----------

function ComingSoonPanel({ id }: { id: string }) {
  const label =
    NAV.flatMap((s) => s.items).find((i) => i.id === id)?.label ?? "Coming soon";
  return (
    <SectionCard title={label}>
      <div className="p-10 text-center text-sm text-muted-foreground">
        This settings area is coming soon.
      </div>
    </SectionCard>
  );
}