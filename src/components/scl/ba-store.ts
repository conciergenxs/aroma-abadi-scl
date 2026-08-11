import { useSyncExternalStore } from "react";

export type BA = {
  id: string;
  name: string;
  gender: "Female" | "Male" | "Other";
  username: string;
  password: string;
  waNumber: string;
  brandIds: string[];
  city: string;
  store: string;
  adraName?: string; // deprecated, kept for backward compat
  position: string;
  /** Area Coordinator overseeing this BA — feeds the first 3 letters of the auto-generated password. */
  areaCoordinator: string;
};

type State = { bas: BA[]; currentBaId: string | null };

const STORAGE_KEY = "aroma_ba_store_v6";

function first3(name: string): string {
  const first = name.trim().split(/\s+/)[0] || "";
  return (first + "XXX").slice(0, 3).toUpperCase();
}

// Format: 3 letters of the Area Coordinator's name + 3 letters of the BA's
// name + 6 random symbol/number/letter characters.
const RANDOM_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
function genPassword(arcoName: string, baName: string) {
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)];
  return `${first3(arcoName)}${first3(baName)}${suffix}`;
}

function seed(): BA[] {
  // Phone numbers MUST match BA contacts in mock-data.ts (c4, c8, c10, c23-c30)
  // Passwords follow the ARCO format: 3 letters of the Area Coordinator's name
  // + 3 letters of the BA's name + 6 random symbol/number/letter characters.
  return [
    { id: "ba1",  name: "Dewi Lestari",   gender: "Female", username: "dewi.l",   password: "CITDEW4mQ!wZ", waNumber: "+62 811 5566 1122", brandIds: ["brand-sisley"],               city: "Bandung",  store: "Paris van Java",    position: "Senior BA", areaCoordinator: "Citra Dewanti" },
    { id: "ba2",  name: "Maya Kusuma",    gender: "Female", username: "maya.k",   password: "BAGMAY9xR#tK", waNumber: "+62 819 6655 2244", brandIds: ["brand-dg"],                   city: "Jakarta",  store: "Plaza Indonesia",   position: "BA", areaCoordinator: "Bagas Wirawan" },
    { id: "ba3",  name: "Reza Wijaya",    gender: "Male",  username: "reza.w",   password: "CITREZ2pL@vN", waNumber: "+62 857 8899 0011", brandIds: ["brand-rimmel"],               city: "Bandung",  store: "Trans Studio Mall", position: "BA", areaCoordinator: "Citra Dewanti" },
    { id: "ba4",  name: "Hesti Andriani", gender: "Female", username: "hesti.a",  password: "FARHES7kM$qX", waNumber: "+62 811 2233 4455", brandIds: ["brand-laura"],                city: "Surabaya", store: "Pakuwon Mall",      position: "BA", areaCoordinator: "Farhan Nugraha" },
    { id: "ba5",  name: "Indra Wahyudi",  gender: "Male",  username: "indra.w",  password: "BAGIND3wT&yB", waNumber: "+62 821 8877 6655", brandIds: ["brand-bm"],                   city: "Jakarta",  store: "Pondok Indah Mall", position: "Senior BA", areaCoordinator: "Bagas Wirawan" },
    { id: "ba6",  name: "Wulan Sari",     gender: "Female", username: "wulan.s",  password: "BAGWUL8nC#zR", waNumber: "+62 857 3344 5566", brandIds: ["brand-dg"],                   city: "Jakarta",  store: "Plaza Indonesia",   position: "BA", areaCoordinator: "Bagas Wirawan" },
    { id: "ba7",  name: "Kevin Nugroho",  gender: "Male",  username: "kevin.n",  password: "CITKEV5jH@mP", waNumber: "+62 812 9900 8877", brandIds: ["brand-sisley"],               city: "Bandung",  store: "Paris van Java",    position: "BA", areaCoordinator: "Citra Dewanti" },
    { id: "ba8",  name: "Sinta Bella",    gender: "Female", username: "sinta.b",  password: "FARSIN1dQ!kL", waNumber: "+62 819 1122 7788", brandIds: ["brand-rimmel"],               city: "Surabaya", store: "Pakuwon Mall",      position: "Senior BA", areaCoordinator: "Farhan Nugraha" },
    { id: "ba9",  name: "Rizal Pratama",  gender: "Male",  username: "rizal.p",  password: "CITRIZ6vB$nW", waNumber: "+62 878 5566 4433", brandIds: ["brand-laura"],                city: "Bandung",  store: "Trans Studio Mall", position: "Supervisor", areaCoordinator: "Citra Dewanti" },
    { id: "ba10", name: "Olivia Lim",     gender: "Female", username: "olivia.l", password: "BAGOLI4xF#tY", waNumber: "+62 813 3344 9900", brandIds: ["brand-bm"],                   city: "Jakarta",  store: "Pondok Indah Mall", position: "BA", areaCoordinator: "Bagas Wirawan" },
    { id: "ba11", name: "Eka Marlinda",   gender: "Female", username: "eka.m",    password: "FAREKA9rP@sD", waNumber: "+62 856 7788 1122", brandIds: ["brand-dg", "brand-sisley"],   city: "Surabaya", store: "Pakuwon Mall",      position: "BA", areaCoordinator: "Farhan Nugraha" },
    { id: "ba12", name: "Mia Hartanti",   gender: "Female", username: "mia.h",    password: "BAGMIA2qZ!wG", waNumber: "+62 812 1100 2233", brandIds: ["brand-sisley"],               city: "Jakarta",  store: "Grand Indonesia",   position: "BA", areaCoordinator: "Bagas Wirawan" },
    { id: "ba13", name: "Fauzan Akbar",   gender: "Male",  username: "fauzan.a", password: "CITFAU7lK#vM", waNumber: "+62 821 4455 6677", brandIds: ["brand-rimmel"],               city: "Bandung",  store: "Ciwalk",            position: "BA", areaCoordinator: "Citra Dewanti" },
    { id: "ba14", name: "Nadia Pramesti", gender: "Female", username: "nadia.p",  password: "BAGNAD3tX$yH", waNumber: "+62 857 9988 1100", brandIds: ["brand-laura"],                city: "Jakarta",  store: "Grand Indonesia",   position: "Senior BA", areaCoordinator: "Bagas Wirawan" },
    { id: "ba15", name: "Bintang Ramadan",gender: "Male",  username: "bintang.r",password: "FARBIN5cJ@nQ", waNumber: "+62 813 5544 7788", brandIds: ["brand-bm"],                   city: "Surabaya", store: "Tunjungan Plaza",   position: "BA", areaCoordinator: "Farhan Nugraha" },
    { id: "ba16", name: "Clara Santika",  gender: "Female", username: "clara.s",  password: "CITCLA8mW#pR", waNumber: "+62 878 2211 3344", brandIds: ["brand-dg"],                   city: "Bandung",  store: "Ciwalk",            position: "BA", areaCoordinator: "Citra Dewanti" },
    { id: "ba17", name: "Ariel Wijaya",   gender: "Male",  username: "ariel.w",  password: "BAGARI1yV!tK", waNumber: "+62 812 6677 8899", brandIds: ["brand-sisley"],               city: "Jakarta",  store: "Plaza Indonesia",   position: "Supervisor", areaCoordinator: "Bagas Wirawan" },
    { id: "ba18", name: "Fina Rahayu",    gender: "Female", username: "fina.r",   password: "FARFIN6bN$qZ", waNumber: "+62 819 3322 5566", brandIds: ["brand-rimmel","brand-laura"], city: "Surabaya", store: "Tunjungan Plaza",   position: "BA", areaCoordinator: "Farhan Nugraha" },
    { id: "ba19", name: "Dodi Kurnia",    gender: "Male",  username: "dodi.k",   password: "CITDOD4sL@wX", waNumber: "+62 856 4433 9900", brandIds: ["brand-bm"],                   city: "Bandung",  store: "Trans Studio Mall", position: "BA", areaCoordinator: "Citra Dewanti" },
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

// What SSR actually rendered (server has no localStorage) — a stable
// reference distinct from `state` so useSyncExternalStore can detect that
// the client's real (localStorage-backed) value differs and correctly
// re-render after hydration, instead of leaving stale server-rendered DOM
// stuck on screen. See promo-store.ts for the same fix via a different
// (useState+useEffect) mechanism.
const SERVER_SNAPSHOT: State = { bas: seed(), currentBaId: null };
const getServerSnapshot = () => SERVER_SNAPSHOT;

function normalizeWa(s: string) {
  return s.replace(/[^\d]/g, "");
}

export const baStore = {
  get state() { return state; },
  add(input: Omit<BA, "id" | "password"> & { password?: string }) {
    const ba: BA = {
      id: `ba-${Date.now()}`,
      password: input.password || genPassword(input.areaCoordinator, input.name),
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
    const ba = state.bas.find((b) => b.id === id);
    const pw = genPassword(ba?.areaCoordinator ?? "", ba?.name ?? "");
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
