import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, SectionCard, ChannelDot } from "@/components/scl/app-shell";
import { broadcasts } from "@/components/scl/mock-data";
import { useMemo, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";

export const Route = createFileRoute("/broadcasts")({
  head: () => ({ meta: [{ title: "Broadcasts — SCL" }] }),
  component: BroadcastListPage,
});

const STATUSES = ["All", "Sent", "Scheduled", "Draft"] as const;
type StatusFilter = (typeof STATUSES)[number];

function BroadcastListPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return broadcasts.filter((b) => {
      if (status !== "All" && b.status !== status) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.audience.toLowerCase().includes(q) ||
        b.channel.toLowerCase().includes(q)
      );
    });
  }, [query, status]);

  const stats = useMemo(() => {
    const sent = broadcasts.filter((b) => b.status === "Sent");
    const totalReach = sent.reduce((a, b) => a + b.reach, 0);
    const totalDelivered = sent.reduce((a, b) => a + b.delivered, 0);
    const totalRead = sent.reduce((a, b) => a + b.read, 0);
    const scheduled = broadcasts.filter((b) => b.status === "Scheduled").length;
    return [
      { l: "Total reach (30d)", v: totalReach.toLocaleString() },
      { l: "Delivery rate", v: totalReach ? `${((totalDelivered / totalReach) * 100).toFixed(1)}%` : "—" },
      { l: "Read rate", v: totalDelivered ? `${((totalRead / totalDelivered) * 100).toFixed(1)}%` : "—" },
      { l: "Scheduled", v: String(scheduled) },
    ];
  }, []);

  return (
    <AppShell
      title="Broadcasts"
      subtitle="Compose, schedule and track outbound campaigns"
      actions={
        <Link
          to="/broadcast/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 h-9 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Create Broadcast
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.l} className="rounded-xl border border-border bg-card/60 p-5 glass">
              <div className="text-xs text-muted-foreground">{s.l}</div>
              <div className="mt-2 text-2xl font-semibold">{s.v}</div>
            </div>
          ))}
        </div>

        <SectionCard
          title="All broadcasts"
          description="Search, filter, and manage campaigns"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-border">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search broadcasts…"
                className="w-full h-9 rounded-md border border-border bg-background/40 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              {STATUSES.map((s) => {
                const sel = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium border transition ${
                      sel
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-border bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Audience</th>
                  <th className="px-4 py-3 text-right font-medium">Reach</th>
                  <th className="px-4 py-3 text-right font-medium">Delivered</th>
                  <th className="px-4 py-3 text-right font-medium">Read</th>
                  <th className="px-4 py-3 text-right font-medium">Clicks</th>
                  <th className="px-4 py-3 text-left font-medium">Sent</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="px-4 py-3"><ChannelDot channel={b.channel} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.audience}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{b.reach.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{b.delivered.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{b.read.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{b.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.sentAt}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        b.status === "Sent" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" :
                        b.status === "Scheduled" ? "border-amber-500/30 bg-amber-500/10 text-amber-300" :
                        "border-border bg-white/[0.04] text-muted-foreground"
                      }`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-xs text-muted-foreground">
                      No broadcasts match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}