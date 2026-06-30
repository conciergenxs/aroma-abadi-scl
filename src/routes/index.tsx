import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard, ChannelDot } from "@/components/scl/app-shell";
import { conversations, contacts, volumeSeries, recentActivity } from "@/components/scl/mock-data";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ArrowDownRight, MessageSquare, Users, Megaphone, Reply, Radio } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — Aroma Abadi" },
      { name: "description", content: "Platform engagement WhatsApp untuk Aroma Abadi — makeup & beauty." },
      { property: "og:title", content: "Aroma Abadi — SCL" },
      { property: "og:description", content: "Kelola percakapan WhatsApp pelanggan Aroma Abadi dalam satu workspace." },
    ],
  }),
  component: Dashboard,
});

const metrics = [
  { label: "Active Contacts", value: "29,841", delta: "+4.2%", up: true, icon: Users, sub: "7-day rolling" },
  { label: "Messages Received", value: "184,220", delta: "+12.4%", up: true, icon: MessageSquare, sub: "vs. 7 hari lalu" },
  { label: "Messages Replied", value: "168,492", delta: "+9.7%", up: true, icon: Reply, sub: "91.5% reply rate" },
  { label: "Broadcast Sent", value: "38", delta: "+5.6%", up: true, icon: Radio, sub: "campaign bulan ini" },
  { label: "Broadcast Reach", value: "1.42M", delta: "−1.6%", up: false, icon: Megaphone, sub: "vs. campaign sebelumnya" },
];

const channelEngagement = [
  { name: "WhatsApp", value: 7.4 },
];

function Dashboard() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return (
    <AppShell title="Overview" subtitle={`${today} · Aroma Abadi workspace`}>
      <div className="space-y-6">
        {/* Quick actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-lg font-semibold">Halo, Aria 👋</div>
          <div className="flex items-center gap-2">
            <Link to="/inbox" className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition">
              Open Inbox
            </Link>
            <Link to="/broadcasts" className="rounded-md border border-border bg-card/60 px-3 py-2 text-xs font-medium hover:bg-card transition">
              New Broadcast
            </Link>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 stagger">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="card-hover rounded-xl border border-border bg-card/60 p-5 glass relative overflow-hidden">
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

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard
            title="Message volume"
            description="WhatsApp · 7 hari terakhir"
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

          <SectionCard title="Channel performance" description="Average messages per contact by channel">
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
                  <li key={c.id} className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02]">
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
