import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { ChannelIcon } from "@/components/scl/channel-badge";
import {
  BadgeCheck,
  Copy,
  Database,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Music2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/channels")({
  component: ChannelsPage,
});

type ChannelKey = "whatsapp" | "instagram" | "tiktok";

const CHANNELS: {
  key: ChannelKey;
  label: string;
  sublabel: string;
  enabled: boolean;
}[] = [
  { key: "whatsapp", label: "WhatsApp Business API", sublabel: "Cloud API", enabled: true },
  { key: "instagram", label: "Instagram", sublabel: "Direct Messaging", enabled: false },
  { key: "tiktok", label: "TikTok Business Messaging", sublabel: "Coming soon", enabled: false },
];

function ChannelsPage() {
  const [selected, setSelected] = useState<ChannelKey>("whatsapp");

  return (
    <AppShell title="Channels" subtitle="Manage messaging channel connections" noPadding>
      <div className="flex h-full min-h-0">
        {/* Left selector */}
        <aside className="w-72 shrink-0 border-r border-border bg-card/30 overflow-y-auto">
          <div className="px-4 py-4 border-b border-border">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Channels
            </h2>
          </div>
          <nav className="p-2 space-y-1">
            {CHANNELS.map((c) => {
              const active = selected === c.key;
              const disabled = !c.enabled;
              return (
                <button
                  key={c.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && setSelected(c.key)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "bg-primary/15 border border-primary/30"
                      : disabled
                        ? "opacity-50 cursor-not-allowed border border-transparent"
                        : "border border-transparent hover:bg-white/[0.04]"
                  }`}
                >
                  {c.key === "tiktok" ? (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                      <Music2 className="h-4 w-4 text-muted-foreground" />
                    </span>
                  ) : (
                    <ChannelIcon channel={c.key} className="h-8 w-8" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{c.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{c.sublabel}</div>
                  </div>
                  {disabled && (
                    <span className="text-[9px] uppercase tracking-wide text-muted-foreground border border-border rounded px-1.5 py-0.5">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Detail */}
        <div className="flex-1 min-w-0 overflow-y-auto p-6">
          {selected === "whatsapp" && <WhatsAppDetail />}
        </div>
      </div>
    </AppShell>
  );
}

function WhatsAppDetail() {
  const [tab, setTab] = useState<"accounts" | "billing" | "optin">("accounts");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero card */}
      <div className="rounded-xl border border-border bg-card/60 glass p-6 flex items-start gap-5">
        <ChannelIcon channel="whatsapp" className="h-14 w-14" />
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold">WhatsApp Business API</h2>
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-300">
            <BadgeCheck className="h-3 w-3" />
            Meta Business Partner
          </div>
          <p className="mt-3 text-xs text-muted-foreground max-w-md">
            Connect WhatsApp Business numbers directly through Meta Cloud API. Manage messaging
            limits, billing, and opt-in templates from one place.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Connection fee
          </div>
          <div className="text-base font-semibold">Rp235,000</div>
          <div className="text-[10px] text-muted-foreground">per number / month</div>
          <button className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Connect
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex items-center gap-1">
        {([
          ["accounts", "Accounts"],
          ["billing", "Billing"],
          ["optin", "Message Opt-in"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
              tab === k
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "accounts" && <AccountsTab />}
      {tab === "billing" && <BillingTab />}
      {tab === "optin" && <OptInTab />}
    </div>
  );
}

function AccountsTab() {
  return (
    <div className="space-y-5">
      {/* Meta Business Account card */}
      <SectionCard>
        <div className="p-5 flex items-start justify-between gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Meta Business Account
            </div>
            <div className="mt-1 text-sm font-semibold">Camlets Support</div>
            <div className="mt-3 flex items-center gap-3 text-[11px]">
              <button className="text-primary hover:underline">Get verified</button>
              <span className="text-border">•</span>
              <button className="text-primary hover:underline">Request MM API</button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Messaging Limit
            </div>
            <div className="mt-1 text-sm font-semibold">10,000 / 24 hours</div>
            <p className="mt-2 text-[10px] text-muted-foreground max-w-[220px]">
              Maximum unique customers your business can message in a rolling 24-hour window.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Connected numbers */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Connected WhatsApp Numbers
        </h3>
        <div className="space-y-3">
          <ConnectedNumberCard
            businessAccount="Camlets Support – Staging"
            phone="+62 811 6610 203"
            displayName="Camlets Support – Staging"
            accountId="waba_010203_staging"
          />
          <ConnectedNumberCard
            businessAccount="Camlets Support – Showcase"
            phone="+62 811 1303 2507"
            displayName="Camlets Support – Showcase"
            accountId="waba_130325_showcase"
          />
        </div>
      </div>
    </div>
  );
}

function ConnectedNumberCard({
  businessAccount,
  phone,
  displayName,
  accountId,
}: {
  businessAccount: string;
  phone: string;
  displayName: string;
  accountId: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card/60 glass">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        <ChannelIcon channel="whatsapp" className="h-9 w-9" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{businessAccount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{phone}</div>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1 mr-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Connected
          </span>
          <span className="text-[10px] text-muted-foreground">Quality: High</span>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="border-t border-border px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Display Name
            </div>
            <div className="mt-1 font-medium">{displayName}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Account ID
            </div>
            <div className="mt-1 flex items-center gap-2">
              <code className="font-mono text-[11px] text-foreground/80">{accountId}</code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(accountId);
                  toast.success("Account ID copied");
                }}
                className="grid h-6 w-6 place-items-center rounded hover:bg-white/[0.06] text-muted-foreground"
                aria-label="Copy account ID"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="md:col-span-2 flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => toast.success("Dataset created")}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium"
            >
              <Database className="h-3.5 w-3.5" />
              Create dataset
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(accountId);
                toast.success("Account ID copied");
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy account ID
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BillingTab() {
  const [filter, setFilter] = useState<"all" | "mba" | "waba">("all");
  const cards = [
    { name: "Camlets Support", balance: "US$13.61", source: "mba" as const },
    { name: "Influence ID", balance: "US$20.81", source: "waba" as const },
  ];
  const filtered = cards.filter((c) => filter === "all" || c.source === filter);

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center rounded-md border border-border bg-card/50 p-0.5 text-[11px]">
        {([
          ["all", "All"],
          ["mba", "Pay with MBA Credits"],
          ["waba", "Pay with WABA Credits"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded font-medium transition-colors ${
              filter === k
                ? "bg-primary/20 text-foreground border border-primary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((c) => (
          <BillingCard key={c.name} name={c.name} balance={c.balance} />
        ))}
      </div>
    </div>
  );
}

function BillingCard({ name, balance }: { name: string; balance: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card/60 glass">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
          {name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{name}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Balance: {balance}</div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-border bg-white/[0.04] px-2 py-0.5 text-[10px] text-muted-foreground">
          Auto top-up disabled
        </span>
        <button
          type="button"
          onClick={() => toast.success("Top up flow opened")}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          Top up
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="grid h-8 w-8 place-items-center rounded-md border border-border bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground"
              aria-label="More"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem>Enable auto top-up</DropdownMenuItem>
            <DropdownMenuItem>Billing history</DropdownMenuItem>
            <DropdownMenuItem>Payment methods</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="grid h-8 w-8 place-items-center rounded-md hover:bg-white/[0.06] text-muted-foreground"
          aria-label="Expand"
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border px-5 py-4 text-[11px] text-muted-foreground">
          Detailed billing breakdown for {name} will appear here.
        </div>
      )}
    </div>
  );
}

function OptInTab() {
  const rows = [
    { name: "Camlets Support", enabled: true },
    { name: "Camlets Support KC", enabled: false },
    { name: "Camlets Support Public", enabled: true },
    { name: "Camlets Support Showcase", enabled: false },
  ];
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card/40 p-5">
        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
          <span className="text-foreground font-medium">Message Opt-In</span> allows businesses to
          re-engage customers outside the 24-hour messaging window using approved WhatsApp
          templates. Configure which accounts and templates are used for opt-in messaging.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <label className="text-[11px] text-muted-foreground">Meta Business Account</label>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 hover:bg-card px-3 py-1.5 text-xs"
          >
            Camlets Support
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-white/[0.03] border-b border-border">
            <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="text-left font-medium px-4 py-3">WhatsApp Business Account</th>
              <th className="text-left font-medium px-4 py-3">Message Opt-In Status</th>
              <th className="text-left font-medium px-4 py-3">Template</th>
              <th className="text-left font-medium px-4 py-3">Language</th>
              <th className="text-left font-medium px-4 py-3">Channels</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <OptInRow key={r.name} name={r.name} initialEnabled={r.enabled} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OptInRow({ name, initialEnabled }: { name: string; initialEnabled: boolean }) {
  const [on, setOn] = useState(initialEnabled);
  return (
    <tr className="border-b border-border last:border-0 hover:bg-white/[0.02]">
      <td className="px-4 py-3 font-medium">{name}</td>
      <td className="px-4 py-3">
        <Switch checked={on} onCheckedChange={setOn} />
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-primary hover:underline"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </td>
      <td className="px-4 py-3 text-muted-foreground">-</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
          <ChannelIcon channel="whatsapp" className="h-3 w-3" />
          WhatsApp
        </span>
      </td>
    </tr>
  );
}