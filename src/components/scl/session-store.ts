import { useSyncExternalStore } from "react";

/* Who is signed in to the dashboard, and what they are allowed to do.
 *
 * Two populations use this product and only one of them lands here: Beauty
 * Ambassadors sign in to the LMS and are turned away from the dashboard at
 * login. Everyone in this store is Aroma Abadi staff.
 *
 * The role decides what the person can reach. It is granted in Roles &
 * Permissions by an admin — never chosen by the person it applies to — so the
 * profile page shows it read-only. */

export type WorkspaceRole = "Super Admin" | "Admin" | "Leader" | "Brand" | "Trainer" | "Management";

export type CurrentUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  job: string;
  role: WorkspaceRole;
  /** Set for a Leader: the BAs reporting to them carry this name. */
  leader?: string;
};

/** The accounts this workspace can sign in as. Matched by email at login, so
 * the dashboard can be demonstrated from each role's point of view. */
export const WORKSPACE_ACCOUNTS: CurrentUser[] = [
  {
    id: "u-aria",
    name: "Aria Kapoor",
    username: "aria.kapoor",
    email: "aria.kapoor@northstar.co",
    phone: "+62 811 5500 0001",
    job: "Workspace Owner",
    role: "Super Admin",
  },
  {
    id: "u-tom",
    name: "Tomas Bergstrom",
    username: "tomas.b",
    email: "tomas.b@northstar.co",
    phone: "+62 811 5500 0002",
    job: "Operations Lead",
    role: "Admin",
  },
  {
    id: "u-citra",
    name: "Citra Dewanti",
    username: "citra.dewanti",
    email: "citra.dewanti@northstar.co",
    phone: "+62 811 5500 0011",
    job: "Leader",
    role: "Leader",
    leader: "Citra Dewanti",
  },
  {
    id: "u-bagas",
    name: "Bagas Wirawan",
    username: "bagas.wirawan",
    email: "bagas.wirawan@northstar.co",
    phone: "+62 811 5500 0012",
    job: "Leader",
    role: "Leader",
    leader: "Bagas Wirawan",
  },
  {
    id: "u-sara",
    name: "Sara Iqbal",
    username: "sara.iqbal",
    email: "sara.iqbal@northstar.co",
    phone: "+62 811 5500 0005",
    job: "Brand Executive",
    role: "Brand",
  },
  {
    id: "u-nadia",
    name: "Nadia Prameswari",
    username: "nadia.p",
    email: "nadia.p@northstar.co",
    phone: "+62 811 5500 0009",
    job: "Product Trainer",
    role: "Trainer",
  },
  {
    id: "u-dimas",
    name: "Dimas Pratama",
    username: "dimas.pratama",
    email: "dimas.p@northstar.co",
    phone: "+62 811 5500 0006",
    job: "Business Management",
    role: "Management",
  },
];

const DEFAULT_USER = WORKSPACE_ACCOUNTS[0];
const USER_KEY = "scl_session_user";
const TZ_KEY = "scl_workspace_timezone";
const DEFAULT_TZ = "(UTC+07:00) Jakarta";

type State = { user: CurrentUser; timeZone: string };

let state: State = { user: DEFAULT_USER, timeZone: DEFAULT_TZ };
/** Distinct object so the server render is never mistaken for the client's. */
const SERVER_SNAPSHOT: State = { user: DEFAULT_USER, timeZone: DEFAULT_TZ };

let loaded = false;
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const rawUser = window.localStorage.getItem(USER_KEY);
    const user = rawUser ? (JSON.parse(rawUser) as CurrentUser) : DEFAULT_USER;
    const timeZone = window.localStorage.getItem(TZ_KEY) ?? DEFAULT_TZ;
    // A session saved before the roles were renamed holds a role this
    // workspace no longer has; signing back in as the owner beats asking the
    // capability map about a role it has never heard of.
    const known = user?.role && user.role in ROLE_CAPABILITIES;
    state = { user: known ? user : DEFAULT_USER, timeZone };
  } catch {
    /* a malformed entry just means the default workspace owner */
  }
}

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => {
  load();
  return state;
};
const getServerSnapshot = () => SERVER_SNAPSHOT;

