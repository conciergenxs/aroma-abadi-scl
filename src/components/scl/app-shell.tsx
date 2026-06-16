import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Megaphone,
  FileText,
  BellRing,
  Settings,
  Search,
  Bell,
  MessageSquareText,
} from "lucide-react";

type NavItem = {
  to: "/" | "/inbox" | "/contacts" | "/broadcast" | "/templates" | "/subscriptions" | "/settings";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: number;
};
const nav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/inbox", label: "Inbox", icon: Inbox, badge: 12 },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/broadcast", label: "Broadcast", icon: Megaphone },
  { to: "/templates", label: "Templates", icon: FileText },
  { to: "/subscriptions", label: "Subscriptions", icon: BellRing },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  title,
  subtitle,
  actions,
  noPadding,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  noPadding?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex h-full w-60 shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_0_24px_-6px_var(--primary)]">
            <MessageSquareText className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">SCL</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Conversation Lab
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-5 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Workspace
          </div>
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/15 text-foreground border border-primary/30 shadow-[inset_0_0_0_1px_oklch(1_0_0_/_4%)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-lg border border-sidebar-border bg-card/60 p-3 glass">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-orange-700 flex items-center justify-center text-xs font-semibold text-primary-foreground">
              AK
            </div>
            <div className="flex-1 leading-tight">
              <div className="text-xs font-medium">Aria Kapoor</div>
              <div className="text-[10px] text-muted-foreground">Acme Brands · Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex h-full flex-col flex-1 min-w-0 overflow-hidden">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/70 backdrop-blur px-6">
          <div className="flex flex-col">
            {title ? (
              <h1 className="text-base font-semibold tracking-tight">{title}</h1>
            ) : null}
            {subtitle ? (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden sm:flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                placeholder="Search conversations, contacts…"
                className="h-9 w-72 rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <button className="relative h-9 w-9 grid place-items-center rounded-md border border-border bg-card/60 hover:bg-card">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            </button>
            {actions}
          </div>
        </header>

        <main className={noPadding ? "flex-1 min-h-0 overflow-y-auto" : "flex-1 p-6 overflow-y-auto"}>{children}</main>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  className = "",
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card/60 glass ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            {title && <h3 className="text-sm font-medium">{title}</h3>}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function ChannelDot({ channel }: { channel: "whatsapp" | "instagram" }) {
  const map = {
    whatsapp: { color: "bg-emerald-500", label: "WhatsApp" },
    instagram: { color: "bg-pink-500", label: "Instagram" },
  } as const;
  const c = map[channel];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${c.color}`} />
      {c.label}
    </span>
  );
}

export function Tag({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "vip" | "lead" | "enterprise" | "active" | "prospect" }) {
  const tones: Record<string, string> = {
    default: "bg-white/5 text-muted-foreground border-white/10",
    vip: "bg-primary/15 text-primary border-primary/30",
    lead: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    enterprise: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    active: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    prospect: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}