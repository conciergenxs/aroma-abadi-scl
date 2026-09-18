import { useSyncExternalStore } from "react";
import { ARMA_PERSONAS, type ArmaPersona } from "./agents";

// ── Arma's three personas ─────────────────────────────────────────────────────
// Settings → Arma Configuration edits these. Kept in a store rather than in the
// page's own state so "Save Configuration" actually saves: the wording an
// operator tunes has to survive navigating away and coming back.

const STORAGE_KEY = "aroma_arma_personas_v1";

let personas: ArmaPersona[] = ARMA_PERSONAS;
const listeners = new Set<() => void>();

/** Distinct from the live array so useSyncExternalStore never hands the server
 * render a value the client is about to replace. */
const SERVER_SNAPSHOT: ArmaPersona[] = ARMA_PERSONAS;

let loaded = false;
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    // Merge onto the seed so a persona added later still appears, and the
    // presentation bits (colours, icons) always come from code.
    personas = ARMA_PERSONAS.map((seed) => {
      const saved = parsed.find((p: ArmaPersona) => p?.id === seed.id);
      return saved ? { ...seed, ...saved, color: seed.color, bgColor: seed.bgColor } : seed;
    });
  } catch {
    /* a malformed entry just means the seed */
  }
}

function getSnapshot() {
  load();
  return personas;
}

export const armaPersonasStore = {
  save(next: ArmaPersona[]) {
    load();
    personas = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(personas));
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  },
};

export function useArmaPersonas() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot,
    () => SERVER_SNAPSHOT,
  );
}