export const sessionStore = {
  /** Called at sign-in: what was typed decides which account — and so which
   * role — the dashboard is being used as. Sign-in is by WhatsApp number, so
   * that is matched on digits; an email is accepted too. Anything unknown
   * signs in as the workspace owner, which is how this demo behaved before
   * roles existed. */
  signInAs(identifier: string) {
    load();
    const typed = identifier.trim().toLowerCase();
    const digits = typed.replace(/\D/g, "");
    const match =
      WORKSPACE_ACCOUNTS.find((u) => u.email.toLowerCase() === typed) ??
      (digits
        ? WORKSPACE_ACCOUNTS.find((u) => u.phone.replace(/\D/g, "") === digits)
        : undefined) ??
      DEFAULT_USER;
    state = { ...state, user: match };
    try {
      window.localStorage.setItem(USER_KEY, JSON.stringify(match));
    } catch {
      /* ignore */
    }
    emit();
    return match;
  },
  signOut() {
    load();
    state = { ...state, user: DEFAULT_USER };
    try {
      window.localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    emit();
  },
  setTimeZone(timeZone: string) {
    load();
    state = { ...state, timeZone };
    try {
      window.localStorage.setItem(TZ_KEY, timeZone);
    } catch {
      /* ignore */
    }
    emit();
  },
};

export function useCurrentUser(): CurrentUser {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).user;
}

export function useWorkspaceTimeZone(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).timeZone;
}

/* ── What each role may reach ─────────────────────────────────────────────
 * Aroma Abadi runs on four roles. The two that carry real risk are editing
 * the knowledge a Beauty Ambassador reads in the LMS, and creating the BA
 * accounts themselves — so those are the capabilities the rest hangs off. */

export type Capability =
  | "inbox"
  | "contacts"
  | "broadcast.view"
  | "broadcast.send"
  | "templates.view"
  | "knowledge.view"
  | "knowledge.manage"
  | "ba.view"
  | "ba.manage"
  | "promo"
  | "transactions"
  | "settings"
  | "settings.roles";

const ROLE_CAPABILITIES: Record<WorkspaceRole, Capability[]> = {
  "Super Admin": [
    "inbox",
    "contacts",
    "broadcast.view",
    "broadcast.send",
    "templates.view",
    "knowledge.view",
    "knowledge.manage",
    "ba.view",
    "ba.manage",
    "promo",
    "transactions",
    "settings",
    "settings.roles",
  ],
  Admin: [
    "inbox",
    "contacts",
    "broadcast.view",
    "broadcast.send",
    "templates.view",
    "knowledge.view",
    "knowledge.manage",
    "ba.view",
    "ba.manage",
    "promo",
    "transactions",
    "settings",
  ],
  // The BAs report to a Leader: they open the accounts, edit the records and
  // hold the LMS passwords. Outbound and the knowledge itself are read-only.
  Leader: [
    "inbox",
    "contacts",
    "broadcast.view",
    "templates.view",
    "knowledge.view",
    "ba.view",
    "ba.manage",
    "promo",
    "transactions",
    "settings",
  ],
  // Brand-side: reads the campaigns and the commerce pages, writes none of it.
  Brand: [
    "inbox",
    "contacts",
    "broadcast.view",
    "templates.view",
    "knowledge.view",
    "ba.view",
    "promo",
    "transactions",
    "settings",
  ],
  // Teaches from the knowledge base and keeps it current — modules and cards
  // are theirs; contacts and commerce are not.
  Trainer: ["inbox", "knowledge.view", "knowledge.manage", "ba.view", "settings"],
  // Oversight: the whole picture, read-only.
  Management: [
    "inbox",
    "contacts",
    "broadcast.view",
    "templates.view",
    "knowledge.view",
    "ba.view",
    "promo",
    "transactions",
    "settings",
  ],
};

export function roleCan(role: WorkspaceRole, capability: Capability): boolean {
  return (ROLE_CAPABILITIES[role] ?? []).includes(capability);
}

export function useCan(capability: Capability): boolean {
  const user = useCurrentUser();
  return roleCan(user.role, capability);
}

/** Why an action is unavailable, for a tooltip beside the disabled control. */
export function cannotReason(role: WorkspaceRole, capability: Capability): string {
  if (roleCan(role, capability)) return "";
  const what: Partial<Record<Capability, string>> = {
    "knowledge.manage": "Only a Trainer, Admin, or Super Admin can change knowledge content.",
    "ba.manage": "Only a Leader, Admin, or Super Admin can manage BA accounts.",
    "broadcast.send": "Only an Admin or Super Admin can send a broadcast.",
    promo: "The promo pages aren't part of this role's access.",
    transactions: "The transaction ledger isn't part of this role's access.",
  };
  return what[capability] ?? `Your role (${role}) doesn't include this.`;
}
