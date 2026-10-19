import { useSyncExternalStore } from "react";
import { broadcasts as seedBroadcasts, type Broadcast, type BroadcastRun } from "./mock-data";

type State = { broadcasts: Broadcast[] };

// Bump when the seeded broadcasts or the Broadcast shape change — v2 added the
// Sisley personal-codes send that promo-2's recipient codes point at, plus the
// promoCodeId/recipientCodes fields; v3 keeps the audience conditions a draft
// was built with; v4 turned the Reseller Promo into a recurring series and
// gave broadcasts a per-send run history.
// v5 adds the activation state a scheduled or recurring broadcast carries,
// plus the blocked scheduled example.
const STORAGE_KEY = "aroma_broadcasts_store_v5";

function seed(): Broadcast[] {
  return [...seedBroadcasts];
}

function load(): State {
  if (typeof window === "undefined") return { broadcasts: seed() };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const initial = { broadcasts: seed() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {
    /* ignore */
  }
  return initial;
}

let state: State = load();
const listeners = new Set<() => void>();
const emit = () => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => state;

// What SSR actually rendered (server has no localStorage) — a stable
// reference distinct from `state` so useSyncExternalStore can detect that
// the client's real (localStorage-backed) value differs and correctly
// re-render after hydration, instead of leaving stale server-rendered DOM
// stuck on screen. See ba-store.ts / promo-store.ts for the same fix.
const SERVER_SNAPSHOT: State = { broadcasts: seed() };
const getServerSnapshot = () => SERVER_SNAPSHOT;

export const broadcastsStore = {
  get state() {
    return state;
  },
  add(b: Broadcast) {
    state = { broadcasts: [b, ...state.broadcasts] };
    emit();
  },
  deleteMany(ids: string[]) {
    const set = new Set(ids);
    state = { broadcasts: state.broadcasts.filter((b) => !set.has(b.id)) };
    emit();
  },
  setActivation(id: string, activation: "active" | "inactive") {
    state = {
      broadcasts: state.broadcasts.map((b) => (b.id === id ? { ...b, activation } : b)),
    };
    emit();
  },
  duplicate(id: string) {
    const src = state.broadcasts.find((b) => b.id === id);
    if (!src) return;
    const copy: Broadcast = {
      ...src,
      id: `b-${Date.now()}`,
      name: `${src.name} (Copy)`,
      status: "Draft",
      sentAt: "—",
      delivered: 0,
      read: 0,
      clicks: 0,
      replied: 0,
      failed: 0,
      createdAt: "just now",
    };
    state = { broadcasts: [copy, ...state.broadcasts] };
    emit();
    return copy;
  },
};

/* ── What kind of broadcast this is, and what state it is actually in ──────
 * The three kinds move through different states, and the list is read by
 * kind:
 *   One time   → Sent (or still a Draft).
 *   Scheduled  → Active → Sent, and can be switched off in between. Left off
 *                past its send time it is Blocked: that send cannot be armed
 *                again, only rescheduled.
 *   Recurring  → Active ⇄ Inactive for as long as it runs; deleting one is
 *                only allowed once it has been switched off. */
export type BroadcastKind = "one-time" | "scheduled" | "recurring";
export type LifecycleStatus = "Sent" | "Active" | "Inactive" | "Blocked" | "Draft";

export function broadcastKind(b: Broadcast): BroadcastKind {
  if (b.sendMode === "recurring") return "recurring";
  if (b.sendMode === "schedule") return "scheduled";
  return "one-time";
}

/** True once a scheduled broadcast's own send time is in the past. */
export function scheduleHasPassed(b: Broadcast, now = new Date()): boolean {
  if (!b.scheduleDate) return false;
  const [y, m, d] = b.scheduleDate.split("-").map(Number);
  const [hh, mm] = (b.scheduleTime ?? "00:00").split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm).getTime() < now.getTime();
}

export function lifecycleStatus(b: Broadcast, now = new Date()): LifecycleStatus {
  if (b.status === "Draft") return "Draft";
  const kind = broadcastKind(b);
  if (kind === "one-time") return "Sent";
  if (kind === "scheduled") {
    if (b.status === "Sent") return "Sent";
    if (b.activation === "inactive") return scheduleHasPassed(b, now) ? "Blocked" : "Inactive";
    return "Active";
  }
  return b.activation === "inactive" ? "Inactive" : "Active";
}

/** Why a broadcast can't be switched back on, or "" when it can. */
export function activationBlockedReason(b: Broadcast, now = new Date()): string {
  if (lifecycleStatus(b, now) !== "Blocked") return "";
  return "This send time has already passed — reschedule it to send again.";
}

/** Recurring broadcasts are switched off before they can be deleted, so a
 * live series can't disappear from under the people it is sending to. */
export function deleteBlockedReason(b: Broadcast, now = new Date()): string {
  if (broadcastKind(b) === "recurring" && lifecycleStatus(b, now) === "Active") {
    return "Deactivate this recurring broadcast before deleting it.";
  }
  return "";
}

export function useBroadcastsStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Every send this broadcast has made, newest first — one row per occurrence
 * for a recurring series, one row for a one-off, none for anything that hasn't
 * gone out yet. A one-off carries no `runs` of its own, so its single send is
 * derived from the broadcast's own totals. */
export function broadcastRuns(b: Broadcast): BroadcastRun[] {
  if (b.runs?.length) return [...b.runs].reverse();
  if (b.status !== "Sent") return [];
  return [
    {
      id: `${b.id}-run-1`,
      sentAt: b.sentAt,
      sentAtDate: b.sentAtDate ?? "",
      audience: b.totalAudience ?? b.reach,
      reach: b.reach,
      delivered: b.delivered,
      read: b.read,
      failed: b.failed ?? Math.max(0, b.reach - b.delivered),
      status: "Success",
    },
  ];
}

export function findBroadcastRun(b: Broadcast, runId: string): BroadcastRun | null {
  return broadcastRuns(b).find((r) => r.id === runId) ?? null;
}
