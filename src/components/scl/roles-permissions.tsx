import { useMemo, useState } from "react";
import { Toggle } from "./toggle";
import { nowWIB } from "@/lib/wib";
import { fmtDateEN } from "@/lib/fmt";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  Pencil,
  X,
  ShieldCheck,
  Search,
  UserPlus,
} from "lucide-react";
import { LITE_MODE } from "@/lib/feature-flags";
import { toast } from "sonner";
import { SectionCard } from "@/components/scl/app-shell";
import { SclSelect, type SclSelectOption } from "@/components/scl/scl-select";
import { ConfirmDialog } from "@/components/scl/confirm-dialog";

// ----- Permission schema -----

type AccessOption = "none" | "limited" | "full";
const ACCESS_3: SclSelectOption[] = [
  { value: "none", label: "No Access", dot: "bg-muted-foreground/40" },
  { value: "limited", label: "Limited Access", dot: "bg-amber-400" },
  { value: "full", label: "Full Access", dot: "bg-emerald-400" },
];
const ACCESS_2: SclSelectOption[] = [
  { value: "none", label: "No Access", dot: "bg-muted-foreground/40" },
  { value: "full", label: "Full Access", dot: "bg-emerald-400" },
];

type PermItem = {
  id: string;
  label: string;
  /** Render a select after the checkbox. */
  select?: "3" | "2";
  /** Default checkbox value. */
  defaultChecked?: boolean;
  /** Default select value. */
  defaultAccess?: AccessOption;
  /** Nested children (rendered indented under this item). */
  children?: PermItem[];
};

type PermGroup = { id: string; label: string; items: PermItem[] };

type PermCategory = {
  id: string;
  label: string;
  masterLabel: string;
  masterDescription: string;
  groups: PermGroup[];
};

type CategorySection = { id: string; label: string; categories: PermCategory[] };

/* The permission tree follows this product's own menu. The version inherited
 * from the generic SCL described a different app — calls, payment links, live
 * monitoring — while saying nothing about the two things that actually carry
 * risk here: the knowledge every Beauty Ambassador reads in the LMS, and the
 * BA accounts themselves. */
