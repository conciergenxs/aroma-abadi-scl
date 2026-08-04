import type React from "react";
import { useEffect, useState } from "react";
import { AI_AGENTS, type AIAgent } from "@/components/scl/agents";
import whatsappAsset from "@/assets/whatsapp.png";
import {
  Bot,
  Phone,
  RefreshCw,
  UserPlus,
  X as XIcon,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// Module-level workspace agents store. Seeded with example agents so
// they remain available in assignment / collaboration dropdowns even
// without a dedicated management page.
let workspaceAgents: AIAgent[] = [...AI_AGENTS];
const listeners = new Set<(agents: AIAgent[]) => void>();

export function getWorkspaceAgents() {
  return workspaceAgents;
}

export function addWorkspaceAgent(agent: AIAgent) {
  workspaceAgents = [...workspaceAgents, agent];
  listeners.forEach((l) => l(workspaceAgents));
}

export function useWorkspaceAgents() {
  const [agents, setAgents] = useState<AIAgent[]>(workspaceAgents);
  useEffect(() => {
    listeners.add(setAgents);
    return () => {
      listeners.delete(setAgents);
    };
  }, []);
  return agents;
}

type Tab = "whatsapp" | "agent";

export function InviteModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("whatsapp");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 modal-backdrop" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-border bg-popover shadow-2xl modal-content"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold">Invite to workspace</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Invite humans or connect an AI agent</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded hover:bg-gray-100 transition-colors duration-150">
            <XIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 pt-3 border-b border-border">
          <div className="flex gap-1">
            <TabBtn active={tab === "whatsapp"} onClick={() => setTab("whatsapp")} icon={<img src={whatsappAsset} alt="" className="h-3.5 w-3.5" />}>
              Invite by WhatsApp
            </TabBtn>
            <TabBtn active={tab === "agent"} onClick={() => setTab("agent")} icon={<Bot className="h-3.5 w-3.5" />}>
              Connect Agent
            </TabBtn>
          </div>
        </div>

        <div className="p-5">
          {tab === "whatsapp" && <WhatsAppTab onClose={onClose} />}
          {tab === "agent" && (
            <AgentTab
              onClose={onClose}
              onConnect={(agent) => {
                addWorkspaceAgent(agent);
                toast.success(`${agent.name} connected`);
              }}
            />
          )}
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

function WhatsAppTab({ onClose }: { onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Member");
  return (
    <div className="space-y-3">
      <Field label="WhatsApp number" required>
        <div className="relative">
          <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            autoFocus
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+62 812 3456 7890"
            className={`${inputCls} pl-8`}
          />
        </div>
      </Field>
      <Field label="Role">
        <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
          <option>Member</option>
          <option>Admin</option>
          <option>Owner</option>
        </select>
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="h-9 px-3 rounded-md border border-border text-xs hover:bg-gray-50 transition-colors duration-150">
          Cancel
        </button>
        <button
          onClick={() => {
            if (!phone.trim()) return toast.error("WhatsApp number is required");
            toast.success(`Invitation sent to ${phone} via WhatsApp`);
            onClose();
          }}
          className="h-9 px-3 rounded-md bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 transition-colors duration-150"
        >
          <UserPlus className="h-3.5 w-3.5" /> Send Invitation
        </button>
      </div>
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
          className="h-9 px-3 rounded-md border border-border text-xs hover:bg-gray-50 inline-flex items-center gap-1.5 disabled:opacity-60 transition-colors duration-150"
        >
          {testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          Test Connection
        </button>
        <button
          onClick={handleConnect}
          className="h-9 px-3 rounded-md bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 transition-colors duration-150"
        >
          <Bot className="h-3.5 w-3.5" /> Connect Agent
        </button>
      </div>
    </div>
  );
}