import sclIconAsset from "@/assets/aroma-abadi-icon-sand.png";
import sclLogoAsset from "@/assets/aroma-abadi-logo-sand.png";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Megaphone,
  FileText,
  Settings,
  Bell,
  User,
  LogOut,
  ChevronDown,
  ChevronLeft,
  UserPlus,
  Radio,
  Receipt,
  Package,
  BadgeCheck,
  ChevronsLeft,
  ChevronsRight,
  MessageCircle,
  ShoppingBag,
  Megaphone as MegaphoneIcon,
  CheckCheck,
  X as XIcon,
  Tag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteModal } from "@/components/scl/invite-modal";

// ── Mock Notifications ───────────────────────────────────────────────────────
type MockNotif = {
  id: string;
  title: string;
  body: string;
  time: string;
  icon: typeof Bell;
  iconBg: string;
  iconColor: string;
};
const MOCK_NOTIFS: MockNotif[] = [
  {
    id: "n1",
    title: "Pesan baru dari Dewi Lestari",
    body: "Halo Arma! Ada customer nanya soal promo 12.12, gimana cara jelasinnya?",
    time: "2 menit lalu",
    icon: MessageCircle,
    iconBg: "bg-sky-500/15",
    iconColor: "text-sky-400",
  },
  {
    id: "n2",
    title: "Transaksi baru — INV-2024-0089",
    body: "Putri Anggraini baru saja checkout Velvet Rouge Shade 03 · Rp 485.000",
    time: "15 menit lalu",
    icon: ShoppingBag,
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
  },
  {
    id: "n3",
    title: "Broadcast 'Promo Harbolnas' terkirim",
    body: "Berhasil dikirim ke 248 kontak. Delivery rate 96.4%.",
    time: "1 jam lalu",
    icon: MegaphoneIcon,
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    id: "n4",
    title: "Pesan baru dari Hesti Andriani",
    body: "Arma, shade berapa yang paling laris di Pakuwon bulan ini?",
    time: "2 jam lalu",
    icon: MessageCircle,
    iconBg: "bg-sky-500/15",
    iconColor: "text-sky-400",
  },
  {
    id: "n5",
    title: "Transaksi baru — INV-2024-0088",
    body: "Bayu Hartanto checkout Glow Serum (3 pcs) + Vitamin C Serum · Rp 1.240.000",
    time: "3 jam lalu",
    icon: ShoppingBag,
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
  },
  {
    id: "n6",
    title: "Template 'Cart Reminder' disetujui",
    body: "Template pesan WhatsApp kamu sudah disetujui dan siap digunakan.",
    time: "Kemarin",
    icon: CheckCheck,
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-400",
  },
];

