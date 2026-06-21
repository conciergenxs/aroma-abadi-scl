import { useSyncExternalStore } from "react";
import {
  contacts as seedContacts,
  initialLabels,
  initialLists,
  LIFECYCLE_STAGES,
  STAGE_COLORS,
  type Contact,
  type ContactLabel,
  type ContactList,
} from "./mock-data";

export type PropertyType =
  | "text"
  | "multiline"
  | "number"
  | "email"
  | "phone"
  | "url"
  | "date"
  | "labels"
  | "list"
  | "select"
  | "multiselect"
  | "boolean";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  text: "Single Line Text",
  multiline: "Multi Line Text",
  number: "Number",
  email: "Email",
  phone: "Phone",
  url: "URL",
  date: "Date",
  labels: "Labels",
  list: "List",
  select: "Dropdown Select",
  multiselect: "Multi Select",
  boolean: "Boolean / Toggle",
};

export type ContactProperty = {
  id: string;
  key: string;
  name: string;
  type: PropertyType;
  visible: boolean;
  system?: boolean;
  /** Options for select / multiselect property types. */
  options?: string[];
};

export const DEFAULT_PROPERTIES: ContactProperty[] = [
  { id: "p-name", key: "name", name: "Name", type: "text", visible: true, system: true },
  { id: "p-phone", key: "phone", name: "Phone Number", type: "phone", visible: true, system: true },
  { id: "p-channel", key: "channel", name: "Channel", type: "select", visible: true, system: true },
  { id: "p-labels", key: "labels", name: "Labels", type: "labels", visible: true, system: true },
  { id: "p-lists", key: "lists", name: "Lists", type: "multiselect", visible: true, system: true },
  { id: "p-lastInteraction", key: "lastInteraction", name: "Last Interaction", type: "date", visible: true, system: true },
  { id: "p-status", key: "status", name: "Status", type: "select", visible: true, system: true },
  // Custom defaults used in the "Additional Information" section of New Contact.
  { id: "p-pic", key: "pic", name: "PIC", type: "text", visible: false },
  { id: "p-user-type", key: "user_type", name: "User Type", type: "select", visible: false, options: ["Customer", "Lead", "Partner", "Employee"] },
  { id: "p-service-type", key: "service_type", name: "Service Type", type: "select", visible: false, options: ["Consulting", "One-off", "Support"] },
  { id: "p-business-type", key: "business_type", name: "Business Type", type: "select", visible: false, options: ["B2B", "B2C", "B2B2C"] },
  { id: "p-business-industry", key: "business_industry", name: "Business Industry", type: "select", visible: false, options: ["Retail", "Finance", "Tech", "Hospitality", "Education", "Healthcare", "Other"] },
  { id: "p-company-name", key: "company_name", name: "Company Name", type: "text", visible: false },
  { id: "p-instagram-username", key: "instagram_username", name: "Instagram Username", type: "text", visible: false },
];

// =========================================================
// LIFECYCLE STAGES — single source of truth
//
// Settings → Customer Lifecycle is just another management UI for the
// same list. Contacts Kanban, Inbox, Contact Detail, and the lifecycle
// dropdown all read from `state.lifecycleStages` via `useContactsStore`.
// Use `getStageStyle(name)` for color lookup.
// =========================================================

export type LifecycleColorKey =
  | "orange" | "blue" | "purple" | "yellow" | "green"
  | "red" | "gray" | "pink" | "sky" | "violet" | "emerald";

export const LIFECYCLE_COLORS: Record<
  LifecycleColorKey,
  { name: string; bar: string; dot: string; badge: string }
