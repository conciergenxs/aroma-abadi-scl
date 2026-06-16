import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ChannelDot, LabelChip, ListChip } from "@/components/scl/app-shell";
import { conversations, contacts, threadsByContact, initialLabels, initialLists } from "@/components/scl/mock-data";
import { useState } from "react";
import {
  Search, Filter, Paperclip, Smile, Send, Phone, Video, MoreHorizontal,
  Check, CheckCheck, Star, ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/inbox")({
  head: () => ({ meta: [{ title: "Inbox — SCL" }] }),
  component: InboxPage,
});

const tabs = ["All", "Unread", "Assigned to me", "Mentions"] as const;

function InboxPage() {
  const [activeId, setActiveId] = useState(conversations[0].id);
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const active = conversations.find((c) => c.id === activeId)!;
  const contact = contacts.find((c) => c.id === active.contactId)!;
  const thread = threadsByContact[contact.id] ?? [];

  const visible = conversations.filter((c) => (tab === "Unread" ? c.unread > 0 : true));

  return (
    <AppShell title="Inbox" subtitle="Shared workspace · 4 teammates online" noPadding>
      <div className="grid grid-cols-[320px_1fr_320px] h-[calc(100vh-64px)] min-h-0">
        <aside className="border-r border-border flex flex-col min-h-0 bg-sidebar/40">
          <div className="p-3 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input placeholder="Search conversations" className="h-9 w-full rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40" />
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
            {visible.map((c) => {
              const ct = contacts.find((x) => x.id === c.contactId)!;
              const sel = c.id === activeId;
              return (
                <button key={c.id} onClick={() => setActiveId(c.id)} className={`w-full text-left flex gap-3 px-4 py-3 border-b border-border/60 transition ${sel ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-white/[0.02]"}`}>
                  <div className="relative shrink-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-xs font-medium">{ct.avatar}</div>
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
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex flex-col min-h-0">
          <div className="h-14 px-5 flex items-center gap-3 border-b border-border bg-card/30 backdrop-blur">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-xs font-medium">{contact.avatar}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{contact.name}</span>
                <ChannelDot channel={active.channel} />
              </div>
              <div className="text-[11px] text-muted-foreground">{active.channel === "whatsapp" ? contact.phone : contact.instagram} · Active now</div>
            </div>
            <div className="ml-auto flex items-center gap-1 text-muted-foreground">
              <button className="h-8 w-8 grid place-items-center rounded hover:bg-white/[0.04]"><Phone className="h-4 w-4" /></button>
              <button className="h-8 w-8 grid place-items-center rounded hover:bg-white/[0.04]"><Video className="h-4 w-4" /></button>
              <button className="h-8 w-8 grid place-items-center rounded hover:bg-white/[0.04]"><Star className="h-4 w-4" /></button>
              <button className="h-8 w-8 grid place-items-center rounded hover:bg-white/[0.04]"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
          </div>

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
          </div>

          <div className="border-t border-border bg-card/40 p-3">
            <div className="rounded-xl border border-border bg-background/60 focus-within:ring-1 focus-within:ring-primary/40">
              <textarea rows={2} placeholder={`Reply on ${active.channel === "whatsapp" ? "WhatsApp" : "Instagram"}…`} className="w-full bg-transparent resize-none px-4 py-3 text-sm focus:outline-none placeholder:text-muted-foreground/70" />
              <div className="flex items-center justify-between px-2 py-2 border-t border-border">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <button className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05]"><Paperclip className="h-4 w-4" /></button>
                  <button className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05]"><Smile className="h-4 w-4" /></button>
                  <button className="ml-1 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-white/[0.05]">Use template <ChevronDown className="h-3 w-3" /></button>
                </div>
                <button className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"><Send className="h-3.5 w-3.5" /> Send</button>
              </div>
            </div>
          </div>
        </section>

        <aside className="border-l border-border bg-sidebar/40 overflow-y-auto">
          <div className="p-5 border-b border-border text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-primary/40 to-card border border-border grid place-items-center text-base font-medium">{contact.avatar}</div>
            <div className="mt-3 text-sm font-medium">{contact.name}</div>
            <div className="text-[11px] text-muted-foreground">Customer since Mar 2024</div>
            <div className="mt-3 flex justify-center gap-1.5 flex-wrap">
              {contact.labelIds.map((id) => {
                const l = initialLabels.find((x) => x.id === id);
                return l ? <LabelChip key={id} label={l} /> : null;
              })}
            </div>
          </div>

          <div className="p-5 border-b border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Labels</div>
            <div className="flex flex-wrap gap-1">
              {contact.labelIds.length === 0 && <span className="text-[11px] text-muted-foreground">No labels yet</span>}
              {contact.labelIds.map((id) => {
                const l = initialLabels.find((x) => x.id === id);
                return l ? <LabelChip key={id} label={l} /> : null;
              })}
            </div>
          </div>

          <div className="p-5 border-b border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Lists</div>
            <div className="flex flex-wrap gap-1">
              {contact.listIds.length === 0 && <span className="text-[11px] text-muted-foreground">Not in any list</span>}
              {contact.listIds.map((id) => {
                const l = initialLists.find((x) => x.id === id);
                return l ? <ListChip key={id} name={l.name} /> : null;
              })}
            </div>
          </div>

          <Field label="Phone number" value={contact.phone} />
          <Field label="Instagram" value={contact.instagram ?? "—"} />
          <Field label="Channel source" value={active.channel === "whatsapp" ? "WhatsApp Business" : "Instagram DM"} />
          <Field label="Subscription" value={contact.subscription} tone={contact.subscription === "Subscribed" ? "good" : "warn"} />
          <Field label="Last interaction" value={contact.lastInteraction} />

          <div className="p-5 border-t border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Notes</div>
            <div className="rounded-md border border-border bg-card/60 p-3 text-xs text-muted-foreground leading-relaxed">Prefers WhatsApp for time-sensitive updates. Loyalty tier: Platinum (renewed Q3).</div>
          </div>

          <div className="p-5 border-t border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Recent orders</div>
            <ul className="space-y-2">
              {[{ id: "#82201", v: "$284.00", d: "Nov 12" }, { id: "#80114", v: "$612.50", d: "Oct 28" }, { id: "#79008", v: "$129.00", d: "Sep 14" }].map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-md border border-border bg-card/40 px-3 py-2 text-xs">
                  <span className="font-medium">{o.id}</span>
                  <span className="text-muted-foreground">{o.d}</span>
                  <span>{o.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Field({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return (
    <div className="px-5 py-3 border-b border-border flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`text-xs ${tone === "good" ? "text-emerald-300" : tone === "warn" ? "text-amber-300" : "text-foreground"}`}>{value}</span>
    </div>
  );
}