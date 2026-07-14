import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { fmtDateEN, fmtNum } from "@/lib/fmt";
import { AppShell, SectionCard, ChannelDot } from "@/components/scl/app-shell";
import { conversations, contacts, volumeSeries, recentActivity } from "@/components/scl/mock-data";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight, ArrowDownRight, MessageSquare, Users, Megaphone,
  Reply, Radio, Calendar, MoonStar, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — Aroma Abadi" },
      { name: "description", content: "WhatsApp engagement platform for Aroma Abadi — makeup & beauty." },
      { property: "og:title", content: "Aroma Abadi — SCL" },
      { property: "og:description", content: "Manage WhatsApp conversations for Aroma Abadi in one workspace." },
    ],
  }),
  component: Dashboard,
});

// ── Types ─────────────────────────────────────────────────────────────────
type Period = "30d" | "60d" | "90d" | "custom";

// ── Mock metric sets per period ────────────────────────────────────────────
const METRICS: Record<Exclude<Period, "custom">, Array<{
  label: string; value: string; delta: string; up: boolean;
  icon: React.ElementType; sub: string;
}>> = {
  "30d": [
    { label: "Active Contacts",       value: "29,841",  delta: "+4.2%",  up: true,  icon: Users,         sub: "30-day rolling" },
    { label: "Messages Received",     value: "184,220", delta: "+12.4%", up: true,  icon: MessageSquare, sub: "vs. 30 days ago" },
    { label: "Messages Replied",      value: "168,492", delta: "+9.7%",  up: true,  icon: Reply,         sub: "91.5% reply rate" },
    { label: "Broadcast Sent",        value: "38",      delta: "+5.6%",  up: true,  icon: Radio,         sub: "campaigns this month" },
    { label: "Broadcast Reach",       value: "1.42M",   delta: "−1.6%",  up: false, icon: Megaphone,     sub: "vs. previous 30d" },
    { label: "Sleeping Consumers",    value: "1,842",   delta: "+3.4%",  up: false, icon: MoonStar,      sub: "" },
  ],
  "60d": [
    { label: "Active Contacts",       value: "57,230",  delta: "+6.8%",  up: true,  icon: Users,         sub: "60-day rolling" },
    { label: "Messages Received",     value: "341,440", delta: "+14.1%", up: true,  icon: MessageSquare, sub: "vs. 60 days ago" },
    { label: "Messages Replied",      value: "312,890", delta: "+11.2%", up: true,  icon: Reply,         sub: "91.7% reply rate" },
    { label: "Broadcast Sent",        value: "74",      delta: "+8.2%",  up: true,  icon: Radio,         sub: "campaigns 60 days" },
    { label: "Broadcast Reach",       value: "2.71M",   delta: "+2.3%",  up: true,  icon: Megaphone,     sub: "vs. previous 60d" },
    { label: "Sleeping Consumers",    value: "2,104",   delta: "+6.1%",  up: false, icon: MoonStar,      sub: "" },
  ],
  "90d": [
    { label: "Active Contacts",       value: "83,410",  delta: "+9.1%",  up: true,  icon: Users,         sub: "90-day rolling" },
    { label: "Messages Received",     value: "498,760", delta: "+17.3%", up: true,  icon: MessageSquare, sub: "vs. 90 days ago" },
    { label: "Messages Replied",      value: "459,110", delta: "+13.9%", up: true,  icon: Reply,         sub: "92.1% reply rate" },
    { label: "Broadcast Sent",        value: "112",     delta: "+11.4%", up: true,  icon: Radio,         sub: "campaigns 90 days" },
    { label: "Broadcast Reach",       value: "4.03M",   delta: "+4.8%",  up: true,  icon: Megaphone,     sub: "vs. previous 90d" },
    { label: "Sleeping Consumers",    value: "2,571",   delta: "+8.3%",  up: false, icon: MoonStar,      sub: "" },
  ],
};

const channelEngagement = [{ name: "WhatsApp", value: 7.4 }];

// ── Period label helper ────────────────────────────────────────────────────
function periodLabel(period: Period, customFrom: string, customTo: string) {
  if (period === "30d") return "30 Hari";
  if (period === "60d") return "60 Hari";
  if (period === "90d") return "90 Hari";
  if (customFrom && customTo) return `${customFrom} – ${customTo}`;
  if (customFrom) return `${customFrom} – …`;
  return "Custom";
}