type NavItem = {
  to:
    | "/"
    | "/inbox"
    | "/contacts"
    | "/broadcasts"
    | "/templates"
    | "/transactions"
    | "/sku"
    | "/ba"
    | "/promo-codes"
    | "/settings";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: number;
};
const topNav: NavItem[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/inbox", label: "Inbox", icon: Inbox, badge: 12 },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/broadcasts", label: "Broadcast", icon: Megaphone },
  { to: "/templates", label: "Templates", icon: FileText },
  { to: "/sku", label: "SKU & Knowledge", icon: Package },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/promo-codes", label: "Promo Codes", icon: Tag },
];
const bottomNav: NavItem[] = [
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  title,
  subtitle,
  actions,
  noPadding,
  backTo,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  noPadding?: boolean;
  backTo?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (notifRef.current?.contains(t) || notifBtnRef.current?.contains(t)) return;
      setNotifOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const markAllRead = () => setReadIds(new Set(MOCK_NOTIFS.map((n) => n.id)));
  const unreadCount = MOCK_NOTIFS.filter((n) => !readIds.has(n.id)).length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`hidden md:flex h-full shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ${
          expanded ? "w-56" : "w-[68px]"
        }`}
      >
        <div className={`flex flex-col w-full border-b border-sidebar-border py-[15px] gap-2 ${expanded ? "px-4" : "px-2 items-center"}`}>
          <div className={`flex w-full items-center ${expanded ? "justify-between" : "justify-center"}`}>
            {expanded && (
              <img
                src={sclIconAsset}
                alt="Aroma Abadi"
                className="h-[22px] w-auto object-contain"
                title="Aroma Abadi"
              />
            )}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
              className="grid h-7 w-7 place-items-center rounded-md text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-white/[0.08] transition-colors"
            >
              {expanded ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
            </button>
          </div>
        </div>


        <nav className={`flex-1 w-full py-5 flex flex-col gap-1.5 ${expanded ? "px-2" : "items-center"}`}>
          {topNav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <SidebarLink
                key={item.to}
                to={item.to}
                label={item.label}
                active={active}
                badge={item.badge}
                Icon={Icon}
                expanded={expanded}
              />
            );
          })}
        </nav>
        <nav className={`w-full pb-3 pt-2 flex flex-col gap-1.5 border-t border-sidebar-border ${expanded ? "px-2" : "items-center"}`}>
          <SidebarButton
            label="Invite Members"
            Icon={UserPlus}
            onClick={() => setInviteOpen(true)}
            expanded={expanded}
          />
          {bottomNav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <SidebarLink
                key={item.to}
                to={item.to}
                label={item.label}
                active={active}
                badge={item.badge}
                Icon={Icon}
                expanded={expanded}
              />
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex h-full flex-col flex-1 min-w-0 overflow-hidden">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/70 backdrop-blur px-6">
          <div className="flex items-center gap-2">
            {backTo && (
              <Link to={backTo as any} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            )}
            <div className="flex flex-col">
              {title ? (
                <h1 className="text-base font-semibold tracking-tight">{title}</h1>
              ) : null}
              {subtitle ? (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                ref={notifBtnRef}
                onClick={() => setNotifOpen((v) => !v)}
                className={`relative h-9 w-9 grid place-items-center rounded-md border border-border bg-card/60 hover:bg-card transition-colors ${notifOpen ? "border-primary/40 bg-primary/10" : ""}`}
                aria-label="Notifikasi"
              >
                <Bell className={`h-4 w-4 ${notifOpen ? "text-primary" : "text-muted-foreground"}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground grid place-items-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  ref={notifRef}
                  className="absolute right-0 top-full mt-2 w-[360px] rounded-xl border border-border bg-popover shadow-2xl z-50 overflow-hidden animate-fade-in"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-semibold">Notifikasi</span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <CheckCheck className="h-3 w-3" /> Tandai semua dibaca
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-white/[0.05]">
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* List */}
                  <div className="max-h-[420px] overflow-y-auto divide-y divide-border/60">
                    {MOCK_NOTIFS.map((n) => {
                      const isRead = readIds.has(n.id);
                      const Icon = n.icon;
                      return (
                        <button
                          key={n.id}
                          onClick={() => setReadIds((prev) => new Set([...prev, n.id]))}
                          className={`w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-white/[0.04] transition-colors ${!isRead ? "bg-primary/[0.04]" : ""}`}
                        >
                          <div className={`mt-0.5 h-8 w-8 shrink-0 rounded-full grid place-items-center ${n.iconBg}`}>
                            <Icon className={`h-3.5 w-3.5 ${n.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] leading-snug ${isRead ? "text-foreground/70" : "text-foreground font-medium"}`}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
                          </div>
                          {!isRead && <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {actions}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-md border border-border bg-card/60 hover:bg-card transition-colors">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-orange-700 flex items-center justify-center text-[10px] font-semibold text-primary-foreground">
                    AK
                  </div>
                  <span className="text-sm font-medium text-foreground hidden lg:block">Aria Kapoor</span>
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
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => setLogoutOpen(true)}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className={noPadding ? "flex-1 min-h-0 overflow-y-auto page-enter" : "flex-1 p-6 overflow-y-auto page-enter"}>{children}</main>
      </div>
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu akan logout dari Aroma Abadi SCL. Pastikan semua pekerjaan sudah tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (typeof window !== "undefined") window.localStorage.removeItem("scl_authed");
                navigate({ to: "/auth" });
              }}
            >
              Ya, Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SidebarLink({
  to,
  label,
  active,
  badge,
  Icon,
  expanded,
}: {
  to: NavItem["to"];
  label: string;
  active: boolean;
  badge?: number;
  Icon: typeof LayoutDashboard;
  expanded: boolean;
}) {
  if (expanded) {
    return (
      <Link
        to={to}
        aria-label={label}
        className={`relative flex items-center gap-3 h-10 px-2.5 rounded-lg text-sm nav-item ${active ? "active" : ""} transition-all duration-150 ${
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground border border-white/10 shadow-[inset_0_1px_0_oklch(1_0_0/10%)]"
            : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-white/[0.06] border border-transparent hover:translate-x-0.5"
        }`}
      >
        <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-sidebar-primary" : ""}`} />
        <span className="flex-1 truncate">{label}</span>
        {badge ? (
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-sidebar-primary text-[10px] font-semibold text-sidebar-primary-foreground grid place-items-center">
            {badge}
          </span>
        ) : null}
      </Link>
    );
  }
  return (
    <div className="group/nav relative">
      <Link
        to={to}
        aria-label={label}
        className={`relative grid h-11 w-11 place-items-center rounded-lg transition-colors ${
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground border border-white/10"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/[0.06] border border-transparent"
        }`}
      >
        <Icon className={`h-[18px] w-[18px] ${active ? "text-sidebar-primary" : ""}`} />
        {badge ? (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-sidebar-primary text-[9px] font-semibold text-sidebar-primary-foreground grid place-items-center">
            {badge}
          </span>
        ) : null}
        {active && (
          <span className="absolute left-0 -ml-2 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-r bg-sidebar-primary" />
        )}
      </Link>
      <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-foreground shadow-lg opacity-0 translate-x-[-4px] transition-all group-hover/nav:opacity-100 group-hover/nav:translate-x-0 z-50">
        {label}
      </span>
    </div>
  );
}

