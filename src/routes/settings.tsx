import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { useState } from "react";
import { Check, CreditCard, Sparkles, Zap, Building2, Rocket, X, ArrowUpRight, Download } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — SCL" }] }),
  component: SettingsPage,
});

const tabs = ["Workspace", "Channels", "Team", "Billing & Plans", "API", "Compliance"] as const;
type Tab = (typeof tabs)[number];

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("Workspace");
  return (
    <AppShell title="Settings" subtitle="Configure your workspace, channels, team and billing">
      <div className="grid grid-cols-[220px_1fr] gap-6">
        <aside className="space-y-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                tab === t
                  ? "bg-primary/15 text-foreground border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              {t}
            </button>
          ))}
        </aside>

        <div className="space-y-6">
          {tab === "Billing & Plans" ? (
            <BillingPanel />
          ) : tab === "Channels" ? (
            <SectionCard title="Connected channels">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5">
                <ChannelRow name="WhatsApp Business" status="Connected" account="+1 415 220 0001 · Tier 4" tone="emerald" />
                <ChannelRow name="Instagram" status="Connected" account="@acme.official · 482k followers" tone="pink" />
              </div>
            </SectionCard>
          ) : (
            <SectionCard title={tab} description="Manage your workspace configuration">
              <div className="p-5 space-y-5">
                <Field label="Workspace name" value="Acme Brands" />
                <Field label="Display URL" value="acme.scl.app" />
                <Field label="Default reply window" value="24 hours" />
                <Field label="Business hours" value="Mon–Fri · 09:00–18:00 (UTC+1)" />
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ---------- Billing ----------

type PlanKey = "Free" | "Starter" | "Growth" | "Enterprise";

type Plan = {
  key: PlanKey;
  price: string;
  cadence: string;
  tagline: string;
  icon: typeof Sparkles;
  accent: string;
  highlight?: boolean;
  limits: { contacts: string; broadcasts: string; channels: string; team: string };
  features: string[];
};

const PLANS: Plan[] = [
  {
    key: "Free",
    price: "$0",
    cadence: "forever",
    tagline: "For trying SCL with a single workspace.",
    icon: Sparkles,
    accent: "from-slate-500/20 to-slate-500/0 text-slate-200 border-slate-500/30",
    limits: { contacts: "500", broadcasts: "1,000 / mo", channels: "1", team: "2 seats" },
    features: ["Shared inbox", "Basic templates", "Community support"],
  },
  {
    key: "Starter",
    price: "$49",
    cadence: "per month",
    tagline: "For small teams shipping first campaigns.",
    icon: Zap,
    accent: "from-sky-500/20 to-sky-500/0 text-sky-200 border-sky-500/30",
    limits: { contacts: "5,000", broadcasts: "25,000 / mo", channels: "2", team: "5 seats" },
    features: ["WhatsApp & Instagram", "Template library", "Tagging & segments", "Email support"],
  },
  {
    key: "Growth",
    price: "$199",
    cadence: "per month",
    tagline: "Scale conversations across markets.",
    icon: Rocket,
    accent: "from-primary/30 to-primary/0 text-primary border-primary/40",
    highlight: true,
    limits: { contacts: "50,000", broadcasts: "250,000 / mo", channels: "5", team: "20 seats" },
    features: [
      "Everything in Starter",
      "Advanced segments & audiences",
      "Approvals & roles",
      "Webhooks & API access",
      "Priority support",
    ],
  },
  {
    key: "Enterprise",
    price: "Custom",
    cadence: "annual contract",
    tagline: "For global brands with compliance needs.",
    icon: Building2,
    accent: "from-violet-500/25 to-violet-500/0 text-violet-200 border-violet-500/40",
    limits: { contacts: "Unlimited", broadcasts: "Custom", channels: "Unlimited", team: "Unlimited" },
    features: [
      "Everything in Growth",
      "SSO / SAML & SCIM",
      "Audit log & data residency",
      "Dedicated CSM",
      "99.99% uptime SLA",
    ],
  },
];

function BillingPanel() {
  const [open, setOpen] = useState(false);
  const current: PlanKey = "Growth";
  const plan = PLANS.find((p) => p.key === current)!;

  return (
    <>
      <SectionCard
        title="Current plan"
        description="Your SCL workspace subscription and billing details"
        action={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/25"
          >
            Manage plan <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-gradient-to-br ${plan.accent}`}>
                <plan.icon className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-base font-semibold">{plan.key}</div>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">Active</span>
                </div>
                <div className="text-xs text-muted-foreground">{plan.tagline}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Meta label="Price" value={`${plan.price}`} sub={plan.cadence} />
              <Meta label="Billing cycle" value="Monthly" sub="Auto-renew" />
              <Meta label="Renews on" value="Jul 14, 2026" sub="in 28 days" />
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-4 flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-white/5 border border-border">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="flex-1 leading-tight">
                <div className="text-sm font-medium">Visa ending in 4242</div>
                <div className="text-[11px] text-muted-foreground">Expires 09/2028 · billed to billing@acmebrands.com</div>
              </div>
              <button className="text-xs text-muted-foreground hover:text-foreground">Update</button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Plan usage</div>
            <UsageBar label="Contacts" used={32480} limit={50000} suffix="contacts" />
            <UsageBar label="Broadcast messages" used={148220} limit={250000} suffix="this cycle" />
            <UsageBar label="Connected channels" used={3} limit={5} suffix="channels" />
            <UsageBar label="Team members" used={14} limit={20} suffix="seats" />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Invoices"
        description="Download past invoices and receipts"
      >
        <div className="divide-y divide-border">
          {[
            { id: "INV-2026-0612", date: "Jun 14, 2026", amount: "$199.00", status: "Paid" },
            { id: "INV-2026-0511", date: "May 14, 2026", amount: "$199.00", status: "Paid" },
            { id: "INV-2026-0410", date: "Apr 14, 2026", amount: "$199.00", status: "Paid" },
          ].map((i) => (
            <div key={i.id} className="flex items-center gap-4 px-5 py-3 text-sm">
              <div className="font-mono text-xs text-muted-foreground w-36">{i.id}</div>
              <div className="text-xs text-muted-foreground w-32">{i.date}</div>
              <div className="flex-1 text-sm">{i.amount}</div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">{i.status}</span>
              <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Download className="h-3.5 w-3.5" /> PDF
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      {open && <PlanCompareModal current={current} onClose={() => setOpen(false)} />}
    </>
  );
}

function Meta({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function UsageBar({ label, used, limit, suffix }: { label: string; used: number; limit: number; suffix: string }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const tone = pct > 85 ? "bg-rose-400" : pct > 65 ? "bg-amber-400" : "bg-primary";
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {used.toLocaleString()} <span className="text-muted-foreground">/ {limit.toLocaleString()} {suffix}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PlanCompareModal({ current, onClose }: { current: PlanKey; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/70 backdrop-blur-sm p-6">
      <div className="w-full max-w-6xl rounded-2xl border border-border bg-card/95 glass shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-base font-semibold">Compare plans</h3>
            <p className="text-xs text-muted-foreground">Upgrade, downgrade or switch your SCL workspace plan</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-md border border-border hover:bg-white/[0.03]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-6">
          {PLANS.map((p) => {
            const isCurrent = p.key === current;
            const idxCurrent = PLANS.findIndex((x) => x.key === current);
            const idxThis = PLANS.findIndex((x) => x.key === p.key);
            const action = isCurrent ? "Current plan" : idxThis > idxCurrent ? "Upgrade" : "Downgrade";
            return (
              <div
                key={p.key}
                className={`relative rounded-xl border p-5 flex flex-col gap-4 ${
                  p.highlight ? "border-primary/40 bg-gradient-to-b from-primary/[0.08] to-transparent" : "border-border bg-background/40"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-2 right-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Most popular
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md border bg-gradient-to-br ${p.accent}`}>
                    <p.icon className="h-4 w-4" />
                  </span>
                  <div className="text-sm font-semibold">{p.key}</div>
                  {isCurrent && (
                    <span className="ml-auto rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">Current</span>
                  )}
                </div>
                <div>
                  <div className="text-2xl font-semibold">{p.price}</div>
                  <div className="text-[11px] text-muted-foreground">{p.cadence}</div>
                </div>
                <p className="text-xs text-muted-foreground">{p.tagline}</p>

                <div className="rounded-lg border border-border bg-background/40 p-3 space-y-1.5 text-xs">
                  <LimitRow label="Contacts" value={p.limits.contacts} />
                  <LimitRow label="Broadcasts" value={p.limits.broadcasts} />
                  <LimitRow label="Channels" value={p.limits.channels} />
                  <LimitRow label="Team" value={p.limits.team} />
                </div>

                <ul className="space-y-1.5 text-xs">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent}
                  className={`mt-auto h-9 rounded-md text-xs font-medium transition ${
                    isCurrent
                      ? "border border-border text-muted-foreground cursor-default"
                      : p.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border hover:bg-white/[0.04]"
                  }`}
                >
                  {action}
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-border text-[11px] text-muted-foreground">
          Plan changes take effect immediately. Downgrades are prorated against your current billing cycle.
        </div>
      </div>
    </div>
  );
}

function LimitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
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