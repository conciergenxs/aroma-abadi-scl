import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { fmtDateEN, fmtIDR, fmtNum } from "@/lib/fmt";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { conversations, contacts, recentActivity } from "@/components/scl/mock-data";
import { useTransactionsStore } from "@/components/scl/transactions-store";
import {
  audienceDonutData, audienceSegmentation, avgMessagesBetweenTransaction,
  computeAverages, computeBroadcastMetrics, computeFunnelRates, computeOrdersAndSales,
  mostAskedProducts, mostUnfulfilledProducts, totalConversations,
  type BroadcastMetrics, type OrdersAndSales, type RankedProduct,
} from "@/components/scl/overview-metrics";
import { Link } from "@tanstack/react-router";
import {
  Users, UserCheck, BadgeCheck, MoonStar, Sparkles,
  Radio, Megaphone, MessageSquare,
  HelpCircle, ShoppingCart, PackageX,
  ClipboardList, Receipt, CircleDollarSign,
  Repeat, Wallet, Tags, ShoppingBasket,
  Calendar, Info,
} from "lucide-react";
import {
  Tooltip as InfoTooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — Aroma Abadi" },
      { name: "description", content: "WhatsApp engagement platform for Aroma Abadi — makeup & beauty." },
      { property: "og:title", content: "Aroma Abadi — SCL" },
      { property: "og:description", content: "Manage WhatsApp conversations for Aroma Abadi in one workspace." },
    ],
  }),
  component: Dashboard,
});

// ── Shared chart styling — light surface, dark text (matches the design
// system's card/popover tokens; charts must never render dark-on-dark). ────
const chartTooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
  padding: "8px 12px",
  boxShadow: "0 8px 24px oklch(0.2 0.02 30 / 12%)",
};
const chartLabelStyle = { color: "var(--foreground)", fontWeight: 600, marginBottom: 3 };
const chartItemStyle = { color: "var(--muted-foreground)", padding: 0 };
const axisColor = "var(--muted-foreground)";
const gridColor = "var(--border)";
const cursorFill = "oklch(0.42 0.12 25 / 6%)";
const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };
const BRAND_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

// ── Type scale (kept to two sizes so every metric reads consistently) ──────
const VALUE_LG = "text-2xl font-semibold tracking-tight stat-value"; // primary tile numbers
const VALUE_SM = "text-xl font-semibold tracking-tight stat-value";  // header-corner badges
const CAPTION = "text-[11px] font-medium uppercase tracking-wide text-muted-foreground";

function fmtPct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