> = {
  orange:  { name: "Orange",  bar: "bg-orange-500",  dot: "bg-orange-500",  badge: "border-orange-500/30 bg-orange-500/10 text-orange-300" },
  blue:    { name: "Blue",    bar: "bg-blue-500",    dot: "bg-blue-500",    badge: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  purple:  { name: "Purple",  bar: "bg-purple-500",  dot: "bg-purple-500",  badge: "border-purple-500/30 bg-purple-500/10 text-purple-300" },
  yellow:  { name: "Yellow",  bar: "bg-yellow-500",  dot: "bg-yellow-500",  badge: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300" },
  green:   { name: "Green",   bar: "bg-green-500",   dot: "bg-green-500",   badge: "border-green-500/30 bg-green-500/10 text-green-300" },
  red:     { name: "Red",     bar: "bg-red-500",     dot: "bg-red-500",     badge: "border-red-500/30 bg-red-500/10 text-red-300" },
  gray:    { name: "Gray",    bar: "bg-gray-500",    dot: "bg-gray-500",    badge: "border-gray-500/30 bg-gray-500/10 text-gray-300" },
  pink:    { name: "Pink",    bar: "bg-pink-500",    dot: "bg-pink-500",    badge: "border-pink-500/30 bg-pink-500/10 text-pink-300" },
  sky:     { name: "Sky",     bar: "bg-sky-500",     dot: "bg-sky-500",     badge: "border-sky-500/30 bg-sky-500/10 text-sky-300" },
  violet:  { name: "Violet",  bar: "bg-violet-500",  dot: "bg-violet-500",  badge: "border-violet-500/30 bg-violet-500/10 text-violet-300" },
  emerald: { name: "Emerald", bar: "bg-emerald-500", dot: "bg-emerald-500", badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
};

export type LifecycleGroup = "active" | "lost";

export type LifecycleStageDef = {
  id: string;
  name: string;
  color: LifecycleColorKey;
  group: LifecycleGroup;
  /** Default/system stages cannot be deleted. */
  system?: boolean;
};

export const DEFAULT_LIFECYCLE_STAGES: LifecycleStageDef[] = [
  { id: "lcs-new-lead",        name: "New Lead",        color: "orange", group: "active", system: true },
  { id: "lcs-contacted",       name: "Contacted",       color: "blue",   group: "active", system: true },
  { id: "lcs-qualified",       name: "Qualified",       color: "purple", group: "active", system: true },
  { id: "lcs-pending-payment", name: "Pending Payment", color: "yellow", group: "active", system: true },
  { id: "lcs-customer",        name: "Customer",        color: "green",  group: "active", system: true },
  { id: "lcs-lost",            name: "Lost",            color: "red",    group: "lost",   system: true },
  { id: "lcs-no-reply",        name: "No Reply",        color: "gray",   group: "lost",   system: true },
];

const initialContacts: Contact[] = seedContacts.map((c, idx) => {
  if (c.lifecycleStage) return c;
  // Leave roughly every 5th contact without a lifecycle stage — they appear
  // in the Contacts list but are intentionally excluded from the Kanban view.
  if (idx % 5 === 0) return c;
  const stage = LIFECYCLE_STAGES[idx % LIFECYCLE_STAGES.length];
  const daysBack = 3 + ((idx * 11) % 118);
  const enteredAt = new Date(Date.now() - daysBack * 86400000).toISOString();
  return { ...c, lifecycleStage: stage, stageEnteredAt: enteredAt };
});

type State = {
  contacts: Contact[];
  labels: ContactLabel[];
  lists: ContactList[];
  properties: ContactProperty[];
  lifecycleStages: LifecycleStageDef[];
  activities: Record<string, ContactActivity[]>;
  remarks: Record<string, ContactRemark[]>;
};

export type ContactActivity = {
  id: string;
  contactId: string;
  type:
    | "created"
    | "lifecycle"
    | "label_added"
    | "label_removed"
    | "list_added"
    | "list_removed"
    | "updated"
    | "note";
  message: string;
  at: string; // ISO
};

export type ContactRemark = {
  id: string;
  contactId: string;
  author: string;
  text: string;
  createdAt: string; // ISO
  updatedAt?: string;
};

let state: State = {
  contacts: initialContacts,
  labels: initialLabels,
  lists: initialLists,
  properties: DEFAULT_PROPERTIES,
  lifecycleStages: DEFAULT_LIFECYCLE_STAGES,
  activities: {},
  remarks: {},
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

type Updater<T> = T | ((current: T) => T);
const resolve = <T>(u: Updater<T>, current: T): T =>
  typeof u === "function" ? (u as (c: T) => T)(current) : u;

export const contactsStore = {
  get state() {
    return state;
  },
  setContacts(u: Updater<Contact[]>) {
    state = { ...state, contacts: resolve(u, state.contacts) };
    emit();
  },
  setLabels(u: Updater<ContactLabel[]>) {
    state = { ...state, labels: resolve(u, state.labels) };
    emit();
  },
  setLists(u: Updater<ContactList[]>) {
    state = { ...state, lists: resolve(u, state.lists) };
    emit();
  },
  setProperties(u: Updater<ContactProperty[]>) {
    state = { ...state, properties: resolve(u, state.properties) };
    emit();
  },
  setLifecycleStages(u: Updater<LifecycleStageDef[]>) {
    state = { ...state, lifecycleStages: resolve(u, state.lifecycleStages) };
    emit();
  },
  addLifecycleStage(stage: Omit<LifecycleStageDef, "id"> & { id?: string }) {
    const id = stage.id ?? `lcs-${Date.now()}`;
    state = { ...state, lifecycleStages: [...state.lifecycleStages, { ...stage, id }] };
    emit();
  },
  updateLifecycleStage(id: string, patch: Partial<Omit<LifecycleStageDef, "id">>) {
    const old = state.lifecycleStages.find((s) => s.id === id);
    if (!old) return;
    const nextStages = state.lifecycleStages.map((s) =>
      s.id === id ? { ...s, ...patch } : s,
    );
    let nextContacts = state.contacts;
    if (patch.name && patch.name !== old.name) {
      nextContacts = state.contacts.map((c) =>
        c.lifecycleStage === old.name ? { ...c, lifecycleStage: patch.name } : c,
      );
    }
    state = { ...state, lifecycleStages: nextStages, contacts: nextContacts };
    emit();
  },
  deleteLifecycleStage(id: string) {
    const stage = state.lifecycleStages.find((s) => s.id === id);
    if (!stage || stage.system) return;
    const nextStages = state.lifecycleStages.filter((s) => s.id !== id);
    const nextContacts = state.contacts.map((c) =>
      c.lifecycleStage === stage.name
        ? { ...c, lifecycleStage: undefined, stageEnteredAt: undefined }
        : c,
    );
    state = { ...state, lifecycleStages: nextStages, contacts: nextContacts };
    emit();
  },
  reorderLifecycleStages(orderedIds: string[]) {
    const map = new Map(state.lifecycleStages.map((s) => [s.id, s]));
    const next: LifecycleStageDef[] = [];
    for (const id of orderedIds) {
      const s = map.get(id);
      if (s) next.push(s);
    }
    // Append any stage that wasn't included to keep data safe
    for (const s of state.lifecycleStages) if (!orderedIds.includes(s.id)) next.push(s);
    state = { ...state, lifecycleStages: next };
    emit();
  },
  softDeleteContacts(ids: string[]) {
    const now = new Date().toISOString();
    state = {
      ...state,
      contacts: state.contacts.map((c) =>
        ids.includes(c.id) ? { ...c, deleted: true, deletedAt: now } : c,
      ),
    };
    emit();
  },
  restoreContacts(ids: string[]) {
    state = {
      ...state,
      contacts: state.contacts.map((c) =>
        ids.includes(c.id) ? { ...c, deleted: false, deletedAt: undefined } : c,
      ),
    };
    emit();
  },
  hardDeleteContacts(ids: string[]) {
    state = { ...state, contacts: state.contacts.filter((c) => !ids.includes(c.id)) };
    emit();
  },
  addActivity(contactId: string, type: ContactActivity["type"], message: string) {
    const entry: ContactActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      contactId,
      type,
      message,
      at: new Date().toISOString(),
    };
    const list = state.activities[contactId] ?? [];
    state = {
      ...state,
      activities: { ...state.activities, [contactId]: [entry, ...list] },
    };
    emit();
  },
  addRemark(contactId: string, author: string, text: string) {
    const entry: ContactRemark = {
      id: `rm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      contactId,
      author,
      text,
      createdAt: new Date().toISOString(),
    };
    const list = state.remarks[contactId] ?? [];
    state = {
      ...state,
      remarks: { ...state.remarks, [contactId]: [entry, ...list] },
    };
    emit();
  },
  updateRemark(contactId: string, remarkId: string, text: string) {
    const list = state.remarks[contactId] ?? [];
    const next = list.map((r) =>
      r.id === remarkId ? { ...r, text, updatedAt: new Date().toISOString() } : r,
    );
    state = { ...state, remarks: { ...state.remarks, [contactId]: next } };
    emit();
  },
  deleteRemark(contactId: string, remarkId: string) {
    const list = state.remarks[contactId] ?? [];
    state = {
      ...state,
      remarks: { ...state.remarks, [contactId]: list.filter((r) => r.id !== remarkId) },
    };
    emit();
  },
};

export function useContactsStore(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}