// ── DateFilterPopover ──────────────────────────────────────────────────────
function DateFilterPopover({
  period, setPeriod,
  customFrom, setCustomFrom,
  customTo, setCustomTo,
}: {
  period: Period;
  setPeriod: (p: Period) => void;
  customFrom: string; setCustomFrom: (s: string) => void;
  customTo: string;   setCustomTo:   (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const label = periodLabel(period, customFrom, customTo);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 h-7 rounded-md border border-border bg-card/60 px-2.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
      >
        <Calendar className="h-3 w-3 shrink-0" />
        <span className="max-w-[120px] truncate">{label}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-56 rounded-xl border border-border bg-popover shadow-xl glass p-2">
          <div className="space-y-0.5">
            {(["30d", "60d", "90d"] as Period[]).map((p) => (
              <button
                key={p} type="button"
                onClick={() => { setPeriod(p); setOpen(false); }}
                className={`w-full text-left h-8 px-3 rounded-md text-[13px] font-medium transition-colors ${
                  period === p
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                }`}
              >
                {p === "30d" ? "30 Hari" : p === "60d" ? "60 Hari" : "90 Hari"}
              </button>
            ))}
          </div>
          <div className="my-2 border-t border-border" />
          <div className="px-1 pb-1 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2">Custom</div>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => { setCustomFrom(e.target.value); setPeriod("custom"); }}
              placeholder="Mulai"
              className="h-8 w-full rounded-md border border-border bg-card px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
            />
            <input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(e) => { setCustomTo(e.target.value); setPeriod("custom"); if (e.target.value) setOpen(false); }}
              placeholder="Selesai"
              className="h-8 w-full rounded-md border border-border bg-card px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
function Dashboard() {
  const today = fmtDateEN(new Date());

  const [period,     setPeriod]     = useState<Period>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");

  const activeMetrics = useMemo(
    () => METRICS[period === "custom" ? "30d" : period],
    [period],
  );

  const sleepingSub = useMemo(() => {
    if (period === "30d") return "≥ 30 hari tanpa aktivitas";
    if (period === "60d") return "≥ 60 hari tanpa aktivitas";
    if (period === "90d") return "≥ 90 hari tanpa aktivitas";
    if (period === "custom" && customFrom && customTo) {
      const days = Math.round(
        (new Date(customTo).getTime() - new Date(customFrom).getTime()) / 86_400_000,
      );
      return days > 0 ? `≥ ${days} hari tanpa aktivitas` : "≥ custom range";
    }
    return "≥ 30 hari tanpa aktivitas";
  }, [period, customFrom, customTo]);

  return (
    <AppShell title="Overview" subtitle={`${today} · Aroma Abadi workspace`}>
      <div className="space-y-6">

        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="text-lg font-semibold">Hello, Aria 👋</div>
            <span className="text-muted-foreground/40 text-base select-none">|</span>
            <DateFilterPopover
              period={period} setPeriod={setPeriod}
              customFrom={customFrom} setCustomFrom={setCustomFrom}
              customTo={customTo} setCustomTo={setCustomTo}
            />
          </div>
          <div className="flex items-center gap-2">
            <Link to="/inbox" className="inline-flex items-center h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Open Inbox
            </Link>
            <Link to="/broadcasts" className="inline-flex items-center h-9 rounded-md border border-border bg-card/60 px-4 text-sm font-medium hover:bg-card transition-colors">
              New Broadcast
            </Link>
          </div>
        </div>

        {/* Metrics — 2 rows × 3 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {activeMetrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="card-hover rounded-xl border border-border bg-card/60 p-5 glass relative overflow-hidden transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                  <div className="h-7 w-7 grid place-items-center rounded-md bg-white/[0.04] border border-border">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-tight stat-value">{m.value}</div>
                <div className="mt-1 flex items-center gap-1 text-[11px]">
                  <span className={`inline-flex items-center gap-0.5 ${m.up ? "text-emerald-400" : "text-rose-400"}`}>
                    {m.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {m.delta}
                  </span>
                  <span className="text-muted-foreground">{m.label === "Sleeping Consumers" ? sleepingSub : m.sub}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard
            title="Message volume"
            description="WhatsApp · periode terpilih"
            className="lg:col-span-2"
            action={
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> WhatsApp</span>
              </div>
            }
          >
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeSeries} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.14 160)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.72 0.14 160)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="d" stroke="oklch(0.7 0 0)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.7 0 0)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "oklch(0.8 0 0)" }}
                  />
                  <Area type="monotone" dataKey="whatsapp" stroke="oklch(0.72 0.14 160)" fill="url(#wa)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Channel performance" description="Avg messages per contact">
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelEngagement} layout="vertical" margin={{ top: 10, right: 16, left: 16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" horizontal={false} />
                  <XAxis type="number" stroke="oklch(0.7 0 0)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <YAxis type="category" dataKey="name" stroke="oklch(0.7 0 0)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                  <Tooltip cursor={{ fill: "oklch(1 0 0 / 4%)" }} contentStyle={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="oklch(0.62 0.17 40)" radius={[0, 6, 6, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 border-t border-border">
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg. messages / contact</div>
                <div className="mt-1 text-lg font-semibold">5.8</div>
              </div>
              <div className="p-4 border-l border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">CSAT</div>
                <div className="mt-1 text-lg font-semibold">4.81 / 5</div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Activity + Conversations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard title="Recent activity" className="lg:col-span-1">
            <ul className="divide-y divide-border">
              {recentActivity.map((a) => (
                <li key={a.id} className="px-5 py-3 flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-xs leading-relaxed">{a.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            title="Recent conversations"
            description="Latest activity in your shared inbox"
            className="lg:col-span-2"
            action={
              <Link to="/inbox" className="text-[11px] text-primary hover:underline">Open inbox →</Link>
            }
          >
            <ul className="divide-y divide-border">
              {conversations.slice(0, 5).map((c) => {
                const contact = contacts.find((x) => x.id === c.contactId)!;
                return (
                  <li key={c.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-xs font-medium">
                      {contact.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{contact.name}</span>
                        <ChannelDot channel={c.channel} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.preview}</p>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{c.time}</div>
                    {c.unread > 0 && (
                      <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{c.unread}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        </div>

      </div>
    </AppShell>
  );
}
