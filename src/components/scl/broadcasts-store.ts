import { useSyncExternalStore } from "react";
import { broadcasts as seedBroadcasts, type Broadcast } from "./mock-data";

type State = { broadcasts: Broadcast[] };

const STORAGE_KEY = "aroma_broadcasts_store_v1";

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

export function useBroadcastsStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
