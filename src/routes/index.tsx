import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { fmtDateEN, fmtNum } from "@/lib/fmt";
import { AppShell, SectionCard, ChannelDot } from "@/components/scl/app-shell";
import { conversations, contacts, volumeSeries, recentActivity } from "@/components/scl/mock-data";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight, ArrowDownRight, MessageSquare, Users, Megaphone,
  Reply, Radio, Calendar, MoonStar, BedDouble, AlertCircle,
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
    { label: "Active Contacts",    value: "29,841", delta: "+4.2%",  up: true,  icon: Users,       sub: "30-day rolling" },
    { label: "Messages Received",  value: "184,220", delta: "+12.4%", up: true,  icon: MessageSquare, sub: "vs. 30 days ago" },
    { label: "Messages Replied",   value: "168,492", delta: "+9.7%",  up: true,  icon: Reply,       sub: "91.5% reply rate" },
    { label: "Broadcast Sent",     value: "38",      delta: "+5.6%",  up: true,  icon: Radio,       sub: "campaigns this month" },
    { label: "Broadcast Reach",    value: "1.42M",   delta: "−1.6%",  up: false, icon: Megaphone,   sub: "vs. previous 30d" },
  ],
  "60d": [
    { label: "Active Contacts",    value: "57,230", delta: "+6.8%",  up: true,  icon: Users,       sub: "60-day rolling" },
    { label: "Messages Received",  value: "341,440", delta: "+14.1%", up: true,  icon: MessageSquare, sub: "vs. 60 days ago" },
    { label: "Messages Replied",   value: "312,890", delta: "+11.2%", up: true,  icon: Reply,       sub: "91.7% reply rate" },
    { label: "Broadcast Sent",     value: "74",      delta: "+8.2%",  up: true,  icon: Radio,       sub: "campaigns 60 days" },
    { label: "Broadcast Reach",    value: "2.71M",   delta: "+2.3%",  up: true,  icon: Megaphone,   sub: "vs. previous 60d" },
  ],
  "90d": [
    { label: "Active Contacts",    value: "83,410", delta: "+9.1%",  up: true,  icon: Users,       sub: "90-day rolling" },
    { label: "Messages Received",  value: "498,760", delta: "+17.3%", up: true,  icon: MessageSquare, sub: "vs. 90 days ago" },
    { label: "Messages Replied",   value: "459,110", delta: "+13.9%", up: true,  icon: Reply,       sub: "92.1% reply rate" },
    { label: "Broadcast Sent",     value: "112",     delta: "+11.4%", up: true,  icon: Radio,       sub: "campaigns 90 days" },
    { label: "Broadcast Reach",    value: "4.03M",   delta: "+4.8%",  up: true,  icon: Megaphone,   sub: "vs. previous 90d" },
  ],
};

// Sleeping consumers mock per threshold
const SLEEPING: Record<"3m" | "6m" | "9m", { count: number; delta: string; up: boolean }> = {
  "3m": { count: 1_842, delta: "+3.4%", up: false },
  "6m": { count:   927, delta: "−8.1%", up: true  },
  "9m": { count:   341, delta: "−12.6%", up: true  },
};

const channelEngagement = [{ name: "WhatsApp", value: 7.4 }];

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

  // Reference date label for sleeping consumer section
  const refLabel = useMemo(() => {
    if (period === "custom" && customTo) return customTo;
    return today;
  }, [period, customTo, today]);

  return (
    <AppShell title="Overview" subtitle={`${today} · Aroma Abadi workspace`}>
      <div className="space-y-6">

        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-lg font-semibold">Hello, Aria 👋</div>
          <div className="flex items-center gap-2">
            <Link to="/inbox" className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Open Inbox
            </Link>
            <Link to="/broadcasts" className="h-9 rounded-md border border-border bg-card/60 px-4 text-sm font-medium hover:bg-card transition-colors">
              New Broadcast
            </Link>
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {(["30d","60d","90d","custom"] as Period[]).map((p) => (
            <button
              key={p} type="button"
              onClick={() => setPeriod(p)}
              className={`h-8 px-3 rounded-md text-[13px] font-medium border transition-colors ${
                period === p
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
            >
              {p === "30d" ? "30 Hari" : p === "60d" ? "60 Hari" : p === "90d" ? "90 Hari" : "Custom"}
            </button>
          ))}
          {period === "custom" && (
            <div className="flex items-center gap-1.5">
              <input type="date" value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 rounded-md border border-border bg-card px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer" />
              <span className="text-[11px] text-muted-foreground">–</span>
              <input type="date" value={customTo} min={customFrom}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 rounded-md border border-border bg-card px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer" />
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 stagger">
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
                  <span className="text-muted-foreground">{m.sub}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sleeping Consumer section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BedDouble className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm font-semibold">Sleeping Consumers</div>
            <span className="text-[11px] text-muted-foreground">· referensi per {refLabel}</span>
            <div className="relative group ml-1">
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 rounded-lg border border-border bg-popover px-3 py-2 text-[11px] text-muted-foreground shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Consumer tanpa aktivitas (chat/transaksi) dalam periode yang dipilih, dihitung dari tanggal referensi.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["3m","6m","9m"] as const).map((tier) => {
              const s = SLEEPING[tier];
              const label = tier === "3m" ? "3 Bulan" : tier === "6m" ? "6 Bulan" : "9 Bulan";
              const colors = tier === "3m"
                ? { bg: "bg-amber-50", icon: "text-amber-500", border: "border-amber-100" }
                : tier === "6m"
                ? { bg: "bg-orange-50", icon: "text-orange-500", border: "border-orange-100" }
                : { bg: "bg-rose-50", icon: "text-rose-500", border: "border-rose-100" };
              return (
                <div key={tier} className={`rounded-xl border ${colors.border} ${colors.bg} p-4 flex items-start gap-3 hover:shadow-md transition-shadow`}>
                  <div className={`h-9 w-9 rounded-md bg-white/80 grid place-items-center shrink-0 shadow-sm`}>
                    <MoonStar className={`h-4 w-4 ${colors.icon}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-muted-foreground">Tidak aktif ≥ {label}</div>
                    <div className="text-xl font-semibold mt-0.5 tabular-nums">{s.count.toLocaleString()}</div>
                    <div className={`mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-medium ${s.up ? "text-emerald-600" : "text-rose-500"}`}>
                      {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {s.delta} dari periode sebelumnya
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
