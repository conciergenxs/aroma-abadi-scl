import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — SCL" }] }),
  component: SettingsPage,
});

const tabs = ["Workspace", "Channels", "Team", "Billing", "API", "Compliance"] as const;

function SettingsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Workspace");
  return (
    <AppShell title="Settings" subtitle="Configure your workspace, channels and team">
      <div className="grid grid-cols-[200px_1fr] gap-6">
        <aside className="space-y-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                tab === t ? "bg-primary/15 text-foreground border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              {t}
            </button>
          ))}
        </aside>

        <div className="space-y-6">
          <SectionCard title={tab} description="Manage your workspace configuration">
            <div className="p-5 space-y-5">
              <Field label="Workspace name" value="Acme Brands" />
              <Field label="Display URL" value="acme.scl.app" />
              <Field label="Default reply window" value="24 hours" />
              <Field label="Business hours" value="Mon–Fri · 09:00–18:00 (UTC+1)" />
            </div>
          </SectionCard>

          <SectionCard title="Connected channels">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5">
              <ChannelRow name="WhatsApp Business" status="Connected" account="+1 415 220 0001 · Tier 4" tone="emerald" />
              <ChannelRow name="Instagram" status="Connected" account="@acme.official · 482k followers" tone="pink" />
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[200px_1fr] items-center gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input defaultValue={value} className="h-9 w-full max-w-md rounded-md border border-border bg-background/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
    </div>
  );
}

function ChannelRow({ name, status, account, tone }: { name: string; status: string; account: string; tone: "emerald" | "pink" }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4 flex items-center gap-3">
      <span className={`h-9 w-9 rounded-md grid place-items-center text-xs font-semibold ${tone === "emerald" ? "bg-emerald-500/15 text-emerald-300" : "bg-pink-500/15 text-pink-300"}`}>
        {name.slice(0, 2)}
      </span>
      <div className="flex-1 leading-tight">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-[11px] text-muted-foreground">{account}</div>
      </div>
      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {status}
      </span>
    </div>
  );
}