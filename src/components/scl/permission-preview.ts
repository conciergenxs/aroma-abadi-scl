import { useEffect, useSyncExternalStore } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LITE_MODE } from "@/lib/feature-flags";

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

const ALL_CONDITIONS: PreviewCondition[] = [
  // ── Module access ───────────────────────────────────────────────────────
  // A module's own toggle is what "view" means now, so these come first:
  // switch one off and the module is gone, not merely locked.
  {
    id: "inbox",
    label: "Inbox Access",
    section: "Module Access",
    effect: "Inbox is gone from the sidebar, and its URL lands on Overview.",
    where: "/inbox",
  },
  {
    id: "contacts",
    label: "Contacts Access",
    section: "Module Access",
    effect: "Contacts is gone from the sidebar, and its URL lands on Overview.",
    where: "/contacts",
  },
  {
    id: "broadcast",
    label: "Broadcast Access",
    section: "Module Access",
    effect: "Broadcast is gone from the sidebar, and its URL lands on Overview.",
    where: "/broadcasts",
  },
  {
    id: "templates",
    label: "Templates Access",
    section: "Module Access",
    effect: "Templates is gone from the sidebar, and its URL lands on Overview.",
    where: "/templates",
  },
  {
    id: "knowledge",
    label: "Knowledge Access",
    section: "Module Access",
    effect: "SKU & Knowledge is gone from the sidebar, and its URL lands on Overview.",
    where: "/sku",
  },
  {
    id: "ba",
    label: "BA Access",
    section: "Module Access",
    effect: "The BA directory can't be opened, and its URL lands on Overview.",
    where: "/ba",
  },
  {
    id: "promo",
    label: "Promo Access",
    section: "Module Access",
    // Referral is a full-build page, so lite has nothing to name beside it.
    effect: LITE_MODE
      ? "Promo Codes is gone from the sidebar, and its URL lands on Overview."
      : "Promo Codes and Referral are gone from the sidebar.",
    where: "/promo-codes",
  },
  {
    id: "transactions",
    label: "Transactions Access",
    section: "Module Access",
    effect: "Transactions is gone from the sidebar, and its URL lands on Overview.",
    where: "/transactions",
  },

  // ── Conversations & Contacts ────────────────────────────────────────────
  {
    id: "inbox-send",
    label: "Send Messages",
    section: "Conversations & Contacts",
    effect:
      "Take over a conversation from Autopilot and the reply box opens, but Send stays locked.",
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
    effect: "A contact's lifecycle, labels and audiences are read-only.",
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
    id: "contacts-restore",
    label: "Manage Recently Deleted Contacts",
    section: "Conversations & Contacts",
    effect: "Deleted contacts can be read, but not restored or purged.",
    where: "/settings?section=recently-deleted",
  },
  {
    id: "contacts-labels",
    label: "Manage Labels",
    section: "Conversations & Contacts",
    effect: "Labels are read-only in Settings.",
    where: "/settings?section=labels",
  },
  {
    id: "contacts-lifecycle",
    label: "Manage Lifecycle Stages",
    section: "Conversations & Contacts",
    effect: "Customer Lifecycle stages can't be added, edited or removed.",
    where: "/settings?section=customer-lifecycle",
  },

  // ── Outbound ────────────────────────────────────────────────────────────
  {
    id: "broadcast-create",
    label: "Create Broadcast",
    section: "Outbound",
    effect: "Broadcasts can be read; Create Broadcast is locked.",
    where: "/broadcasts",
  },
  {
    id: "broadcast-send",
    label: "Send & Schedule Broadcast",
    section: "Outbound",
    effect: "The composer opens and saves drafts, but won't send or schedule.",
    where: "/broadcasts/new",
  },
  {
    id: "broadcast-recurring",
    label: "Start & Stop Recurring Broadcast",
    section: "Outbound",
    effect: "A recurring series can't be activated or paused.",
    where: "/broadcasts",
  },
  {
    id: "templates-create",
    label: "Create Template",
    section: "Outbound",
    effect: "Templates can be read; New Template is locked.",
    where: "/templates",
  },
  {
    id: "templates-delete",
    label: "Delete Template",
    section: "Outbound",
    effect: "Open a template: Delete Template is locked, and so is the bulk delete.",
    where: "/templates",
  },

  // ── BA Enablement ───────────────────────────────────────────────────────
  {
    id: "knowledge-brands",
    label: "Manage Brands",
    section: "BA Enablement",
    effect: "Add New Brand is locked.",
    where: "/sku",
  },
  {
    id: "knowledge-categories",
    label: "Manage Categories",
    section: "BA Enablement",
    effect: "Add Category is locked inside a brand.",
    where: "/sku?brand=brand-dg",
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
    effect: "Every Add New card button is locked, on a module and on a SKU.",
    where: "/sku?brand=brand-dg&category=cat-dg-lip",
  },
  {
    id: "ba-view",
    label: "View Beauty Ambassadors",
    section: "BA Enablement",
    effect: "Contacts shows customers only — the BA view and the directory are closed.",
    where: "/contacts?view=ba",
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
    effect: "A BA record is read-only, and their password can't be reset.",
    where: "/ba",
  },
  {
    id: "ba-password",
    label: "Reveal LMS Passwords",
    section: "BA Enablement",
    effect: "A BA's LMS password stays hidden.",
    where: "/ba",
  },

  // ── Commerce ────────────────────────────────────────────────────────────
  {
    id: "promo-create",
    label: "Create Promo Codes",
    section: "Commerce",
    effect: "Promo codes can be read; Create Promo is locked.",
    where: "/promo-codes",
  },
  {
    id: "promo-edit",
    label: "Edit Promo Codes",
    section: "Commerce",
    effect: "A code's row menu opens, but Edit and Delete are locked.",
    where: "/promo-codes",
  },
  {
    id: "referral-manage",
    label: "Create & Edit Referral Seasons",
    section: "Commerce",
    effect: "Referral seasons can be read; creating and editing is locked.",
    where: "/referral",
  },

  // ── Workspace ───────────────────────────────────────────────────────────
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

/* One per checkbox in the permission tree — so the lite build, whose tree has
 * no referral seasons to permit, has no link for them either. */
export const PREVIEW_CONDITIONS: PreviewCondition[] = ALL_CONDITIONS.filter(
  (c) => !(LITE_MODE && c.id === "referral-manage"),
);

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
  const path = c?.where ?? "/";
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
    if (!allowed) navigate({ to: "/" });
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