function SidebarButton({
  label,
  Icon,
  onClick,
  expanded,
}: {
  label: string;
  Icon: typeof LayoutDashboard;
  onClick: () => void;
  expanded: boolean;
}) {
  if (expanded) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="flex items-center gap-3 h-10 px-2.5 rounded-lg transition-colors text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-white/[0.06] border border-transparent"
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1 truncate text-left">{label}</span>
      </button>
    );
  }
  return (
    <div className="group/nav relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="relative grid h-11 w-11 place-items-center rounded-lg transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/[0.06] border border-transparent"
      >
        <Icon className="h-[18px] w-[18px]" />
      </button>
      <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-foreground shadow-lg opacity-0 translate-x-[-4px] transition-all group-hover/nav:opacity-100 group-hover/nav:translate-x-0 z-50">
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
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

import { ChannelIcon } from "./channel-badge";

export function ChannelDot({ channel }: { channel: "whatsapp" }) {
  void channel;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <ChannelIcon channel="whatsapp" className="h-4 w-4" />
      WhatsApp
    </span>
  );
}

import type { LabelColor, ContactLabel } from "./mock-data";
import { X } from "lucide-react";

export const labelColorClass: Record<LabelColor, string> = {
  indigo: "bg-indigo-500/10 text-indigo-700 border-indigo-500/30",
  pink: "bg-pink-500/10 text-pink-700 border-pink-500/30",
  emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-800 border-amber-500/30",
  sky: "bg-sky-500/10 text-sky-700 border-sky-500/30",
  violet: "bg-violet-500/10 text-violet-700 border-violet-500/30",
  slate: "bg-slate-500/10 text-slate-700 border-slate-500/30",
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
