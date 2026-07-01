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
  adraName?: string; // deprecated, kept for backward compat
  position: string;
};

type State = { bas: BA[]; currentBaId: string | null };

const STORAGE_KEY = "aroma_ba_store_v3";

function genPassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function seed(): BA[] {
  // Phone numbers MUST match BA contacts in mock-data.ts (c4, c8, c10, c23-c30)
  return [
    { id: "ba1",  name: "Dewi Lestari",   gender: "Wanita",  username: "dewi.l",   password: "Dewi67890A", waNumber: "+62 811 5566 1122", brandIds: ["brand-sisley"],               city: "Bandung",  store: "Paris van Java",    position: "Senior BA" },
    { id: "ba2",  name: "Maya Kusuma",    gender: "Wanita",  username: "maya.k",   password: "MayaK12345", waNumber: "+62 819 6655 2244", brandIds: ["brand-dg"],                   city: "Jakarta",  store: "Plaza Indonesia",   position: "BA" },
    { id: "ba3",  name: "Reza Wijaya",    gender: "Pria",    username: "reza.w",   password: "Reza54321X", waNumber: "+62 857 8899 0011", brandIds: ["brand-rimmel"],               city: "Bandung",  store: "Trans Studio Mall", position: "BA" },
    { id: "ba4",  name: "Hesti Andriani", gender: "Wanita",  username: "hesti.a",  password: "HestiA8899", waNumber: "+62 811 2233 4455", brandIds: ["brand-laura"],                city: "Surabaya", store: "Pakuwon Mall",      position: "BA" },
    { id: "ba5",  name: "Indra Wahyudi",  gender: "Pria",    username: "indra.w",  password: "IndraW4321", waNumber: "+62 821 8877 6655", brandIds: ["brand-bm"],                   city: "Jakarta",  store: "Pondok Indah Mall", position: "Senior BA" },
    { id: "ba6",  name: "Wulan Sari",     gender: "Wanita",  username: "wulan.s",  password: "WulanS5678", waNumber: "+62 857 3344 5566", brandIds: ["brand-dg"],                   city: "Jakarta",  store: "Plaza Indonesia",   position: "BA" },
    { id: "ba7",  name: "Kevin Nugroho",  gender: "Pria",    username: "kevin.n",  password: "KevinN7890", waNumber: "+62 812 9900 8877", brandIds: ["brand-sisley"],               city: "Bandung",  store: "Paris van Java",    position: "BA" },
    { id: "ba8",  name: "Sinta Bella",    gender: "Wanita",  username: "sinta.b",  password: "SintaB1234", waNumber: "+62 819 1122 7788", brandIds: ["brand-rimmel"],               city: "Surabaya", store: "Pakuwon Mall",      position: "Senior BA" },
    { id: "ba9",  name: "Rizal Pratama",  gender: "Pria",    username: "rizal.p",  password: "RizalP5678", waNumber: "+62 878 5566 4433", brandIds: ["brand-laura"],                city: "Bandung",  store: "Trans Studio Mall", position: "Supervisor" },
    { id: "ba10", name: "Olivia Lim",     gender: "Wanita",  username: "olivia.l", password: "OliviaL789", waNumber: "+62 813 3344 9900", brandIds: ["brand-bm"],                   city: "Jakarta",  store: "Pondok Indah Mall", position: "BA" },
    { id: "ba11", name: "Eka Marlinda",   gender: "Wanita",  username: "eka.m",    password: "EkaM12345",  waNumber: "+62 856 7788 1122", brandIds: ["brand-dg", "brand-sisley"],   city: "Surabaya", store: "Pakuwon Mall",      position: "BA" },
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
