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
import { SclSelect } from "@/components/scl/scl-select";

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
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55 hover:text-muted-foreground/80"
                >
                  <span>{section.label}</span>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform opacity-60 ${isOpen ? "" : "-rotate-90"}`}
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

// ============================================================
// Company Details
// ============================================================

const TIMEZONES = [
  "(UTC+07:00) Jakarta",
  "(UTC+08:00) Singapore",
  "(UTC+00:00) London",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type WorkingHours = { open: boolean; from: string; to: string };

const DEFAULT_HOURS: Record<string, WorkingHours> = {
  Monday: { open: true, from: "09:00", to: "18:00" },
  Tuesday: { open: true, from: "09:00", to: "18:00" },
  Wednesday: { open: true, from: "09:00", to: "18:00" },
  Thursday: { open: true, from: "09:00", to: "18:00" },
  Friday: { open: true, from: "09:00", to: "18:00" },
  Saturday: { open: false, from: "09:00", to: "18:00" },
  Sunday: { open: false, from: "09:00", to: "18:00" },
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-white/10 border border-border"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function CompanyDetailsPage() {
  const [tab, setTab] = useState<"Settings" | "Security">("Settings");
  return (
    <div className="space-y-5">
      <div className="px-1 pt-0.5">
        <h2 className="text-xl font-semibold leading-tight m-0">Company Details</h2>
        <p className="text-xs text-muted-foreground mt-1 m-0">
          Workspace-wide identity, working hours, and security
        </p>
      </div>
      <div className="flex items-center gap-1 border-b border-border">
        {(["Settings", "Security"] as const).map((t) => (
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
      {tab === "Settings" ? <CompanySettingsTab /> : <CompanySecurityTab />}
    </div>
  );
}

function CompanySettingsTab() {
  const [name, setName] = useState("Northstar Commerce");
  const [tz, setTz] = useState(TIMEZONES[0]);
  const [hoursOn, setHoursOn] = useState(false);
  const [hours, setHours] = useState(DEFAULT_HOURS);

  return (
    <div className="space-y-5">
      <SectionCard title="Company">
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Company name" value={name} onChange={setName} />
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Default time zone
            </span>
            <div className="relative mt-1">
              <select
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                className="h-9 w-full appearance-none rounded-md border border-border bg-background/60 px-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                {TIMEZONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Working hours"
        action={<Toggle checked={hoursOn} onChange={setHoursOn} />}
      >
        <div className="p-5 space-y-3">
          <p className="text-xs text-muted-foreground">
            Used for analytics, SLA reporting, and response-time calculations.
          </p>
          {hoursOn && (
            <div className="rounded-lg border border-border divide-y divide-border">
              {DAYS.map((d) => {
                const h = hours[d];
                return (
                  <div key={d} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-28 text-sm">{d}</div>
                    <Toggle
                      checked={h.open}
                      onChange={(v) =>
                        setHours((s) => ({ ...s, [d]: { ...s[d], open: v } }))
                      }
                    />
                    {h.open ? (
                      <div className="flex items-center gap-2 ml-auto">
                        <input
                          type="time"
                          value={h.from}
                          onChange={(e) =>
                            setHours((s) => ({
                              ...s,
                              [d]: { ...s[d], from: e.target.value },
                            }))
                          }
                          className="h-8 rounded-md border border-border bg-background/60 px-2 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <input
                          type="time"
                          value={h.to}
                          onChange={(e) =>
                            setHours((s) => ({
                              ...s,
                              [d]: { ...s[d], to: e.target.value },
                            }))
                          }
                          className="h-8 rounded-md border border-border bg-background/60 px-2 text-xs"
                        />
                      </div>
                    ) : (
                      <span className="ml-auto text-xs text-muted-foreground">Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function CompanySecurityTab() {
  const [twoFA, setTwoFA] = useState(false);
  const [ipOn, setIpOn] = useState(false);
  const [ips, setIps] = useState<string[]>(["103.22.xxx.xxx", "180.12.xxx.xxx"]);
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-5">
      <SectionCard title="Two-factor authentication" action={<Toggle checked={twoFA} onChange={setTwoFA} />}>
        <div className="p-5 text-sm text-muted-foreground">
          Add an additional layer of protection beyond email and password.
        </div>
      </SectionCard>

      <SectionCard title="IP allowlisting" action={<Toggle checked={ipOn} onChange={setIpOn} />}>
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Restrict workspace access to approved IP addresses only.
          </p>
          {ipOn && (
            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Allowed IP addresses
              </div>
              <div className="rounded-lg border border-border divide-y divide-border">
                {ips.map((ip, i) => (
                  <div key={i} className="flex items-center px-4 py-2.5 text-sm font-mono">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                    {ip}
                    <button
                      onClick={() => setIps((s) => s.filter((_, j) => j !== i))}
                      className="ml-auto h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="0.0.0.0"
                  className="h-9 flex-1 rounded-md border border-border bg-background/60 px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
                <button
                  onClick={() => {
                    if (!draft.trim()) return;
                    setIps((s) => [...s, draft.trim()]);
                    setDraft("");
                    toast.success("IP added to allowlist");
                  }}
                  className="h-9 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5" /> Add IP address
                </button>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// User Management
// ============================================================

type UserRole = "Super Admin" | "Admin" | "Team Admin" | "Staff";
type UserStatus = "Online" | "Offline" | "Away";
type UserState = "Active" | "Pending";

type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
  job: string;
  role: UserRole;
  status: UserStatus;
  teams: string[];
  joinedOn: string;
  state: UserState;
  owner?: boolean;
};

const USERS_SEED: WorkspaceUser[] = [
  {
    id: "u-aria",
    name: "Aria Kapoor",
    email: "aria.kapoor@northstar.co",
    job: "Workspace Owner",
    role: "Super Admin",
    status: "Online",
    teams: ["Customer Support", "Marketing"],
    joinedOn: "Jan 12, 2024",
    state: "Active",
    owner: true,
  },
  {
    id: "u-tom",
    name: "Tomas Bergstrom",
    email: "tomas.b@northstar.co",
    job: "Head of Support",
    role: "Admin",
    status: "Online",
    teams: ["Customer Support"],
    joinedOn: "Feb 02, 2024",
    state: "Active",
  },
  {
    id: "u-mei",
    name: "Mei Tanaka",
    email: "mei.tanaka@northstar.co",
    job: "Sales Lead",
    role: "Team Admin",
    status: "Away",
    teams: ["Sales"],
    joinedOn: "Mar 18, 2024",
    state: "Active",
  },
  {
    id: "u-luca",
    name: "Luca Romano",
    email: "luca.romano@northstar.co",
    job: "Marketing Manager",
    role: "Team Admin",
    status: "Offline",
    teams: ["Marketing"],
    joinedOn: "Apr 04, 2024",
    state: "Active",
  },
  {
    id: "u-sara",
    name: "Sara Iqbal",
    email: "sara.iqbal@northstar.co",
    job: "Support Specialist",
    role: "Staff",
    status: "Online",
    teams: ["Customer Support"],
    joinedOn: "May 22, 2024",
    state: "Active",
  },
  {
    id: "u-dimas",
    name: "Dimas Pratama",
    email: "dimas.p@northstar.co",
    job: "Operations Analyst",
    role: "Staff",
    status: "Offline",
    teams: ["Operations"],
    joinedOn: "Jun 09, 2024",
    state: "Active",
  },
  {
    id: "u-pending-1",
    name: "Hana Wijaya",
    email: "hana.wijaya@northstar.co",
    job: "Sales Associate",
    role: "Staff",
    status: "Offline",
    teams: ["Sales"],
    joinedOn: "—",
    state: "Pending",
  },
  {
    id: "u-pending-2",
    name: "Marco Silva",
    email: "marco.silva@northstar.co",
    job: "Support Agent",
    role: "Staff",
    status: "Offline",
    teams: ["Customer Support"],
    joinedOn: "—",
    state: "Pending",
  },
];

const ROLE_OPTIONS: UserRole[] = ["Super Admin", "Admin", "Team Admin", "Staff"];
const TEAM_FILTER_OPTIONS = ["All teams", "Customer Support", "Sales", "Marketing", "Operations"];

const statusDot: Record<UserStatus, string> = {
  Online: "bg-emerald-400",
  Away: "bg-amber-400",
  Offline: "bg-muted-foreground/50",
};

function UserManagementPage() {
  const [tab, setTab] = useState<UserState>("Active");
  const [users, setUsers] = useState(USERS_SEED);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | UserRole>("All");
  const [teamFilter, setTeamFilter] = useState<string>("All teams");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = useMemo(() => {
    return users
      .filter((u) => u.state === tab)
      .filter((u) =>
        search.trim()
          ? (u.name + u.email).toLowerCase().includes(search.toLowerCase())
          : true,
      )
      .filter((u) => (roleFilter === "All" ? true : u.role === roleFilter))
      .filter((u) => (teamFilter === "All teams" ? true : u.teams.includes(teamFilter)))
      .sort((a, b) => (a.owner ? -1 : b.owner ? 1 : 0));
  }, [users, tab, search, roleFilter, teamFilter]);

  const selectableIds = filtered.filter((u) => !u.owner).map((u) => u.id);
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.includes(id));

  const toggleAll = () => {
    setSelected(allSelected ? [] : selectableIds);
  };
  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("All");
    setTeamFilter("All teams");
  };

  const updateRole = (id: string, role: UserRole) =>
    setUsers((s) => s.map((u) => (u.id === id ? { ...u, role } : u)));

  const handleDelete = () => {
    setUsers((s) => s.filter((u) => !selected.includes(u.id) || u.owner));
    toast.success(`${selected.length} user(s) removed`);
    setSelected([]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 px-1 pt-0.5">
        <div>
          <h2 className="text-xl font-semibold leading-tight m-0">User Management</h2>
          <p className="text-xs text-muted-foreground mt-1 m-0">
            Manage workspace members, roles, and team assignments
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="h-9 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="h-3.5 w-3.5" /> Invite user
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-border">
        {(["Active", "Pending"] as const).map((t) => {
          const count = users.filter((u) => u.state === t).length;
          return (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setSelected([]);
              }}
              className={`relative px-3 py-2 text-sm transition inline-flex items-center gap-1.5 ${
                tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              <span className="text-[10px] rounded-full bg-white/[0.06] border border-border px-1.5 py-0.5">
                {count}
              </span>
              {tab === t && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <SectionCard>
        <div className="p-4 flex flex-wrap items-center gap-2 border-b border-border">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="h-9 w-full rounded-md border border-border bg-background/60 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <FilterSelect
            value={roleFilter}
            onChange={(v) => setRoleFilter(v as "All" | UserRole)}
            options={["All", ...ROLE_OPTIONS]}
            label="Role"
          />
          <FilterSelect
            value={teamFilter}
            onChange={setTeamFilter}
            options={TEAM_FILTER_OPTIONS}
            label="Team"
          />
          <FilterSelect
            value="Anytime"
            onChange={() => {}}
            options={["Anytime", "Last 7 days", "Last 30 days", "This year"]}
            label="Joined on"
          />
          <button
            onClick={resetFilters}
            className="h-9 inline-flex items-center gap-1.5 rounded-md border border-border bg-white/[0.03] px-3 text-xs hover:bg-white/[0.06]"
          >
            <Filter className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        {selected.length > 0 && (
          <div className="px-4 py-2 flex items-center gap-3 bg-primary/10 border-b border-primary/20 text-xs">
            <span className="font-medium">{selected.length} selected</span>
            <button
              onClick={() => setConfirmDelete(true)}
              className="ml-auto h-8 inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 text-destructive-foreground font-medium hover:bg-destructive/90"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete users
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-2.5 text-left w-8">
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="px-3 py-2.5 text-left">Name</th>
                <th className="px-3 py-2.5 text-left">Email</th>
                <th className="px-3 py-2.5 text-left">Job title</th>
                <th className="px-3 py-2.5 text-left">Role</th>
                <th className="px-3 py-2.5 text-left">Status</th>
                <th className="px-3 py-2.5 text-left">Teams</th>
                <th className="px-3 py-2.5 text-left">Joined on</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/60 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.includes(u.id)}
                      onChange={() => toggleOne(u.id)}
                      disabled={u.owner}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/40 to-primary/0 grid place-items-center text-[10px] font-semibold">
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <span className="font-medium">{u.name}</span>
                      {u.owner && (
                        <span className="text-[9px] uppercase tracking-wider rounded border border-primary/40 bg-primary/15 text-primary px-1.5 py-0.5">
                          Owner
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-3 py-3 text-muted-foreground">{u.job}</td>
                  <td className="px-3 py-3">
                    {u.owner ? (
                      <span className="text-xs">Super Admin</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                        className="h-7 rounded-md border border-border bg-background/60 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDot[u.status]}`} />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.teams.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-full border border-border bg-white/[0.04] px-2 py-0.5 text-[10px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground text-xs">{u.joinedOn}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No users match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <ConnectedAgentsSection />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Are you sure you want to remove these users?"
        description="This action cannot be undone."
        confirmLabel="Delete users"
      />
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`h-4 w-4 rounded border grid place-items-center transition ${
        disabled
          ? "border-border/40 bg-white/[0.02] cursor-not-allowed"
          : checked
          ? "bg-primary border-primary text-primary-foreground"
          : "border-border hover:border-primary/40"
      }`}
    >
      {checked && !disabled && <Check className="h-3 w-3" />}
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-md border border-border bg-background/60 pl-3 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
    </div>
  );
}

// ============================================================
// Connected AI Agents
// ============================================================

const AGENT_META: Record<string, { conversations: number; connectedOn: string }> = {
  "support-ai": { conversations: 142, connectedOn: "Jan 18, 2024" },
  "sales-ai": { conversations: 87, connectedOn: "Feb 24, 2024" },
};

function ConnectedAgentsSection() {
  const agents = useWorkspaceAgents();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [disconnected, setDisconnected] = useState<string[]>([]);

  const visible = agents.filter((a) => !disconnected.includes(a.id));
  const allSelected =
    visible.length > 0 && visible.every((a) => selected.includes(a.id));

  const toggleAll = () =>
    setSelected(allSelected ? [] : visible.map((a) => a.id));
  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleDisconnect = () => {
    setDisconnected((d) => [...d, ...selected]);
    toast.success(`${selected.length} agent(s) disconnected`);
    setSelected([]);
  };

  return (
    <SectionCard
      title="Connected AI Agents"
      description="AI agents that can participate in assignments, collaboration, and conversation ownership."
    >
      {selected.length > 0 && (
        <div className="px-4 py-2 flex items-center gap-3 bg-primary/10 border-b border-primary/20 text-xs">
          <span className="font-medium">{selected.length} selected</span>
          <button
            onClick={() => setConfirm(true)}
            className="ml-auto h-8 inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 text-destructive-foreground font-medium hover:bg-destructive/90"
          >
            <Trash2 className="h-3.5 w-3.5" /> Disconnect agent
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="px-4 py-2.5 text-left w-8">
                <Checkbox checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-3 py-2.5 text-left">Agent name</th>
              <th className="px-3 py-2.5 text-left">Description</th>
              <th className="px-3 py-2.5 text-left">Webhook URL</th>
              <th className="px-3 py-2.5 text-left">Status</th>
              <th className="px-3 py-2.5 text-left">Assigned conversations</th>
              <th className="px-3 py-2.5 text-left">Connected on</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => {
              const meta = AGENT_META[a.id] ?? {
                conversations: 0,
                connectedOn: "Today",
              };
              return (
                <tr key={a.id} className="border-b border-border/60 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selected.includes(a.id)}
                      onChange={() => toggleOne(a.id)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 grid place-items-center text-primary">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground max-w-sm">{a.description}</td>
                  <td className="px-3 py-3 text-muted-foreground font-mono text-xs">
                    {a.webhookUrl}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-2 py-0.5 text-[10px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {a.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{meta.conversations}</td>
                  <td className="px-3 py-3 text-muted-foreground text-xs">{meta.connectedOn}</td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No AI agents connected.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={handleDisconnect}
        title="Disconnect selected AI agent(s)?"
        description="The agent will stop receiving assignments and automation events."
        confirmLabel="Disconnect"
      />
    </SectionCard>
  );
}