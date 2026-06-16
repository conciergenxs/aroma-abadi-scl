import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Megaphone,
  FileText,
  Settings,
  Search,
  Bell,
  MessageSquareText,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  to: "/" | "/inbox" | "/contacts" | "/broadcast" | "/templates" | "/settings";
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
      <aside className="hidden md:flex h-full w-16 shrink-0 flex-col items-center border-r border-border bg-sidebar">
        <div className="flex items-center justify-center h-16 w-full border-b border-sidebar-border">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_0_24px_-6px_var(--primary)]"
            title="SCL — Strategic Conversation Lab"
          >
            <MessageSquareText className="h-4 w-4" />
          </div>
        </div>

        <nav className="flex-1 w-full py-4 flex flex-col items-center gap-1.5">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <SidebarIconLink
                key={item.to}
                to={item.to}
                label={item.label}
                active={active}
                badge={item.badge}
                Icon={Icon}
              />
            );
          })}
        </nav>
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-md border border-border bg-card/60 hover:bg-card transition-colors">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-orange-700 flex items-center justify-center text-[10px] font-semibold text-primary-foreground">
                    AK
                  </div>
                  <span className="text-xs font-medium text-foreground hidden lg:block">Aria Kapoor</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground hidden lg:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className={noPadding ? "flex-1 min-h-0 overflow-y-auto" : "flex-1 p-6 overflow-y-auto"}>{children}</main>
      </div>
    </div>
  );
}

function SidebarIconLink({
  to,
  label,
  active,
  badge,
  Icon,
}: {
  to: NavItem["to"];
  label: string;
  active: boolean;
  badge?: number;
  Icon: typeof LayoutDashboard;
}) {
  return (
    <div className="group/nav relative">
      <Link
        to={to}
        aria-label={label}
        className={`relative grid h-10 w-10 place-items-center rounded-lg transition-colors ${
          active
            ? "bg-primary/15 text-foreground border border-primary/30"
            : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-transparent"
        }`}
      >
        <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
        {badge ? (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-[9px] font-semibold text-primary-foreground grid place-items-center">
            {badge}
          </span>
        ) : null}
        {active && (
          <span className="absolute left-0 -ml-2 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary" />
        )}
      </Link>
      <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[11px] font-medium text-foreground shadow-lg opacity-0 translate-x-[-4px] transition-all group-hover/nav:opacity-100 group-hover/nav:translate-x-0 z-50">
        {label}
      </span>
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

import type { LabelColor, ContactLabel } from "./mock-data";
import { X } from "lucide-react";

export const labelColorClass: Record<LabelColor, string> = {
  indigo: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
  pink: "bg-pink-500/10 text-pink-300 border-pink-500/30",
  emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  sky: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  violet: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  slate: "bg-slate-500/10 text-slate-300 border-slate-500/30",
};

export const labelColorDot: Record<LabelColor, string> = {
  indigo: "bg-indigo-400",
  pink: "bg-pink-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  slate: "bg-slate-400",
};

export function LabelChip({ label, onRemove }: { label: ContactLabel; onRemove?: () => void }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${labelColorClass[label.color]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${labelColorDot[label.color]}`} />
      {label.name}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 -mr-1 grid h-3.5 w-3.5 place-items-center rounded hover:bg-white/10">
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}

export function ListChip({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-foreground/80">
      <span className="h-1.5 w-1.5 rounded-sm bg-primary/70" />
      {name}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 -mr-1 grid h-3.5 w-3.5 place-items-center rounded hover:bg-white/10">
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}