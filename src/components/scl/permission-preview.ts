import { useEffect, useSyncExternalStore } from "react";
import { useNavigate } from "@tanstack/react-router";

/* Permission preview — one link per condition.
 *
 * Roles & Permissions is a tree of checkboxes, and the question everyone asks
 * about it is "what does the dashboard look like with this one switched off?"
 * Describing that in a meeting never lands, so every checkbox has a link that
 * opens the dashboard with exactly that permission revoked: ?perm_off=<id>.
 *
 * The link is the whole entry point, so what it sets has to survive the first
 * click onto another page — it is kept in sessionStorage until the banner's
 * Exit is pressed, and it never touches a real role. Nothing here writes to
 * the permission tree: it is a lens over one session, not a saved state. */

export const PREVIEW_PARAM = "perm_off";
const KEY = "scl_permission_preview";

export type PreviewCondition = {
  id: string;
  /** The checkbox as Roles & Permissions labels it. */
  label: string;
  /** Which part of the tree it sits in, for grouping the link list. */
  section: string;
  /** What the dashboard does without it — shown in the preview banner. */
  effect: string;
  /** The page the link opens: where the effect is visible, not the home
   * screen. A page the permission closes is still the right landing spot —
   * arriving there and being sent to Overview is the demonstration. */
  where: string;
};

/** Every condition that has a link. One per checkbox in the permission tree. */
export const PREVIEW_CONDITIONS: PreviewCondition[] = [
  // ── Conversations & Contacts ────────────────────────────────────────────
  {
    id: "inbox-view",
    label: "View Conversations",
    section: "Conversations & Contacts",
    effect: "Inbox is gone from the sidebar, and its URL lands on Overview.",
    where: "/inbox",
  },
  {
    id: "inbox-send",
    label: "Send Messages",
    section: "Conversations & Contacts",
    effect: "Conversations can be read, but the reply box won't send.",
    where: "/inbox",
  },
  {
    id: "inbox-assign",
    label: "Assign & Transfer Conversations",
    section: "Conversations & Contacts",
    effect: "A conversation can't be handed to another agent.",
    where: "/inbox",
  },
  {
    id: "contacts-view",
    label: "View Contacts",
    section: "Conversations & Contacts",
    effect: "Contacts is gone from the sidebar, and its URL lands on Overview.",
    where: "/contacts",
  },
  {
    id: "contacts-create",
    label: "Create Contacts",
    section: "Conversations & Contacts",
    effect: "New Contact is locked.",
    where: "/contacts",
  },
  {
    id: "contacts-edit",
    label: "Edit Contacts",
    section: "Conversations & Contacts",
    effect: "A contact's details, labels and audiences are read-only.",
    where: "/contacts/c3",
  },
  {
    id: "contacts-delete",
    label: "Delete Contacts",
    section: "Conversations & Contacts",
    effect: "Deleting a contact is locked, in the list and on the contact itself.",
    where: "/contacts/c3",
  },
  {
    id: "contacts-export",
    label: "Export Contacts",
    section: "Conversations & Contacts",
    effect: "Nothing changes on screen — contacts have no export action in the product yet.",
    where: "/contacts",
  },
  {
    id: "contacts-properties",
    label: "Manage Contact Properties",
    section: "Conversations & Contacts",
    effect: "Filter Properties still opens, but nothing in it can be changed.",
    where: "/contacts",
  },
  {
    id: "contacts-labels",
    label: "Manage Labels & Lifecycle Stages",
    section: "Conversations & Contacts",
    effect: "Labels and Customer Lifecycle are read-only in Settings.",
    where: "/settings?section=labels",
  },

  // ── Outbound ────────────────────────────────────────────────────────────
  {
    id: "broadcast-view",
    label: "View Broadcasts & Logs",
    section: "Outbound",
    effect: "Broadcast is gone from the sidebar, and its URL lands on Overview.",
    where: "/broadcasts",
  },
  {
    id: "broadcast-create",
    label: "Create & Edit Broadcasts",
    section: "Outbound",
    effect: "Broadcasts can be read; Create Broadcast is locked.",
    where: "/broadcasts",
  },
  {
    id: "broadcast-send",
    label: "Send & Schedule Broadcasts",
    section: "Outbound",
    effect: "The composer opens and saves drafts, but won't send or schedule.",
    where: "/broadcasts/new",
  },
  {
    id: "broadcast-recurring",
    label: "Start & Stop Recurring Broadcasts",
    section: "Outbound",
    effect: "A recurring series can't be activated or paused.",
    where: "/broadcasts",
  },
  {
    id: "templates-view",
    label: "View Templates",
    section: "Outbound",
    effect: "Templates is gone from the sidebar, and its URL lands on Overview.",
    where: "/templates",
  },
  {
    id: "templates-manage",
    label: "Create & Edit Templates",
    section: "Outbound",
    effect: "Templates can be read; creating and editing is locked.",
    where: "/templates",
  },

  // ── BA Enablement ───────────────────────────────────────────────────────
  {
    id: "knowledge-view",
    label: "View Knowledge Content",
    section: "BA Enablement",
    effect: "SKU & Knowledge is gone from the sidebar, and its URL lands on Overview.",
    where: "/sku",
  },
  {
    id: "knowledge-brands",
    label: "Manage Brands & Categories",
    section: "BA Enablement",
    effect: "Add New Brand and Add Category are locked.",
    where: "/sku",
  },
  {
    id: "knowledge-modules",
    label: "Manage Modules",
    section: "BA Enablement",
    effect: "Add Module is locked.",
    where: "/sku?brand=brand-dg&category=cat-dg-lip",
  },
  {
    id: "knowledge-cards",
    label: "Manage Knowledge Cards",
    section: "BA Enablement",
    effect: "Adding and editing knowledge cards is locked.",
    where: "/sku?brand=brand-dg&category=cat-dg-lip",
  },
  {
    id: "ba-view",
    label: "View Beauty Ambassadors",
    section: "BA Enablement",
    effect: "The BA directory can't be opened from BA Contacts.",
    where: "/contacts?view=ba",
  },
  {
    id: "ba-scope",
    label: "See Every Area",
    section: "BA Enablement",
    effect: "The BA list shows only the signed-in coordinator's own area.",
    where: "/ba",
  },
  {
    id: "ba-create",
    label: "Add Beauty Ambassadors",
    section: "BA Enablement",
    effect: "Add BA is locked.",
    where: "/ba",
  },
  {
    id: "ba-edit",
    label: "Edit BA Details & Brand Assignment",
    section: "BA Enablement",
    effect: "A BA record is read-only.",
    where: "/ba",
  },
  {
    id: "ba-password",
    label: "Reveal & Reset LMS Passwords",
    section: "BA Enablement",
    effect: "A BA's LMS password can't be revealed or reset.",
    where: "/ba",
  },

  // ── Commerce ────────────────────────────────────────────────────────────
  {
    id: "commerce-view",
    label: "View Promo & Transactions",
    section: "Commerce",
    effect: "Transactions, Promo Codes and Referral are gone from the sidebar.",
    where: "/transactions",
  },
  {
    id: "promo-manage",
    label: "Create & Edit Promo Codes",
    section: "Commerce",
    effect: "Promo codes can be read; creating and editing is locked.",
    where: "/promo-codes",
  },
  {
    id: "referral-manage",
    label: "Create & Edit Referral Seasons",
    section: "Commerce",
    effect: "Referral seasons can be read; creating and editing is locked.",
    where: "/referral",
  },
  {
    id: "transactions-manage",
    label: "Record Transactions",
    section: "Commerce",
    effect: "Nothing changes on screen — the ledger is already read-only, filled from ARMA.",
    where: "/transactions",
  },

  // ── Workspace ───────────────────────────────────────────────────────────
  {
    id: "settings-view",
    label: "Open Settings",
    section: "Workspace",
    effect: "Settings is gone from the sidebar, and its URL lands on Overview.",
    where: "/settings",
  },
  {
    id: "settings-users",
    label: "Invite & Manage Users",
    section: "Workspace",
    effect: "User Management is closed, and inviting is locked.",
    where: "/settings?section=user-management",
  },
  {
    id: "settings-roles",
    label: "Manage Roles & Permissions",
    section: "Workspace",
    effect: "Roles & Permissions is closed.",
    where: "/settings?section=roles",
  },
];

