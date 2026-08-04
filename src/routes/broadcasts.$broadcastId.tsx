import { createFileRoute } from "@tanstack/react-router";
import { fmtNum } from "@/lib/fmt";
import { AppShell } from "@/components/scl/app-shell";
import { ChannelIcon } from "@/components/scl/channel-badge";
import { useBroadcastsStore } from "@/components/scl/broadcasts-store";
import { useContactsStore } from "@/components/scl/contacts-store";
import { useTemplatesStore, TEMPLATE_GROUP_BADGE } from "@/components/scl/templates-store";
import { connectedChannels, type Broadcast } from "@/components/scl/mock-data";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  Users,
  ListPlus,
  ListMinus,
  Search as SearchIcon,
  Check,
  X as XIcon,
  Send,
  CheckCheck,
  Eye,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/broadcasts/$broadcastId")({
  head: () => ({ meta: [{ title: "Broadcast — SCL" }] }),
  component: BroadcastDetailPage,
});

type Tab = "details" | "analytics";

function BroadcastDetailPage() {
  const { broadcastId } = Route.useParams();
  const { broadcasts } = useBroadcastsStore();
  const broadcast = broadcasts.find((b) => b.id === broadcastId);
  const [tab, setTab] = useState<Tab>("details");

  if (!broadcast) {
    return (
      <AppShell>
        <div className="max-w-xl">
          <h1 className="mt-4 text-lg font-semibold">Broadcast not found</h1>
          <p className="text-xs text-muted-foreground mt-1">It may have been deleted.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell backTo="/broadcasts">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{broadcast.name}</h1>
          <StatusBadge status={broadcast.status} />
        </div>
      </div>

      <div className="border-b border-border mb-6">
        <div className="flex items-center gap-1">
          {[
            { id: "details", label: "Broadcast Details" },
            { id: "analytics", label: "Analytics" },
          ].map((t) => {
            const active = tab === (t.id as Tab);
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className={`px-4 h-9 text-[12px] font-medium border-b-2 -mb-px transition ${
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "details" ? (
        <DetailsTab broadcast={broadcast} />
      ) : (
        <AnalyticsTab broadcast={broadcast} />
      )}
    </AppShell>
  );
}

/* --------------------------------- Details -------------------------------- */

function DetailsTab({ broadcast }: { broadcast: Broadcast }) {
  const { lists } = useContactsStore();
  const { templates } = useTemplatesStore();
  const channel = connectedChannels.find((c) => c.id === broadcast.channelId);
  const template = broadcast.templateId
    ? templates.find((t) => t.id === broadcast.templateId)
    : null;
  const selectedLists = (broadcast.listIds ?? [])
    .map((id) => lists.find((l) => l.id === id))
    .filter(Boolean) as { id: string; name: string }[];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
      <div className="space-y-6">
        <Section title="Broadcast Settings">
          <ReadGrid>
            <ReadField label="Channel">
              {channel ? (
                <span className="inline-flex items-center gap-2">
                  <ChannelIcon channel={channel.channel} className="h-4 w-4" />
                  <span className="font-medium">{channel.name}</span>
                  <span className="text-muted-foreground text-[11px]">{channel.handle}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ChannelIcon channel={broadcast.channel} className="h-4 w-4" />
                  <span className="capitalize">{broadcast.channel}</span>
                </span>
              )}
            </ReadField>
            <ReadField label="Broadcast Name">{broadcast.name}</ReadField>
            <ReadField label="Status"><StatusBadge status={broadcast.status} /></ReadField>
            <ReadField label="Broadcast Time">{broadcast.sentAt || "—"}</ReadField>
            <ReadField label="Send mode">
              {broadcast.sendMode === "schedule" ? "Scheduled" : "Send now"}
            </ReadField>
            {broadcast.sendMode === "schedule" && (
              <ReadField label="Scheduled For">
                {[broadcast.scheduleDate, broadcast.scheduleTime].filter(Boolean).join(" · ") || "—"}
              </ReadField>
            )}
            <ReadField label="Created By">{broadcast.createdBy ?? "—"}</ReadField>
            <ReadField label="Created Date">{broadcast.createdAt ?? "—"}</ReadField>
          </ReadGrid>
        </Section>

        <Section title="Audience">
          <ReadGrid>
            <ReadField label="Selected Audience" span={2}>
              {selectedLists.length === 0 ? (
                <span className="text-muted-foreground">No audience selected</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedLists.map((l) => (
                    <span
                      key={l.id}
                      className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                    >
                      <Users className="h-3 w-3" /> {l.name}
                    </span>
                  ))}
                </div>
              )}
            </ReadField>
            <ReadField label="Total Audience">
              {fmtNum(broadcast.totalAudience ?? broadcast.reach)}
            </ReadField>
          </ReadGrid>
        </Section>

        <Section title="Content">
          <ReadGrid>
            <ReadField label="Mode">
              {broadcast.contentMode === "manual" ? "Manual message" : "Template"}
            </ReadField>
            {template && (
              <ReadField label="Selected Template">
                <span className="inline-flex items-center gap-2">
                  <span className="font-medium">{template.name}</span>
                  <span className="text-[10px] text-muted-foreground rounded-full border border-border px-1.5 py-0.5">
                    {template.category}
                  </span>
                </span>
              </ReadField>
            )}
          </ReadGrid>
          <div className="mt-4 space-y-3">
            <ReadBlock label="Message Content">
              <div className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
                {renderWithVars(broadcast.body ?? "")}
              </div>
            </ReadBlock>
            {broadcast.footer && (
              <ReadBlock label="Footer">
                <div className="text-[12px] text-muted-foreground">{broadcast.footer}</div>
              </ReadBlock>
            )}
            {broadcast.buttons && broadcast.buttons.length > 0 && (
              <ReadBlock label="Buttons">
                <div className="flex flex-wrap gap-1.5">
                  {broadcast.buttons.map((b, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-md border border-border bg-background/40 px-2 py-1 text-[11px]"
                    >
                      {b.label}
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        · {b.kind === "url" ? "URL" : b.kind === "phone" ? "Phone" : "Reply"}
                      </span>
                    </span>
                  ))}
                </div>
              </ReadBlock>
            )}
          </div>
        </Section>
      </div>

      <div className="lg:sticky lg:top-6">
        <div className="rounded-xl border border-border bg-card/60 glass overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <ChannelIcon channel={broadcast.channel} className="h-4 w-4" />
              <span className="text-sm font-medium">Preview</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              WhatsApp
            </span>
          </div>
          <div className="p-5 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent)]">
            <PhoneFrame
              channel={broadcast.channel}
              senderName={channel?.name ?? "Your business"}
            >
              {broadcast.body ? (
                <>
                  <div className="whitespace-pre-wrap break-words">{renderWithVars(broadcast.body)}</div>
                  {broadcast.footer && (
                    <div className="mt-2 text-[10px] text-muted-foreground/80">{broadcast.footer}</div>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground italic">No message body</span>
              )}
            </PhoneFrame>
            {broadcast.buttons && broadcast.buttons.length > 0 && (
              <div className="mx-auto mt-2 w-full max-w-[300px] space-y-1">
                {broadcast.buttons.map((b, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-background/60 px-3 py-1.5 text-center text-[12px] text-primary"
                  >
                    {b.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Analytics ------------------------------- */

type ContactRowStatus = "Sent" | "Delivered" | "Read" | "Replied" | "Failed";

function AnalyticsTab({ broadcast }: { broadcast: Broadcast }) {
  const { contacts, lists } = useContactsStore();
  const { groups } = useTemplatesStore();

  // Build a deterministic set of recipient contacts from the broadcast id.
  const recipientRows = useMemo(() => {
    const seed = broadcast.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const ordered = [...contacts].sort((a, b) => {
      const ha = hash(a.id + broadcast.id);
      const hb = hash(b.id + broadcast.id);
      return ha - hb;
    });
    const count = Math.min(contacts.length, Math.max(6, Math.floor(broadcast.reach / 2000) + 6));
    const slice = ordered.slice(0, count);
    const statuses: ContactRowStatus[] = ["Sent", "Delivered", "Read", "Replied", "Failed"];
    return slice.map((c, i) => {
      let status: ContactRowStatus;
      if (broadcast.status !== "Sent") status = "Sent";
      else {
        const r = (hash(c.id + broadcast.id + String(seed)) % 100);
        if (r < 6) status = "Failed";
        else if (r < 18) status = "Replied";
        else if (r < 60) status = "Read";
        else if (r < 90) status = "Delivered";
        else status = "Sent";
      }
      return { contact: c, status, i };
    });
  }, [broadcast, contacts]);

  const kpis = useMemo(() => {
    const sent = broadcast.reach;
    const delivered = broadcast.delivered;
    const read = broadcast.read;
    const replied = broadcast.replied ?? Math.floor(read * 0.08);
    const failed = broadcast.failed ?? Math.max(0, sent - delivered);
    return [
      { l: "Sent", v: sent, icon: Send, color: "text-foreground" },
      { l: "Delivered", v: delivered, icon: CheckCheck, color: "text-sky-300" },
      { l: "Read", v: read, icon: Eye, color: "text-emerald-300" },
      { l: "Replied", v: replied, icon: MessageSquare, color: "text-violet-300" },
      { l: "Failed", v: failed, icon: AlertTriangle, color: "text-red-300" },
    ];
  }, [broadcast]);

  // Selection
  const [selected, setSelected] = useState<string[]>([]);
  const visibleIds = recipientRows.map((r) => r.contact.id);
  const allSel = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const toggleAll = () =>
    setSelected(allSel ? selected.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...selected, ...visibleIds])));
  const toggleOne = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((s) => s !== id) : [...p, id]));
  const clearSelection = () => setSelected([]);

  const [addListOpen, setAddListOpen] = useState(false);
  const [removeListOpen, setRemoveListOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.l} className="card-hover rounded-xl border border-border bg-card/60 p-5 glass transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{k.l}</div>
                <Icon className={`h-3.5 w-3.5 ${k.color}`} />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">
                {fmtNum(k.v)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card/60 glass overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-medium">Contact performance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Per-contact delivery and engagement.
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {recipientRows.length} of {fmtNum(broadcast.reach)} contacts
          </span>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 border-b border-border bg-primary/5 text-[11px]">
            <span className="text-muted-foreground">{selected.length} selected</span>
            <button
              onClick={() => setAddListOpen(true)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 hover:bg-card px-2.5 py-1.5 transition-colors duration-150"
            >
              <ListPlus className="h-3 w-3" /> Add to List
            </button>
            <button
              onClick={() => setRemoveListOpen(true)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 hover:bg-card px-2.5 py-1.5 transition-colors duration-150"
            >
              <ListMinus className="h-3 w-3" /> Remove from List
            </button>
            <button
              onClick={clearSelection}
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              Clear Selection
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-white/[0.02]">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    className="accent-[oklch(0.62_0.17_40)]"
                    checked={allSel}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">Contact</th>
                <th className="px-4 py-3 text-left font-medium">Channel</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Labels</th>
                <th className="px-4 py-3 text-left font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recipientRows.map(({ contact, status, i }) => {
                const isSel = selected.includes(contact.id);
                // Map contacts' listIds → group-like display using contact lists names.
                const contactGroups = contact.listIds
                  .map((lid) => lists.find((l) => l.id === lid))
                  .filter(Boolean)
                  .slice(0, 2) as { id: string; name: string }[];
                return (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="accent-[oklch(0.62_0.17_40)]"
                        checked={isSel}
                        onChange={() => toggleOne(contact.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/15 text-primary text-[11px] font-medium grid place-items-center">
                          {contact.avatar}
                        </div>
                        <span className="font-medium">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <ChannelIcon channel={contact.channel} className="h-4 w-4" />
                        WhatsApp
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ContactStatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {contactGroups.length === 0 ? (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        ) : (
                          contactGroups.map((g, idx) => {
                            const tone = Object.values(TEMPLATE_GROUP_BADGE)[(idx + i) % Object.values(TEMPLATE_GROUP_BADGE).length];
                            return (
                              <span
                                key={g.id}
                                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${tone}`}
                              >
                                {g.name}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{contact.lastInteraction}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {addListOpen && (
        <ListPickerModal
          title="Add to List"
          confirmLabel="Add to selected lists"
          onClose={() => setAddListOpen(false)}
          onConfirm={(listIds) => {
            toast.success(
              `Added ${selected.length} contact${selected.length === 1 ? "" : "s"} to ${listIds.length} list${listIds.length === 1 ? "" : "s"}`,
            );
            setAddListOpen(false);
            clearSelection();
          }}
        />
      )}
      {removeListOpen && (
        <ListPickerModal
          title="Remove from List"
          confirmLabel="Remove from selected lists"
          assignedOnly
          assignedListIds={Array.from(
            new Set(
              recipientRows
                .filter((r) => selected.includes(r.contact.id))
                .flatMap((r) => r.contact.listIds),
            ),
          )}
          onClose={() => setRemoveListOpen(false)}
          onConfirm={(listIds) => {
            toast.success(
              `Removed ${selected.length} contact${selected.length === 1 ? "" : "s"} from ${listIds.length} list${listIds.length === 1 ? "" : "s"}`,
            );
            setRemoveListOpen(false);
            clearSelection();
          }}
        />
      )}
    </div>
  );
}

/* --------------------------------- Helpers -------------------------------- */

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function StatusBadge({ status }: { status: Broadcast["status"] }) {
  return (
    <span
      className={`badge-animate inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
        status === "Sent"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : status === "Scheduled"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : "border-border bg-white/[0.04] text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

function ContactStatusBadge({ status }: { status: ContactRowStatus }) {
  const map: Record<ContactRowStatus, string> = {
    Sent: "border-border bg-white/[0.04] text-muted-foreground",
    Delivered: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    Read: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    Replied: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    Failed: "border-red-500/30 bg-red-500/10 text-red-300",
  };
  return (
    <span className={`badge-animate inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${map[status]}`}>
      {status}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 glass">
      <div className="px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ReadGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function ReadField({
  label,
  children,
  span,
}: {
  label: string;
  children: React.ReactNode;
  span?: number;
}) {
  return (
    <div className={span === 2 ? "sm:col-span-2 space-y-1" : "space-y-1"}>
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="text-[13px]">{children}</div>
    </div>
  );
}

function ReadBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="rounded-lg border border-border bg-background/30 p-3">{children}</div>
    </div>
  );
}

function renderWithVars(body: string) {
  const parts = body.split(/(\{\{[^}]+\}\})/g);
  return parts.map((p, i) =>
    /^\{\{[^}]+\}\}$/.test(p) ? (
      <span key={i} className="rounded bg-primary/15 px-1 py-0.5 text-primary font-medium">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function PhoneFrame({
  channel,
  senderName,
  children,
}: {
  channel: "whatsapp" | "instagram";
  senderName: string;
  children: React.ReactNode;
}) {
  const isWa = channel === "whatsapp";
  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[28px] border border-border bg-background/60 p-3 shadow-xl">
      <div className="rounded-[20px] bg-background overflow-hidden">
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <ChannelIcon channel={channel} className="h-5 w-5" />
          <div className="min-w-0">
            <div className="text-[12px] font-semibold truncate">{senderName}</div>
            <div className="text-[10px] text-muted-foreground">{"WhatsApp Business"}</div>
          </div>
        </div>
        <div className="min-h-[180px] p-3 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]">
          <div
            className={`max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-[12px] leading-relaxed ${
              isWa
                ? "bg-emerald-500/15 border border-emerald-500/20 text-foreground"
                : "bg-pink-500/10 border border-pink-500/20 text-foreground"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- List picker modal -------------------------- */

function ListPickerModal({
  title,
  confirmLabel,
  onClose,
  onConfirm,
  assignedOnly,
  assignedListIds,
}: {
  title: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (listIds: string[]) => void;
  assignedOnly?: boolean;
  assignedListIds?: string[];
}) {
  const { lists } = useContactsStore();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const pool = assignedOnly
    ? lists.filter((l) => assignedListIds?.includes(l.id))
    : lists;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((l) => l.name.toLowerCase().includes(q));
  }, [pool, query]);

  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[80vh] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden modal-content"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground transition-colors duration-150"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lists…"
              className="w-full h-9 rounded-md border border-border bg-background/40 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-10 text-center text-xs text-muted-foreground">
              {assignedOnly ? "No assigned lists." : "No lists match."}
            </div>
          ) : (
            filtered.map((l) => {
              const sel = picked.has(l.id);
              return (
                <label
                  key={l.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer ${
                    sel ? "bg-primary/10" : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sel}
                    onChange={() => toggle(l.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-[13px] font-medium flex-1 truncate">{l.name}</span>
                  {sel && <Check className="h-3.5 w-3.5 text-primary" />}
                </label>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <span className="text-[11px] text-muted-foreground">{picked.size} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center rounded-md border border-border bg-card/60 hover:bg-card px-3 h-8 text-[12px] transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={() => picked.size > 0 && onConfirm(Array.from(picked))}
              disabled={picked.size === 0}
              className="inline-flex items-center rounded-md bg-primary px-3 h-8 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors duration-150"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
