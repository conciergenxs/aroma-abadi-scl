import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppShell, ChannelDot, LabelChip, ListChip, labelColorClass, labelColorDot } from "@/components/scl/app-shell";
import { conversations, threadsByContact } from "@/components/scl/mock-data";
import {
  STAGE_COLORS,
  LIFECYCLE_STAGES,
  type LifecycleStage,
  type Channel,
} from "@/components/scl/mock-data";
import type { Contact } from "@/components/scl/mock-data";
type Conversation = (typeof conversations)[number];
import { useContactsStore, contactsStore } from "@/components/scl/contacts-store";
import { LifecycleSelect } from "@/components/scl/lifecycle-select";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Filter, Paperclip, Smile, Send, Phone, MoreHorizontal,
  Check, CheckCheck, Star, ChevronDown, Inbox as InboxIcon, Users, AtSign,
  UserX, MessageSquare, Instagram, Info,
  Mail, User2, ExternalLink, UserPlus, X as XIcon,
} from "lucide-react";

export const Route = createFileRoute("/inbox")({
  head: () => ({ meta: [{ title: "Inbox — SCL" }] }),
  component: InboxPage,
});

type InboxView = "my" | "team" | "mentions" | "unassigned";
type ChannelFilter = "all" | Channel;
const tabs = ["All", "Unread", "Assigned", "Unassigned"] as const;

const VIEWS: { id: InboxView; label: string; icon: typeof InboxIcon }[] = [
  { id: "my", label: "My Inbox", icon: InboxIcon },
  { id: "team", label: "Team Inbox", icon: Users },
  { id: "mentions", label: "Mentions", icon: AtSign },
  { id: "unassigned", label: "Unassigned", icon: UserX },
];

