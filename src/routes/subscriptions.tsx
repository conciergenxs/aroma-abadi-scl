import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard, ChannelDot } from "@/components/scl/app-shell";
import { contacts } from "@/components/scl/mock-data";
import { useState } from "react";
import { Check, X, Ban } from "lucide-react";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions — SCL" }] }),
  component: SubsPage,
});

const tabs = ["All", "Subscribed", "Unsubscribed", "Opted Out"] as const;

function SubsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const filtered = contacts.filter((c) => tab === "All" || c.subscription === tab);

  const counts = {
    Subscribed: contacts.filter((c) => c.subscription === "Subscribed").length,
    Unsubscribed: contacts.filter((c) => c.subscription === "Unsubscribed").length,
    "Opted Out": contacts.filter((c) => c.subscription === "Opted Out").length,
  };

  return (
    <AppShell title="Subscriptions" subtitle="Manage consent and channel preferences">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Subscribed" value="84,221" delta="+1.8% wk" tone="good" icon={Check} />
          <StatCard label="Unsubscribed" value="3,214" delta="+0.4% wk" tone="warn" icon={X} />
          <StatCard label="Opted Out" value="612" delta="−0.1% wk" tone="bad" icon={Ban} />
        </div>

        <SectionCard
          title="Consent ledger"
          description="Every subscription event is logged for compliance (GDPR, TCPA, CCPA)"
          action={
            <div className="flex items-center gap-1 text-[11px]">
              {tabs.map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-2.5 py-1 rounded ${tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {t}{t !== "All" && ` (${counts[t as keyof typeof counts]})`}
                </button>
              ))}
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Contact</th>
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Source</th>
                  <th className="px-4 py-3 text-left font-medium">Consent date</th>
                  <th className="px-4 py-3 text-left font-medium">Last update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-[11px] font-medium">{c.avatar}</div>
                        <div>
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-[11px] font-mono text-muted-foreground">{c.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><ChannelDot channel={c.channel} /></td>
                    <td className="px-4 py-3"><SubBadge value={c.subscription} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.channel === "whatsapp" ? "WA Opt-in widget" : "IG DM checkbox"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">Mar 14, 2024</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.lastInteraction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, delta, tone, icon: Icon }: { label: string; value: string; delta: string; tone: "good" | "warn" | "bad"; icon: typeof Check }) {
  const t = tone === "good" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
    : tone === "warn" ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
    : "text-rose-300 bg-rose-500/10 border-rose-500/30";
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5 glass">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${t}`}><Icon className="h-3.5 w-3.5" /></span>
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{delta}</div>
    </div>
  );
}

function SubBadge({ value }: { value: string }) {
  const tone = value === "Subscribed" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : value === "Unsubscribed" ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
    : "border-rose-500/30 bg-rose-500/10 text-rose-300";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone}`}>{value}</span>;
}