import { createFileRoute, Link } from "@tanstack/react-router";
import { variableLabel } from "@/components/scl/template-vars";
import { fmtNum } from "@/lib/fmt";
import { AppShell, StatusPill } from "@/components/scl/app-shell";
import { ChannelIcon } from "@/components/scl/channel-badge";
import { useBroadcastsStore, broadcastRuns } from "@/components/scl/broadcasts-store";
import { useContactsStore } from "@/components/scl/contacts-store";
import { usePromoStore } from "@/components/scl/promo-store";
import { useTemplatesStore } from "@/components/scl/templates-store";
import { TableFooterPagination } from "@/components/scl/broadcast-session-analytics";
import { DateRangePopover, lifetimePresets } from "@/components/scl/date-range-popover";
import type { DateRange } from "@/components/scl/overview-metrics";
import { connectedChannels, type Broadcast, type BroadcastRun } from "@/components/scl/mock-data";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Users, Eye, Repeat, ChevronDown, ExternalLink, Phone } from "lucide-react";

export const Route = createFileRoute("/broadcasts/$broadcastId")({
  head: () => ({ meta: [{ title: "Broadcast — SCL" }] }),
  component: BroadcastDetailPage,
});

function BroadcastDetailPage() {
  const { broadcastId } = Route.useParams();
  const { broadcasts } = useBroadcastsStore();
  const broadcast = broadcasts.find((b) => b.id === broadcastId);

  if (!broadcast) {
    return (
      <AppShell>
        <div className="max-w-xl">
          <h1 className="mt-4 text-lg font-semibold">Broadcast not found</h1>
          <p className="text-[12px] text-muted-foreground mt-1">It may have been deleted.</p>
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
          {broadcast.recurrence && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[12px] font-medium text-primary">
              <Repeat className="h-3 w-3" />
              {broadcast.recurrence.summary} · {broadcast.recurrence.time}
            </span>
          )}
        </div>
      </div>

      {/* The shell's own bottom gutter leaves the logs table sitting tight
          against the viewport edge on this page; give it 30px more. */}
      <div className="space-y-6 pb-[30px]">
        <BroadcastDetails broadcast={broadcast} />
        <BroadcastLogs broadcast={broadcast} />
      </div>
    </AppShell>
  );
}

/* --------------------------------- Details -------------------------------- */

