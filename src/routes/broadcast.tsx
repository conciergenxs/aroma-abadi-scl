import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard, ChannelDot } from "@/components/scl/app-shell";
import { broadcasts, templates } from "@/components/scl/mock-data";
import { useState, type ReactNode } from "react";
import { Users, MessageSquareText, FileText, Eye, Send, Check } from "lucide-react";

export const Route = createFileRoute("/broadcast")({
  head: () => ({ meta: [{ title: "Broadcast — SCL" }] }),
  component: BroadcastPage,
});

const steps = [
  { key: "audience", label: "Audience", icon: Users },
  { key: "channel", label: "Channel", icon: MessageSquareText },
  { key: "template", label: "Template", icon: FileText },
  { key: "preview", label: "Preview", icon: Eye },
  { key: "send", label: "Send", icon: Send },
] as const;

const segments = [
  { name: "VIP Customers", count: 12408, desc: "Platinum tier · last 90 days" },
  { name: "Active EU Leads", count: 4910, desc: "Engaged in last 30 days" },
  { name: "Enterprise accounts", count: 612, desc: "Annual contract value > $25k" },
  { name: "All subscribed", count: 84221, desc: "Opted-in across both channels" },
];

function BroadcastPage() {
  const [step, setStep] = useState(0);
  const [seg, setSeg] = useState(segments[0]);
  const [channel, setChannel] = useState<"whatsapp" | "instagram">("whatsapp");
  const [tplId, setTplId] = useState(templates[0].id);
  const tpl = templates.find((t) => t.id === tplId)!;

  return (
    <AppShell title="Broadcast" subtitle="Compose, target, and send to thousands in minutes">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { l: "Sent (30d)", v: "1.42M" },
            { l: "Delivery rate", v: "99.4%" },
            { l: "Read rate", v: "88.1%" },
            { l: "CTR", v: "32.7%" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border bg-card/60 p-5 glass">
              <div className="text-xs text-muted-foreground">{s.l}</div>
              <div className="mt-2 text-2xl font-semibold">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <SectionCard title="New broadcast" description="Follow the steps to launch your campaign">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border overflow-x-auto">
              {steps.map((s, i) => {
                const done = i < step;
                const active = i === step;
                const Icon = s.icon;
                return (
                  <div key={s.key} className="flex items-center gap-2">
                    <button
                      onClick={() => setStep(i)}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs border transition ${
                        active ? "border-primary/40 bg-primary/15 text-foreground" :
                        done ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" :
                        "border-border bg-card/60 text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                      {s.label}
                    </button>
                    {i < steps.length - 1 && <span className="h-px w-6 bg-border" />}
                  </div>
                );
              })}
            </div>

            <div className="p-5 space-y-4">
              {step === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {segments.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => setSeg(s)}
                      className={`text-left rounded-lg border p-4 transition ${
                        seg.name === s.name ? "border-primary/40 bg-primary/10" : "border-border bg-card/40 hover:bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{s.name}</span>
                        <span className="text-[11px] text-muted-foreground">{s.count.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                    </button>
                  ))}
                </div>
              )}
              {step === 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {(["whatsapp", "instagram"] as const).map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setChannel(ch)}
                      className={`rounded-lg border p-5 text-left transition ${
                        channel === ch ? "border-primary/40 bg-primary/10" : "border-border bg-card/40 hover:bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${ch === "whatsapp" ? "bg-emerald-500" : "bg-pink-500"}`} />
                        <span className="text-sm font-medium capitalize">{ch}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {ch === "whatsapp"
                          ? "Business-approved templates · highest delivery"
                          : "DMs to opted-in followers · rich media"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {step === 2 && (
                <div className="space-y-2">
                  {templates.filter((t) => t.channel === channel && t.status === "Approved").map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTplId(t.id)}
                      className={`w-full text-left rounded-lg border p-4 transition ${
                        tplId === t.id ? "border-primary/40 bg-primary/10" : "border-border bg-card/40 hover:bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t.name}</span>
                        <span className="text-[10px] text-muted-foreground">{t.category}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.body}</p>
                    </button>
                  ))}
                </div>
              )}
              {step >= 3 && (
                <div className="rounded-lg border border-border bg-card/40 p-5">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Final preview</div>
                  <div className="max-w-sm rounded-2xl border border-border bg-background/60 p-4 text-sm">
                    {tpl.body}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <button onClick={() => setStep((s) => Math.max(0, s - 1))} className="text-xs text-muted-foreground hover:text-foreground">← Back</button>
                {step < steps.length - 1 ? (
                  <button onClick={() => setStep((s) => s + 1)} className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">Continue</button>
                ) : (
                  <button className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2">
                    <Send className="h-3.5 w-3.5" /> Send broadcast
                  </button>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Campaign summary">
            <dl className="divide-y divide-border text-xs">
              <Row label="Audience" value={`${seg.name} · ${seg.count.toLocaleString()}`} />
              <Row label="Channel" value={<ChannelDot channel={channel} />} />
              <Row label="Template" value={tpl.name} />
              <Row label="Est. delivery" value="98–99%" />
              <Row label="Est. cost" value="$214.60" />
              <Row label="Send window" value="Immediately" />
            </dl>
          </SectionCard>
        </div>

        <SectionCard title="Recent broadcasts" description="Last 30 days">
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
                {broadcasts.map((b) => (
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
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}