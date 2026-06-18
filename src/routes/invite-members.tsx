import { createFileRoute } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useState } from "react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { AI_AGENTS, type AIAgent } from "@/components/scl/agents";
import {
  Bot,
  Check,
  Copy as CopyIcon,
  Link as LinkIcon,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  User as UserIcon,
  UserPlus,
  X as XIcon,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/invite-members")({
  head: () => ({ meta: [{ title: "Invite Members — SCL" }] }),
  component: InviteMembersPage,
});

type HumanMember = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
  avatar: string;
  status: "Active" | "Invited";
};

const HUMANS: HumanMember[] = [
  { id: "me", name: "Aria Kapoor (You)", email: "aria@scl.app", role: "Owner", avatar: "AK", status: "Active" },
  { id: "petrus", name: "Petrus Sinaga", email: "petrus@scl.app", role: "Admin", avatar: "PS", status: "Active" },
  { id: "sarah", name: "Sarah Burhan", email: "sarah@scl.app", role: "Member", avatar: "SB", status: "Active" },
  { id: "michael", name: "Michael Septiadi", email: "michael@scl.app", role: "Member", avatar: "MS", status: "Active" },
  { id: "rina", name: "Rina Wijaya", email: "rina@scl.app", role: "Member", avatar: "RW", status: "Active" },
  { id: "alex", name: "Alex Chen", email: "alex@scl.app", role: "Member", avatar: "AC", status: "Active" },
  { id: "priya", name: "Priya Patel", email: "priya@scl.app", role: "Member", avatar: "PP", status: "Invited" },
];

type Row =
  | { kind: "human"; data: HumanMember }
  | { kind: "agent"; data: AIAgent };

function InviteMembersPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState<AIAgent[]>(AI_AGENTS);

  const rows: Row[] = [
    ...HUMANS.map((h) => ({ kind: "human" as const, data: h })),
    ...agents.map((a) => ({ kind: "agent" as const, data: a })),
  ].filter((r) => r.data.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell
      title="Invite Members"
      subtitle="Invite teammates and connect AI agents to your workspace"
      actions={
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Invite Member
        </button>
      }
    >
      <div className="max-w-6xl mx-auto space-y-5">
        <SectionCard
          title="Workspace Members"
          description="People and AI agents that can be assigned to conversations"
        >
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members…"
                className="h-9 w-full rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="ml-auto text-[11px] text-muted-foreground">
              {HUMANS.length} people · {agents.length} agents
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground/70 border-b border-border">
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Role / Description</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) =>
                  r.kind === "human" ? (
                    <tr key={r.data.id} className="border-b border-border/60 hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/40 to-card border border-border grid place-items-center text-[10px] font-medium">
                            {r.data.avatar}
                          </span>
                          <div>
                            <div className="text-foreground font-medium">{r.data.name}</div>
                            <div className="text-[10px] text-muted-foreground">{r.data.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 rounded border border-border bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          <UserIcon className="h-3 w-3" /> Human
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{r.data.role}</td>
                      <td className="px-3 py-3">
                        <StatusPill status={r.data.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button className="text-[11px] text-muted-foreground hover:text-foreground">Manage</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.data.id} className="border-b border-border/60 hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="h-7 w-7 rounded-full bg-primary/15 border border-primary/30 grid place-items-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-foreground font-medium">{r.data.name}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[420px]">
                              {r.data.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary uppercase tracking-wider">
                          <Bot className="h-3 w-3" /> AI Agent
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground truncate max-w-xs">
                        <span className="font-mono text-[10px]">{r.data.webhookUrl}</span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={r.data.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => {
                            setAgents((list) => list.filter((a) => a.id !== r.data.id));
                            toast.success(`${r.data.name} disconnected`);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" /> Disconnect
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {open && (
        <InviteModal
          onClose={() => setOpen(false)}
          onConnectAgent={(agent) => {
            setAgents((list) => [...list, agent]);
            toast.success(`${agent.name} connected`);
          }}
        />
      )}
    </AppShell>
  );
}

function StatusPill({ status }: { status: "Active" | "Invited" | "Connected" | "Disconnected" }) {
  const tone =
    status === "Active" || status === "Connected"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : status === "Invited"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-border bg-white/[0.04] text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}

type Tab = "email" | "link" | "agent";

function InviteModal({
  onClose,
  onConnectAgent,
}: {
  onClose: () => void;
  onConnectAgent: (agent: AIAgent) => void;
}) {
  const [tab, setTab] = useState<Tab>("email");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-border bg-popover shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold">Invite to workspace</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Invite humans or connect an AI agent</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded hover:bg-white/[0.06]">
            <XIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 pt-3 border-b border-border">
          <div className="flex gap-1">
            <TabBtn active={tab === "email"} onClick={() => setTab("email")} icon={<Mail className="h-3.5 w-3.5" />}>
              Invite by Email
            </TabBtn>
            <TabBtn active={tab === "link"} onClick={() => setTab("link")} icon={<LinkIcon className="h-3.5 w-3.5" />}>
              Invite with Link
            </TabBtn>
            <TabBtn active={tab === "agent"} onClick={() => setTab("agent")} icon={<Bot className="h-3.5 w-3.5" />}>
              Connect Agent
            </TabBtn>
          </div>
        </div>

        <div className="p-5">
          {tab === "email" && <EmailTab onClose={onClose} />}
          {tab === "link" && <LinkTab />}
          {tab === "agent" && <AgentTab onClose={onClose} onConnect={onConnectAgent} />}
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 -mb-px transition-colors ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[11px] font-medium text-foreground mb-1">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </div>
      {children}
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </label>
  );
}

const inputCls =
  "h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-xs placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/40";

function EmailTab({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Member");
  return (
    <div className="space-y-3">
      <Field label="Email address" required>
        <input
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          className={inputCls}
        />
      </Field>
      <Field label="Role">
        <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
          <option>Member</option>
          <option>Admin</option>
          <option>Owner</option>
        </select>
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="h-9 px-3 rounded-md border border-border text-xs hover:bg-white/[0.05]">
          Cancel
        </button>
        <button
          onClick={() => {
            if (!email) return toast.error("Email is required");
            toast.success(`Invitation sent to ${email}`);
            onClose();
          }}
          className="h-9 px-3 rounded-md bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5"
        >
          <UserPlus className="h-3.5 w-3.5" /> Send Invitation
        </button>
      </div>
    </div>
  );
}

function LinkTab() {
  const [link] = useState("https://scl.app/join/wks_8c2a-aria?invite=k29df1");
  return (
    <div className="space-y-3">
      <Field label="Shareable invite link" hint="Anyone with this link can join as a Member. Link expires in 7 days.">
        <div className="flex gap-2">
          <input readOnly value={link} className={`${inputCls} font-mono`} />
          <button
            onClick={() => {
              navigator.clipboard.writeText(link);
              toast.success("Link copied to clipboard");
            }}
            className="h-9 px-3 rounded-md border border-border text-xs hover:bg-white/[0.05] inline-flex items-center gap-1.5"
          >
            <CopyIcon className="h-3.5 w-3.5" /> Copy
          </button>
        </div>
      </Field>
      <button className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground">
        <RefreshCw className="h-3 w-3" /> Regenerate link
      </button>
    </div>
  );
}

function AgentTab({
  onClose,
  onConnect,
}: {
  onClose: () => void;
  onConnect: (agent: AIAgent) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [webhook, setWebhook] = useState("");
  const [authType, setAuthType] = useState<"None" | "API Key" | "Bearer Token">("None");
  const [credential, setCredential] = useState("");
  const [testing, setTesting] = useState(false);

  const handleTest = () => {
    if (!webhook) return toast.error("Webhook URL is required");
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      toast.success("Connection successful · 200 OK · 142ms");
    }, 900);
  };

  const handleConnect = () => {
    if (!name) return toast.error("Agent name is required");
    if (!webhook) return toast.error("Webhook URL is required");
    onConnect({
      id: `agent-${Date.now()}`,
      name,
      description: description || "Custom AI agent",
      status: "Connected",
      webhookUrl: webhook,
      authType,
    });
    onClose();
  };

  return (
    <div className="space-y-3">
      <Field label="Agent Name" required>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Returns AI" className={inputCls} />
      </Field>
      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What does this agent handle?"
          className={`${inputCls} h-auto py-2 resize-none`}
        />
      </Field>
      <Field label="Webhook URL" required>
        <input
          value={webhook}
          onChange={(e) => setWebhook(e.target.value)}
          placeholder="https://api.example.com/agent/webhook"
          className={`${inputCls} font-mono`}
        />
      </Field>
      <Field label="Authentication Type">
        <select value={authType} onChange={(e) => setAuthType(e.target.value as typeof authType)} className={inputCls}>
          <option>None</option>
          <option>API Key</option>
          <option>Bearer Token</option>
        </select>
      </Field>
      {authType !== "None" && (
        <Field label={authType} required>
          <input
            type="password"
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            placeholder={authType === "API Key" ? "sk_live_…" : "eyJhbGciOiJIUzI1NiI…"}
            className={`${inputCls} font-mono`}
          />
        </Field>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={handleTest}
          disabled={testing}
          className="h-9 px-3 rounded-md border border-border text-xs hover:bg-white/[0.05] inline-flex items-center gap-1.5 disabled:opacity-60"
        >
          {testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          Test Connection
        </button>
        <button
          onClick={handleConnect}
          className="h-9 px-3 rounded-md bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5"
        >
          <Bot className="h-3.5 w-3.5" /> Connect Agent
        </button>
      </div>
    </div>
  );
}