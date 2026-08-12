import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, LabelChip, ListChip, labelColorClass, labelColorDot } from "@/components/scl/app-shell";
import { conversations, threadsByContact, connectedChannels, type LifecycleStage } from "@/components/scl/mock-data";
import type { Contact, Channel } from "@/components/scl/mock-data";
type Conversation = (typeof conversations)[number];
import { useContactsStore, contactsStore, getStageStyle } from "@/components/scl/contacts-store";
import { LifecycleSelect } from "@/components/scl/lifecycle-select";
import { FloatingMenu } from "@/components/scl/floating-menu";
import { ChannelIcon } from "@/components/scl/channel-badge";
import { TemplatePicker } from "@/components/scl/template-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Filter, Paperclip, Smile, Send, Phone, MoreHorizontal, ChevronUp,
  Check, CheckCheck, ChevronDown, Inbox as InboxIcon, Users, AtSign,
  UserX, MessageSquare, Info, Building2,
  Mail, User2, ExternalLink, UserPlus, X as XIcon, Bot, Plus,
} from "lucide-react";
import { StickyNote, AtSign as AtSignIcon, Pin, PinOff, MailOpen, Mail as MailIcon, Reply as ReplyIcon, Copy as CopyIcon, ClipboardPaste, Forward as ForwardIcon, CornerDownRight } from "lucide-react";
import { AI_AGENTS, findAgent, isAgentId } from "@/components/scl/agents";
import { toast } from "sonner";
import type { Message } from "@/components/scl/mock-data";

type ReplyRef = { id: string; text: string; fromName: string; time: string };
type SentMsg = Message & { replyTo?: ReplyRef; forwardedFrom?: string };

export const Route = createFileRoute("/inbox")({
  head: () => ({ meta: [{ title: "Inbox — SCL" }] }),
  component: InboxPage,
});

type InboxView = "all" | "my" | "ba";
type TeamFilter = "all" | string;
type ActiveFilter =
  | { kind: "view"; value: InboxView }
  | { kind: "stage"; value: LifecycleStage }
  | { kind: "team"; value: string };
const tabs = ["All", "Unread", "Assigned", "Unassigned"] as const;

const VIEWS: { id: InboxView; label: string; icon: typeof InboxIcon }[] = [
  { id: "all", label: "All Inbox", icon: InboxIcon },
  { id: "my", label: "Consumer Inbox", icon: Users },
  { id: "ba", label: "BA Inbox", icon: MessageSquare },
];

/** Shared SCL team / user directory used by owner & collaborator selectors. */
type TeamUser = { id: string; name: string; team: string; avatar: string };
const TEAM_USERS: TeamUser[] = [
  { id: "me", name: "You", team: "Sales", avatar: "ME" },
  { id: "sarah", name: "Sarah Burhan", team: "Sales", avatar: "SB" },
  { id: "michael", name: "Michael Septiadi", team: "Sales", avatar: "MS" },
  { id: "rina", name: "Rina Wijaya", team: "Sales", avatar: "RW" },
  { id: "alex", name: "Alex Chen", team: "Support", avatar: "AC" },
  { id: "priya", name: "Priya Patel", team: "Support", avatar: "PP" },
  { id: "tomas", name: "Tomas Becker", team: "Success", avatar: "TB" },
];
const TEAMS = Array.from(new Set(TEAM_USERS.map((u) => u.team)));
const teamOfOwner = (ownerId?: string | null) =>
  ownerId ? TEAM_USERS.find((u) => u.id === ownerId)?.team ?? null : null;
const userLabel = (id?: string | null) => {
  if (!id) return "Unassigned";
  const u = TEAM_USERS.find((x) => x.id === id);
  if (u) return u.name;
  const a = findAgent(id);
  if (a) return a.name;
  return id;
};

