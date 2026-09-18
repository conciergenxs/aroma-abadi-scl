import { useSyncExternalStore } from "react";
import type { Message } from "./mock-data";

// ── What the user has actually done in the Inbox ──────────────────────────────
// Replies sent, pins, read/unread overrides, who was added to a conversation and
// whether Arma is still driving it. All of it used to live in the page's own
// useState, so a trip to Contacts and back wiped it. Everything else in the app
// keeps its state in a store; the Inbox does too.

export type ReplyRef = { id: string; text: string; fromName: string; time: string };
export type SentMsg = Message & { replyTo?: ReplyRef; forwardedFrom?: string };

export type InboxState = {
  /** Messages the user sent, keyed by conversation. */
  sentByConvo: Record<string, SentMsg[]>;
  /** Half-written replies, keyed by conversation — never shared between them. */
  draftByConvo: Record<string, string>;
  /** The message being replied to, keyed by conversation. */
  replyTargets: Record<string, ReplyRef | undefined>;
  /** true = forced unread, false = marked read, absent = whatever the thread says. */
  unreadOverrides: Record<string, boolean>;
  pinnedIds: string[];
  /** Absent or true = Arma is driving; false = a human took over. */
  autopilotByConvo: Record<string, boolean>;
  /** Teammates added to a conversation, keyed by conversation. */
  collaborators: Record<string, string[]>;
};

const EMPTY: InboxState = {
  sentByConvo: {},
  draftByConvo: {},
  replyTargets: {},
  unreadOverrides: {},
  pinnedIds: [],
  autopilotByConvo: {},
  collaborators: {},
};

const STORAGE_KEY = "aroma_inbox_store_v1";

/** Distinct object so the server render and the first client render agree —
 * same pattern as the other useSyncExternalStore stores here. */
const SERVER_SNAPSHOT: InboxState = { ...EMPTY };

let state: InboxState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") state = { ...EMPTY, ...parsed };
  } catch {
    /* a malformed entry just means a fresh inbox */
  }
}

function getSnapshot() {
  load();
  return state;
}

function set(next: Partial<InboxState>) {
  load();
  state = { ...state, ...next };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export const inboxStore = {
  get: getSnapshot,

  setDraft(convoId: string, text: string) {
    set({ draftByConvo: { ...getSnapshot().draftByConvo, [convoId]: text } });
  },
  send(convoId: string, msg: SentMsg) {
    const s = getSnapshot();
    set({
      sentByConvo: { ...s.sentByConvo, [convoId]: [...(s.sentByConvo[convoId] ?? []), msg] },
      draftByConvo: { ...s.draftByConvo, [convoId]: "" },
      replyTargets: { ...s.replyTargets, [convoId]: undefined },
    });
  },
  setReplyTarget(convoId: string, ref: ReplyRef | undefined) {
    set({ replyTargets: { ...getSnapshot().replyTargets, [convoId]: ref } });
  },
  setUnread(convoId: string, unread: boolean) {
    set({ unreadOverrides: { ...getSnapshot().unreadOverrides, [convoId]: unread } });
  },
  togglePinned(convoId: string) {
    const pinned = getSnapshot().pinnedIds;
    set({
      pinnedIds: pinned.includes(convoId)
        ? pinned.filter((id) => id !== convoId)
        : [...pinned, convoId],
    });
  },
  setAutopilot(convoId: string, on: boolean) {
    set({ autopilotByConvo: { ...getSnapshot().autopilotByConvo, [convoId]: on } });
  },
  setCollaborators(convoId: string, ids: string[]) {
    set({ collaborators: { ...getSnapshot().collaborators, [convoId]: ids } });
  },
};

export function useInboxStore(): InboxState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot,
    () => SERVER_SNAPSHOT,
  );
}
