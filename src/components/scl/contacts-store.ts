import { useSyncExternalStore } from "react";
import {
  contacts as seedContacts,
  initialLabels,
  initialLists,
  LIFECYCLE_STAGES,
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

const initialContacts: Contact[] = seedContacts.map((c, idx) => {
  if (c.lifecycleStage) return c;
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