function BroadcastDetails({ broadcast }: { broadcast: Broadcast }) {
  const { promos } = usePromoStore();
  const issuedCodes = broadcast.recipientCodes ?? [];
  const promo = promos.find((p) => p.id === broadcast.promoCodeId) ?? null;
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
                  <span className="text-muted-foreground text-[12px]">{channel.handle}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ChannelIcon channel={broadcast.channel} className="h-4 w-4" />
                  <span className="capitalize">{broadcast.channel}</span>
                </span>
              )}
            </ReadField>
            <ReadField label="Broadcast Name">{broadcast.name}</ReadField>
            <ReadField label="Broadcast Time">{broadcast.sentAt || "—"}</ReadField>
            <ReadField label="Send Mode">
              {broadcast.sendMode === "recurring"
                ? "Recurring"
                : broadcast.sendMode === "schedule"
                  ? "Scheduled"
                  : "Send now"}
            </ReadField>
            {broadcast.sendMode === "schedule" && (
              <ReadField label="Scheduled For">
                {[broadcast.scheduleDate, broadcast.scheduleTime].filter(Boolean).join(" · ") ||
                  "—"}
              </ReadField>
            )}
            {broadcast.recurrence && (
              <>
                <ReadField label="Repeats">
                  {broadcast.recurrence.summary} at {broadcast.recurrence.time}
                </ReadField>
                <ReadField label="Next Send">{broadcast.recurrence.nextRunAt ?? "—"}</ReadField>
                <ReadField label="Series Started">{broadcast.recurrence.startDate}</ReadField>
                <ReadField label="Series Ends">
                  {broadcast.recurrence.endDate ?? "No end date"}
                </ReadField>
              </>
            )}
            <ReadField label="Created By">{broadcast.createdBy ?? "—"}</ReadField>
            <ReadField label="Created Date">{broadcast.createdAt ?? "—"}</ReadField>
          </ReadGrid>
        </Section>

        <Section title="Audience">
          <ReadGrid>
            <ReadField label="Selected Audience">
              {selectedLists.length === 0 ? (
                <span className="text-muted-foreground">No audience selected</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedLists.map((l) => (
                    <span
                      key={l.id}
                      className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[12px] text-primary"
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

        {issuedCodes.length > 0 && (
          <Section title={`Promo Codes Issued (${issuedCodes.length})`}>
            {promo && (
              <p className="text-[13px] text-muted-foreground mb-3">
                Each recipient received their own{" "}
                <Link
                  to="/promo-codes/$promoId"
                  params={{ promoId: promo.id }}
                  className="font-mono font-semibold text-primary hover:underline"
                >
                  {promo.code}
                </Link>{" "}
                code — the last four characters are their initials.
              </p>
            )}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-[14px]">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Recipient
                      </th>
                      <th className="px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Code
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {issuedCodes.map((r) => (
                      <tr key={r.contactId}>
                        <td className="px-3 py-1.5 text-[13px]">{r.contactName}</td>
                        <td className="px-3 py-1.5">
                          <code className="font-mono text-[13px] bg-muted/60 border border-border rounded px-1.5 py-0.5">
                            {r.code}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>
        )}

        <Section title="Content">
          <ReadGrid>
            <ReadField label="Mode">
              {broadcast.contentMode === "manual" ? "Manual message" : "Template"}
            </ReadField>
            {template && (
              <ReadField label="Selected Template">
                <span className="inline-flex items-center gap-2">
                  <span className="font-medium">{template.name}</span>
                  <span className="text-[12px] text-muted-foreground rounded-full border border-border px-2 py-0.5">
                    {template.category}
                  </span>
                </span>
              </ReadField>
            )}
          </ReadGrid>
          <div className="mt-4 space-y-3">
            <ReadBlock label="Message Content">
              <div className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">
                {renderWithVars(broadcast.body ?? "")}
              </div>
            </ReadBlock>
            {/* Footer and Buttons are both short — side by side on a wide screen,
                stacked only when there isn't room. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 items-stretch gap-3">
              {broadcast.footer && (
                <ReadBlock label="Footer">
                  <div className="text-[13px] text-muted-foreground">{broadcast.footer}</div>
                </ReadBlock>
              )}
              {broadcast.buttons && broadcast.buttons.length > 0 && (
                <ReadBlock label="Buttons">
                  <div className="flex flex-wrap gap-1.5">
                    {broadcast.buttons.map((b, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-md border border-border bg-background/40 px-2 py-1 text-[12px]"
                      >
                        {b.label}
                        <span className="ml-1 text-[12px] text-muted-foreground">
                          · {b.kind === "url" ? "URL" : b.kind === "phone" ? "Phone" : "Reply"}
                        </span>
                      </span>
                    ))}
                  </div>
                </ReadBlock>
              )}
            </div>
          </div>
        </Section>
      </div>

      <div className="lg:sticky lg:top-6">
        <div className="rounded-xl border border-border bg-card/60 glass overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <ChannelIcon channel={broadcast.channel} className="h-4 w-4" />
              <span className="text-[14px] font-medium">Preview</span>
            </div>
            <span className="text-[12px] uppercase tracking-wider text-muted-foreground">
              WhatsApp
            </span>
          </div>
          <div className="p-5 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent)]">
            <PhoneFrame
              channel={broadcast.channel}
              senderName={channel?.name ?? "Your business"}
              buttons={broadcast.buttons ?? []}
            >
              {broadcast.body ? (
                <>
                  <div className="whitespace-pre-wrap break-words">
                    {renderWithVars(broadcast.body)}
                  </div>
                  {broadcast.footer && (
                    <div className="mt-2 text-[10px] text-muted-foreground/80">
                      {broadcast.footer}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground italic">No message body</span>
              )}
            </PhoneFrame>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Broadcast Logs ----------------------------- */

/** Logs list dates, not relative words: "Today · 09:00" tells you nothing a
 * week later. The time comes off whatever the send recorded, so a series that
 * runs twice in a day stays readable. */
export function fmtSentAt(run: BroadcastRun) {
  if (!run.sentAtDate) return run.sentAt;
  const [y, m, d] = run.sentAtDate.split("-");
  const time = run.sentAt.match(/(\d{1,2}):(\d{2})/);
  const clock = time ? `, ${time[1].padStart(2, "0")}.${time[2]}` : "";
  return `${d}/${m}/${y}${clock}`;
}

/* Every send this broadcast has made. A one-off has a single row; a recurring
 * series gets one per occurrence, and each row opens that session's own
 * analytics — performance is only ever read per send, never averaged across
 * the series. */
const LOG_STATUSES = ["All", "Success", "Partial", "Failed"] as const;

function BroadcastLogs({ broadcast }: { broadcast: Broadcast }) {
  // broadcastRuns() builds a fresh array on every call, so memoise it: the
  // date bounds derive from it, and an unstable identity would re-run the
  // effect that resets the filter on every render.
  const runs = useMemo(() => broadcastRuns(broadcast), [broadcast]);

  // A log filter can only reach from the day the broadcast was created to its
  // most recent send — never outside its own history.
  const bounds: DateRange = useMemo(() => {
    const dates = runs.map((r) => r.sentAtDate).filter(Boolean);
    const end = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : "";
    const earliest = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : "";
    const start = broadcast.createdAtDate ?? earliest;
    return { start: start && start <= end ? start : end, end };
  }, [runs, broadcast.createdAtDate]);

  const [range, setRange] = useState<DateRange>(bounds);
  const [presetLabel, setPresetLabel] = useState<string | null>("Program Lifetime");
  // Depend on the two dates, not the object: `bounds` is rebuilt on every
  // render, and depending on it would reset the filter in a loop.
  useEffect(() => {
    setRange(bounds);
    setPresetLabel("Program Lifetime");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.start, bounds.end]);
  const [status, setStatus] = useState<(typeof LOG_STATUSES)[number]>("All");

  const filtered = useMemo(
    () =>
      runs.filter((r) => {
        if (status !== "All" && r.status !== status) return false;
        if (!r.sentAtDate || !bounds.end) return true;
        return r.sentAtDate >= range.start && r.sentAtDate <= range.end;
      }),
    [runs, status, range, bounds.end],
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    // No overflow-hidden here: the filter popover has to escape the card.
    // The scroll area below clips itself, and the rounded corners survive
    // because nothing paints a background right at the card's edge.
    <div className="rounded-xl border border-border bg-card/60 glass">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-[14px] font-medium">Broadcast Logs</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Execution history for this broadcast.
            </p>
          </div>
          <div aria-hidden className="h-8 w-px bg-border" />
          <span className="inline-flex items-center rounded-full border border-border bg-white/[0.04] px-2.5 py-1 text-[12px] text-muted-foreground">
            Logs Count: {runs.length}
          </span>
        </div>
        {runs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePopover
              range={range}
              bounds={bounds}
              presets={lifetimePresets(bounds)}
              selectedLabel={presetLabel}
              onChange={(r, label) => {
                setRange(r);
                setPresetLabel(label);
                setPage(1);
              }}
            />
            <span className="relative inline-flex items-center">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as (typeof LOG_STATUSES)[number]);
                  setPage(1);
                }}
                aria-label="Filter by status"
                className="h-9 appearance-none rounded-md border border-border bg-card/60 pl-3 pr-8 text-[13px] text-muted-foreground hover:text-foreground hover:bg-card focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors duration-150"
              >
                {LOG_STATUSES.map((v) => (
                  <option key={v} value={v}>
                    {v === "All" ? "All Statuses" : v}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-3 w-3 text-muted-foreground" />
            </span>
          </div>
        )}
      </div>

      {runs.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-[14px] text-muted-foreground">No sends yet.</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            {broadcast.recurrence?.nextRunAt
              ? `The first send runs ${broadcast.recurrence.nextRunAt}.`
              : broadcast.status === "Scheduled"
                ? `Scheduled for ${[broadcast.scheduleDate, broadcast.scheduleTime]
                    .filter(Boolean)
                    .join(" · ")}.`
                : "This broadcast is still a draft."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[14px]">
              <thead className="text-[12px] uppercase tracking-wider text-muted-foreground bg-white/[0.02]">
                <tr>
                  <th className="w-[180px] px-4 py-3 text-left font-medium whitespace-nowrap">
                    Date Sent
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Audience</th>
                  <th className="px-4 py-3 text-left font-medium">Reach</th>
                  <th className="px-4 py-3 text-left font-medium">Delivered</th>
                  <th className="px-4 py-3 text-left font-medium">Read</th>
                  <th className="w-[110px] px-4 py-3 text-left font-medium">Status</th>
                  <th className="w-[190px] px-4 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">{fmtSentAt(run)}</td>
                    <td className="px-4 py-3 tabular-nums">{fmtNum(run.audience)}</td>
                    <td className="px-4 py-3 tabular-nums">{fmtNum(run.reach)}</td>
                    <td className="px-4 py-3 tabular-nums">{fmtNum(run.delivered)}</td>
                    <td className="px-4 py-3 tabular-nums">{fmtNum(run.read)}</td>
                    <td className="px-4 py-3">
                      <RunStatusBadge status={run.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to="/broadcast-log/$broadcastId/$logId"
                        params={{ broadcastId: broadcast.id, logId: run.id }}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card/60 hover:bg-card px-2.5 h-8 text-[13px] transition-colors duration-150"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-[14px] text-muted-foreground">No sends match these filters.</p>
              <button
                onClick={() => {
                  setRange(bounds);
                  setPresetLabel("Program Lifetime");
                  setStatus("All");
                }}
                className="mt-2 text-[13px] text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
          <TableFooterPagination
            page={safePage}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            total={filtered.length}
          />
        </>
      )}
    </div>
  );
}

export function RunStatusBadge({ status }: { status: BroadcastRun["status"] }) {
  return (
    <StatusPill
      tone={status === "Success" ? "positive" : status === "Partial" ? "warning" : "danger"}
    >
      {status}
    </StatusPill>
  );
}

/* --------------------------------- Helpers -------------------------------- */

function StatusBadge({ status }: { status: Broadcast["status"] }) {
  return (
    <StatusPill
      tone={status === "Sent" ? "positive" : status === "Scheduled" ? "warning" : "neutral"}
    >
      {status}
    </StatusPill>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 glass">
      <div className="px-5 py-3.5 border-b border-border">
        <h3 className="text-[14px] font-medium">{title}</h3>
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
      <div className="text-[12px] font-medium text-muted-foreground">{label}</div>
      <div className="text-[13px]">{children}</div>
    </div>
  );
}

function ReadBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // Side-by-side blocks (Footer and Buttons) get the same height: the column
    // stretches, and the box grows to fill whatever the taller one sets.
    <div className="flex h-full flex-col gap-1.5">
      <div className="text-[12px] font-medium text-muted-foreground">{label}</div>
      <div className="flex-1 rounded-lg border border-border bg-background/30 p-3">{children}</div>
    </div>
  );
}

function renderWithVars(body: string) {
  const parts = body.split(/(\{\{[^}]+\}\})/g);
  return parts.map((p, i) =>
    /^\{\{[^}]+\}\}$/.test(p) ? (
      <span key={i} className="rounded bg-primary/15 px-1 py-0.5 text-primary font-medium">
        {variableLabel(p)}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

/* WhatsApp attaches call-to-action buttons (URL / phone) to the bottom of the
 * message bubble itself: a hairline divider, then the label centred in link
 * blue with a small leading icon. Quick replies are different — they sit
 * outside the bubble as their own tappable chips — so the preview keeps the
 * two apart instead of drawing every button the same way. */
function PhoneFrame({
  channel,
  senderName,
  buttons = [],
  children,
}: {
  channel: "whatsapp" | "instagram";
  senderName: string;
  buttons?: NonNullable<Broadcast["buttons"]>;
  children: React.ReactNode;
}) {
  const ctaButtons = buttons.filter((b) => b.kind !== "quick_reply");
  const quickReplies = buttons.filter((b) => b.kind === "quick_reply");
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
            {/* -mb-2 cancels the bubble's own bottom padding, so the gap under
                the label matches the one above it. */}
            {ctaButtons.length > 0 && (
              <div className="-mx-3 -mb-2 mt-2">
                {ctaButtons.map((b, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-center gap-1.5 border-t px-3 py-2 text-[13px] ${
                      isWa
                        ? "border-emerald-900/10 text-[#027EB5]"
                        : "border-pink-900/10 text-primary"
                    }`}
                  >
                    {b.kind === "phone" ? (
                      <Phone className="h-3.5 w-3.5" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5" />
                    )}
                    {b.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          {quickReplies.length > 0 && (
            <div className="mt-1.5 max-w-[85%] space-y-1">
              {quickReplies.map((b, i) => (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-1.5 text-center text-[13px] ${
                    isWa
                      ? "border-emerald-500/20 bg-emerald-500/10 text-[#027EB5]"
                      : "border-pink-500/20 bg-pink-500/10 text-primary"
                  }`}
                >
                  {b.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