export const conditionFor = (id: string | null) =>
  id ? (PREVIEW_CONDITIONS.find((c) => c.id === id) ?? null) : null;

/* ── The session's preview, if any ──────────────────────────────────────── */

let current: string | null = null;
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(PREVIEW_PARAM);
    if (fromUrl !== null) {
      current = conditionFor(fromUrl) ? fromUrl : null;
      window.sessionStorage.setItem(KEY, current ?? "");
    } else {
      const stored = window.sessionStorage.getItem(KEY);
      current = stored && conditionFor(stored) ? stored : null;
    }
  } catch {
    /* a blocked sessionStorage just means no preview */
  }
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => {
  hydrate();
  return current;
};
const getServerSnapshot = () => null;

export const permissionPreview = {
  get id() {
    hydrate();
    return current;
  },
  exit() {
    current = null;
    try {
      window.sessionStorage.removeItem(KEY);
      const url = new URL(window.location.href);
      url.searchParams.delete(PREVIEW_PARAM);
      window.history.replaceState({}, "", url.toString());
    } catch {
      /* ignore */
    }
    emit();
  },
};

/** The condition being previewed, or null when nothing is. */
export function usePreviewedCondition(): PreviewCondition | null {
  return conditionFor(useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot));
}

/** False only while this exact permission is the one being previewed off. */
export function usePermAllows(id: string): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) !== id;
}

/** Non-reactive read, for route guards that run before a component mounts. */
export function permAllows(id: string): boolean {
  return permissionPreview.id !== id;
}

/** Why a control is locked, for the tooltip beside it. */
export function previewLockReason(id: string): string {
  const c = conditionFor(id);
  return c ? `"${c.label}" is switched off in this preview.` : "";
}

/** The link that opens the page this permission changes, with it switched
 * off. Falls back to the workspace home for anything without a page. */
export function previewLink(id: string, origin = ""): string {
  const c = conditionFor(id);
  const path = c?.where ?? "/app";
  const sep = path.includes("?") ? "&" : "?";
  return `${origin}${path}${sep}${PREVIEW_PARAM}=${encodeURIComponent(id)}`;
}

/** For a page that a permission opens: sends the viewer to Overview while that
 * permission is the one switched off, so the preview link doesn't leave a page
 * reachable that the sidebar no longer offers. */
export function usePreviewGate(id: string): boolean {
  const allowed = usePermAllows(id);
  const navigate = useNavigate();
  useEffect(() => {
    if (!allowed) navigate({ to: "/app" });
  }, [allowed, navigate]);
  return allowed;
}

/** The role's own answer, narrowed by the preview. Each control asks once:
 *   const brands = usePermission("knowledge-brands", canManage, LOCKED_REASON);
 * and then reads `brands.allowed` and `brands.reason`. */
export function usePermission(
  permId: string,
  roleAllows = true,
  roleReason = "",
): { allowed: boolean; reason: string } {
  const previewAllows = usePermAllows(permId);
  if (!previewAllows) return { allowed: false, reason: previewLockReason(permId) };
  return { allowed: roleAllows, reason: roleAllows ? "" : roleReason };
}