// ── Reveal-on-scroll — mounts/animates content only once its section
// actually scrolls into view, instead of everything firing at page load. ──
function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function Reveal({ innerRef, inView, children, className = "" }: { innerRef: React.Ref<HTMLDivElement>; inView: boolean; children: ReactNode; className?: string }) {
  return (
    <div
      ref={innerRef}
      className={`transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
    >
      {children}
    </div>
  );
}

// ── Info hint — hover an ⓘ next to any metric label to see its definition. ──
function InfoHint({ text }: { text: string }) {
  return (
    <InfoTooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex text-muted-foreground/50 hover:text-primary transition-colors" aria-label="What is this metric?">
          <Info className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-center leading-snug bg-popover text-popover-foreground border border-border shadow-lg">
        {text}
      </TooltipContent>
    </InfoTooltip>
  );
}

// ── Single-metric stat tile ──────────────────────────────────────────────
function MetricStat({
  icon: Icon, label, value, sub, info,
}: { icon: React.ElementType; label: string; value: string; sub?: string; info: string }) {
  return (
    <div className="card-hover rounded-xl border border-border bg-card/60 p-4 glass relative overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          {label}
          <InfoHint text={info} />
        </span>
        <div className="h-6 w-6 shrink-0 grid place-items-center rounded-md bg-white/[0.04] border border-border">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <div className={`mt-2 ${VALUE_LG}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ── Compact header-corner stat badge (used in SectionCard's action slot) ──
function CornerStat({ value, label, info }: { value: string; label: string; info: string }) {
  return (
    <div className="text-right">
      <div className={VALUE_SM}>{value}</div>
      <div className="inline-flex items-center gap-1 justify-end text-[10px] text-muted-foreground">
        {label} <InfoHint text={info} />
      </div>
    </div>
  );
}

// ── Step funnel — a sequence of proportional bars, replacing recharts'
// Funnel (whose trapezoid geometry breaks down at wide value ranges). ──────
type FunnelStage = { label: string; value: number; color: string };
function StepFunnel({ stages }: { stages: FunnelStage[] }) {
  const max = stages[0]?.value || 1;
  return (
    <div className="p-4 space-y-2.5">
      {stages.map((s, i) => {
        const widthPct = Math.max((s.value / max) * 100, 10);
        const prev = i > 0 ? stages[i - 1] : null;
        const dropPct = prev && prev.value ? (s.value / prev.value) * 100 : null;
        return (
          <div key={s.label}>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-xs font-medium text-foreground">{s.label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {fmtNum(s.value)}
                {dropPct !== null && <span className="ml-1.5 text-muted-foreground/70">({dropPct.toFixed(1)}%)</span>}
              </span>
            </div>
            <div className="h-6 rounded-md bg-muted overflow-hidden">
              <div className="h-full rounded-md animate-grow-x" style={{ width: `${widthPct}%`, background: s.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Ranked product list — horizontal progress bars (Section C) ───────────
function RankedBarList({ items, color }: { items: RankedProduct[]; color: string }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="p-4 space-y-2">
      {items.map((item, i) => (
        <div key={item.name} className="flex items-center gap-2.5">
          <span className="text-[11px] w-3.5 shrink-0 text-muted-foreground tabular-nums">{i + 1}</span>
          <span className="text-[12px] flex-1 min-w-0 truncate text-foreground" title={item.name}>{item.name}</span>
          <div className="w-16 shrink-0 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full animate-grow-x" style={{ width: `${(item.count / max) * 100}%`, background: color }} />
          </div>
          <span className="text-[12px] font-semibold text-foreground w-8 text-right shrink-0 tabular-nums">{fmtNum(item.count)}</span>
        </div>
      ))}
    </div>
  );
}

function RankedListColumn({ title, icon: Icon, items, color }: { title: string; icon: React.ElementType; items: RankedProduct[]; color: string }) {
  return (
    <div>
      <div className={`flex items-center gap-1.5 px-4 pt-3 pb-0.5 ${CAPTION}`}>
        <Icon className="h-3 w-3" /> {title}
      </div>
      <RankedBarList items={items} color={color} />
    </div>
  );
}

// ── A. Audience & Segmentation ───────────────────────────────────────────
function AudienceSection() {
  const { ref, inView } = useRevealOnScroll<HTMLDivElement>();
  return (
    <Reveal innerRef={ref} inView={inView}>
      <SectionCard title="Audience & Segmentation" description="Who's in your contact base, and how engaged they are.">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 p-4 stagger">
          <MetricStat icon={Users} label="Contacts" value={fmtNum(audienceSegmentation.contacts)} info="Total number of contacts you own (Total Users)." />
          <MetricStat icon={UserCheck} label="Active Contacts" value={fmtNum(audienceSegmentation.activeContacts)} info="Contacts who interacted with you in the last 6 months." />
          <MetricStat icon={BadgeCheck} label="Active Customers" value={fmtNum(audienceSegmentation.activeCustomers)} info="Contacts who made a transaction in the last 6 months." />
          <MetricStat icon={MoonStar} label="Sleeping Customers" value={fmtNum(audienceSegmentation.sleepingCustomers)} info="Contacts who transacted before, but not in the last 6 months." />
          <MetricStat icon={Sparkles} label="Potential Customers" value={fmtNum(audienceSegmentation.potentialCustomers)} info="Active Contacts who have never made a transaction." />
        </div>
        <div className="flex items-center gap-5 border-t border-border p-4">
          {inView && (
            <div className="relative w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} formatter={(v: number, n: string) => [fmtNum(Number(v)), n]} />
                  <Pie data={audienceDonutData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={54} paddingAngle={2} strokeWidth={0} isAnimationActive animationDuration={700}>
                    {audienceDonutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-semibold tabular-nums leading-none">{fmtNum(audienceSegmentation.contacts)}</span>
                <span className="text-[9px] uppercase tracking-wide text-muted-foreground mt-0.5">Total</span>
              </div>
            </div>
          )}
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {audienceDonutData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: d.color }} />
                <span className="text-foreground/80 flex-1 truncate">{d.name}</span>
                <span className="font-semibold tabular-nums">{fmtNum(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </Reveal>
  );
}

// ── B. Broadcast & Messaging ─────────────────────────────────────────────
function BroadcastSection({ broadcast }: { broadcast: BroadcastMetrics }) {
  const { ref, inView } = useRevealOnScroll<HTMLDivElement>();
  const stages: FunnelStage[] = [
    { label: "Broadcast Reach", value: broadcast.reach, color: "var(--chart-1)" },
    { label: "Delivered", value: broadcast.delivered, color: "var(--chart-2)" },
    { label: "Read", value: broadcast.read, color: "var(--chart-3)" },
  ];
  return (
    <Reveal innerRef={ref} inView={inView}>
      <SectionCard
        title="Broadcast & Messaging"
        description="Campaign volume and how well messages land."
        action={
          <div className="flex items-center gap-4">
            <CornerStat value={fmtPct(broadcast.deliveryRate)} label="Delivery Rate" info="Share of broadcast messages successfully delivered to contacts (Delivered ÷ Reach)." />
            <div className="w-px h-8 bg-border" />
            <CornerStat value={fmtPct(broadcast.readRate)} label="Read Rate" info="Share of delivered broadcast messages that were read (Read ÷ Delivered)." />
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 stagger">
          <MetricStat icon={Radio} label="Broadcast Sent" value={fmtNum(broadcast.broadcastSent)} sub="campaigns sent" info="Number of broadcast campaigns sent." />
          <MetricStat icon={Megaphone} label="Broadcast Reach" value={fmtNum(broadcast.reach)} info="Number of contacts a broadcast message reached." />
          <MetricStat icon={MessageSquare} label="Message Received" value={fmtNum(broadcast.messageReceived)} info="Number of messages received from customer-initiated conversations." />
        </div>
        {inView && (
          <div className="border-t border-border">
            <StepFunnel stages={stages} />
          </div>
        )}
      </SectionCard>
    </Reveal>
  );
}

// ── C. Conversation & Product Intelligence ───────────────────────────────
function ConversationSection({ orders }: { orders: OrdersAndSales }) {
  const { ref, inView } = useRevealOnScroll<HTMLDivElement>();
  return (
    <Reveal innerRef={ref} inView={inView}>
      <SectionCard
        title="Conversation & Product Intelligence"
        description="What people are talking about, and what they want."
        action={<CornerStat value={fmtNum(totalConversations)} label="Total Conversations" info="Number of conversations that took place." />}
      >
        {inView && (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border border-t border-border">
            <RankedListColumn title="Most Asked" icon={HelpCircle} items={mostAskedProducts} color="var(--chart-1)" />
            <RankedListColumn title="Most Added to Cart" icon={ShoppingCart} items={orders.mostAddedToCart} color="var(--chart-2)" />
            <RankedListColumn title="Most Unfulfilled" icon={PackageX} items={mostUnfulfilledProducts} color="var(--chart-3)" />
          </div>
        )}
      </SectionCard>
    </Reveal>
  );
}

// ── D. Orders & Sales ─────────────────────────────────────────────────────
function OrdersSection({ orders }: { orders: OrdersAndSales }) {
  const { ref, inView } = useRevealOnScroll<HTMLDivElement>();
  return (
    <Reveal innerRef={ref} inView={inView}>
      <SectionCard title="Orders & Sales" description="What's coming in, and how much it's worth.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 stagger">
          <MetricStat icon={ClipboardList} label="Total Orders" value={fmtNum(orders.totalOrders)} info="Number of incoming orders (total count)." />
          <MetricStat icon={Receipt} label="Total Transactions" value={fmtNum(orders.totalTransactions)} info="Number of transactions completed / paid (total count)." />
          <MetricStat icon={CircleDollarSign} label="Total Sales" value={fmtIDR(orders.totalSales)} info="Total sales value (IDR)." />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 border-t border-border p-4">
          <div className="lg:col-span-2">
            <div className={`${CAPTION} mb-2`}>Sales Trend</div>
            <div className="h-52">
              {inView && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={orders.dailySales} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="date" stroke={axisColor} tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(d: string) => fmtDateEN(d).slice(0, 6)} />
                    <YAxis stroke={axisColor} tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : fmtNum(v))} />
                    <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} labelFormatter={(d: string) => fmtDateEN(d)} formatter={(v: number) => [fmtIDR(Number(v)), "Sales"]} />
                    <Area type="monotone" dataKey="sales" stroke="var(--chart-1)" fill="url(#salesTrend)" strokeWidth={2} isAnimationActive animationDuration={700} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div>
            <div className={`${CAPTION} mb-2 inline-flex items-center gap-1`}>
              Qty Sold — by Brand <InfoHint text="Number of items sold, by brand." />
            </div>
            <div className="h-52">
              {inView && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orders.qtyByBrand} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" stroke={axisColor} tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="brand" stroke={axisColor} tick={axisTick} tickLine={false} axisLine={false} width={92} />
                    <Tooltip cursor={{ fill: cursorFill }} contentStyle={chartTooltipStyle} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} formatter={(v: number) => [fmtNum(Number(v)), "Units sold"]} />
                    <Bar dataKey="qty" radius={[0, 6, 6, 0]} barSize={16} isAnimationActive animationDuration={700}>
                      {orders.qtyByBrand.map((d, i) => <Cell key={d.brand} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </SectionCard>
    </Reveal>
  );
}

// ── E. Averages / Basket Economics ───────────────────────────────────────
function AveragesSection({ averages }: { averages: ReturnType<typeof computeAverages> }) {
  const { ref, inView } = useRevealOnScroll<HTMLDivElement>();
  return (
    <Reveal innerRef={ref} inView={inView}>
      <SectionCard title="Averages & Basket Economics" description="What a typical order looks like.">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 stagger">
          <MetricStat icon={Repeat} label="Avg. Messages / Transaction" value={avgMessagesBetweenTransaction.toFixed(1)} info="Average number of messages exchanged between transactions." />
          <MetricStat icon={Wallet} label="Avg. Order Value" value={fmtIDR(averages.avgOrderValue)} info="Average value per order (Sales ÷ Orders)." />
          <MetricStat icon={Tags} label="Avg. Selling Price" value={fmtIDR(averages.avgSellingPrice)} info="Average selling price per item (Sales ÷ Qty Sold)." />
          <MetricStat icon={ShoppingBasket} label="Avg. Basket Size" value={averages.avgBasketSize.toFixed(1)} sub="items / order" info="Average number of items per order (Qty Sold ÷ Orders)." />
        </div>
      </SectionCard>
    </Reveal>
  );
}

// ── F. Funnel & Conversion ───────────────────────────────────────────────
function ConversionSection({ broadcast, orders, funnelRates }: { broadcast: BroadcastMetrics; orders: OrdersAndSales; funnelRates: ReturnType<typeof computeFunnelRates> }) {
  const { ref, inView } = useRevealOnScroll<HTMLDivElement>();
  const stages: FunnelStage[] = [
    { label: "Broadcast Reach", value: broadcast.reach, color: "var(--chart-1)" },
    { label: "Conversations", value: totalConversations, color: "var(--chart-2)" },
    { label: "Transactions", value: orders.totalTransactions, color: "var(--chart-3)" },
  ];
  return (
    <Reveal innerRef={ref} inView={inView}>
      <SectionCard
        title="Funnel & Conversion"
        description="How reach turns into conversations, and conversations into sales."
        action={
          <div className="flex items-center gap-4">
            <CornerStat value={fmtPct(funnelRates.conversationRate)} label="Conversation Rate" info="Rate of conversations started since a broadcast was sent (Replies ÷ Broadcast Reach)." />
            <div className="w-px h-8 bg-border" />
            <CornerStat value={fmtPct(funnelRates.conversionRate)} label="Conversion Rate" info="Rate of transactions resulting from conversations (Transactions ÷ Conversations)." />
          </div>
        }
      >
        {inView && (
          <div className="border-t border-border">
            <StepFunnel stages={stages} />
          </div>
        )}
      </SectionCard>
    </Reveal>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
function Dashboard() {
  const today = fmtDateEN(new Date());
  const txState = useTransactionsStore();

  const orders = useMemo(() => computeOrdersAndSales(txState.transactions), [txState.transactions]);
  const broadcast = useMemo(() => computeBroadcastMetrics(), []);
  const averages = useMemo(() => computeAverages(orders), [orders]);
  const funnelRates = useMemo(
    () => computeFunnelRates(broadcast, totalConversations, orders.totalTransactions),
    [broadcast, orders.totalTransactions],
  );

  return (
    <TooltipProvider delayDuration={150}>
      <AppShell title="Overview" subtitle={`${today} · Aroma Abadi workspace`}>
        <div className="space-y-5">

          {/* Header row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="text-lg font-semibold">Hello, Aria 👋</div>
              <span className="text-muted-foreground/40 text-base select-none">|</span>
              <span className="inline-flex items-center gap-1.5 h-7 rounded-md border border-border bg-card/60 px-2.5 text-[12px] text-muted-foreground">
                <Calendar className="h-3 w-3 shrink-0" /> Jul 7 – Jul 31, 2026
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/inbox" className="inline-flex items-center h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Open Inbox
              </Link>
              <Link to="/broadcasts" className="inline-flex items-center h-9 rounded-md border border-border bg-card/60 px-4 text-sm font-medium hover:bg-card transition-colors">
                New Broadcast
              </Link>
            </div>
          </div>

          <AudienceSection />
          <BroadcastSection broadcast={broadcast} />
          <ConversationSection orders={orders} />
          <OrdersSection orders={orders} />
          <AveragesSection averages={averages} />
          <ConversionSection broadcast={broadcast} orders={orders} funnelRates={funnelRates} />

          {/* Activity + Conversations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SectionCard title="Recent activity" className="lg:col-span-1">
              <ul className="divide-y divide-border">
                {recentActivity.map((a) => (
                  <li key={a.id} className="px-5 py-3 flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-xs leading-relaxed">{a.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard
              title="Recent conversations"
              description="Latest activity in your shared inbox"
              className="lg:col-span-2"
              action={
                <Link to="/inbox" className="text-[11px] text-primary hover:underline">Open inbox →</Link>
              }
            >
              <ul className="divide-y divide-border">
                {conversations.slice(0, 5).map((c) => {
                  const contact = contacts.find((x) => x.id === c.contactId)!;
                  return (
                    <li key={c.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-xs font-medium">
                        {contact.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{contact.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{c.preview}</p>
                      </div>
                      <div className="text-[10px] text-muted-foreground">{c.time}</div>
                      {c.unread > 0 && (
                        <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{c.unread}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          </div>

        </div>
      </AppShell>
    </TooltipProvider>
  );
}
