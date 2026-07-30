import { createFileRoute } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";
import { fmtDateEN, fmtIDR, fmtNum } from "@/lib/fmt";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { conversations, contacts, recentActivity } from "@/components/scl/mock-data";
import { useTransactionsStore } from "@/components/scl/transactions-store";
import {
  audienceDonutData, audienceSegmentation, avgMessagesBetweenTransaction,
  computeAverages, computeBroadcastMetrics, computeFunnelRates, computeOrdersAndSales,
  mostAskedProducts, mostUnfulfilledProducts, totalConversations,
  type RankedProduct,
} from "@/components/scl/overview-metrics";
import { Link } from "@tanstack/react-router";
import {
  Users, UserCheck, BadgeCheck, MoonStar, Sparkles,
  Radio, Megaphone, MessageSquare, MessagesSquare,
  HelpCircle, ShoppingCart, PackageX,
  ClipboardList, Receipt, CircleDollarSign,
  Repeat, Wallet, Tags, ShoppingBasket,
  Reply, TrendingUp, Calendar, Info,
} from "lucide-react";
import {
  Tooltip as InfoTooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList,
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

// ── Shared chart styling — matches the tooltip/grid look already established
// in this codebase's earlier chart usage. ──────────────────────────────────
const chartTooltipStyle = { background: "oklch(0.18 0 0)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 8, fontSize: 12 };
const axisTick = { fontSize: 11 };
const BRAND_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function fmtPct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
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
      <TooltipContent side="top" className="max-w-[240px] text-center leading-snug">
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
    <div className="card-hover rounded-xl border border-border bg-card/60 p-5 glass relative overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          {label}
          <InfoHint text={info} />
        </span>
        <div className="h-7 w-7 shrink-0 grid place-items-center rounded-md bg-white/[0.04] border border-border">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight stat-value">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ── Compact "vs previous stage" stat strip (used under funnel charts) ────
function RateStrip({ items }: { items: { label: string; value: string; info: string }[] }) {
  return (
    <div className={`grid border-t border-border`} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it, i) => (
        <div key={it.label} className={`p-4 ${i > 0 ? "border-l border-border" : ""}`}>
          <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {it.label}
            <InfoHint text={it.info} />
          </div>
          <div className="mt-1 text-lg font-semibold stat-value">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

// ── Funnel chart — shared by the Broadcast funnel (B) and Conversion funnel (F) ──
type FunnelDatum = { name: string; value: number; fill: string };
function MetricFunnel({ data, height = 220 }: { data: FunnelDatum[]; height?: number }) {
  return (
    <div style={{ height }} className="p-4">
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number, n: string) => [fmtNum(Number(v)), n]} />
          <Funnel data={data} dataKey="value" nameKey="name" isAnimationActive animationDuration={700}>
            {data.map((d) => <Cell key={d.name} fill={d.fill} />)}
            <LabelList position="right" dataKey="name" fill="oklch(0.3 0.02 30)" fontSize={11} offset={10} />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Ranked product list — horizontal progress bars (Section C) ───────────
function RankedBarList({ items, color }: { items: RankedProduct[]; color: string }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="p-5 space-y-2.5">
      {items.map((item, i) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="text-[11px] w-3.5 shrink-0 text-muted-foreground tabular-nums">{i + 1}</span>
          <span className="text-[12px] flex-1 min-w-0 truncate text-foreground" title={item.name}>{item.name}</span>
          <div className="w-20 shrink-0 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(item.count / max) * 100}%`, background: color }} />
          </div>
          <span className="text-[12px] font-semibold text-foreground w-9 text-right shrink-0 tabular-nums">{fmtNum(item.count)}</span>
        </div>
      ))}
    </div>
  );
}

function RankedListColumn({ title, icon: Icon, items, color }: { title: string; icon: React.ElementType; items: RankedProduct[]; color: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 px-5 pt-4 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {title}
      </div>
      <RankedBarList items={items} color={color} />
    </div>
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

  const messageFunnelData: FunnelDatum[] = [
    { name: "Reach", value: broadcast.reach, fill: "var(--chart-1)" },
    { name: "Delivered", value: broadcast.delivered, fill: "var(--chart-2)" },
    { name: "Read", value: broadcast.read, fill: "var(--chart-3)" },
  ];
  const conversionFunnelData: FunnelDatum[] = [
    { name: "Broadcast Reach", value: broadcast.reach, fill: "var(--chart-1)" },
    { name: "Conversations", value: totalConversations, fill: "var(--chart-2)" },
    { name: "Transactions", value: orders.totalTransactions, fill: "var(--chart-3)" },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <AppShell title="Overview" subtitle={`${today} · Aroma Abadi workspace`}>
        <div className="space-y-6">

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

          {/* A. Audience & Segmentation */}
          <SectionCard title="Audience & Segmentation" description="Who's in your contact base, and how engaged they are.">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 p-5 stagger">
              <MetricStat icon={Users} label="Contacts" value={fmtNum(audienceSegmentation.contacts)} info="Total number of contacts you own (Total Users)." />
              <MetricStat icon={UserCheck} label="Active Contacts" value={fmtNum(audienceSegmentation.activeContacts)} info="Contacts who interacted with you in the last 6 months." />
              <MetricStat icon={BadgeCheck} label="Active Customers" value={fmtNum(audienceSegmentation.activeCustomers)} info="Contacts who made a transaction in the last 6 months." />
              <MetricStat icon={MoonStar} label="Sleeping Customers" value={fmtNum(audienceSegmentation.sleepingCustomers)} info="Contacts who transacted before, but not in the last 6 months." />
              <MetricStat icon={Sparkles} label="Potential Customers" value={fmtNum(audienceSegmentation.potentialCustomers)} info="Active Contacts who have never made a transaction." />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-t border-border p-5 pt-4">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number, n: string) => [fmtNum(Number(v)), n]} />
                    <Pie data={audienceDonutData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={86} paddingAngle={2} strokeWidth={0} isAnimationActive animationDuration={700}>
                      {audienceDonutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center gap-2.5">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Contact composition</div>
                {audienceDonutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                    <span className="text-foreground/80 flex-1">{d.name}</span>
                    <span className="font-semibold tabular-nums">{fmtNum(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* B. Broadcast & Messaging */}
          <SectionCard title="Broadcast & Messaging" description="Campaign volume and how well messages land.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 stagger">
              <MetricStat icon={Radio} label="Broadcast Sent" value={fmtNum(broadcast.broadcastSent)} sub="campaigns sent" info="Number of broadcast campaigns sent." />
              <MetricStat icon={Megaphone} label="Broadcast Reach" value={fmtNum(broadcast.reach)} info="Number of contacts a broadcast message reached." />
              <MetricStat icon={MessageSquare} label="Message Received" value={fmtNum(broadcast.messageReceived)} info="Number of messages received from customer-initiated conversations." />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-border">
              <MetricFunnel data={messageFunnelData} height={200} />
              <div className="flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-border">
                <RateStrip
                  items={[
                    { label: "Delivery Rate", value: fmtPct(broadcast.deliveryRate), info: "Share of broadcast messages successfully delivered to contacts (Delivered ÷ Reach)." },
                    { label: "Read Rate", value: fmtPct(broadcast.readRate), info: "Share of delivered broadcast messages that were read (Read ÷ Delivered)." },
                  ]}
                />
              </div>
            </div>
          </SectionCard>

          {/* C. Conversation & Product Intelligence */}
          <SectionCard
            title="Conversation & Product Intelligence"
            description="What people are talking about, and what they want."
            action={
              <div className="text-right">
                <div className="text-xl font-semibold stat-value">{fmtNum(totalConversations)}</div>
                <div className="inline-flex items-center gap-1 justify-end text-[10px] text-muted-foreground">
                  Total Conversations <InfoHint text="Number of conversations that took place." />
                </div>
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border border-t border-border">
              <RankedListColumn title="Most Asked" icon={HelpCircle} items={mostAskedProducts} color="var(--chart-1)" />
              <RankedListColumn title="Most Added to Cart" icon={ShoppingCart} items={orders.mostAddedToCart} color="var(--chart-2)" />
              <RankedListColumn title="Most Unfulfilled" icon={PackageX} items={mostUnfulfilledProducts} color="var(--chart-3)" />
            </div>
          </SectionCard>

          {/* D. Orders & Sales */}
          <SectionCard title="Orders & Sales" description="What's coming in, and how much it's worth.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 stagger">
              <MetricStat icon={ClipboardList} label="Total Orders" value={fmtNum(orders.totalOrders)} info="Number of incoming orders (total count)." />
              <MetricStat icon={Receipt} label="Total Transactions" value={fmtNum(orders.totalTransactions)} info="Number of transactions completed / paid (total count)." />
              <MetricStat icon={CircleDollarSign} label="Total Sales" value={fmtIDR(orders.totalSales)} info="Total sales value (IDR)." />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 border-t border-border p-5 pt-4">
              <div className="lg:col-span-2">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Sales trend</div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={orders.dailySales} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
                      <XAxis dataKey="date" stroke="oklch(0.7 0 0)" tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(d: string) => fmtDateEN(d).slice(0, 6)} />
                      <YAxis stroke="oklch(0.7 0 0)" tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : fmtNum(v))} />
                      <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(d: string) => fmtDateEN(d)} formatter={(v: number) => [fmtIDR(Number(v)), "Sales"]} />
                      <Area type="monotone" dataKey="sales" stroke="var(--chart-1)" fill="url(#salesTrend)" strokeWidth={2} isAnimationActive animationDuration={700} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2 inline-flex items-center gap-1">
                  Qty Sold — by Brand <InfoHint text="Number of items sold, by brand." />
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orders.qtyByBrand} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" vertical={false} />
                      <XAxis dataKey="brand" stroke="oklch(0.7 0 0)" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={46} />
                      <YAxis stroke="oklch(0.7 0 0)" tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: "oklch(1 0 0 / 4%)" }} contentStyle={chartTooltipStyle} formatter={(v: number) => [fmtNum(Number(v)), "Units sold"]} />
                      <Bar dataKey="qty" radius={[6, 6, 0, 0]} barSize={28} isAnimationActive animationDuration={700}>
                        {orders.qtyByBrand.map((d, i) => <Cell key={d.brand} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* E. Averages / Basket Economics */}
          <SectionCard title="Averages & Basket Economics" description="What a typical order looks like.">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-5 stagger">
              <MetricStat icon={Repeat} label="Avg. Messages / Transaction" value={averages ? avgMessagesBetweenTransaction.toFixed(1) : "0"} info="Average number of messages exchanged between transactions." />
              <MetricStat icon={Wallet} label="Avg. Order Value" value={fmtIDR(averages.avgOrderValue)} info="Average value per order (Sales ÷ Orders)." />
              <MetricStat icon={Tags} label="Avg. Selling Price" value={fmtIDR(averages.avgSellingPrice)} info="Average selling price per item (Sales ÷ Qty Sold)." />
              <MetricStat icon={ShoppingBasket} label="Avg. Basket Size" value={averages.avgBasketSize.toFixed(1)} sub="items / order" info="Average number of items per order (Qty Sold ÷ Orders)." />
            </div>
          </SectionCard>

          {/* F. Funnel & Conversion */}
          <SectionCard title="Funnel & Conversion" description="How reach turns into conversations, and conversations into sales.">
            <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-border">
              <MetricFunnel data={conversionFunnelData} height={200} />
              <div className="flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-border">
                <RateStrip
                  items={[
                    { label: "Conversation Rate", value: fmtPct(funnelRates.conversationRate), info: "Rate of conversations started since a broadcast was sent (Replies ÷ Broadcast Reach)." },
                    { label: "Conversion Rate", value: fmtPct(funnelRates.conversionRate), info: "Rate of transactions resulting from conversations (Transactions ÷ Conversations)." },
                  ]}
                />
              </div>
            </div>
          </SectionCard>

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