function InboxPage() {
  const { contacts, labels, lists, properties, lifecycleStages } = useContactsStore();
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>({ kind: "view", value: "my" });
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [search, setSearch] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState<import("@/components/scl/mock-data").LabelColor>("indigo");

  // ============== INBOX FILTER PANEL ==============
  type FilterCategory = "channels" | "labels" | "owner" | "lifecycle" | "unread";
  type InboxFilters = {
    channels: Channel[];
    labels: string[];
    owners: string[]; // user ids; "__unassigned" for unassigned
    stages: LifecycleStage[];
    unreadOnly: boolean;
  };
  const emptyFilters: InboxFilters = {
    channels: [],
    labels: [],
    owners: [],
    stages: [],
    unreadOnly: false,
  };
  const [filters, setFilters] = useState<InboxFilters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("channels");
  const [filterSearch, setFilterSearch] = useState("");
  const filterBtnRef = useRef<HTMLButtonElement | null>(null);
  const filterPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!filtersOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (filterPanelRef.current?.contains(t)) return;
      if (filterBtnRef.current?.contains(t)) return;
      setFiltersOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  useEffect(() => {
    setFilterSearch("");
  }, [filterCategory]);

  const toggleIn = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const activeFilterCount =
    filters.channels.length +
    filters.labels.length +
    filters.owners.length +
    filters.stages.length +
    (filters.unreadOnly ? 1 : 0);

  const availableChannels = useMemo(() => {
    const seen = new Set<Channel>();
    const out: Channel[] = [];
    for (const c of connectedChannels) {
      if (c.status === "connected" && !seen.has(c.channel)) {
        seen.add(c.channel);
        out.push(c.channel);
      }
    }
    return out;
  }, []);
  const channelLabel = (c: Channel) => ("WhatsApp");

  const ownerOptions = useMemo(
    () => [
      { id: "me", name: "Me" },
      { id: "__unassigned", name: "Unassigned" },
      ...TEAM_USERS.filter((u) => u.id !== "me").map((u) => ({ id: u.id, name: u.name })),
    ],
    [],
  );
  const ownerLabel = (id: string) =>
    id === "__unassigned" ? "Unassigned" : id === "me" ? "Me" : userLabel(id);

  const labelById = useMemo(
    () => new Map(labels.map((l) => [l.id, l] as const)),
    [labels],
  );

  useEffect(() => {
    if (!contextOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [contextOpen]);
  const [collaborators, setCollaborators] = useState<Record<string, string[]>>({});
  const [activeId, setActiveId] = useState(conversations[0].id);

  // ============== PIN + READ STATE OVERRIDES ==============
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  // true = forced unread, false = marked read, undefined = use original
  const [unreadOverrides, setUnreadOverrides] = useState<Record<string, boolean>>({});
  const isPinned = (id: string) => pinnedIds.has(id);
  const togglePinned = (id: string) =>
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const unreadCount = (c: Conversation) => {
    const o = unreadOverrides[c.id];
    if (o === false) return 0;
    if (o === true) return Math.max(c.unread, 1);
    return c.unread;
  };
  const isUnread = (c: Conversation) => unreadCount(c) > 0;
  const markRead = (id: string) =>
    setUnreadOverrides((p) => ({ ...p, [id]: false }));
  const markUnread = (id: string) =>
    setUnreadOverrides((p) => ({ ...p, [id]: true }));

  const [replyText, setReplyText] = useState("");
  // Autopilot state: per conversation
  const [autopilotByConvo, setAutopilotByConvo] = useState<Record<string, boolean>>({});
  const isAutopilot = (id: string) => autopilotByConvo[id] !== false; // default = autopilot ON
  const setAutopilot = (id: string, v: boolean) => setAutopilotByConvo((p) => ({ ...p, [id]: v }));
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  // ============== MESSAGE ACTIONS (reply / copy / forward) ==============
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const [replyTargets, setReplyTargets] = useState<Record<string, ReplyRef | undefined>>({});
  const [sentByConvo, setSentByConvo] = useState<Record<string, SentMsg[]>>({});
  const [forwardMode, setForwardMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardSearch, setForwardSearch] = useState("");
  const [forwardContacts, setForwardContacts] = useState<Set<string>>(new Set());

  // ============== MESSAGE SEARCH ==============
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActiveIdx, setSearchActiveIdx] = useState(0);

  const exitForwardMode = () => {
    setForwardMode(false);
    setSelectedMsgIds(new Set());
  };
  const toggleSelectMsg = (id: string) =>
    setSelectedMsgIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };
  const copyToComposer = (text: string) => {
    setReplyText(text);
    requestAnimationFrame(() => {
      composerRef.current?.focus();
      const end = text.length;
      composerRef.current?.setSelectionRange(end, end);
    });
  };

  const insertTemplate = (body: string) => {
    setReplyText((t) => (t ? `${t}${t.endsWith("\n") ? "" : "\n"}${body}` : body));
  };

  const visible = useMemo(() => {
    return conversations.filter((c) => {
      const ct = contacts.find((x) => x.id === c.contactId);
      if (!ct) return false;
      // Single active primary filter — skip inbox-view check when filtering by label
      if (!labelFilter && activeFilter.kind === "view") {
        const v = activeFilter.value;
        // "all" = show everything, "my" = consumer (non-BA), "ba" = BA inbox
        if (v === "my" && ct.labelIds.includes("lb-ba")) return false;
        if (v === "ba" && !ct.labelIds.includes("lb-ba")) return false;
      } else if (activeFilter.kind === "stage") {
        if (ct.lifecycleStage !== activeFilter.value) return false;
      } else if (activeFilter.kind === "team") {
        const t = teamOfOwner(ct.ownerId);
        if (t !== activeFilter.value) return false;
      }
      // Tabs
      if (tab === "Unread" && !isUnread(c)) return false;
      if (tab === "Assigned" && !ct.ownerId) return false;
      if (tab === "Unassigned" && ct.ownerId) return false;
      // Inbox filter panel
      if (filters.channels.length && !filters.channels.includes(c.channel)) return false;
      if (filters.labels.length && !filters.labels.some((id) => ct.labelIds.includes(id))) return false;
      if (filters.owners.length) {
        const matchUnassigned = filters.owners.includes("__unassigned") && !ct.ownerId;
        const matchUser = ct.ownerId ? filters.owners.includes(ct.ownerId) : false;
        if (!matchUnassigned && !matchUser) return false;
      }
      if (filters.stages.length) {
        if (!ct.lifecycleStage || !filters.stages.includes(ct.lifecycleStage)) return false;
      }
      if (filters.unreadOnly && !isUnread(c)) return false;
      // Label filter (left nav)
      if (labelFilter && !ct.labelIds.includes(labelFilter)) return false;
      // Search
      if (search) {
        const q = search.toLowerCase();
        if (!ct.name.toLowerCase().includes(q) && !c.preview.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [contacts, activeFilter, tab, search, collaborators, filters, unreadOverrides, labelFilter]);

  // Pinned conversations float to the top while preserving original order.
  const sortedVisible = useMemo(() => {
    return [...visible].sort((a, b) => {
      const ap = pinnedIds.has(a.id) ? 1 : 0;
      const bp = pinnedIds.has(b.id) ? 1 : 0;
      return bp - ap;
    });
  }, [visible, pinnedIds]);

  const active = sortedVisible.find((c) => c.id === activeId) ?? sortedVisible[0] ?? conversations[0];
  const contact = contacts.find((c) => c.id === active.contactId)!;
  const thread: Message[] = useMemo(() => {
    const existing = threadsByContact[contact.id];
    if (existing && existing.length) return existing;
    // Fallback: synthesize a small thread from the conversation preview so
    // the chat panel never shows an empty state.
    const greet: Message = {
      id: `gen-${contact.id}-1`,
      from: "them",
      text: `Halo, saya ${contact.name.split(" ")[0]}. Saya tertarik dengan produk Aroma Abadi.`,
      time: "09:12",
      status: "read",
    };
    const reply: Message = {
      id: `gen-${contact.id}-2`,
      from: "me",
      text: `Halo ${contact.name.split(" ")[0]}, terima kasih sudah menghubungi Aroma Abadi. Ada yang bisa kami bantu?`,
      time: "09:14",
      status: "read",
    };
    const follow: Message = {
      id: `gen-${contact.id}-3`,
      from: "them",
      text: active.preview || "Mohon info lebih lanjut ya.",
      time: active.time || "09:20",
      status: "delivered",
    };
    return [greet, reply, follow];
  }, [contact.id, contact.name, active.preview, active.time]);

  // Combined message list (mock thread + locally-sent messages)
  const combinedThread: SentMsg[] = useMemo(
    () => [...thread, ...(sentByConvo[active.id] ?? [])],
    [thread, sentByConvo, active.id],
  );

  // Search matches across messages of the active conversation.
  const searchMatches = useMemo(() => {
    if (!searchOpen) return [] as string[];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as string[];
    const ids: string[] = [];
    for (const m of combinedThread) {
      if (m.text.toLowerCase().includes(q)) ids.push(m.id);
    }
    return ids;
  }, [searchOpen, searchQuery, combinedThread]);
  const activeMatchId = searchMatches[searchActiveIdx];
  useEffect(() => { setSearchActiveIdx(0); }, [searchQuery, active.id]);
  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, [active.id]);
  useEffect(() => {
    if (!activeMatchId) return;
    const el = document.querySelector(`[data-search-id="${activeMatchId}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeMatchId]);
  const highlightQuery = searchOpen ? searchQuery.trim() : "";

  const senderName = (m: Message) => (m.from === "me" ? "You" : contact.name);
  const replyTarget = replyTargets[active.id];
  const startReply = (m: Message) => {
    setComposerMode("reply");
    setReplyTargets((prev) => ({
      ...prev,
      [active.id]: { id: m.id, text: m.text, fromName: senderName(m), time: m.time },
    }));
    requestAnimationFrame(() => composerRef.current?.focus());
  };
  const clearReply = () =>
    setReplyTargets((prev) => ({ ...prev, [active.id]: undefined }));
  const submitReply = () => {
    const text = replyText.trim();
    if (!text) return;
    const sent: SentMsg = {
      id: `s_${Date.now()}`,
      from: "me",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "delivered",
      replyTo: replyTarget,
    };
    setSentByConvo((prev) => ({ ...prev, [active.id]: [...(prev[active.id] ?? []), sent] }));
    setReplyText("");
    clearReply();
  };
  const startForward = (m: Message) => {
    setForwardMode(true);
    setSelectedMsgIds(new Set([m.id]));
  };
  const openForwardModal = () => {
    if (selectedMsgIds.size === 0) return;
    setForwardContacts(new Set());
    setForwardSearch("");
    setForwardModalOpen(true);
  };
  const confirmForward = () => {
    const count = selectedMsgIds.size;
    const recipients = forwardContacts.size;
    setForwardModalOpen(false);
    exitForwardMode();
    toast.success(
      `Messages forwarded successfully`,
      { description: `${count} message${count === 1 ? "" : "s"} sent to ${recipients} contact${recipients === 1 ? "" : "s"}` },
    );
  };

  const stageCounts = useMemo(() => {
    const map = new Map<LifecycleStage, number>();
    for (const c of conversations) {
      const ct = contacts.find((x) => x.id === c.contactId);
      if (!ct?.lifecycleStage) continue;
      map.set(ct.lifecycleStage, (map.get(ct.lifecycleStage) ?? 0) + 1);
    }
    return map;
  }, [contacts]);

  const viewCounts = useMemo(() => {
    const result: Record<InboxView, number> = { all: 0, my: 0, ba: 0 };
    for (const c of conversations) {
      if (c.unread <= 0) continue;
      const ct = contacts.find((x) => x.id === c.contactId);
      result.all += c.unread;
      if (ct?.labelIds.includes("lb-ba")) result.ba += c.unread;
      else result.my += c.unread;
    }
    return result;
  }, [contacts, conversations]);

  const teamCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of conversations) {
      const ct = contacts.find((x) => x.id === c.contactId);
      if (!ct) continue;
      const t = teamOfOwner(ct.ownerId);
      if (!t) continue;
      map.set(t, (map.get(t) ?? 0) + 1);
    }
    return map;
  }, [contacts]);

  const isViewActive = (id: InboxView) =>
    activeFilter.kind === "view" && activeFilter.value === id;
  const isStageActive = (s: LifecycleStage | null) =>
    s === null
      ? activeFilter.kind !== "stage"
      : activeFilter.kind === "stage" && activeFilter.value === s;
  const isTeamActive = (t: TeamFilter) =>
    t === "all"
      ? activeFilter.kind !== "team"
      : activeFilter.kind === "team" && activeFilter.value === t;

  const filterContext = useMemo(() => {
    if (activeFilter.kind === "view") {
      const v = activeFilter.value;
      if (v === "my") return { title: "My Inbox", subtitle: "Showing conversations assigned to you" };
      if (v === "collaborations") return { title: "Collaborations", subtitle: "Conversations where multiple teammates collaborate" };
      if (v === "mentions") return { title: "Mentions", subtitle: "Conversations where you are mentioned" };
      return { title: "Unassigned", subtitle: "Showing conversations with no owner" };
    }
    if (activeFilter.kind === "stage") {
      return { title: activeFilter.value, subtitle: `Showing contacts in ${activeFilter.value} stage` };
    }
    return { title: `${activeFilter.value} Team`, subtitle: `Showing conversations handled by ${activeFilter.value} Team` };
  }, [activeFilter]);

  return (
    <AppShell title="Inbox" subtitle="Shared workspace · 4 teammates online" noPadding>
      <div className="flex h-[calc(100vh-64px)] min-h-0 w-full overflow-hidden">
        {/* ============== LEFT NAV ============== */}
        <aside className="shrink-0 w-[252px] border-r border-border/60 bg-background scl-grid-bg overflow-y-auto py-1.5">
          <NavSection title="Inbox Views">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              const sel = isViewActive(v.id);
              const count = viewCounts[v.id];
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveFilter({ kind: "view", value: v.id })}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition ${
                    sel
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground/80 hover:text-foreground hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${sel ? "" : "opacity-70"}`} />
                  <span className="flex-1 text-left">{v.label}</span>
                  {count > 0 && (
                    <span className={`text-[11px] tabular-nums ${sel ? "text-primary" : "text-muted-foreground/60"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </NavSection>

          {/* Labels filter section */}
          <div className="border-t border-border pt-3 mt-2 px-2">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Labels</span>
              <button
                onClick={() => setLabelModalOpen(true)}
                className="h-5 w-5 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground transition-colors duration-150"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            {labels.map((lbl) => {
              const count = contacts.filter((c) => c.labelIds.includes(lbl.id)).length;
              const active = labelFilter === lbl.id;
              return (
                <button
                  key={lbl.id}
                  onClick={() => setLabelFilter(active ? null : lbl.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12px] transition-colors ${active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-gray-50"}`}
                >
                  <span className={`h-2 w-2 rounded-full ${labelColorDot[lbl.color]}`} />
                  <span className="flex-1 text-left truncate">{lbl.name}</span>
                  <span className="text-[10px] text-muted-foreground">{count}</span>
                </button>
              );
            })}
            {labelModalOpen && (
              <div className="px-1 py-2 space-y-2">
                <input
                  autoFocus
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Label name..."
                  className="w-full h-7 rounded border border-border bg-white px-2 text-xs focus:outline-none"
                />
                <select
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value as import("@/components/scl/mock-data").LabelColor)}
                  className="w-full h-7 rounded border border-border bg-white px-2 text-xs focus:outline-none"
                >
                  {(["indigo","pink","emerald","amber","sky","violet","slate"] as const).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      if (!newLabelName.trim()) return;
                      contactsStore.setLabels((l) => [...l, { id: `lb-${Date.now()}`, name: newLabelName.trim(), color: newLabelColor }]);
                      setNewLabelName("");
                      setLabelModalOpen(false);
                    }}
                    className="flex-1 h-7 rounded bg-primary text-primary-foreground text-xs font-medium"
                  >Save</button>
                  <button
                    onClick={() => { setNewLabelName(""); setLabelModalOpen(false); }}
                    className="flex-1 h-7 rounded border border-border text-xs text-muted-foreground"
                  >Cancel</button>
                </div>
              </div>
            )}
          </div>

        </aside>

        {/* ============== CONVERSATION LIST ============== */}
        <aside className="shrink-0 w-[340px] min-w-[340px] border-r border-border flex flex-col min-h-0 bg-background/40">
          <div className="px-3.5 pt-3 pb-2 border-b border-border/60">
            <div className="text-[13px] font-semibold text-foreground truncate">{filterContext.title}</div>
            <div className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{filterContext.subtitle}</div>
          </div>
          <div className="p-3 border-b border-border space-y-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations"
                className="h-9 w-full rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              {tabs.map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-2 py-1 rounded ${tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {t}
                </button>
              ))}
              <div className="ml-auto relative">
                <button
                  ref={filterBtnRef}
                  onClick={() => setFiltersOpen((v) => !v)}
                  aria-label="Filter conversations"
                  className={`h-7 inline-flex items-center gap-1 px-1.5 rounded border transition ${
                    filtersOpen || activeFilterCount > 0
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {activeFilterCount > 0 && (
                    <span className="text-[10px] font-semibold tabular-nums">{activeFilterCount}</span>
                  )}
                </button>
                {filtersOpen && (
                  <FilterPanel
                    panelRef={filterPanelRef}
                    category={filterCategory}
                    setCategory={setFilterCategory}
                    filters={filters}
                    setFilters={setFilters}
                    activeCount={activeFilterCount}
                    search={filterSearch}
                    setSearch={setFilterSearch}
                    availableChannels={availableChannels}
                    channelLabel={channelLabel}
                    labels={labels}
                    ownerOptions={ownerOptions}
                    onClose={() => setFiltersOpen(false)}
                    onClear={() => setFilters(emptyFilters)}
                    toggleIn={toggleIn}
                  />
                )}
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {filters.channels.map((c) => (
                  <FilterChip key={`ch-${c}`} label={channelLabel(c)} onRemove={() => setFilters((f) => ({ ...f, channels: f.channels.filter((x) => x !== c) }))} />
                ))}
                {filters.labels.map((id) => {
                  const lb = labelById.get(id);
                  if (!lb) return null;
                  return (
                    <FilterChip key={`lb-${id}`} label={lb.name} onRemove={() => setFilters((f) => ({ ...f, labels: f.labels.filter((x) => x !== id) }))} />
                  );
                })}
                {filters.owners.map((id) => (
                  <FilterChip key={`ow-${id}`} label={ownerLabel(id)} onRemove={() => setFilters((f) => ({ ...f, owners: f.owners.filter((x) => x !== id) }))} />
                ))}
                {filters.stages.map((s) => (
                  <FilterChip key={`st-${s}`} label={s} onRemove={() => setFilters((f) => ({ ...f, stages: f.stages.filter((x) => x !== s) }))} />
                ))}
                {filters.unreadOnly && (
                  <FilterChip label="Unread only" onRemove={() => setFilters((f) => ({ ...f, unreadOnly: false }))} />
                )}
                <button
                  onClick={() => setFilters(emptyFilters)}
                  className="ml-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto stagger">
            {sortedVisible.length === 0 && (
              <div className="px-4 py-10 text-center text-[11px] text-muted-foreground">
                No conversations match the current filters.
              </div>
            )}
            {sortedVisible.map((c) => {
              const ct = contacts.find((x) => x.id === c.contactId);
              if (!ct) return null;
              const sel = c.id === activeId;
              const stageColor = ct.lifecycleStage ? getStageStyle(ct.lifecycleStage) : null;
              const unread = isUnread(c);
              const count = unreadCount(c);
              const pinned = isPinned(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`conv-item w-full text-left flex gap-3 px-3.5 py-3 border-b border-border/40 transition-all duration-150 ${
                    sel
                      ? "active-conv bg-primary/10 border-l-2 border-l-primary"
                      : "border-l-2 border-l-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="relative shrink-0 h-10 w-10 self-start">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-xs font-medium">
                      {ct.avatar}
                    </div>
                    <ChannelIcon
                      channel={c.channel}
                      className="absolute -bottom-0.5 -right-0.5 h-[16px] w-[16px] ring-2 ring-background shadow-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[15px] truncate ${unread ? "font-semibold text-foreground" : "font-medium text-foreground/90"}`}>
                        {ct.name}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <span className={`text-[10px] tabular-nums ${unread ? "text-primary font-medium" : "text-muted-foreground/60"}`}>
                          {c.time}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className={`text-[12px] truncate leading-snug ${unread ? "text-foreground/85" : "text-muted-foreground/70"}`}>
                        {c.preview}
                      </p>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {pinned && (
                          <Pin className="h-3 w-3 text-primary fill-primary/80" aria-label="Pinned" />
                        )}
                        {unread && (
                          <span className="rounded-full bg-primary px-1.5 min-w-[18px] h-[18px] grid place-items-center text-[10px] font-semibold text-primary-foreground">
                            {count}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {stageColor && ct.lifecycleStage && (
                        <span title={ct.lifecycleStage} className={`inline-block h-2.5 w-2.5 rounded-full ${stageColor.dot}`} />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ============== ACTIVE CONVERSATION ============== */}
        <section className="flex-1 min-w-0 flex flex-col min-h-0">
          <ConversationHeader
            contact={contact}
            active={active}
            collaborators={collaborators[active.id] ?? []}
            onChangeLifecycle={(next) => {
              contactsStore.setContacts((list) =>
                list.map((c) => (c.id === contact.id ? { ...c, lifecycleStage: next ?? undefined } : c)),
              );
            }}
            onChangeOwner={(ownerId) => {
              contactsStore.setContacts((list) =>
                list.map((c) => (c.id === contact.id ? { ...c, ownerId: ownerId ?? undefined } : c)),
              );
            }}
            onChangeCollaborators={(ids) =>
              setCollaborators((prev) => ({ ...prev, [active.id]: ids }))
            }
            contextOpen={contextOpen}
            onToggleContext={() => setContextOpen((v) => !v)}
            isPinned={isPinned(active.id)}
            isUnread={isUnread(active)}
            onTogglePin={() => togglePinned(active.id)}
            onToggleRead={() =>
              isUnread(active) ? markRead(active.id) : markUnread(active.id)
            }
            searchOpen={searchOpen}
            onToggleSearch={() => setSearchOpen((v) => !v)}
          />

          {searchOpen && (
            <SearchStrip
              query={searchQuery}
              setQuery={setSearchQuery}
              total={searchMatches.length}
              index={searchActiveIdx}
              onPrev={() =>
                setSearchActiveIdx((i) =>
                  searchMatches.length === 0 ? 0 : (i - 1 + searchMatches.length) % searchMatches.length,
                )
              }
              onNext={() =>
                setSearchActiveIdx((i) =>
                  searchMatches.length === 0 ? 0 : (i + 1) % searchMatches.length,
                )
              }
              onClose={() => { setSearchOpen(false); setSearchQuery(""); }}
            />
          )}

          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-5 scl-grid-bg">
            <div className="text-center text-[10px] uppercase tracking-wider text-muted-foreground/60">Today</div>
            {combinedThread.map((m) => (
              <MessageRow
                key={m.id}
                message={m}
                senderName={senderName(m)}
                forwardMode={forwardMode}
                selected={selectedMsgIds.has(m.id)}
                onToggleSelect={() => toggleSelectMsg(m.id)}
                onReply={() => startReply(m)}
                onCopy={() => copyToClipboard(m.text)}
                onCopyToBox={() => copyToComposer(m.text)}
                onForward={() => startForward(m)}
                highlightQuery={highlightQuery}
                isActiveMatch={activeMatchId === m.id}
              />
            ))}
            {(notesByConvo[active.id] ?? []).map((n) => (
              <div key={n.id} data-search-id={n.id} className="flex justify-center">
                <div className={`max-w-[80%] w-full rounded-xl border px-4 py-3 shadow-sm transition ${activeMatchId === n.id ? "border-amber-300/70 bg-amber-300/[0.12] ring-2 ring-amber-300/40" : "border-amber-300/30 bg-amber-300/[0.06]"}`}>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-amber-300/90 font-semibold">
                    <StickyNote className="h-3 w-3" />
                    Internal note
                    <span className="ml-auto text-muted-foreground/70 normal-case tracking-normal">
                      {userLabel(n.authorId)} · {n.time}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {highlightQuery ? (
                      <HighlightedText text={n.text} query={highlightQuery} isActive={activeMatchId === n.id} />
                    ) : (
                      n.text.split(/(@[A-Za-z][A-Za-z ]*?)(?=\s|$|[.,!?])/g).map((part, i) =>
                        part.startsWith("@") && TEAM_USERS.some((u) => `@${u.name}` === part.trim()) ? (
                          <span key={i} className="rounded bg-amber-300/20 text-amber-200 px-1 font-medium">{part}</span>
                        ) : (
                          <span key={i}>{part}</span>
                        ),
                      )
                    )}
                  </p>
                  {n.mentions.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground/80">
                      <AtSignIcon className="h-3 w-3" />
                      Notified {n.mentions.map((id) => userLabel(id)).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/60 bg-background/30 px-6 py-4">
            {forwardMode ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5">
                <div className="text-[13px] font-medium text-foreground">
                  {selectedMsgIds.size} message{selectedMsgIds.size === 1 ? "" : "s"} selected
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exitForwardMode}
                    className="h-9 px-3 rounded-md border border-border bg-card/60 text-[14px] hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={openForwardModal}
                    disabled={selectedMsgIds.size === 0}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-[14px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ForwardIcon className="h-3.5 w-3.5" /> Forward
                  </button>
                </div>
              </div>
            ) : isAutopilot(active.id) ? (
              /* Autopilot mode: show Takeover button instead of composer */
              <div className="rounded-xl border border-border bg-card/30 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="h-4 w-4 text-primary" />
                  <span>Arma is currently replying to this conversation automatically.</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setAutopilot(active.id, false); setComposerMode("reply"); }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 h-8 text-xs font-semibold hover:bg-primary/90 transition shrink-0"
                >
                  Takeover
                </button>
              </div>
            ) : composerMode === "reply" ? (
              <div className="rounded-xl border border-border bg-card/80 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition">
                {replyTarget && (
                  <div className="flex items-start gap-2 mx-3 mt-3 rounded-md border-l-2 border-primary bg-primary/[0.08] pl-2.5 pr-2 py-2">
                    <CornerDownRight className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="font-semibold text-primary/90">Replying to {replyTarget.fromName}</span>
                        <span>·</span>
                        <span>{replyTarget.time}</span>
                      </div>
                      <div className="mt-0.5 text-[12px] text-foreground/80 line-clamp-2">
                        {replyTarget.text}
                      </div>
                    </div>
                    <button
                      onClick={clearReply}
                      aria-label="Cancel reply"
                      className="h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors duration-150"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <textarea
                  ref={composerRef}
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submitReply(); }
                  }}
                  placeholder="Reply as Arma.."
                  className="w-full bg-transparent resize-none px-4 pt-3.5 pb-2 text-[14px] leading-relaxed focus:outline-none placeholder:text-muted-foreground/60"
                />
                <div className="flex items-center justify-between px-2 py-1.5 border-t border-border/50">
                  <div className="flex items-center gap-0.5 text-muted-foreground/70">
                    <button className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 hover:text-foreground transition-colors duration-150"><Paperclip className="h-4 w-4" /></button>
                    <button className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 hover:text-foreground transition-colors duration-150"><Smile className="h-4 w-4" /></button>
                    <button
                      onClick={() => setTemplatePickerOpen(true)}
                      className="ml-1 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-gray-50 hover:text-foreground transition-colors duration-150"
                    >
                      Use template <ChevronDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => { setComposerMode("note"); requestAnimationFrame(() => noteRef.current?.focus()); }}
                      className="ml-1 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-amber-300/10 text-amber-300/90 transition-colors duration-150"
                    >
                      <StickyNote className="h-3.5 w-3.5" /> Internal note
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAutopilot(active.id, true)}
                      className="inline-flex items-center gap-1.5 h-9 rounded-md border border-border px-3 text-[14px] text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors"
                    >
                      <Bot className="h-3.5 w-3.5" /> Back to Autopilot
                    </button>
                    <button
                      onClick={submitReply}
                      disabled={!replyText.trim()}
                      className="inline-flex items-center gap-2 h-9 rounded-md bg-primary px-4 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" /> Send
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl border-2 border-amber-300/40 bg-amber-300/[0.08] shadow-sm focus-within:border-amber-300/70 focus-within:ring-2 focus-within:ring-amber-300/20 transition">
                <div className="flex items-center gap-2 px-4 pt-2.5 pb-1.5 border-b border-amber-300/20">
                  <StickyNote className="h-3.5 w-3.5 text-amber-300" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Internal note</span>
                  <span className="text-[11px] text-muted-foreground/70">Only visible to teammates · use @ to mention</span>
                  <button
                    onClick={exitNoteMode}
                    aria-label="Exit internal note"
                    className="ml-auto h-6 w-6 grid place-items-center rounded hover:bg-amber-300/15 text-amber-300/80 hover:text-amber-200 transition-colors duration-150"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                <textarea
                  ref={noteRef}
                  rows={2}
                  value={noteText}
                  onChange={handleNoteChange}
                  onKeyDown={(e) => {
                    if (mentionQuery !== null && mentionMatches.length > 0) {
                      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex((i) => (i + 1) % mentionMatches.length); return; }
                      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex((i) => (i - 1 + mentionMatches.length) % mentionMatches.length); return; }
                      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(mentionMatches[mentionIndex]); return; }
                      if (e.key === "Escape") { e.preventDefault(); setMentionQuery(null); return; }
                    }
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submitNote(); }
                  }}
                  placeholder="Add a note for your team. Type @ to mention someone…"
                  className="w-full bg-transparent resize-none px-4 pt-3 pb-2 text-[14px] leading-relaxed focus:outline-none placeholder:text-amber-200/40 text-foreground"
                />
                {mentionQuery !== null && mentionMatches.length > 0 && (
                  <div className="absolute left-4 bottom-full mb-2 w-[280px] rounded-lg border border-border bg-popover shadow-lg overflow-hidden z-20">
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 border-b border-border/60">Mention teammate</div>
                    {mentionMatches.map((u, i) => (
                      <button
                        key={u.id}
                        onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                        onMouseEnter={() => setMentionIndex(i)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm ${i === mentionIndex ? "bg-accent" : "hover:bg-accent/60"}`}
                      >
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/40 to-card border border-border grid place-items-center text-[11px] font-medium">{u.avatar}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] text-foreground truncate">{u.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{u.team}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between px-2 py-1.5 border-t border-amber-300/20">
                  <div className="flex items-center gap-0.5 text-amber-300/70">
                    <button className="h-7 w-7 grid place-items-center rounded hover:bg-amber-300/10 hover:text-amber-200 transition-colors duration-150"><Paperclip className="h-4 w-4" /></button>
                    <button className="h-7 w-7 grid place-items-center rounded hover:bg-amber-300/10 hover:text-amber-200 transition-colors duration-150"><Smile className="h-4 w-4" /></button>
                    <button
                      onClick={() => {
                        const el = noteRef.current;
                        const caret = el?.selectionStart ?? noteText.length;
                        const next = noteText.slice(0, caret) + "@" + noteText.slice(caret);
                        setNoteText(next);
                        setMentionQuery("");
                        requestAnimationFrame(() => {
                          el?.focus();
                          const pos = caret + 1;
                          el?.setSelectionRange(pos, pos);
                        });
                      }}
                      className="h-7 w-7 grid place-items-center rounded hover:bg-amber-300/10 hover:text-amber-200 transition-colors duration-150"
                    >
                      <AtSignIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setTemplatePickerOpen(true)}
                      className="ml-1 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-amber-300/10 hover:text-amber-200 transition-colors duration-150"
                    >
                      Use template
                    </button>
                  </div>
                  <button
                    onClick={submitNote}
                    disabled={!noteText.trim()}
                    className="inline-flex items-center gap-2 h-9 rounded-md bg-amber-400 px-4 text-[14px] font-medium text-amber-950 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <StickyNote className="h-3.5 w-3.5" /> Add note
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>
      {/* ============== CONTACT CONTEXT PANEL (overlay side drawer) ============== */}
      {contextOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/25 animate-fade-in"
            onClick={() => setContextOpen(false)}
            aria-hidden
          />
          {/* Drawer */}
          <aside
            role="dialog"
            aria-label="Contact details"
            className="absolute right-0 top-0 h-full w-[440px] max-w-[95vw] bg-background border-l border-border shadow-2xl flex flex-col animate-slide-in-right"
          >
            {/* Fixed header */}
            <div className="shrink-0 flex items-center justify-between gap-3 px-5 h-14 border-b border-border bg-background">
              <div className="text-sm font-semibold truncate">{contact.name}</div>
              <button
                onClick={() => setContextOpen(false)}
                className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors duration-150"
                aria-label="Close"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
            <div className="p-5 border-b border-border text-center">
              <div className="relative mx-auto h-16 w-16">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/40 to-card border border-border grid place-items-center text-[15px] font-medium">{contact.avatar}</div>
                <ChannelIcon
                  channel={contact.channel}
                  className="absolute -bottom-0.5 -right-0.5 h-[22px] w-[22px] ring-2 ring-background shadow-sm"
                />
              </div>
              <div className="mt-3 text-sm font-medium">{contact.name}</div>
              {contact.lifecycleStage && (
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] ${getStageStyle(contact.lifecycleStage).badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${getStageStyle(contact.lifecycleStage).dot}`} />
                    {contact.lifecycleStage}
                  </span>
                </div>
              )}
              <div className="mt-3">
                <Link
                  to="/contacts/$contactId"
                  params={{ contactId: contact.id }}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline transition-colors duration-150"
                >
                  Open full contact <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <Section title="Labels">
              <div className="flex flex-wrap gap-1">
                {contact.labelIds.length === 0 && <span className="text-[11px] text-muted-foreground">No labels</span>}
                {contact.labelIds.map((id) => {
                  const l = labels.find((x) => x.id === id);
                  return l ? <LabelChip key={id} label={l} /> : null;
                })}
              </div>
            </Section>

            <Section title="Audience">
              <div className="flex flex-wrap gap-1">
                {contact.listIds.length === 0 && <span className="text-[11px] text-muted-foreground">Not in any audience</span>}
                {contact.listIds.map((id) => {
                  const l = lists.find((x) => x.id === id);
                  return l ? <ListChip key={id} name={l.name} /> : null;
                })}
              </div>
            </Section>

            <Section title="Contact Information">
              <InfoRow icon={<Mail className="h-3 w-3" />} label="Email" value={contact.email ?? "—"} />
              <InfoRow icon={<Phone className="h-3 w-3" />} label="Phone" value={contact.phone} />
              <InfoRow icon={<MessageSquare className="h-3 w-3" />} label="Channel" value="WhatsApp" />
              <InfoRow icon={<span className="h-3 w-3 grid place-items-center text-muted-foreground">·</span>} label="Last interaction" value={contact.lastInteraction} />
            </Section>

            <Section title="Contact Properties">
              {(() => {
                const SYS = new Set(["name", "phone", "channel", "labels", "lists", "lastInteraction", "status", "email"]);
                const custom = properties.filter((p) => !p.system && !SYS.has(p.key));
                if (custom.length === 0) {
                  return (
                    <div className="text-[11px] text-muted-foreground">
                      No custom properties. Add them in Manage Properties.
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {custom.map((p) => {
                      const v = contact.customFields?.[p.key];
                      const display = formatPropertyValue(v);
                      return (
                        <div key={p.id} className="flex items-start justify-between gap-3 text-xs">
                          <span className="text-muted-foreground">{p.name}</span>
                          <span className={`text-right break-words ${display === "—" ? "text-muted-foreground" : "text-foreground"}`}>
                            {display}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </Section>
          </div>
          </aside>
        </div>
      )}
      <TemplatePicker
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onInsert={insertTemplate}
      />
      {forwardModalOpen && (
        <ForwardModal
          count={selectedMsgIds.size}
          contacts={contacts}
          search={forwardSearch}
          setSearch={setForwardSearch}
          selected={forwardContacts}
          toggle={(id) =>
            setForwardContacts((prev) => {
              const n = new Set(prev);
              if (n.has(id)) n.delete(id);
              else n.add(id);
              return n;
            })
          }
          onClose={() => setForwardModalOpen(false)}
          onConfirm={confirmForward}
        />
      )}
    </AppShell>
  );
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-2.5 py-3 border-b border-border/40 last:border-b-0">
      <div className="px-2.5 pt-1 pb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/90">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 border-b border-border">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-xs">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">{icon}{label}</span>
      <span className={`text-right truncate ${value === "—" || value === "Unassigned" ? "text-muted-foreground" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function formatPropertyValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length === 0 ? "—" : v.join(", ");
  return String(v);
}

// ============================================================
// Conversation Header (Sleekflow-inspired)
// ============================================================

function ConversationHeader({
  contact,
  active,
  collaborators,
  contextOpen,
  onChangeLifecycle,
  onChangeOwner,
  onChangeCollaborators,
  onToggleContext,
  isPinned,
  isUnread,
  onTogglePin,
  onToggleRead,
  searchOpen,
  onToggleSearch,
}: {
  contact: Contact;
  active: Conversation;
  collaborators: string[];
  contextOpen: boolean;
  onChangeLifecycle: (next: LifecycleStage | null) => void;
  onChangeOwner: (ownerId: string | null) => void;
  onChangeCollaborators: (ids: string[]) => void;
  onToggleContext: () => void;
  isPinned: boolean;
  isUnread: boolean;
  onTogglePin: () => void;
  onToggleRead: () => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
}) {
  const moreRef = useRef<HTMLButtonElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <div className="relative z-30 min-h-[68px] px-7 py-3 flex items-center gap-6 border-b border-border/60 bg-background/40 backdrop-blur">
      {/* LEFT — contact name + lifecycle (single row) */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[13px] font-medium text-foreground truncate">
          {contact.name}
        </span>
        {!contact.labelIds.includes("lb-ba") && (
          <LifecycleSelect
            size="sm"
            value={contact.lifecycleStage ?? null}
            onChange={onChangeLifecycle}
          />
        )}
      </div>

      {/* RIGHT — actions */}
      <div className="ml-auto flex items-center gap-3">
      <div className="flex items-center gap-0.5 text-muted-foreground/70">
        <button
          onClick={onToggleSearch}
          title="Search messages"
          className={`h-9 w-9 grid place-items-center rounded transition ${
            searchOpen ? "bg-primary/15 text-primary" : "hover:bg-gray-50 hover:text-foreground"
          }`}
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleContext}
          data-contact-toggle
          title={contextOpen ? "Hide contact details" : "Show contact details"}
          className={`h-9 w-9 grid place-items-center rounded transition ${
            contextOpen ? "bg-primary/15 text-primary" : "hover:bg-gray-50"
          }`}
        >
          <Info className="h-4 w-4" />
        </button>
        <button
          ref={moreRef}
          onClick={() => setMoreOpen((v) => !v)}
          title="More actions"
          className={`h-9 w-9 grid place-items-center rounded transition ${
            moreOpen ? "bg-white/[0.06] text-foreground" : "hover:bg-gray-50 hover:text-foreground"
          }`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <FloatingMenu
          anchorRef={moreRef}
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          align="end"
          width={200}
          className="rounded-md border border-border bg-popover/95 backdrop-blur shadow-lg py-1 text-[13px]"
        >
          <button
            onClick={() => { onTogglePin(); setMoreOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-150"
          >
            {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            <span>{isPinned ? "Unpin Contact" : "Pin Contact"}</span>
          </button>
          <button
            onClick={() => { onToggleRead(); setMoreOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-150"
          >
            {isUnread ? <MailOpen className="h-3.5 w-3.5" /> : <MailIcon className="h-3.5 w-3.5" />}
            <span>{isUnread ? "Mark as Read" : "Mark as Unread"}</span>
          </button>
        </FloatingMenu>
      </div>
      </div>
    </div>
  );
}

function OwnerSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const current = TEAM_USERS.find((u) => u.id === value);
  const currentAgent = findAgent(value);
  const filtered = TEAM_USERS.filter((u) =>
    u.name.toLowerCase().includes(q.toLowerCase()),
  );
  const filteredAgents = AI_AGENTS.filter((a) =>
    a.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 h-8 px-2.5 rounded-md border border-white/10 bg-white/[0.04] hover:bg-gray-50 text-xs transition-colors duration-150"
      >
        {current ? (
          <>
            <span className="h-5 w-5 rounded-full bg-gradient-to-br from-primary/40 to-card border border-border grid place-items-center text-[9px] font-medium">
              {current.avatar}
            </span>
            <span className="text-foreground">{current.name}</span>
          </>
        ) : currentAgent ? (
          <>
            <span className="h-5 w-5 rounded-full bg-primary/15 border border-primary/30 grid place-items-center">
              <Bot className="h-3 w-3 text-primary" />
            </span>
            <span className="text-foreground">{currentAgent.name}</span>
            <span className="rounded border border-primary/30 bg-primary/10 px-1 py-px text-[8px] font-semibold text-primary uppercase tracking-wider">
              AI Agent
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <FloatingMenu anchorRef={btnRef} open={open} onClose={() => setOpen(false)} align="end" width={256}>
        <div className="rounded-md border border-border bg-popover shadow-xl p-2">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search users"
              className="h-7 w-full rounded border border-border bg-card/60 pl-7 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length > 0 && (
              <div className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                People
              </div>
            )}
            {TEAMS.map((team) => {
              const members = filtered.filter((u) => u.team === team);
              if (members.length === 0) return null;
              return (
                <div key={team} className="mb-1.5">
                  <div className="px-3 pt-1 pb-1 text-[10px] font-medium text-muted-foreground/60">
                    {team}
                  </div>
                  {members.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onChange(u.id);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-gray-50 ${
                        value === u.id ? "bg-white/[0.06]" : ""
                      }`}
                    >
                      <span className="h-5 w-5 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-[9px]">
                        {u.avatar}
                      </span>
                      <span className="flex-1 text-left">{u.name}</span>
                      {value === u.id && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              );
            })}
            {filteredAgents.length > 0 && (
              <div className="mt-1 border-t border-border pt-1.5">
                <div className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  AI Agents
                </div>
                {filteredAgents.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      onChange(a.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-gray-50 ${
                      value === a.id ? "bg-white/[0.06]" : ""
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full bg-primary/15 border border-primary/30 grid place-items-center">
                      <Bot className="h-3 w-3 text-primary" />
                    </span>
                    <span className="flex-1 text-left">{a.name}</span>
                    <span className="rounded border border-primary/30 bg-primary/10 px-1 py-px text-[8px] font-semibold text-primary uppercase tracking-wider">
                      AI
                    </span>
                    {value === a.id && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-border mt-1 pt-1">
            <button
              type="button"
              disabled={!value}
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-muted-foreground hover:bg-gray-50 hover:text-foreground disabled:opacity-40 transition-colors duration-150"
            >
              <XIcon className="h-3.5 w-3.5" /> Unassign
            </button>
          </div>
        </div>
      </FloatingMenu>
    </div>
  );
}

function CollaboratorsPopover({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<string[]>(value);
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);
  const filtered = TEAM_USERS.filter((u) =>
    u.name.toLowerCase().includes(q.toLowerCase()),
  );
  const filteredAgents = AI_AGENTS.filter((a) =>
    a.name.toLowerCase().includes(q.toLowerCase()),
  );
  const toggle = (id: string) =>
    setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Collaborators"
        className={`relative h-9 px-2 inline-flex items-center gap-1.5 rounded hover:bg-gray-50 ${
          value.length > 0 ? "text-foreground" : ""
        }`}
      >
        <Users className="h-4 w-4" />
        {value.length > 0 && (
          <span className="text-[10px] rounded-full bg-primary/20 text-primary px-1.5 py-0.5 leading-none">
            {value.length}
          </span>
        )}
      </button>
      <FloatingMenu anchorRef={btnRef} open={open} onClose={() => setOpen(false)} align="end" width={288}>
        <div className="rounded-md border border-border bg-popover shadow-xl p-2">
          <div className="text-[11px] font-semibold px-1 pb-2 text-foreground">Add collaborators</div>
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search user"
              className="h-7 w-full rounded border border-border bg-card/60 pl-7 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          {draft.length > 0 && (
            <div className="flex flex-wrap gap-1 px-1 pb-2">
              {draft.map((id) => {
                const u = TEAM_USERS.find((x) => x.id === id);
                const a = !u ? findAgent(id) : undefined;
                if (!u && !a) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-white/[0.04] pl-1 pr-1.5 py-0.5 text-[10px]"
                  >
                    {u ? (
                      <>
                        <span className="h-4 w-4 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-[8px]">
                          {u.avatar}
                        </span>
                        {u.name}
                      </>
                    ) : a ? (
                      <>
                        <span className="h-4 w-4 rounded-full bg-primary/15 border border-primary/30 grid place-items-center">
                          <Bot className="h-2.5 w-2.5 text-primary" />
                        </span>
                        {a.name}
                      </>
                    ) : null}
                    <button
                      onClick={() => toggle(id)}
                      className="text-muted-foreground hover:text-foreground transition-colors duration-150"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length > 0 && (
              <div className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                People
              </div>
            )}
            {TEAMS.map((team) => {
              const members = filtered.filter((u) => u.team === team);
              if (members.length === 0) return null;
              return (
                <div key={team} className="mb-1.5">
                  <div className="px-3 pt-1 pb-1 text-[10px] font-medium text-muted-foreground/60">
                    {team}
                  </div>
                  {members.map((u) => {
                    const checked = draft.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => toggle(u.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-gray-50 transition-colors duration-150"
                      >
                        <span
                          className={`h-4 w-4 rounded border grid place-items-center ${
                            checked
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border"
                          }`}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </span>
                        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-[9px]">
                          {u.avatar}
                        </span>
                        <span className="flex-1 text-left">{u.name}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {filteredAgents.length > 0 && (
              <div className="mt-1 border-t border-border pt-1.5">
                <div className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  AI Agents
                </div>
                {filteredAgents.map((a) => {
                  const checked = draft.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggle(a.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-gray-50 transition-colors duration-150"
                    >
                      <span
                        className={`h-4 w-4 rounded border grid place-items-center ${
                          checked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border"
                        }`}
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <span className="h-5 w-5 rounded-full bg-primary/15 border border-primary/30 grid place-items-center">
                        <Bot className="h-3 w-3 text-primary" />
                      </span>
                      <span className="flex-1 text-left">{a.name}</span>
                      <span className="rounded border border-primary/30 bg-primary/10 px-1 py-px text-[8px] font-semibold text-primary uppercase tracking-wider">
                        AI
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border mt-2 pt-2">
            <button
              onClick={() => {
                setDraft([]);
                onChange([]);
                setOpen(false);
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              Clear
            </button>
            <button
              onClick={() => {
                onChange(draft);
                setOpen(false);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add collaborators
            </button>
          </div>
        </div>
      </FloatingMenu>
    </div>
  );
}
// ============== Inbox filter chip & panel ==============
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 pl-2 pr-1 py-0.5 text-[10px] text-primary">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="h-3.5 w-3.5 grid place-items-center rounded-full hover:bg-primary/20 transition-colors duration-150"
      >
        <XIcon className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

type FilterPanelProps = {
  panelRef: React.RefObject<HTMLDivElement | null>;
  category: "channels" | "labels" | "owner" | "lifecycle" | "unread";
  setCategory: (c: FilterPanelProps["category"]) => void;
  filters: {
    channels: Channel[];
    labels: string[];
    owners: string[];
    stages: LifecycleStage[];
    unreadOnly: boolean;
  };
  setFilters: React.Dispatch<React.SetStateAction<FilterPanelProps["filters"]>>;
  activeCount: number;
  search: string;
  setSearch: (s: string) => void;
  availableChannels: Channel[];
  channelLabel: (c: Channel) => string;
  labels: { id: string; name: string }[];
  ownerOptions: { id: string; name: string }[];
  onClose: () => void;
  onClear: () => void;
  toggleIn: <T,>(arr: T[], v: T) => T[];
};

function FilterPanel(props: FilterPanelProps) {
  const {
    panelRef, category, setCategory, filters, setFilters,
    activeCount, search, setSearch,
    availableChannels, channelLabel, labels, ownerOptions,
    onClose, onClear, toggleIn,
  } = props;
  const { lifecycleStages } = useContactsStore();

  const categories: { id: FilterPanelProps["category"]; label: string; count: number }[] = [
    { id: "channels", label: "Channels", count: filters.channels.length },
    { id: "labels", label: "Labels", count: filters.labels.length },
    { id: "owner", label: "Owner", count: filters.owners.length },
    { id: "lifecycle", label: "Lifecycle Stage", count: filters.stages.length },
    { id: "unread", label: "Unread Only", count: filters.unreadOnly ? 1 : 0 },
  ];

  const showSearch = category === "channels" || category === "labels" || category === "owner";
  const q = search.toLowerCase();

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Filter conversations"
      className="absolute right-0 top-9 z-40 w-[560px] rounded-lg border border-border bg-popover shadow-2xl overflow-hidden animate-fade-in"
    >
      <div className="flex items-center justify-between px-3 h-10 border-b border-border/70">
        <div className="text-[12px] font-semibold text-foreground">Filters</div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            disabled={activeCount === 0}
            className="text-[11px] px-2 py-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors duration-150"
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors duration-150"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex min-h-[320px] max-h-[420px]">
        {/* Left: categories */}
        <div className="w-[180px] shrink-0 border-r border-border/70 bg-sidebar/30 py-1.5">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-[12px] transition ${
                category === c.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
              }`}
            >
              <span>{c.label}</span>
              {c.count > 0 && (
                <span className={`text-[10px] tabular-nums ${category === c.id ? "text-primary" : "text-muted-foreground/70"}`}>
                  {c.count}
                </span>
              )}
            </button>
          ))}
        </div>
        {/* Right: options */}
        <div className="flex-1 min-w-0 flex flex-col">
          {showSearch && (
            <div className="p-2 border-b border-border/60">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${category}…`}
                  className="h-8 w-full rounded-md border border-border bg-card/60 pl-7 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto py-1">
            {category === "channels" && (
              <FilterCheckList
                items={availableChannels
                  .filter((c) => channelLabel(c).toLowerCase().includes(q))
                  .map((c) => ({
                    key: c,
                    label: channelLabel(c),
                    checked: filters.channels.includes(c),
                    onToggle: () =>
                      setFilters((f) => ({ ...f, channels: toggleIn(f.channels, c) })),
                    leading: <ChannelIcon channel={c} className="h-4 w-4" />,
                  }))}
              />
            )}
            {category === "labels" && (
              <FilterCheckList
                items={labels
                  .filter((l) => l.name.toLowerCase().includes(q))
                  .map((l) => ({
                    key: l.id,
                    label: l.name,
                    checked: filters.labels.includes(l.id),
                    onToggle: () =>
                      setFilters((f) => ({ ...f, labels: toggleIn(f.labels, l.id) })),
                  }))}
              />
            )}
            {category === "owner" && (
              <FilterCheckList
                items={ownerOptions
                  .filter((o) => o.name.toLowerCase().includes(q))
                  .map((o) => ({
                    key: o.id,
                    label: o.name,
                    checked: filters.owners.includes(o.id),
                    onToggle: () =>
                      setFilters((f) => ({ ...f, owners: toggleIn(f.owners, o.id) })),
                  }))}
              />
            )}
            {category === "lifecycle" && (
              <FilterCheckList
                items={lifecycleStages.map((stageDef) => ({
                  key: stageDef.name,
                  label: stageDef.name,
                  checked: filters.stages.includes(stageDef.name),
                  onToggle: () =>
                    setFilters((f) => ({ ...f, stages: toggleIn(f.stages, stageDef.name) })),
                  leading: (
                    <span className={`h-2 w-2 rounded-full ${getStageStyle(stageDef.name).dot}`} />
                  ),
                }))}
              />
            )}
            {category === "unread" && (
              <div className="px-3 py-3">
                <label className="flex items-center gap-2.5 text-[12px] text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.unreadOnly}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, unreadOnly: e.target.checked }))
                    }
                    className="h-3.5 w-3.5 rounded border-border bg-card accent-primary"
                  />
                  Show only conversations with unread messages
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterCheckList({
  items,
}: {
  items: {
    key: string;
    label: string;
    checked: boolean;
    onToggle: () => void;
    leading?: React.ReactNode;
  }[];
}) {
  if (items.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">
        No options match.
      </div>
    );
  }
  return (
    <div>
      {items.map((it) => (
        <label
          key={it.key}
          className="flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-foreground hover:bg-gray-50 cursor-pointer transition-colors duration-150"
        >
          <input
            type="checkbox"
            checked={it.checked}
            onChange={it.onToggle}
            className="h-3.5 w-3.5 rounded border-border bg-card accent-primary"
          />
          {it.leading}
          <span className="flex-1 truncate">{it.label}</span>
        </label>
      ))}
    </div>
  );
}

// ============================================================
// Message Row — bubble + hover actions + forward checkbox
// ============================================================

function MessageRow({
  message,
  senderName,
  forwardMode,
  selected,
  onToggleSelect,
  onReply,
  onCopy,
  onCopyToBox,
  onForward,
  highlightQuery,
  isActiveMatch,
}: {
  message: SentMsg;
  senderName: string;
  forwardMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onReply: () => void;
  onCopy: () => void;
  onCopyToBox: () => void;
  onForward: () => void;
  highlightQuery: string;
  isActiveMatch: boolean;
}) {
  const m = message;
  const isMe = m.from === "me";
  const moreRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const bubble = (
    <div className="group relative max-w-[64%]">
      <div
        className={`rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm transition ${
          isMe
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card/90 border border-border/60 text-foreground rounded-bl-sm"
        } ${isActiveMatch ? "ring-2 ring-amber-300/70" : ""}`}
      >
        {m.replyTo && (
          <div
            className={`mb-2 rounded-md border-l-2 pl-2 pr-2 py-1.5 text-[11px] ${
              isMe
                ? "border-primary-foreground/70 bg-primary-foreground/10"
                : "border-primary bg-primary/10"
            }`}
          >
            <div className={`font-semibold ${isMe ? "text-primary-foreground/90" : "text-primary"}`}>
              {m.replyTo.fromName}
            </div>
            <div className={`mt-0.5 line-clamp-2 ${isMe ? "text-primary-foreground/80" : "text-foreground/75"}`}>
              {m.replyTo.text}
            </div>
          </div>
        )}
        {m.forwardedFrom && (
          <div className={`mb-1 inline-flex items-center gap-1 text-[10px] italic ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            <ForwardIcon className="h-3 w-3" /> Forwarded
          </div>
        )}
        <p className="whitespace-pre-wrap">
          {highlightQuery ? (
            <HighlightedText text={m.text} query={highlightQuery} isActive={isActiveMatch} />
          ) : (
            m.text
          )}
        </p>
        <div className={`mt-1.5 flex items-center gap-1 text-[10px] ${isMe ? "text-primary-foreground/70 justify-end" : "text-muted-foreground/70"}`}>
          <span>{m.time}</span>
          {isMe && (m.status === "read" ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
        </div>
      </div>

      {/* Hover 3-dot trigger */}
      {!forwardMode && (
        <button
          ref={moreRef}
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          aria-label="Message actions"
          className={`absolute -top-2 ${isMe ? "-left-2" : "-right-2"} h-6 w-6 grid place-items-center rounded-full border border-border bg-popover text-muted-foreground shadow-sm transition opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-foreground ${open ? "opacity-100" : ""}`}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      )}

      <FloatingMenu
        anchorRef={moreRef}
        open={open}
        onClose={() => setOpen(false)}
        align={isMe ? "start" : "end"}
        width={210}
        className="rounded-md border border-border bg-popover/95 backdrop-blur shadow-lg py-1 text-[13px]"
      >
        <MenuItem icon={<ReplyIcon className="h-3.5 w-3.5" />} label="Reply" onClick={() => { onReply(); setOpen(false); }} />
        <MenuItem icon={<CopyIcon className="h-3.5 w-3.5" />} label="Copy Message" onClick={() => { onCopy(); setOpen(false); }} />
        <MenuItem icon={<ClipboardPaste className="h-3.5 w-3.5" />} label="Copy to Message Box" onClick={() => { onCopyToBox(); setOpen(false); }} />
        <MenuItem icon={<ForwardIcon className="h-3.5 w-3.5" />} label="Forward" onClick={() => { onForward(); setOpen(false); }} />
      </FloatingMenu>
    </div>
  );

  return (
    <div data-search-id={m.id} className={`flex items-start gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
      {forwardMode && !isMe && (
        <ForwardCheckbox checked={selected} onChange={onToggleSelect} />
      )}
      {bubble}
      {forwardMode && isMe && (
        <ForwardCheckbox checked={selected} onChange={onToggleSelect} />
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-150">
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ForwardCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-label={checked ? "Deselect message" : "Select message"}
      className={`mt-2 h-5 w-5 shrink-0 rounded border grid place-items-center transition ${
        checked
          ? "bg-primary border-primary text-primary-foreground"
          : "border-border bg-card/60 hover:border-primary/60"
      }`}
    >
      {checked && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}

// ============================================================
// Forward Messages modal
// ============================================================

function ForwardModal({
  count,
  contacts,
  search,
  setSearch,
  selected,
  toggle,
  onClose,
  onConfirm,
}: {
  count: number;
  contacts: Contact[];
  search: string;
  setSearch: (v: string) => void;
  selected: Set<string>;
  toggle: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const q = search.trim().toLowerCase();
  const filtered = contacts.filter((c) => !q || c.name.toLowerCase().includes(q) || (c.phone ?? "").toLowerCase().includes(q));
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Forward Messages"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[95vw] max-h-[80vh] flex flex-col rounded-xl border border-border bg-popover shadow-2xl animate-fade-in"
      >
        <div className="shrink-0 flex items-center justify-between px-5 h-14 border-b border-border">
          <div>
            <div className="text-sm font-semibold">Forward Messages</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {count} message{count === 1 ? "" : "s"} · {selected.size} recipient{selected.size === 1 ? "" : "s"}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors duration-150">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts"
              className="h-9 w-full rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-[11px] text-muted-foreground">No contacts match your search.</div>
          )}
          {filtered.map((c) => {
            const checked = selected.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${checked ? "bg-primary/10" : "hover:bg-gray-50"}`}
              >
                <span className={`h-5 w-5 shrink-0 rounded border grid place-items-center ${checked ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card/60"}`}>
                  {checked && <Check className="h-3.5 w-3.5" />}
                </span>
                <div className="relative shrink-0 h-9 w-9">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-[11px] font-medium">{c.avatar}</div>
                  <ChannelIcon channel={c.channel} className="absolute -bottom-0.5 -right-0.5 h-[14px] w-[14px] ring-2 ring-popover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-foreground truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    WhatsApp · {c.lastInteraction}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="shrink-0 flex items-center justify-end gap-2 px-4 h-14 border-t border-border">
          <button onClick={onClose} className="h-9 px-3 rounded-md border border-border bg-card/60 text-[14px] hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={selected.size === 0}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-[14px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ForwardIcon className="h-3.5 w-3.5" /> Forward Messages
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Conversation message search
// ============================================================

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({ text, query, isActive }: { text: string; query: string; isActive?: boolean }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={i}
            className={
              isActive
                ? "rounded px-0.5 bg-amber-300 text-black font-medium"
                : "rounded px-0.5 bg-amber-300/30 text-inherit"
            }
          >
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function SearchStrip({
  query,
  setQuery,
  total,
  index,
  onPrev,
  onNext,
  onClose,
}: {
  query: string;
  setQuery: (v: string) => void;
  total: number;
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const hasQuery = query.trim().length > 0;
  return (
    <div className="relative z-20 flex items-center gap-2 px-7 py-2.5 border-b border-border/60 bg-background/40 backdrop-blur">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { e.preventDefault(); onClose(); }
            else if (e.key === "Enter") {
              e.preventDefault();
              if (e.shiftKey) onPrev(); else onNext();
            }
          }}
          placeholder="Search messages..."
          className="h-9 w-full rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>
      {hasQuery && (
        total > 0 ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {index + 1} of {total}
            </span>
            <button
              onClick={onPrev}
              aria-label="Previous match"
              className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors duration-150"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onNext}
              aria-label="Next match"
              className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors duration-150"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground shrink-0">No messages found</span>
        )
      )}
      <button
        onClick={onClose}
        aria-label="Close search"
        className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-gray-50 shrink-0 transition-colors duration-150"
      >
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
