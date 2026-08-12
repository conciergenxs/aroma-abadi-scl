import { useSyncExternalStore } from "react";
import { broadcasts as seedBroadcasts, type Broadcast } from "./mock-data";

type State = { broadcasts: Broadcast[] };

let state: State = { broadcasts: [...seedBroadcasts] };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => state;

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
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
