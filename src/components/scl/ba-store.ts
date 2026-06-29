import { useSyncExternalStore } from "react";

export type BA = {
  id: string;
  name: string;
  gender: "Wanita" | "Pria" | "Lainnya";
  username: string;
  password: string;
  waNumber: string;
  brandIds: string[];
  city: string;
  store: string;
  adraName?: string;
  position: string;
};

type State = { bas: BA[]; currentBaId: string | null };

const STORAGE_KEY = "aroma_ba_store_v1";

function genPassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function seed(): BA[] {
  return [
    { id: "ba1", name: "Putri Anggraini", gender: "Wanita", username: "putri.a", password: "Putri12345", waNumber: "+62 812 3456 7890", brandIds: ["brand-glow"], city: "Jakarta", store: "Tunjungan Plaza", adraName: "Ibu Rini", position: "Supervisor" },
    { id: "ba2", name: "Dewi Lestari", gender: "Wanita", username: "dewi.l", password: "Dewi67890A", waNumber: "+62 811 5566 1122", brandIds: ["brand-velvet"], city: "Bandung", store: "Paris van Java", adraName: "Ibu Sari", position: "Senior BA" },
    { id: "ba3", name: "Reza Wijaya", gender: "Pria", username: "reza.w", password: "Reza54321X", waNumber: "+62 857 8899 0011", brandIds: ["brand-velvet", "brand-glow"], city: "Bandung", store: "Trans Studio Mall", position: "BA" },
  ];
}

function load(): State {
  if (typeof window === "undefined") return { bas: seed(), currentBaId: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const initial = { bas: seed(), currentBaId: null };
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial)); } catch { /* ignore */ }
  return initial;
}

let state: State = load();
const listeners = new Set<() => void>();
const emit = () => {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const getSnapshot = () => state;

function normalizeWa(s: string) {
  return s.replace(/[^\d]/g, "");
}

export const baStore = {
  get state() { return state; },
  add(input: Omit<BA, "id" | "password"> & { password?: string }) {
    const ba: BA = {
      id: `ba-${Date.now()}`,
      password: input.password || genPassword(),
      ...input,
    };
    state = { ...state, bas: [ba, ...state.bas] };
    emit();
    return ba;
  },
  update(id: string, patch: Partial<BA>) {
    state = { ...state, bas: state.bas.map((b) => (b.id === id ? { ...b, ...patch } : b)) };
    emit();
  },
  remove(id: string) {
    state = { ...state, bas: state.bas.filter((b) => b.id !== id) };
    emit();
  },
  regeneratePassword(id: string) {
    const pw = genPassword();
    state = { ...state, bas: state.bas.map((b) => (b.id === id ? { ...b, password: pw } : b)) };
    emit();
    return pw;
  },
  login(waNumber: string, password: string) {
    const wa = normalizeWa(waNumber);
    const ba = state.bas.find((b) => normalizeWa(b.waNumber) === wa && b.password === password);
    if (!ba) return null;
    state = { ...state, currentBaId: ba.id };
    emit();
    return ba;
  },
  logout() {
    state = { ...state, currentBaId: null };
    emit();
  },
  generatePassword: genPassword,
};

export function useBaStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
