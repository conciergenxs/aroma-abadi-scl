import { useSyncExternalStore } from "react";
import {
  templates as seedTemplates,
  initialTemplateGroups,
  type Template,
  type TemplateGroup,
} from "./mock-data";

type State = {
  templates: Template[];
  groups: TemplateGroup[];
  starred: string[];
};

let state: State = {
  templates: [...seedTemplates],
  groups: [...initialTemplateGroups],
  starred: ["tp2", "tp4"],
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => state;

const GROUP_COLORS: TemplateGroup["color"][] = [
  "pink",
  "amber",
  "sky",
  "violet",
  "indigo",
  "emerald",
  "slate",
  "rose",
];

export const templatesStore = {
  get state() {
    return state;
  },
  addTemplate(t: Omit<Template, "id" | "updated"> & { id?: string; updated?: string }) {
    const entry: Template = {
      id: t.id ?? `tp-${Date.now()}`,
      updated: t.updated ?? "just now",
      ...t,
    } as Template;
    state = { ...state, templates: [entry, ...state.templates] };
    emit();
    return entry;
  },
  deleteTemplate(id: string) {
    state = {
      ...state,
      templates: state.templates.filter((t) => t.id !== id),
      starred: state.starred.filter((s) => s !== id),
    };
    emit();
  },
  deleteTemplates(ids: string[]) {
    const set = new Set(ids);
    state = {
      ...state,
      templates: state.templates.filter((t) => !set.has(t.id)),
      starred: state.starred.filter((s) => !set.has(s)),
    };
    emit();
  },
  toggleStar(id: string) {
    state = {
      ...state,
      starred: state.starred.includes(id)
        ? state.starred.filter((s) => s !== id)
        : [...state.starred, id],
    };
    emit();
  },
  isStarred(id: string) {
    return state.starred.includes(id);
  },
  /** Assign every template in `ids` to `groupId`. */
  setGroupForTemplates(ids: string[], groupId: string | undefined) {
    const set = new Set(ids);
    state = {
      ...state,
      templates: state.templates.map((t) =>
        set.has(t.id) ? { ...t, groupId } : t,
      ),
    };
    emit();
  },
  /** Remove `groupId` from every template in `ids` that currently has it. */
  removeGroupFromTemplates(ids: string[], groupId: string) {
    const set = new Set(ids);
    state = {
      ...state,
      templates: state.templates.map((t) =>
        set.has(t.id) && t.groupId === groupId ? { ...t, groupId: undefined } : t,
      ),
    };
    emit();
  },
  addGroup(name: string) {
    const color = GROUP_COLORS[state.groups.length % GROUP_COLORS.length];
    const entry: TemplateGroup = {
      id: `tg-${Date.now()}`,
      name,
      color,
    };
    state = { ...state, groups: [...state.groups, entry] };
    emit();
    return entry;
  },
  renameGroup(id: string, name: string) {
    state = {
      ...state,
      groups: state.groups.map((g) => (g.id === id ? { ...g, name } : g)),
    };
    emit();
  },
  deleteGroup(id: string) {
    state = {
      ...state,
      groups: state.groups.filter((g) => g.id !== id),
      templates: state.templates.map((t) =>
        t.groupId === id ? { ...t, groupId: undefined } : t,
      ),
    };
    emit();
  },
};

export function useTemplatesStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const TEMPLATE_GROUP_DOT: Record<TemplateGroup["color"], string> = {
  indigo: "bg-indigo-400",
  pink: "bg-pink-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  slate: "bg-slate-400",
  rose: "bg-rose-400",
};

export const TEMPLATE_GROUP_BADGE: Record<TemplateGroup["color"], string> = {
  indigo: "border-indigo-700 bg-indigo-600 text-white font-semibold",
  pink: "border-pink-700 bg-pink-600 text-white font-semibold",
  emerald: "border-emerald-700 bg-emerald-600 text-white font-semibold",
  amber: "border-amber-700 bg-amber-500 text-white font-semibold",
  sky: "border-sky-700 bg-sky-600 text-white font-semibold",
  violet: "border-violet-700 bg-violet-600 text-white font-semibold",
  slate: "border-slate-600 bg-slate-500 text-white font-semibold",
  rose: "border-rose-700 bg-rose-600 text-white font-semibold",
};