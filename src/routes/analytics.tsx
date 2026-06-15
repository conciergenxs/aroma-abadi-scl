import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { volumeSeries, contactGrowth, broadcasts } from "@/components/scl/mock-data";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — SCL" }] }),
  component: AnalyticsPage,
});

const channelMix = [
  { name: "WhatsApp", v: 68 },
  { name: "Instagram", v: 32 },
];
const colors = ["oklch(0.72 0.14 160)", "oklch(0.66 0.2 350)"];

function AnalyticsPage() {
  return (
    <AppShell title="Analytics" subtitle="Enterprise messaging performance · last 30 days">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { l: "Total messages", v: "397,104", d: "+9.2%" },
            { l: "Active conversations", v: "8,212", d: "+4.1%" },
            { l: "Contact growth", v: "+5,720", d: "+18.4%" },
            { l: "Broadcast performance", v: "88.1%", d: "Read rate" },
          ].map((m) => (
            <div key={m.l} className="rounded-xl border border-border bg-card/60 p-5 glass">
              <div className="text-xs text-muted-foreground">{m.l}</div>
              <div className="mt-2 text-2xl font-semibold">{m.v}</div>
              <div className="mt-1 text-[11px] text-emerald-400">{m.d}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SectionCard title="Message volume" description="Daily volume by channel" className="lg:col-span-2">
            <div className="h-80 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeSeries} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wa2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.14 160)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.72 0.14 160)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ig2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.66 0.2 350)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.66 0.2 350)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="d" stroke="oklch(0.7 0 0)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.7 0 0)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="whatsapp" stroke="oklch(0.72 0.14 160)" fill="url(#wa2)" strokeWidth={2} />
                  <Area type="monotone" dataKey="instagram" stroke="oklch(0.66 0.2 350)" fill="url(#ig2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Channel mix">
            <div className="h-80 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={channelMix} dataKey="v" innerRadius={60} outerRadius={95} paddingAngle={4} stroke="none">
                    {channelMix.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11, color: "oklch(0.8 0 0)" }} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Contact growth" description="Subscribed contacts over time">
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={contactGrowth} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="m" stroke="oklch(0.7 0 0)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.7 0 0)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="v" stroke="oklch(0.62 0.17 40)" strokeWidth={2.5} dot={{ r: 3, fill: "oklch(0.62 0.17 40)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Broadcast performance" description="Last campaigns · read rate %">
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={broadcasts.filter((b) => b.status === "Sent").map((b) => ({ name: b.name.split(" — ")[0], v: Math.round((b.read / Math.max(1, b.delivered)) * 100) }))}
                  margin={{ top: 10, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="name" stroke="oklch(0.7 0 0)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.7 0 0)" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "oklch(1 0 0 / 4%)" }} />
                  <Bar dataKey="v" fill="oklch(0.62 0.17 40)" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}