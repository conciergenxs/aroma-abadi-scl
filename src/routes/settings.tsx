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
  ArrowLeft,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { WHATSAPP_CHANNELS } from "@/routes/channels";
import { InviteModal, useWorkspaceAgents } from "@/components/scl/invite-modal";
import { ARMA_PERSONAS, type ArmaPersona } from "@/components/scl/agents";
import { ConfirmDialog } from "@/components/scl/confirm-dialog";
import { SclSelect } from "@/components/scl/scl-select";
import { RolesPermissionsModule } from "@/components/scl/roles-permissions";
import { DataManagementModule } from "@/components/scl/data-management";

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
      { id: "team-management", label: "Team Management", enabled: true },
      { id: "roles", label: "Roles & Permissions", enabled: true },
    ],
  },
  {
    id: "data",
    label: "Data management",
    items: [
      { id: "labels", label: "Labels", enabled: true },
      { id: "contact-properties", label: "Contact Properties", enabled: true },
      { id: "customer-lifecycle", label: "Customer Lifecycle", enabled: true },
      { id: "recently-deleted", label: "Recently Deleted Contacts", enabled: true },
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
                {section.id !== "company" ? (
                  <button
                    onClick={() => setOpen((o) => ({ ...o, [section.id]: !o[section.id] }))}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55 hover:text-muted-foreground/80"
                  >
                    <span>{section.label}</span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform opacity-60 ${isOpen ? "" : "-rotate-90"}`}
                    />
                  </button>
                ) : null}
                {isOpen && (
                  <div className={`space-y-0.5 ${section.id !== "company" ? "mt-1" : ""}`}>
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
                              ? "text-muted-foreground hover:text-foreground hover:bg-gray-50 border border-transparent"
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
          {active === "team-management" && <TeamManagementPage />}
          {active === "roles" && <RolesPermissionsModule />}
          {(active === "labels" ||
            active === "contact-properties" ||
            active === "customer-lifecycle" ||
            active === "recently-deleted") && (
            <DataManagementModule section={active} />
          )}
          {active !== "general" &&
            active !== "company-details" &&
            active !== "user-management" &&
            active !== "team-management" &&
            active !== "roles" &&
            active !== "labels" &&
            active !== "contact-properties" &&
            active !== "customer-lifecycle" &&
            active !== "recently-deleted" && <ComingSoonPanel id={active} />}
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
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white/[0.03] px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
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
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-gray-50"
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
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-md border border-border bg-white/[0.03] text-xs font-medium hover:bg-gray-100"
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
                      className="ml-auto h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground"
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
  const [joinedFilter, setJoinedFilter] = useState<string>("Anytime");
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
    setJoinedFilter("Anytime");
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
          <SclSelect
            ariaLabel="Role"
            value={roleFilter}
            onChange={(v) => setRoleFilter(v as "All" | UserRole)}
            options={["All", ...ROLE_OPTIONS].map((o) => ({ value: o, label: o }))}
            className="w-40"
          />
          <SclSelect
            ariaLabel="Team"
            value={teamFilter}
            onChange={setTeamFilter}
            options={TEAM_FILTER_OPTIONS.map((o) => ({ value: o, label: o }))}
            className="w-44"
          />
          <SclSelect
            ariaLabel="Joined on"
            value={joinedFilter}
            onChange={setJoinedFilter}
            options={["Anytime", "Last 7 days", "Last 30 days", "This year"].map((o) => ({
              value: o,
              label: o,
            }))}
            className="w-40"
          />
          <button
            onClick={resetFilters}
            className="h-9 inline-flex items-center gap-1.5 rounded-md border border-border bg-white/[0.03] px-3 text-xs hover:bg-gray-100"
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

        <div className="overflow-x-auto scl-scroll">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-2.5 text-left w-8">
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Name</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Email</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Job title</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Role</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Status</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Teams</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Joined on</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/60 hover:bg-gray-50 h-14">
                  <td className="px-4 py-3 align-middle">
                    <Checkbox
                      checked={selected.includes(u.id)}
                      onChange={() => toggleOne(u.id)}
                      disabled={u.owner}
                    />
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
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
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground">{u.job}</td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    {u.owner ? (
                      <span className="text-xs">Super Admin</span>
                    ) : (
                      <SclSelect
                        ariaLabel="Role"
                        value={u.role}
                        onChange={(v) => updateRole(u.id, v as UserRole)}
                        options={ROLE_OPTIONS.map((r) => ({ value: r, label: r }))}
                        size="sm"
                        className="w-36"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDot[u.status]}`} />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1">
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
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground text-xs">{u.joinedOn}</td>
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
      <div className="overflow-x-auto scl-scroll">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="px-4 py-2.5 text-left w-8">
                <Checkbox checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-4 py-2.5 text-left whitespace-nowrap">Agent name</th>
              <th className="px-4 py-2.5 text-left whitespace-nowrap">Description</th>
              <th className="px-4 py-2.5 text-left whitespace-nowrap">Webhook URL</th>
              <th className="px-4 py-2.5 text-left whitespace-nowrap">Status</th>
              <th className="px-4 py-2.5 text-left whitespace-nowrap">Assigned conversations</th>
              <th className="px-4 py-2.5 text-left whitespace-nowrap">Connected on</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => {
              const meta = AGENT_META[a.id] ?? {
                conversations: 0,
                connectedOn: "Today",
              };
              return (
                <tr key={a.id} className="border-b border-border/60 hover:bg-gray-50 h-14">
                  <td className="px-4 py-3 align-middle">
                    <Checkbox
                      checked={selected.includes(a.id)}
                      onChange={() => toggleOne(a.id)}
                    />
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 grid place-items-center text-primary">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground max-w-sm">
                    <span className="block truncate">{a.description}</span>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground font-mono text-xs max-w-xs">
                    <span className="block truncate">{a.webhookUrl}</span>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-2 py-0.5 text-[10px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground">{meta.conversations}</td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground text-xs">{meta.connectedOn}</td>
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
// ============================================================
// Team Management
// ============================================================

type Team = {
  id: string;
  name: string;
  channelId: string | null;
  memberIds: string[];
  updatedOn: string;
};

const INITIAL_TEAMS: Team[] = [
  {
    id: "team-cs",
    name: "Customer Support",
    channelId: "northstar-support",
    memberIds: ["u-tom", "u-sara", "u-aria", "u-pending-2"],
    updatedOn: "Jun 12, 2026",
  },
  {
    id: "team-mkt",
    name: "Marketing",
    channelId: "northstar-marketing",
    memberIds: ["u-luca", "u-aria"],
    updatedOn: "Jun 09, 2026",
  },
  {
    id: "team-sales",
    name: "Sales",
    channelId: "northstar-sales",
    memberIds: ["u-mei", "u-pending-1"],
    updatedOn: "Jun 05, 2026",
  },
];

function channelLabel(id: string | null): string {
  if (!id) return "—";
  const c = WHATSAPP_CHANNELS.find((x) => x.id === id);
  return c ? c.name : "—";
}

function TeamManagementPage() {
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [users, setUsers] = useState<WorkspaceUser[]>(USERS_SEED);
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const openTeam = teams.find((t) => t.id === openTeamId) ?? null;

  if (openTeam) {
    return (
      <TeamDetailPage
        team={openTeam}
        users={users}
        onBack={() => setOpenTeamId(null)}
        onUpdate={(patch) =>
          setTeams((s) =>
            s.map((t) =>
              t.id === openTeam.id
                ? { ...t, ...patch, updatedOn: todayLabel() }
                : t,
            ),
          )
        }
        onUsersChange={setUsers}
      />
    );
  }

  const filtered = teams.filter((t) =>
    search.trim() ? t.name.toLowerCase().includes(search.toLowerCase()) : true,
  );

  const allSelected =
    filtered.length > 0 && filtered.every((t) => selected.includes(t.id));
  const toggleAll = () =>
    setSelected(allSelected ? [] : filtered.map((t) => t.id));
  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleDelete = () => {
    setTeams((s) => s.filter((t) => !selected.includes(t.id)));
    toast.success(`${selected.length} team(s) deleted`);
    setSelected([]);
  };

  const handleCreate = (name: string, channelId: string | null) => {
    const id = `team-${Date.now()}`;
    setTeams((s) => [
      ...s,
      { id, name, channelId, memberIds: [], updatedOn: todayLabel() },
    ]);
    toast.success("Team created");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 px-1 pt-0.5">
        <div>
          <h2 className="text-xl font-semibold leading-tight m-0">Team Management</h2>
          <p className="text-xs text-muted-foreground mt-1 m-0">
            Manage workspace teams and dedicated channel ownership
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="h-9 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Create Team
        </button>
      </div>

      <SectionCard>
        <div className="p-4 flex flex-wrap items-center gap-2 border-b border-border">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by team name"
              className="h-9 w-full rounded-md border border-border bg-background/60 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        {selected.length > 0 && (
          <div className="px-4 py-2 flex items-center gap-3 bg-primary/10 border-b border-primary/20 text-xs">
            <span className="font-medium">{selected.length} selected</span>
            <button
              onClick={() => setConfirmDelete(true)}
              className="ml-auto h-8 inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 text-destructive-foreground font-medium hover:bg-destructive/90"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Team
            </button>
          </div>
        )}

        <div className="overflow-x-auto scl-scroll">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-2.5 text-left w-8">
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Team Name</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Members</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Dedicated Channel</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setOpenTeamId(t.id)}
                  className="border-b border-border/60 hover:bg-gray-50 h-14 cursor-pointer"
                >
                  <td
                    className="px-4 py-3 align-middle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selected.includes(t.id)}
                      onChange={() => toggleOne(t.id)}
                    />
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 grid place-items-center text-primary">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground">
                    {t.memberIds.length}
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    {t.channelId ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-2 py-0.5 text-[10px]">
                        WhatsApp · {channelLabel(t.channelId)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground text-xs">
                    {t.updatedOn}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No teams found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {createOpen && (
        <TeamFormModal
          title="Create Team"
          submitLabel="Create Team"
          onClose={() => setCreateOpen(false)}
          onSubmit={(name, channelId) => {
            handleCreate(name, channelId);
            setCreateOpen(false);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Team"
        description="Are you sure you want to delete this team?"
        confirmLabel="Delete"
      />
    </div>
  );
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function TeamFormModal({
  title,
  submitLabel,
  initialName = "",
  initialChannelId = null,
  onClose,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  initialName?: string;
  initialChannelId?: string | null;
  onClose: () => void;
  onSubmit: (name: string, channelId: string | null) => void;
}) {
  const [name, setName] = useState(initialName);
  const [channelId, setChannelId] = useState<string | null>(initialChannelId);

  const channelOptions = [
    { value: "__none", label: "No dedicated channel" },
    ...WHATSAPP_CHANNELS.map((c) => ({
      value: c.id,
      label: c.name,
      trailing: c.phone,
    })),
  ];

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="px-5 pt-5 pb-3 flex items-start justify-between">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4 border-t border-border">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Team name <span className="text-destructive">*</span>
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Customer Support"
              className="mt-1 h-9 w-full rounded-md border border-border bg-background/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Dedicated channel (optional)
            </span>
            <div className="mt-1">
              <SclSelect
                value={channelId ?? "__none"}
                onChange={(v) => setChannelId(v === "__none" ? null : v)}
                options={channelOptions}
                placeholder="Select a channel"
              />
            </div>
          </label>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-border bg-card/60 hover:bg-card px-3 h-9 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => onSubmit(name.trim(), channelId)}
            className="inline-flex items-center rounded-md px-3 h-9 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamDetailPage({
  team,
  users,
  onBack,
  onUpdate,
  onUsersChange: _onUsersChange,
}: {
  team: Team;
  users: WorkspaceUser[];
  onBack: () => void;
  onUpdate: (patch: Partial<Team>) => void;
  onUsersChange: (users: WorkspaceUser[]) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const members = users.filter((u) => team.memberIds.includes(u.id));
  const allSelected =
    members.length > 0 && members.every((m) => selected.includes(m.id));
  const toggleAll = () =>
    setSelected(allSelected ? [] : members.map((m) => m.id));
  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleRemove = () => {
    onUpdate({ memberIds: team.memberIds.filter((id) => !selected.includes(id)) });
    toast.success(`${selected.length} member(s) removed`);
    setSelected([]);
  };

  return (
    <div className="space-y-5">
      <div className="px-1 pt-0.5">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Team Management
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold leading-tight m-0">{team.name}</h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                Dedicated Channel
              </span>
              {team.channelId ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-2 py-0.5 text-[10px]">
                  WhatsApp · {channelLabel(team.channelId)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">None</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="h-9 inline-flex items-center gap-1.5 rounded-md border border-border bg-white/[0.03] px-3 text-xs font-medium hover:bg-gray-100"
            >
              Edit Team
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="h-9 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add Team Members
            </button>
          </div>
        </div>
      </div>

      <SectionCard
        title="Team members"
        description={`${members.length} member${members.length === 1 ? "" : "s"} in this team`}
      >
        {selected.length > 0 && (
          <div className="px-4 py-2 flex items-center gap-3 bg-primary/10 border-b border-primary/20 text-xs">
            <span className="font-medium">{selected.length} selected</span>
            <button
              onClick={() => setConfirmRemove(true)}
              className="ml-auto h-8 inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 text-destructive-foreground font-medium hover:bg-destructive/90"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove From Team
            </button>
          </div>
        )}
        <div className="overflow-x-auto scl-scroll">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-2.5 text-left w-8">
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Name</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Email</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Role</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Job Title</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Date Added</th>
              </tr>
            </thead>
            <tbody>
              {members.map((u) => (
                <tr key={u.id} className="border-b border-border/60 hover:bg-gray-50 h-14">
                  <td className="px-4 py-3 align-middle">
                    <Checkbox
                      checked={selected.includes(u.id)}
                      onChange={() => toggleOne(u.id)}
                    />
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/40 to-primary/0 grid place-items-center text-[10px] font-semibold">
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">{u.role}</td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground">{u.job}</td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground text-xs">{u.joinedOn}</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No members yet. Click “Add Team Members” to invite users to this team.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {editOpen && (
        <TeamFormModal
          title="Edit Team"
          submitLabel="Save Changes"
          initialName={team.name}
          initialChannelId={team.channelId}
          onClose={() => setEditOpen(false)}
          onSubmit={(name, channelId) => {
            onUpdate({ name, channelId });
            setEditOpen(false);
            toast.success("Team updated");
          }}
        />
      )}

      {addOpen && (
        <AddMembersModal
          users={users}
          existingIds={team.memberIds}
          onClose={() => setAddOpen(false)}
          onSubmit={(ids) => {
            onUpdate({ memberIds: Array.from(new Set([...team.memberIds, ...ids])) });
            setAddOpen(false);
            toast.success(`${ids.length} member(s) added`);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={handleRemove}
        title="Remove Members"
        description="Are you sure you want to remove the selected members from this team?"
        confirmLabel="Remove"
      />
    </div>
  );
}

function AddMembersModal({
  users,
  existingIds,
  onClose,
  onSubmit,
}: {
  users: WorkspaceUser[];
  existingIds: string[];
  onClose: () => void;
  onSubmit: (ids: string[]) => void;
}) {
  const candidates = users.filter((u) => !existingIds.includes(u.id));
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const toggle = (id: string) =>
    setPicked((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const filtered = candidates.filter((u) =>
    query.trim()
      ? (u.name + u.email).toLowerCase().includes(query.toLowerCase())
      : true,
  );

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="px-5 pt-5 pb-3 flex items-start justify-between">
          <h2 className="text-sm font-semibold">Add Team Members</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 border-t border-border">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Members
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users…"
              className="h-9 w-full rounded-md border border-border bg-background/60 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="max-h-72 overflow-auto scl-scroll rounded-md border border-border divide-y divide-border">
            {filtered.map((u) => {
              const checked = picked.includes(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => toggle(u.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
                >
                  <Checkbox checked={checked} onChange={() => toggle(u.id)} />
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/40 to-primary/0 grid place-items-center text-[10px] font-semibold">
                    {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{u.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {u.email}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{u.role}</span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                No users available to add.
              </div>
            )}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-border bg-card/60 hover:bg-card px-3 h-9 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            disabled={picked.length === 0}
            onClick={() => onSubmit(picked)}
            className="inline-flex items-center rounded-md px-3 h-9 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Members
          </button>
        </div>
      </div>
    </div>
  );
}