const CHANNELS: { id: ChannelFilter; label: string; icon: typeof MessageSquare }[] = [
  { id: "all", label: "All Channels", icon: InboxIcon },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { id: "instagram", label: "Instagram", icon: Instagram },
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
const userLabel = (id?: string | null) =>
  !id ? "Unassigned" : TEAM_USERS.find((u) => u.id === id)?.name ?? id;

function InboxPage() {
  const { contacts, labels, lists, properties } = useContactsStore();
  const [view, setView] = useState<InboxView>("my");
  const [stage, setStage] = useState<LifecycleStage | null>(null);
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [search, setSearch] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Record<string, string[]>>({});
  const [activeId, setActiveId] = useState(conversations[0].id);

  const visible = useMemo(() => {
    return conversations.filter((c) => {
      const ct = contacts.find((x) => x.id === c.contactId);
      if (!ct) return false;
      // Inbox view
      if (view === "my" && ct.ownerId !== "me") return false;
      if (view === "unassigned" && ct.ownerId) return false;
      if (view === "mentions" && c.unread === 0) return false;
      // Lifecycle stage
      if (stage && ct.lifecycleStage !== stage) return false;
      // Channel
      if (channel !== "all" && c.channel !== channel) return false;
      // Tabs
      if (tab === "Unread" && c.unread === 0) return false;
      if (tab === "Assigned" && !ct.ownerId) return false;
      if (tab === "Unassigned" && ct.ownerId) return false;
      // Search
      if (search) {
        const q = search.toLowerCase();
        if (!ct.name.toLowerCase().includes(q) && !c.preview.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [contacts, view, stage, channel, tab, search]);

  const active = visible.find((c) => c.id === activeId) ?? visible[0] ?? conversations[0];
  const contact = contacts.find((c) => c.id === active.contactId)!;
  const thread = threadsByContact[contact.id] ?? [];

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
    const result: Record<InboxView, number> = { my: 0, team: 0, mentions: 0, unassigned: 0 };
    for (const c of conversations) {
      const ct = contacts.find((x) => x.id === c.contactId);
      if (!ct) continue;
      if (ct.ownerId === "me") result.my += c.unread;
      result.team += c.unread;
      if (c.unread > 0) result.mentions += 1;
      if (!ct.ownerId) result.unassigned += 1;
    }
    return result;
  }, [contacts]);

  return (
    <AppShell title="Inbox" subtitle="Shared workspace · 4 teammates online" noPadding>
      <div className="flex h-[calc(100vh-64px)] min-h-0 w-full overflow-hidden">
        {/* ============== LEFT NAV ============== */}
        <aside className="shrink-0 w-[240px] border-r border-border bg-sidebar/40 overflow-y-auto">
          <NavSection title="Inbox Views">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              const sel = view === v.id;
              const count = viewCounts[v.id];
              return (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition ${
                    sel ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">{v.label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sel ? "bg-primary/25 text-primary" : "bg-white/[0.06] text-muted-foreground"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </NavSection>

          <NavSection title="Lifecycle Stages">
            <button
              onClick={() => setStage(null)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition ${
                stage === null ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <span className="flex-1 text-left">All Stages</span>
            </button>
            {LIFECYCLE_STAGES.map((s) => {
              const sel = stage === s;
              const count = stageCounts.get(s) ?? 0;
              return (
                <button
                  key={s}
                  onClick={() => setStage(s)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition ${
                    sel ? "bg-white/[0.05] text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${STAGE_COLORS[s].dot}`} />
                  <span className="flex-1 text-left truncate">{s}</span>
                  {count > 0 && (
                    <span className="text-[10px] text-muted-foreground">{count}</span>
                  )}
                </button>
              );
            })}
          </NavSection>

          <NavSection title="Company Inboxes">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon;
              const sel = channel === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setChannel(ch.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition ${
                    sel ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">{ch.label}</span>
                </button>
              );
            })}
          </NavSection>
        </aside>

        {/* ============== CONVERSATION LIST ============== */}
        <aside className="shrink-0 w-[340px] min-w-[340px] border-r border-border flex flex-col min-h-0 bg-sidebar/20">
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
              <button className="ml-auto h-7 w-7 grid place-items-center rounded border border-border text-muted-foreground hover:text-foreground">
                <Filter className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {visible.length === 0 && (
              <div className="px-4 py-10 text-center text-[11px] text-muted-foreground">
                No conversations match the current filters.
              </div>
            )}
            {visible.map((c) => {
              const ct = contacts.find((x) => x.id === c.contactId);
              if (!ct) return null;
              const sel = c.id === activeId;
              const stageColor = ct.lifecycleStage ? STAGE_COLORS[ct.lifecycleStage] : null;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left flex gap-2.5 px-3 py-2.5 border-b border-border/60 transition ${
                    sel ? "bg-primary/10 border-l-2 border-l-primary" : "border-l-2 border-l-transparent hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-xs font-medium">
                      {ct.avatar}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar ${c.channel === "whatsapp" ? "bg-emerald-500" : "bg-pink-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{ct.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{c.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-xs truncate ${c.unread > 0 ? "text-foreground" : "text-muted-foreground"}`}>{c.preview}</p>
                      {c.unread > 0 && (<span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground shrink-0">{c.unread}</span>)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {stageColor && ct.lifecycleStage && (
                        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] ${stageColor.badge}`}>
                          <span className={`h-1 w-1 rounded-full ${stageColor.dot}`} />
                          {ct.lifecycleStage}
                        </span>
                      )}
                      {ct.ownerId && (
                        <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                          <User2 className="h-2.5 w-2.5" />
                          {ct.ownerId === "me" ? "Me" : ct.ownerId}
                        </span>
                      )}
                      {!ct.ownerId && (
                        <span className="text-[9px] text-amber-300/80">Unassigned</span>
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
          />

          <div className="flex-1 overflow-y-auto p-6 space-y-4 scl-grid-bg">
            <div className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">Today</div>
            {thread.map((m) => (
              <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[68%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.from === "me" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card/80 border border-border text-foreground rounded-bl-sm glass"}`}>
                  <p>{m.text}</p>
                  <div className={`mt-1 flex items-center gap-1 text-[10px] ${m.from === "me" ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"}`}>
                    <span>{m.time}</span>
                    {m.from === "me" && (m.status === "read" ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                  </div>
                </div>
              </div>
            ))}
            {thread.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-10">No messages yet.</div>
            )}
          </div>

          <div className="border-t border-border bg-card/40 p-3">
            <div className="rounded-xl border border-border bg-background/60 focus-within:ring-1 focus-within:ring-primary/40">
              <textarea rows={2} placeholder={`Reply on ${active.channel === "whatsapp" ? "WhatsApp" : "Instagram"}…`} className="w-full bg-transparent resize-none px-4 py-3 text-sm focus:outline-none placeholder:text-muted-foreground/70" />
              <div className="flex items-center justify-between px-2 py-2 border-t border-border">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <button className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05]"><Paperclip className="h-4 w-4" /></button>
                  <button className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05]"><Smile className="h-4 w-4" /></button>
                  <button className="ml-1 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-white/[0.05]">Use template <ChevronDown className="h-3 w-3" /></button>
                  <button className="ml-1 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-white/[0.05] text-amber-300/80">Internal note</button>
                </div>
                <button className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"><Send className="h-3.5 w-3.5" /> Send</button>
              </div>
            </div>
          </div>
        </section>

        {/* ============== CONTACT CONTEXT PANEL (slide-in) ============== */}
        <ContactDrawer open={contextOpen} onClose={() => setContextOpen(false)}>
            <div className="p-5 border-b border-border text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-primary/40 to-card border border-border grid place-items-center text-base font-medium">{contact.avatar}</div>
              <div className="mt-3 text-sm font-medium">{contact.name}</div>
              {contact.lifecycleStage && (
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] ${STAGE_COLORS[contact.lifecycleStage].badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${STAGE_COLORS[contact.lifecycleStage].dot}`} />
                    {contact.lifecycleStage}
                  </span>
                </div>
              )}
              <div className="mt-3">
                <Link
                  to="/contacts/$contactId"
                  params={{ contactId: contact.id }}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
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

            <Section title="Lists">
              <div className="flex flex-wrap gap-1">
                {contact.listIds.length === 0 && <span className="text-[11px] text-muted-foreground">Not in any list</span>}
                {contact.listIds.map((id) => {
                  const l = lists.find((x) => x.id === id);
                  return l ? <ListChip key={id} name={l.name} /> : null;
                })}
              </div>
            </Section>

            <Section title="Contact Information">
              <InfoRow icon={<Mail className="h-3 w-3" />} label="Email" value={contact.email ?? "—"} />
              <InfoRow icon={<Phone className="h-3 w-3" />} label="Phone" value={contact.phone} />
              <InfoRow icon={<MessageSquare className="h-3 w-3" />} label="Channel" value={contact.channel === "whatsapp" ? "WhatsApp" : "Instagram"} />
              <InfoRow icon={<User2 className="h-3 w-3" />} label="Owner" value={contact.ownerId ? (contact.ownerId === "me" ? "Me" : contact.ownerId) : "Unassigned"} />
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
        </ContactDrawer>
      </div>
    </AppShell>
  );
}

function ContactDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        // Ignore clicks on the toggle button (data-contact-toggle)
        const el = target as HTMLElement;
        if (el.closest?.("[data-contact-toggle]")) return;
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <aside
      ref={ref}
      className="fixed right-0 top-16 bottom-0 z-40 w-[400px] max-w-[100vw] border-l border-border bg-sidebar/95 backdrop-blur overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200"
    >
      {children}
    </aside>
  );
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-2 border-b border-border/60">
      <div className="px-2.5 pt-1 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/80">{title}</div>
      <div className="space-y-0.5">{children}</div>
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
}: {
  contact: Contact;
  active: Conversation;
  collaborators: string[];
  contextOpen: boolean;
  onChangeLifecycle: (next: LifecycleStage | null) => void;
  onChangeOwner: (ownerId: string | null) => void;
  onChangeCollaborators: (ids: string[]) => void;
  onToggleContext: () => void;
}) {
  return (
    <div className="min-h-[68px] px-5 py-3 flex items-center gap-4 border-b border-border bg-card/40 backdrop-blur">
      {/* LEFT — contact name + lifecycle */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-sm font-medium shrink-0">
          {contact.avatar}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-semibold truncate text-foreground">{contact.name}</span>
            <ChannelDot channel={active.channel} />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="w-[180px]">
              <LifecycleSelect
                size="sm"
                value={contact.lifecycleStage ?? null}
                onChange={onChangeLifecycle}
              />
            </div>
            <span className="text-[11px] text-muted-foreground truncate">
              {active.channel === "whatsapp" ? contact.phone : contact.instagram}
            </span>
          </div>
        </div>
      </div>

      {/* CENTER — owner / assignee */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Assigned to</span>
        <OwnerSelect value={contact.ownerId ?? null} onChange={onChangeOwner} />
      </div>

      {/* RIGHT — actions */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <CollaboratorsPopover value={collaborators} onChange={onChangeCollaborators} />
        <button className="h-9 w-9 grid place-items-center rounded hover:bg-white/[0.05]" title="Star">
          <Star className="h-4 w-4" />
        </button>
        <button className="h-9 w-9 grid place-items-center rounded hover:bg-white/[0.05]" title="More">
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleContext}
          data-contact-toggle
          title={contextOpen ? "Hide contact details" : "Show contact details"}
          className={`h-9 w-9 grid place-items-center rounded transition ${
            contextOpen ? "bg-primary/15 text-primary" : "hover:bg-white/[0.05]"
          }`}
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function useOutsideClose(
  ref: React.RefObject<HTMLElement | null>,
  open: boolean,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, ref, close]);
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
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, open, () => setOpen(false));
  const current = TEAM_USERS.find((u) => u.id === value);
  const filtered = TEAM_USERS.filter((u) =>
    u.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 h-8 px-2.5 rounded-md border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] text-xs"
      >
        {current ? (
          <>
            <span className="h-5 w-5 rounded-full bg-gradient-to-br from-primary/40 to-card border border-border grid place-items-center text-[9px] font-medium">
              {current.avatar}
            </span>
            <span className="text-foreground">{current.name}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-64 rounded-md border border-border bg-popover shadow-xl p-2">
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
            {TEAMS.map((team) => {
              const members = filtered.filter((u) => u.team === team);
              if (members.length === 0) return null;
              return (
                <div key={team} className="mb-1.5">
                  <div className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {team}
                  </div>
                  {members.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onChange(u.id);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-white/[0.05] ${
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
          </div>
          <div className="border-t border-border mt-1 pt-1">
            <button
              type="button"
              disabled={!value}
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground disabled:opacity-40"
            >
              <XIcon className="h-3.5 w-3.5" /> Unassign
            </button>
          </div>
        </div>
      )}
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
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, open, () => setOpen(false));
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);
  const filtered = TEAM_USERS.filter((u) =>
    u.name.toLowerCase().includes(q.toLowerCase()),
  );
  const toggle = (id: string) =>
    setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Collaborators"
        className={`relative h-9 px-2 inline-flex items-center gap-1.5 rounded hover:bg-white/[0.05] ${
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
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-72 rounded-md border border-border bg-popover shadow-xl p-2">
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
                if (!u) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-white/[0.04] pl-1 pr-1.5 py-0.5 text-[10px]"
                  >
                    <span className="h-4 w-4 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-[8px]">
                      {u.avatar}
                    </span>
                    {u.name}
                    <button
                      onClick={() => toggle(id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <div className="max-h-56 overflow-y-auto">
            {TEAMS.map((team) => {
              const members = filtered.filter((u) => u.team === team);
              if (members.length === 0) return null;
              return (
                <div key={team} className="mb-1.5">
                  <div className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {team}
                  </div>
                  {members.map((u) => {
                    const checked = draft.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => toggle(u.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-white/[0.05]"
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
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border mt-2 pt-2">
            <button
              onClick={() => {
                setDraft([]);
                onChange([]);
                setOpen(false);
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
            <button
              onClick={() => {
                onChange(draft);
                setOpen(false);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add collaborators
            </button>
          </div>
        </div>
      )}
    </div>
  );
}