const SCHEMA: CategorySection[] = [
  {
    id: "conversations",
    label: "Conversations & Contacts",
    categories: [
      {
        id: "inbox",
        label: "Inbox",
        masterLabel: "Inbox Access",
        masterDescription: "Handle WhatsApp conversations with customers and Beauty Ambassadors.",
        groups: [
          {
            id: "inbox-basic",
            label: "Conversations",
            items: [
              { id: "inbox-view", label: "View Conversations", defaultChecked: true },
              { id: "inbox-send", label: "Send Messages", defaultChecked: true },
              { id: "inbox-assign", label: "Assign & Transfer Conversations" },
            ],
          },
        ],
      },
      {
        id: "contacts",
        label: "Contacts",
        masterLabel: "Contacts Access",
        masterDescription: "The customer directory, its labels, lifecycle stages and properties.",
        groups: [
          {
            id: "contacts-basic",
            label: "Contact Records",
            items: [
              { id: "contacts-view", label: "View Contacts", defaultChecked: true },
              { id: "contacts-create", label: "Create Contacts", defaultChecked: true },
              { id: "contacts-edit", label: "Edit Contacts", defaultChecked: true },
              { id: "contacts-delete", label: "Delete Contacts" },
              { id: "contacts-export", label: "Export Contacts" },
            ],
          },
          {
            id: "contacts-schema",
            label: "Data Structure",
            items: [
              { id: "contacts-properties", label: "Manage Contact Properties" },
              { id: "contacts-labels", label: "Manage Labels & Lifecycle Stages" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "outbound",
    label: "Outbound",
    categories: [
      {
        id: "broadcast",
        label: "Broadcast & Templates",
        masterLabel: "Broadcast Access",
        masterDescription: "Compose campaigns, and decide who may actually send them.",
        groups: [
          {
            id: "broadcast-basic",
            label: "Campaigns",
            items: [
              { id: "broadcast-view", label: "View Broadcasts & Logs", defaultChecked: true },
              { id: "broadcast-create", label: "Create & Edit Broadcasts" },
              { id: "broadcast-send", label: "Send & Schedule Broadcasts" },
              { id: "broadcast-recurring", label: "Start & Stop Recurring Broadcasts" },
            ],
          },
          {
            id: "broadcast-templates",
            label: "Templates",
            items: [
              { id: "templates-view", label: "View Templates", defaultChecked: true },
              { id: "templates-manage", label: "Create & Edit Templates" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "enablement",
    label: "BA Enablement",
    categories: [
      {
        id: "knowledge",
        label: "SKU & Knowledge",
        masterLabel: "Knowledge Access",
        masterDescription:
          "Brands, categories, SKUs and the knowledge cards Beauty Ambassadors read in the LMS.",
        groups: [
          {
            id: "knowledge-read",
            label: "Reading",
            items: [
              { id: "knowledge-view", label: "View Knowledge Content", defaultChecked: true },
            ],
          },
          {
            id: "knowledge-write",
            label: "Publishing",
            items: [
              { id: "knowledge-brands", label: "Manage Brands & Categories" },
              { id: "knowledge-modules", label: "Manage Modules" },
              { id: "knowledge-cards", label: "Manage Knowledge Cards" },
            ],
          },
        ],
      },
      {
        id: "ba",
        label: "Beauty Ambassadors",
        masterLabel: "BA Access",
        masterDescription:
          "The BA directory and their LMS credentials. An Area Coordinator sees only their own area.",
        groups: [
          {
            id: "ba-read",
            label: "Directory",
            items: [
              { id: "ba-view", label: "View Beauty Ambassadors", defaultChecked: true },
              { id: "ba-scope", label: "See Every Area", select: "2", defaultAccess: "none" },
            ],
          },
          {
            id: "ba-write",
            label: "Accounts",
            items: [
              { id: "ba-create", label: "Add Beauty Ambassadors" },
              { id: "ba-edit", label: "Edit BA Details & Brand Assignment" },
              { id: "ba-password", label: "Reveal & Reset LMS Passwords" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    categories: [
      {
        id: "commerce",
        label: LITE_MODE ? "Promo & Transactions" : "Promo, Referral & Transactions",
        masterLabel: "Commerce Access",
        masterDescription: LITE_MODE
          ? "Promo codes and the transaction ledger."
          : "Promo codes, referral seasons and the transaction ledger.",
        groups: [
          {
            id: "commerce-read",
            label: "Reading",
            items: [
              {
                id: "commerce-view",
                label: LITE_MODE
                  ? "View Promo & Transactions"
                  : "View Promo, Referral & Transactions",
                defaultChecked: true,
              },
            ],
          },
          {
            id: "commerce-write",
            label: "Creating",
            items: [
              { id: "promo-manage", label: "Create & Edit Promo Codes" },
              // The lite build has no referral seasons to permit.
              ...(LITE_MODE
                ? []
                : [{ id: "referral-manage", label: "Create & Edit Referral Seasons" }]),
              { id: "transactions-manage", label: "Record Transactions" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    categories: [
      {
        id: "settings",
        label: "Settings",
        masterLabel: "Settings Access",
        masterDescription: "Workspace preferences, the people in it, and what they may do.",
        groups: [
          {
            id: "settings-basic",
            label: "Settings",
            items: [
              { id: "settings-view", label: "Open Settings" },
              { id: "settings-users", label: "Invite & Manage Users" },
              { id: "settings-roles", label: "Manage Roles & Permissions" },
            ],
          },
        ],
      },
    ],
  },
];

// Permission state: per-item checked + access value, per-category master toggle
type PermState = {
  master: Record<string, boolean>;
  items: Record<string, { checked: boolean; access?: AccessOption }>;
};

function flattenItems(items: PermItem[]): PermItem[] {
  return items.flatMap((i) => [i, ...(i.children ? flattenItems(i.children) : [])]);
}

/* What each seeded role starts with. Previously every role was built from the
 * same defaults, so the four of them differed in name only. */
const ROLE_GRANTS: Record<string, { categories: string[]; items: string[] }> = {
  "Super Admin": { categories: ["*"], items: ["*"] },
  Admin: {
    categories: ["inbox", "contacts", "broadcast", "knowledge", "ba", "commerce", "settings"],
    items: ["*", "-settings-roles"],
  },
  // Looks after their own area's BAs; reads knowledge but never edits it, and
  // the commercial pages aren't theirs at all.
  "Area Coordinator": {
    categories: ["inbox", "contacts", "knowledge", "ba"],
    items: [
      "inbox-view",
      "inbox-send",
      "contacts-view",
      "contacts-create",
      "contacts-edit",
      "knowledge-view",
      "ba-view",
      "ba-create",
      "ba-edit",
      "ba-password",
    ],
  },
  // Desk work: conversations, contacts and the commercial pages.
  Staff: {
    categories: ["inbox", "contacts", "broadcast", "knowledge", "ba", "commerce"],
    items: [
      "inbox-view",
      "inbox-send",
      "contacts-view",
      "contacts-create",
      "contacts-edit",
      "broadcast-view",
      "broadcast-create",
      "templates-view",
      "knowledge-view",
      "ba-view",
      "commerce-view",
      "promo-manage",
      "referral-manage",
      "transactions-manage",
    ],
  },
};

function buildStateForRole(roleName: string): PermState {
  const grant = ROLE_GRANTS[roleName];
  const master: Record<string, boolean> = {};
  const items: Record<string, { checked: boolean; access?: AccessOption }> = {};
  const allows = (list: string[], id: string) =>
    list.includes("*") ? !list.includes(`-${id}`) : list.includes(id);

  for (const sec of SCHEMA) {
    for (const cat of sec.categories) {
      master[cat.id] = grant ? allows(grant.categories, cat.id) : true;
      for (const g of cat.groups) {
        for (const it of flattenItems(g.items)) {
          const checked = grant
            ? master[cat.id] && allows(grant.items, it.id)
            : !!it.defaultChecked;
          items[it.id] = {
            checked,
            access: it.select ? (checked ? "full" : (it.defaultAccess ?? "none")) : undefined,
          };
        }
      }
    }
  }
  return { master, items };
}

/** A brand-new custom role starts from the quietest sensible position. */
function buildDefaultState(): PermState {
  return buildStateForRole("Staff");
}

// ----- Public types -----

export type Role = {
  id: string;
  name: string;
  description: string;
  state: PermState;
  /** System roles cannot be deleted or renamed. */
  system?: boolean;
};

const SEED_ROLES: Role[] = [
  {
    id: "r-super",
    name: "Super Admin",
    description: "Full unrestricted access to all workspace features and settings.",
    state: buildStateForRole("Super Admin"),
    system: true,
  },
  {
    id: "r-admin",
    name: "Admin",
    description: "Runs the workspace day to day: knowledge, BA accounts, broadcasts and commerce.",
    state: buildStateForRole("Admin"),
  },
  {
    id: "r-area-coordinator",
    name: "Area Coordinator",
    description: "Looks after the Beauty Ambassadors in their own area.",
    state: buildStateForRole("Area Coordinator"),
  },
  {
    id: "r-staff",
    name: "Staff",
    description: LITE_MODE
      ? "Conversations, contacts, and the promo and transaction pages."
      : "Conversations, contacts, and the promo, referral and transaction pages.",
    state: buildStateForRole("Staff"),
  },
];

// ----- Assigned-users seed (module-local) -----

export type AssignedUser = {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  team: string;
  assignedDate: string;
  /** Role name; matched against Role.name. */
  role: string;
};

const SEED_USERS: AssignedUser[] = [
  {
    id: "u-aria",
    name: "Aria Kapoor",
    email: "aria.kapoor@northstar.co",
    jobTitle: "Workspace Owner",
    team: "Customer Support",
    assignedDate: "Jan 12, 2024",
    role: "Super Admin",
  },
  {
    id: "u-jonas",
    name: "Jonas Weber",
    email: "jonas.weber@northstar.co",
    jobTitle: "CTO",
    team: "Operations",
    assignedDate: "Jan 14, 2024",
    role: "Super Admin",
  },
  {
    id: "u-ines",
    name: "Ines Carvalho",
    email: "ines.c@northstar.co",
    jobTitle: "VP Customer",
    team: "Customer Support",
    assignedDate: "Jan 20, 2024",
    role: "Super Admin",
  },
  {
    id: "u-tom",
    name: "Tomas Bergstrom",
    email: "tomas.b@northstar.co",
    jobTitle: "Head of Support",
    team: "Customer Support",
    assignedDate: "Feb 02, 2024",
    role: "Admin",
  },
  {
    id: "u-priya",
    name: "Priya Shah",
    email: "priya.shah@northstar.co",
    jobTitle: "Operations Manager",
    team: "Operations",
    assignedDate: "Feb 18, 2024",
    role: "Admin",
  },
  {
    id: "u-mei",
    name: "Mei Tanaka",
    email: "mei.tanaka@northstar.co",
    jobTitle: "Sales Lead",
    team: "Sales",
    assignedDate: "Mar 18, 2024",
    role: "Area Coordinator",
  },
  {
    id: "u-luca",
    name: "Luca Romano",
    email: "luca.romano@northstar.co",
    jobTitle: "Marketing Manager",
    team: "Marketing",
    assignedDate: "Apr 04, 2024",
    role: "Area Coordinator",
  },
  {
    id: "u-sara",
    name: "Sara Iqbal",
    email: "sara.iqbal@northstar.co",
    jobTitle: "Support Specialist",
    team: "Customer Support",
    assignedDate: "May 22, 2024",
    role: "Staff",
  },
  {
    id: "u-dimas",
    name: "Dimas Pratama",
    email: "dimas.p@northstar.co",
    jobTitle: "Operations Analyst",
    team: "Operations",
    assignedDate: "Jun 09, 2024",
    role: "Staff",
  },
  {
    id: "u-hana",
    name: "Hana Wijaya",
    email: "hana.wijaya@northstar.co",
    jobTitle: "Sales Associate",
    team: "Sales",
    assignedDate: "Jul 03, 2024",
    role: "Staff",
  },
  {
    id: "u-marco",
    name: "Marco Silva",
    email: "marco.silva@northstar.co",
    jobTitle: "Support Agent",
    team: "Customer Support",
    assignedDate: "Aug 15, 2024",
    role: "Staff",
  },
  {
    id: "u-noor",
    name: "Noor Hassan",
    email: "noor.h@northstar.co",
    jobTitle: "Customer Insights",
    team: "Marketing",
    assignedDate: "Sep 01, 2024",
    role: "Staff",
  },
];

// ----- UI atoms -----

function Checkbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`h-4 w-4 grid place-items-center rounded-sm border transition shrink-0 ${
        disabled
          ? "border-border/50 bg-transparent cursor-not-allowed opacity-40"
          : checked
            ? "bg-primary border-primary"
            : "border-border hover:border-primary/60 bg-background/40"
      }`}
    >
      {checked && <Check className="h-3 w-3 text-primary-foreground" />}
    </button>
  );
}

// ----- Main component -----

type View =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; roleId: string }
  | { mode: "detail"; roleId: string };

export function RolesPermissionsModule() {
  const [roles, setRoles] = useState<Role[]>(SEED_ROLES);
  const [users, setUsers] = useState<AssignedUser[]>(SEED_USERS);
  const [view, setView] = useState<View>({ mode: "list" });
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const usersByRole = (roleName: string) => users.filter((u) => u.role === roleName);

  if (view.mode === "create") {
    return (
      <RoleEditor
        onCancel={() => setView({ mode: "list" })}
        onSubmit={(name, description, state) => {
          const id = `r-${Date.now()}`;
          setRoles((s) => [...s, { id, name, description, state }]);
          toast.success(`Role "${name}" created`);
          setView({ mode: "list" });
        }}
      />
    );
  }

  if (view.mode === "edit") {
    const role = roles.find((r) => r.id === view.roleId);
    if (!role) {
      setView({ mode: "list" });
      return null;
    }
    return (
      <RoleEditor
        initial={role}
        onCancel={() => setView({ mode: "detail", roleId: role.id })}
        onSubmit={(name, description, state) => {
          setRoles((s) =>
            s.map((r) =>
              r.id === role.id ? { ...r, name: r.system ? r.name : name, description, state } : r,
            ),
          );
          // If role name changed, propagate to assigned users
          if (!role.system && role.name !== name) {
            setUsers((s) => s.map((u) => (u.role === role.name ? { ...u, role: name } : u)));
          }
          toast.success(`Role "${name}" updated`);
          setView({ mode: "detail", roleId: role.id });
        }}
      />
    );
  }

  if (view.mode === "detail") {
    const role = roles.find((r) => r.id === view.roleId);
    if (!role) {
      setView({ mode: "list" });
      return null;
    }
    return (
      <RoleDetailPage
        role={role}
        roles={roles}
        users={usersByRole(role.name)}
        allUsers={users}
        onBack={() => setView({ mode: "list" })}
        onEdit={() => setView({ mode: "edit", roleId: role.id })}
        onDelete={() => {
          setRoles((s) => s.filter((r) => r.id !== role.id));
          toast.success(`Role "${role.name}" deleted`);
          setView({ mode: "list" });
        }}
        onRemoveUsers={(ids) => {
          // "Remove role" = unassign — for the prototype, we drop them from this role list.
          setUsers((s) => s.filter((u) => !ids.includes(u.id)));
          toast.success(`${ids.length} user(s) removed from role`);
        }}
        onAssignUsers={(ids) => {
          setUsers((s) =>
            s.map((u) =>
              ids.includes(u.id) ? { ...u, role: role.name, assignedDate: fmtDateEN(nowWIB()) } : u,
            ),
          );
          toast.success("Users assigned successfully.");
        }}
      />
    );
  }

  const allSelected = roles.length > 0 && roles.every((r) => selected.includes(r.id));
  const toggleAll = () => setSelected(allSelected ? [] : roles.map((r) => r.id));
  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleDelete = () => {
    const protectedIds = roles.filter((r) => r.system).map((r) => r.id);
    const removable = selected.filter((id) => !protectedIds.includes(id));
    if (removable.length === 0) {
      toast.error("System roles cannot be deleted");
      setSelected([]);
      return;
    }
    setRoles((s) => s.filter((r) => !removable.includes(r.id)));
    toast.success(`${removable.length} role(s) deleted`);
    setSelected([]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 px-1 pt-0.5">
        <div>
          <h2 className="text-xl font-semibold leading-tight m-0">Roles & Permissions</h2>
          <p className="text-xs text-muted-foreground mt-1 m-0">
            Create and manage custom roles and permission levels for workspace members.
          </p>
        </div>
        <button
          onClick={() => setView({ mode: "create" })}
          className="h-9 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
        >
          <Plus className="h-3.5 w-3.5" /> Create New Role
        </button>
      </div>

      <SectionCard>
        {selected.length > 0 && (
          <div className="px-4 py-2 flex items-center gap-3 bg-primary/10 border-b border-primary/20 text-xs">
            <span className="font-medium">{selected.length} selected</span>
            <button
              onClick={() => setConfirmDelete(true)}
              className="ml-auto h-8 inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors duration-150"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Role
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
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Role Name</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Description</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Assigned Users</th>
                <th className="px-4 py-2.5 text-left w-8" />
              </tr>
            </thead>
            <tbody className="stagger">
              {roles.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setView({ mode: "detail", roleId: r.id })}
                  className="border-b border-border/60 hover:bg-gray-50 h-14 cursor-pointer transition-colors duration-150"
                >
                  <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.includes(r.id)} onChange={() => toggleOne(r.id)} />
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap font-medium">
                    <span className="inline-flex items-center gap-2">
                      {r.name}
                      {r.system && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-[10px] uppercase tracking-wider">
                          <ShieldCheck className="h-3 w-3" /> System
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground max-w-md truncate">
                    {r.description}
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground">
                    {usersByRole(r.name).length}{" "}
                    {usersByRole(r.name).length === 1 ? "User" : "Users"}
                  </td>
                  <td className="px-4 py-3 align-middle text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No roles yet.
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
        title="Delete Role"
        description="Are you sure you want to delete the selected role(s)?"
        confirmLabel="Delete"
      />
    </div>
  );
}

// ----- Editor (stepper) -----

type Step = 1 | 2 | 3;
const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Role Info" },
  { id: 2, label: "Permissions" },
  { id: 3, label: "Preview" },
];

function RoleEditor({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: Role;
  onCancel: () => void;
  onSubmit: (name: string, description: string, state: PermState) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [state, setState] = useState<PermState>(initial?.state ?? buildDefaultState());

  const canContinue1 = name.trim().length > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 px-1 pt-0.5">
        <button
          onClick={onCancel}
          className="h-8 w-8 grid place-items-center rounded-md border border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-xl font-semibold leading-tight m-0">
            {initial ? `Edit Role` : "Create New Role"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 m-0">
            {initial
              ? "Update role information and permissions."
              : "Define a new role and its permissions."}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="rounded-xl border border-border bg-card/60 glass px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {STEPS.map((s, idx) => {
            const active = step === s.id;
            const done = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div
                  className={`h-7 w-7 rounded-full grid place-items-center text-[11px] font-semibold border transition ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : done
                        ? "bg-primary/15 text-primary border-primary/40"
                        : "bg-background/40 text-muted-foreground border-border"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : s.id}
                </div>
                <div
                  className={`text-xs ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}
                >
                  {s.label}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-px ${done ? "bg-primary/40" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {step === 1 && (
        <SectionCard title="Role Info" description="Name and describe the role.">
          <div className="p-5 space-y-4 max-w-xl">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Role Name <span className="text-destructive">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marketing Manager"
                className="mt-1 h-9 w-full rounded-md border border-border bg-background/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="What does this role do?"
                className="mt-1 w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
              />
            </div>
          </div>
        </SectionCard>
      )}

      {step === 2 && <PermissionsStep state={state} onChange={setState} />}

      {step === 3 && <PreviewStep name={name} description={description} state={state} />}

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          onClick={() => (step === 1 ? onCancel() : setStep((step - 1) as Step))}
          className="h-9 inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-4 text-xs font-medium text-foreground hover:bg-card transition-colors duration-150"
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>
        {step < 3 ? (
          <button
            disabled={step === 1 && !canContinue1}
            onClick={() => setStep((step + 1) as Step)}
            className="h-9 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={() => onSubmit(name.trim(), description.trim(), state)}
            className="h-9 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
          >
            {initial ? "Save Changes" : "Create Role"}
          </button>
        )}
      </div>
    </div>
  );
}

// ----- Step 2: Permissions -----

function PermissionsStep({
  state,
  onChange,
}: {
  state: PermState;
  onChange: (s: PermState) => void;
}) {
  const allCategories = useMemo(() => SCHEMA.flatMap((s) => s.categories), []);
  const [activeId, setActiveId] = useState<string>(allCategories[0]?.id ?? "inbox");

  const setMaster = (id: string, v: boolean) =>
    onChange({ ...state, master: { ...state.master, [id]: v } });

  const setItemChecked = (id: string, v: boolean) =>
    onChange({
      ...state,
      items: { ...state.items, [id]: { ...state.items[id], checked: v } },
    });

  const setItemAccess = (id: string, v: AccessOption) =>
    onChange({
      ...state,
      items: { ...state.items, [id]: { ...state.items[id], access: v } },
    });

  const active = allCategories.find((c) => c.id === activeId)!;
  const masterOn = state.master[active.id] ?? true;

  // Completion = master on AND at least one item checked
  const completion = (cat: PermCategory) => {
    if (!state.master[cat.id]) return "off";
    const items = cat.groups.flatMap((g) => flattenItems(g.items));
    const checked = items.filter((i) => state.items[i.id]?.checked).length;
    if (checked === 0) return "empty";
    if (checked === items.length) return "full";
    return "partial";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">
      <aside className="rounded-xl border border-border bg-card/60 glass p-2 lg:sticky lg:top-[88px] self-start">
        {SCHEMA.map((sec) => (
          <div key={sec.id} className="mb-2">
            <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55">
              {sec.label}
            </div>
            <div className="space-y-0.5">
              {sec.categories.map((cat) => {
                const isActive = activeId === cat.id;
                const status = completion(cat);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveId(cat.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition flex items-center justify-between ${
                      isActive
                        ? "bg-primary/15 text-foreground border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        status === "full"
                          ? "bg-emerald-400"
                          : status === "partial"
                            ? "bg-amber-400"
                            : status === "empty"
                              ? "bg-muted-foreground/30"
                              : "bg-transparent border border-border"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </aside>

      <div className="min-w-0 space-y-5">
        <SectionCard>
          <div className="px-5 py-4 flex items-start gap-4 border-b border-border">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">
                Master Toggle
              </div>
              <div className="text-sm font-medium">{active.masterLabel}</div>
              <p className="text-xs text-muted-foreground mt-1">{active.masterDescription}</p>
            </div>
            <Toggle checked={masterOn} onChange={(v) => setMaster(active.id, v)} />
          </div>

          <div className={`p-5 space-y-5 ${masterOn ? "" : "opacity-40 pointer-events-none"}`}>
            {active.groups.map((g) => (
              <div key={g.id} className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 font-medium">
                  {g.label}
                </div>
                <div className="rounded-lg border border-border divide-y divide-border bg-background/40">
                  {g.items.map((it) => (
                    <PermRow
                      key={it.id}
                      item={it}
                      state={state}
                      onCheck={setItemChecked}
                      onAccess={setItemAccess}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function PermRow({
  item,
  depth = 0,
  state,
  onCheck,
  onAccess,
}: {
  item: PermItem;
  depth?: number;
  state: PermState;
  onCheck: (id: string, v: boolean) => void;
  onAccess: (id: string, v: AccessOption) => void;
}) {
  const it = state.items[item.id] ?? { checked: false };
  const childrenEnabled = it.checked;
  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-2.5" style={{ paddingLeft: 16 + depth * 24 }}>
        <Checkbox checked={it.checked} onChange={(v) => onCheck(item.id, v)} />
        <div className="text-sm flex-1 min-w-0 truncate">{item.label}</div>
        {item.select && (
          <SclSelect
            size="sm"
            className="w-40"
            value={it.access ?? "none"}
            options={item.select === "3" ? ACCESS_3 : ACCESS_2}
            onChange={(v) => onAccess(item.id, v as AccessOption)}
          />
        )}
      </div>
      {item.children && item.children.length > 0 && (
        <div className={childrenEnabled ? "" : "opacity-40 pointer-events-none"}>
          {item.children.map((c) => (
            <PermRow
              key={c.id}
              item={c}
              depth={depth + 1}
              state={state}
              onCheck={onCheck}
              onAccess={onAccess}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ----- Step 3: Preview -----

function PreviewStep({
  name,
  description,
  state,
}: {
  name: string;
  description: string;
  state: PermState;
}) {
  const allCategories = useMemo(() => SCHEMA.flatMap((s) => s.categories), []);

  let full = 0;
  let limited = 0;
  let disabled = 0;
  for (const cat of allCategories) {
    const masterOn = state.master[cat.id];
    const items = cat.groups.flatMap((g) => flattenItems(g.items));
    for (const it of items) {
      const s = state.items[it.id];
      if (!masterOn || !s?.checked) {
        disabled++;
      } else if (it.select && s.access === "limited") {
        limited++;
      } else if (it.select && s.access === "none") {
        disabled++;
      } else {
        full++;
      }
    }
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Role Information">
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">
              Role Name
            </div>
            <div className="text-sm font-medium">
              {name || <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 mb-1">
              Description
            </div>
            <div className="text-sm text-muted-foreground">{description || "—"}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Permission Summary">
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allCategories.map((cat) => {
            const on = !!state.master[cat.id];
            return (
              <div
                key={cat.id}
                className="rounded-lg border border-border bg-background/40 px-4 py-3 flex items-center justify-between"
              >
                <span className="text-sm">{cat.label}</span>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    on
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-border bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {on ? "Enabled" : "Disabled"}
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Access Breakdown">
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 stagger">
          <BreakdownTile label="Full Access" value={full} accent="emerald" />
          <BreakdownTile label="Limited Access" value={limited} accent="amber" />
          <BreakdownTile label="Disabled" value={disabled} accent="muted" />
        </div>
      </SectionCard>
    </div>
  );
}

function BreakdownTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "emerald" | "amber" | "muted";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/5"
      : accent === "amber"
        ? "text-amber-300 border-amber-500/30 bg-amber-500/5"
        : "text-muted-foreground border-border bg-background/40";
  return (
    <div className={`card-hover rounded-lg border px-4 py-4 transition-all duration-300 ${color}`}>
      <div className="stat-value text-2xl font-semibold leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-wider mt-2 opacity-80">{label}</div>
    </div>
  );
}

// ============================================================
// Role Detail Page
// ============================================================

function RoleDetailPage({
  role,
  roles,
  users,
  allUsers,
  onBack,
  onEdit,
  onDelete,
  onRemoveUsers,
  onAssignUsers,
}: {
  role: Role;
  roles: Role[];
  users: AssignedUser[];
  allUsers: AssignedUser[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRemoveUsers: (userIds: string[]) => void;
  onAssignUsers: (userIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDeleteRole, setConfirmDeleteRole] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const allSelected = users.length > 0 && users.every((u) => selected.includes(u.id));
  const toggleAll = () => setSelected(allSelected ? [] : users.map((u) => u.id));
  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const canDeleteRole = !role.system && users.length === 0;

  return (
    <div className="space-y-5">
      <div className="px-1 pt-0.5">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors duration-150"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Roles & Permissions
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold leading-tight m-0">{role.name}</h2>
              {role.system && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-[10px] uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3" /> System
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 m-0 max-w-2xl">
              {role.description || "No description provided."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAssign(true)}
              className="h-9 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add User
            </button>
            <button
              onClick={onEdit}
              className="h-9 inline-flex items-center gap-1.5 rounded-md border border-border bg-white/[0.03] px-3 text-xs font-medium hover:bg-gray-100 transition-colors duration-150"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Role
            </button>
            {!role.system && (
              <button
                onClick={() => canDeleteRole && setConfirmDeleteRole(true)}
                disabled={!canDeleteRole}
                title={
                  !canDeleteRole ? "Reassign all users before deleting this role" : "Delete role"
                }
                className="h-9 inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-3 text-xs font-medium hover:bg-destructive/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Role
              </button>
            )}
          </div>
        </div>
      </div>

      <SectionCard
        title="Assigned users"
        description={`${users.length} user${users.length === 1 ? "" : "s"} currently assigned to this role`}
      >
        {selected.length > 0 && (
          <div className="px-4 py-2 flex items-center gap-3 bg-primary/10 border-b border-primary/20 text-xs">
            <span className="font-medium">{selected.length} selected</span>
            <button
              onClick={() => setConfirmRemove(true)}
              className="ml-auto h-8 inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors duration-150"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove Role
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
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Job Title</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Team</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Assigned Date</th>
              </tr>
            </thead>
            <tbody className="stagger">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border/60 hover:bg-gray-50 h-14 transition-colors duration-150"
                >
                  <td className="px-4 py-3 align-middle">
                    <Checkbox checked={selected.includes(u.id)} onChange={() => toggleOne(u.id)} />
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
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground">
                    {u.email}
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground">
                    {u.jobTitle}
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-2 py-0.5 text-[10px]">
                      {u.team}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap text-muted-foreground text-xs">
                    {u.assignedDate}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No users assigned to this role.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <ConfirmDialog
        open={confirmDeleteRole}
        onClose={() => setConfirmDeleteRole(false)}
        onConfirm={onDelete}
        title="Delete role?"
        description="This role will be permanently removed. This action cannot be undone."
        confirmLabel="Delete Role"
      />

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => {
          onRemoveUsers(selected);
          setSelected([]);
        }}
        title="Remove role from selected users?"
        description="Selected users will lose access associated with this role. You can assign a new role afterwards."
        confirmLabel="Remove Role"
      />

      {showAssign && (
        <AssignUsersModal
          role={role}
          allUsers={allUsers}
          onClose={() => setShowAssign(false)}
          onSubmit={(ids) => {
            onAssignUsers(ids);
            setShowAssign(false);
          }}
        />
      )}
    </div>
  );
}

function AssignUsersModal({
  role,
  allUsers,
  onClose,
  onSubmit,
}: {
  role: Role;
  allUsers: AssignedUser[];
  onClose: () => void;
  onSubmit: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.team.toLowerCase().includes(q),
    );
  }, [allUsers, query]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-sm p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[80vh] modal-content"
      >
        <div className="px-5 pt-5 pb-3 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold">Assign Users to Role</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Select workspace members to assign to {role.name}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="tap h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground transition-colors duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 pb-3 border-t border-border pt-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or team"
              className="h-9 w-full rounded-md border border-border bg-background/30 pl-8 pr-3 text-xs outline-none focus:border-primary/60"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scl-scroll border-t border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card z-[1]">
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-2.5 text-left w-8" />
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Name</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Email</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Team</th>
                <th className="px-4 py-2.5 text-left whitespace-nowrap">Current Role</th>
              </tr>
            </thead>
            <tbody className="stagger">
              {filtered.map((u) => {
                const already = u.role === role.name;
                const isSel = selected.includes(u.id);
                return (
                  <tr
                    key={u.id}
                    className={`border-b border-border/60 h-12 ${
                      already ? "opacity-50" : "hover:bg-gray-50 cursor-pointer"
                    }`}
                    onClick={() => !already && toggle(u.id)}
                  >
                    <td className="px-4 align-middle">
                      <Checkbox
                        checked={already || isSel}
                        onChange={() => !already && toggle(u.id)}
                        disabled={already}
                      />
                    </td>
                    <td className="px-4 align-middle whitespace-nowrap font-medium">{u.name}</td>
                    <td className="px-4 align-middle whitespace-nowrap text-muted-foreground text-xs">
                      {u.email}
                    </td>
                    <td className="px-4 align-middle whitespace-nowrap text-xs">
                      <span className="inline-flex items-center rounded-full border border-border bg-background/40 px-2 py-0.5 text-[10px]">
                        {u.team}
                      </span>
                    </td>
                    <td className="px-4 align-middle whitespace-nowrap text-xs text-muted-foreground">
                      {already ? (
                        <span className="text-[10px] uppercase tracking-wider text-primary">
                          Already Assigned
                        </span>
                      ) : (
                        u.role
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {selected.length} user{selected.length === 1 ? "" : "s"} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center rounded-md border border-border bg-card/60 hover:bg-card px-3 h-9 text-xs font-medium transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              disabled={selected.length === 0}
              onClick={() => onSubmit(selected)}
              className="inline-flex items-center rounded-md px-4 h-9 text-[14px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              Assign Users
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
