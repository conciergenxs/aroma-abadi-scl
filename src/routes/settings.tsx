import { createFileRoute } from "@tanstack/react-router";
import { nowWIB } from "@/lib/wib";
import { fmtDateEN } from "@/lib/fmt";
import { Toggle } from "@/components/scl/toggle";
import { AppShell, SectionCard, StatusPill } from "@/components/scl/app-shell";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { ConfirmDialog } from "@/components/scl/confirm-dialog";
import { SclSelect } from "@/components/scl/scl-select";
import { RolesPermissionsModule } from "@/components/scl/roles-permissions";
import { DataManagementModule } from "@/components/scl/data-management";
import { useCurrentUser, type WorkspaceRole } from "@/components/scl/session-store";

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
    label: "Workspace",
    items: [
      { id: "user-management", label: "User Management", enabled: true },
      { id: "roles", label: "Roles & Permissions", enabled: true },
    ],
  },
  {
    id: "data",
    label: "Data management",
    items: [
      { id: "labels", label: "Labels", enabled: true },
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
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
        <aside className="rounded-xl border border-border bg-card/60 glass p-2 h-fit sticky top-0 self-start">
          {NAV.map((section) => {
            const isOpen = open[section.id];
            return (
              <div key={section.id} className="mb-1">
                {section.id !== "company" ? (
                  <button
                    onClick={() => setOpen((o) => ({ ...o, [section.id]: !o[section.id] }))}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55 hover:text-muted-foreground/80 transition-colors duration-150"
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
          {active === "user-management" && <UserManagementPage />}
          {active === "roles" && <RolesPermissionsModule />}
          {(active === "labels" ||
            active === "customer-lifecycle" ||
            active === "recently-deleted") && <DataManagementModule section={active} />}
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
          Your personal profile, and how customers reach Arma on WhatsApp
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-border">
        {GENERAL_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-3 py-2 text-[14px] transition-colors duration-150 ${
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
            {tab === t && (
              <span className="animate-grow-x absolute inset-x-0 -bottom-px h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {tab === "Profile" ? <ProfileTab /> : <WhatsAppQrTab />}
    </div>
  );
}

// ---------- Profile Tab ----------

function ProfileTab() {
  const user = useCurrentUser();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [first, setFirst] = useState(user.name.split(" ")[0] ?? "");
  const [last, setLast] = useState(user.name.split(" ").slice(1).join(" "));
  const [phone, setPhone] = useState(user.phone);
  const [job, setJob] = useState(user.job);
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
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white/[0.03] px-3 py-1.5 text-xs font-medium hover:bg-gray-100 transition-colors duration-150"
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
          <TextField label="Email" value={user.email} onChange={() => {}} readOnly />
          <TextField label="Phone number" value={phone} onChange={setPhone} />
          <TextField label="Job title" value={job} onChange={setJob} />
          {/* Read-only: a role is granted in Roles & Permissions by an admin,
              never chosen by the person it applies to. */}
          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Role</span>
            <div className="mt-1 flex h-9 items-center gap-2">
              <StatusPill tone={user.role === "Staff" ? "neutral" : "positive"}>
                {user.role}
              </StatusPill>
              <span className="text-[12px] text-muted-foreground">
                Set in Roles &amp; Permissions.
              </span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ---------- WhatsApp QR Tab ----------

/* The entry point customers use to reach Arma. The workspace answers on one
 * WhatsApp number, so there is nothing to pick here — only the message the
 * conversation opens with. */

function WhatsAppQrTab() {
  const arma = WHATSAPP_CHANNELS[0];
  const [message, setMessage] = useState("Hi Arma, I'd like to know more about Aroma Abadi.");

  const waLink = useMemo(() => {
    const phone = arma.phone.replace(/[^\d]/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }, [arma.phone, message]);

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
      a.download = "arma-whatsapp-qr.png";
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
      <SectionCard title="Arma on WhatsApp">
        <div className="p-5 text-[14px] text-muted-foreground">
          Put this QR code on packaging, counters or campaign material. Scanning it — or opening the
          link — starts a WhatsApp chat with Arma, pre-filled with the message below, and the
          conversation lands in Inbox.
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] items-start gap-5">
        <SectionCard title="Opening message">
          <div className="p-5 space-y-4">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Pre-filled message
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-md border border-border bg-background/60 px-3 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
              />
              <p className="mt-1.5 text-[12px] text-muted-foreground">
                What the customer sends when the chat opens — Arma replies from there.
              </p>
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Preview">
          <div className="p-5 flex flex-col items-center text-center gap-3">
            <div className="rounded-lg border border-border bg-white p-2">
              <img
                src={qrSrc}
                alt="QR code that opens a WhatsApp chat with Arma"
                className="h-[240px] w-[240px] block"
              />
            </div>
            <div>
              <div className="text-[14px] font-semibold flex items-center gap-1.5 justify-center">
                <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
                {arma.name}
              </div>
              <div className="text-[12px] text-muted-foreground">{arma.phone}</div>
            </div>
            <div className="flex items-center gap-2 pt-1 w-full">
              <button
                onClick={download}
                className="press flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-md border border-border bg-white/[0.03] text-[12px] font-medium hover:bg-gray-100 transition-colors duration-150"
              >
                <Download className="h-3.5 w-3.5" /> Download QR
              </button>
              <button
                onClick={copy}
                className="press flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-md bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors duration-150"
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

type UserRole = WorkspaceRole;
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
    role: "Area Coordinator",
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
    role: "Area Coordinator",
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

const ROLE_OPTIONS: UserRole[] = ["Super Admin", "Admin", "Area Coordinator", "Staff"];
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
        search.trim() ? (u.name + u.email).toLowerCase().includes(search.toLowerCase()) : true,
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
          className="h-9 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
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
                <span className="animate-grow-x absolute inset-x-0 -bottom-px h-0.5 bg-primary rounded-full" />
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
            className="h-9 inline-flex items-center gap-1.5 rounded-md border border-border bg-white/[0.03] px-3 text-xs hover:bg-gray-100 transition-colors duration-150"
          >
            <Filter className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        {selected.length > 0 && (
          <div className="px-4 py-2 flex items-center gap-3 bg-primary/10 border-b border-primary/20 text-xs">
            <span className="font-medium">{selected.length} selected</span>
            <button
              onClick={() => setConfirmDelete(true)}
              className="ml-auto h-8 inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors duration-150"
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
            <tbody className="stagger">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border/60 hover:bg-gray-50 h-14 transition-colors duration-150"
                >
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
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground">
                    {u.email}
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground">
                    {u.job}
                  </td>
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
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground text-xs">
                    {u.joinedOn}
                  </td>
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
