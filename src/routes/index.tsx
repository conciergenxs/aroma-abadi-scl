import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtDateEN, fmtIDR, fmtNum } from "@/lib/fmt";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { conversations, contacts, recentActivity } from "@/components/scl/mock-data";
import { useTransactionsStore } from "@/components/scl/transactions-store";
import {
  avgMessagesBetweenTransaction,
  computeAverages,
  computeBroadcastMetrics,
  computeFunnelRates,
  computeOrdersAndSales,
  computeRangeScale,
  getTransactionDateBounds,
  mostAskedProducts,
  mostUnfulfilledProducts,
  scaleRankedProducts,
  scaledAudienceSegmentation,
  scaledTotalConversations,
  type BroadcastMetrics,
  type DateRange,
  type OrdersAndSales,
  type RankedProduct,
} from "@/components/scl/overview-metrics";
import { Link } from "@tanstack/react-router";
import {
  Users,
  UserCheck,
  BadgeCheck,
  MoonStar,
  Sparkles,
  Radio,
  Megaphone,
  MessageSquare,
  HelpCircle,
  ShoppingCart,
  PackageX,
  ClipboardList,
  Receipt,
  CircleDollarSign,
  Repeat,
  Wallet,
  Tags,
  ShoppingBasket,
  Reply,
  TrendingUp,
  CheckCheck,
  Eye,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  chartTooltipStyle,
  chartLabelStyle,
  chartItemStyle,
  axisColor,
  gridColor,
  cursorFill,
  axisTick,
  BRAND_COLORS,
  CAPTION,
  fmtPct,
  useRevealOnScroll,
  Reveal,
  InfoHint,
  MetricStat,
  CornerStat,
  StepFunnel,
  type FunnelStage,
} from "@/components/scl/dashboard-ui";
import { CrmLoyaltyAnalytics } from "@/components/scl/loyalty-analytics-section";
import { LITE_MODE } from "@/lib/feature-flags";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — Aroma Abadi" },
      {
        name: "description",
        content: "WhatsApp engagement platform for Aroma Abadi — makeup & beauty.",
      },
      { property: "og:title", content: "Aroma Abadi — SCL" },
      {
        property: "og:description",
        content: "Manage WhatsApp conversations for Aroma Abadi in one workspace.",
      },
    ],
  }),
  component: Dashboard,
});

// ── Ranked product list — horizontal progress bars (Section C) ───────────
function RankedBarList({ items, color }: { items: RankedProduct[]; color: string }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="p-4 space-y-2">
      {items.map((item, i) => (
        <div key={item.name} className="flex items-center gap-2.5">
          <span className="text-[11px] w-3.5 shrink-0 text-muted-foreground tabular-nums">
            {i + 1}
          </span>
          <span className="text-[12px] flex-1 min-w-0 truncate text-foreground" title={item.name}>
            {item.name}
          </span>
          <div className="w-16 shrink-0 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full animate-grow-x"
              style={{ width: `${(item.count / max) * 100}%`, background: color }}
            />
          </div>
          <span className="text-[12px] font-semibold text-foreground w-8 text-right shrink-0 tabular-nums">
            {fmtNum(item.count)}
          </span>
        </div>
      ))}
    </div>
  );
}

function RankedListColumn({
  title,
  icon: Icon,
  items,
  color,
}: {
  title: string;
  icon: React.ElementType;
  items: RankedProduct[];
  color: string;
}) {
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
function AudienceSection({ scale }: { scale: number }) {
  const { ref, inView } = useRevealOnScroll<HTMLDivElement>();
  const audience = scaledAudienceSegmentation(scale);
  return (
    <Reveal innerRef={ref} inView={inView}>
      <SectionCard title="Audience & Segmentation">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 p-4 stagger">
          <MetricStat
            icon={Users}
            label="Contacts"
            value={fmtNum(audience.contacts)}
            info="Total number of contacts you own (Total Users)."
          />
          <MetricStat
            icon={UserCheck}
            label="Active Contacts"
            value={fmtNum(audience.activeContacts)}
            info="Contacts who interacted with you in the last 6 months."
          />
          <MetricStat
            icon={BadgeCheck}
            label="Active Customers"
            value={fmtNum(audience.activeCustomers)}
            info="Contacts who made a transaction in the last 6 months."
          />
          <MetricStat
            icon={MoonStar}
            label="Sleeping Customers"
            value={fmtNum(audience.sleepingCustomers)}
            info="Contacts who transacted before, but not in the last 6 months."
          />
          <MetricStat
            icon={Sparkles}
            label="Potential Customers"
            value={fmtNum(audience.potentialCustomers)}
            info="Active Contacts who have never made a transaction."
          />
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
      <SectionCard title="Broadcast & Messaging">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 stagger">
          <MetricStat
            icon={Radio}
            label="Broadcast Sent"
            value={fmtNum(broadcast.broadcastSent)}
            sub="campaigns sent"
            info="Number of broadcast campaigns sent."
          />
          <MetricStat
            icon={Megaphone}
            label="Broadcast Reach"
            value={fmtNum(broadcast.reach)}
            info="Number of contacts a broadcast message reached."
          />
          <MetricStat
            icon={MessageSquare}
            label="Message Received"
            value={fmtNum(broadcast.messageReceived)}
            info="Number of messages received from customer-initiated conversations."
          />
        </div>
        {inView && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 border-t border-border p-4">
            <div className="lg:col-span-2 rounded-xl border border-border bg-card/60 glass">
              <StepFunnel stages={stages} />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <MetricStat
                icon={CheckCheck}
                label="Delivery Rate"
                value={fmtPct(broadcast.deliveryRate)}
                info="Share of broadcast messages successfully delivered to contacts (Delivered ÷ Reach)."
              />
              <MetricStat
                icon={Eye}
                label="Read Rate"
                value={fmtPct(broadcast.readRate)}
                info="Share of delivered broadcast messages that were read (Read ÷ Delivered)."
              />
            </div>
          </div>
        )}
      </SectionCard>
    </Reveal>
  );
}

// ── C. Conversation & Product Intelligence ───────────────────────────────
function ConversationSection({
  orders,
  scale,
  totalConversations,
}: {
  orders: OrdersAndSales;
  scale: number;
  totalConversations: number;
}) {
  const { ref, inView } = useRevealOnScroll<HTMLDivElement>();
  return (
    <Reveal innerRef={ref} inView={inView}>
      <SectionCard
        title="Conversation & Product Intelligence"
        action={
          <CornerStat
            value={fmtNum(totalConversations)}
            label="Total Conversations"
            info="Number of conversations that took place."
          />
        }
      >
        {inView && (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border border-t border-border">
            <RankedListColumn
              title="Most Asked"
              icon={HelpCircle}
              items={scaleRankedProducts(mostAskedProducts, scale)}
              color="var(--chart-1)"
            />
            <RankedListColumn
              title="Most Added to Cart"
              icon={ShoppingCart}
              items={orders.mostAddedToCart}
              color="var(--chart-2)"
            />
            <RankedListColumn
              title="Most Unfulfilled"
              icon={PackageX}
              items={scaleRankedProducts(mostUnfulfilledProducts, scale)}
              color="var(--chart-3)"
            />
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
      <SectionCard title="Orders & Sales">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 stagger">
          <MetricStat
            icon={ClipboardList}
            label="Total Orders"
            value={fmtNum(orders.totalOrders)}
            info="Number of incoming orders (total count)."
          />
          <MetricStat
            icon={Receipt}
            label="Total Transactions"
            value={fmtNum(orders.totalTransactions)}
            info="Number of transactions completed / paid (total count)."
          />
          <MetricStat
            icon={CircleDollarSign}
            label="Total Sales"
            value={fmtIDR(orders.totalSales)}
            info="Total sales value (IDR)."
          />
        </div>
        <div className="border-t border-border p-4">
          <div className={`${CAPTION} mb-2`}>Sales Trend</div>
          <div className="h-52">
            {inView && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={orders.dailySales}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke={axisColor}
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(d: string) => fmtDateEN(d).slice(0, 6)}
                  />
                  <YAxis
                    stroke={axisColor}
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : fmtNum(v)
                    }
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartLabelStyle}
                    itemStyle={chartItemStyle}
                    labelFormatter={(d: string) => fmtDateEN(d)}
                    formatter={(v: number) => [fmtIDR(Number(v)), "Sales"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--chart-1)"
                    fill="url(#salesTrend)"
                    strokeWidth={2}
                    isAnimationActive
                    animationDuration={700}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="border-t border-border p-4">
          <div className={`${CAPTION} mb-2 inline-flex items-center gap-1`}>
            Qty Sold — by Brand <InfoHint text="Number of items sold, by brand." />
          </div>
          <div className="h-40">
            {inView && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={orders.qtyByBrand}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis
                    type="number"
                    stroke={axisColor}
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="brand"
                    stroke={axisColor}
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: cursorFill }}
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartLabelStyle}
                    itemStyle={chartItemStyle}
                    formatter={(v: number) => [fmtNum(Number(v)), "Units sold"]}
                  />
                  <Bar
                    dataKey="qty"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                    isAnimationActive
                    animationDuration={700}
                  >
                    {orders.qtyByBrand.map((d, i) => (
                      <Cell key={d.brand} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
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
      <SectionCard title="Averages & Basket Economics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 stagger">
          <MetricStat
            icon={Repeat}
            label="Avg. Messages / Transaction"
            value={avgMessagesBetweenTransaction.toFixed(1)}
            info="Average number of messages exchanged between transactions."
          />
          <MetricStat
            icon={Wallet}
            label="Avg. Order Value"
            value={fmtIDR(averages.avgOrderValue)}
            info="Average value per order (Sales ÷ Orders)."
          />
          <MetricStat
            icon={Tags}
            label="Avg. Selling Price"
            value={fmtIDR(averages.avgSellingPrice)}
            info="Average selling price per item (Sales ÷ Qty Sold)."
          />
          <MetricStat
            icon={ShoppingBasket}
            label="Avg. Basket Size"
            value={averages.avgBasketSize.toFixed(1)}
            sub="items / order"
            info="Average number of items per order (Qty Sold ÷ Orders)."
          />
        </div>
      </SectionCard>
    </Reveal>
  );
}

// ── F. Funnel & Conversion ───────────────────────────────────────────────
function ConversionSection({
  broadcast,
  orders,
  funnelRates,
  totalConversations,
}: {
  broadcast: BroadcastMetrics;
  orders: OrdersAndSales;
  funnelRates: ReturnType<typeof computeFunnelRates>;
  totalConversations: number;
}) {
  const { ref, inView } = useRevealOnScroll<HTMLDivElement>();
  const stages: FunnelStage[] = [
    { label: "Broadcast Reach", value: broadcast.reach, color: "var(--chart-1)" },
    { label: "Conversations", value: totalConversations, color: "var(--chart-2)" },
    { label: "Transactions", value: orders.totalTransactions, color: "var(--chart-3)" },
  ];
  return (
    <Reveal innerRef={ref} inView={inView}>
      <SectionCard title="Funnel & Conversion">
        {inView && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-4">
            <div className="lg:col-span-2 rounded-xl border border-border bg-card/60 glass">
              <StepFunnel stages={stages} />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <MetricStat
                icon={Reply}
                label="Conversation Rate"
                value={fmtPct(funnelRates.conversationRate)}
                info="Rate of conversations started since a broadcast was sent (Replies ÷ Broadcast Reach)."
              />
              <MetricStat
                icon={TrendingUp}
                label="Conversion Rate"
                value={fmtPct(funnelRates.conversionRate)}
                info="Rate of transactions resulting from conversations (Transactions ÷ Conversations)."
              />
            </div>
          </div>
        )}
      </SectionCard>
    </Reveal>
  );
}

// ── Date range popover — filters every metric on the page down to the
// selected window (presets or a custom from/to pair). ──────────────────────
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
// Both helpers work directly on the "YYYY-MM-DD" components — parsing via
// `new Date(iso)` interprets local vs. UTC differently depending on whether
// a time component is present, which can silently shift the date by a day
// depending on the machine's timezone (and SSR/client can disagree too).
function fmtShortDate(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS_SHORT[m - 1]}`;
}
function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function DateRangePopover({
  range,
  fullRange,
  onChange,
}: {
  range: DateRange;
  fullRange: DateRange;
  onChange: (r: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Presets can clamp to an identical range once the window is short enough
  // (e.g. Last 30 Days and Last 90 Days both hit the same data boundary) —
  // matching by value alone would mislabel "Last 90 Days" as "Last 30 Days"
  // just because it's listed first. Track the actual click instead.
  const [selectedLabel, setSelectedLabel] = useState<string | null>("Last 90 Days");

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Presets can't reach further back than the real data actually goes.
  const clampStart = (iso: string) => (iso < fullRange.start ? fullRange.start : iso);
  const presets: { label: string; range: DateRange }[] = [
    {
      label: "Last 7 Days",
      range: { start: clampStart(addDaysIso(fullRange.end, -6)), end: fullRange.end },
    },
    {
      label: "Last 30 Days",
      range: { start: clampStart(addDaysIso(fullRange.end, -29)), end: fullRange.end },
    },
    {
      label: "Last 90 Days",
      range: { start: clampStart(addDaysIso(fullRange.end, -89)), end: fullRange.end },
    },
  ];
  const isKnownPreset = presets.some(
    (p) => p.range.start === range.start && p.range.end === range.end,
  );
  const label =
    isKnownPreset && selectedLabel
      ? selectedLabel
      : `${fmtShortDate(range.start)} – ${fmtShortDate(range.end)}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 h-7 rounded-md border border-border bg-card/60 px-2.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
      >
        <Calendar className="h-3 w-3 shrink-0" />
        <span className="max-w-[160px] truncate">{label}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-border bg-popover shadow-xl p-2 animate-scale-in origin-top-left">
          <div className="space-y-0.5">
            {presets.map((p) => {
              const active = selectedLabel === p.label;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setSelectedLabel(p.label);
                    onChange(p.range);
                    setOpen(false);
                  }}
                  className={`w-full text-left h-8 px-3 rounded-md text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="my-2 border-t border-border" />
          <div className="px-1 pb-1 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2">
              Custom Range
            </div>
            <input
              type="date"
              value={range.start}
              min={fullRange.start}
              max={range.end}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedLabel(null);
                  onChange({ start: e.target.value, end: range.end });
                }
              }}
              className="h-8 w-full rounded-md border border-border bg-card px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
            />
            <input
              type="date"
              value={range.end}
              min={range.start}
              max={fullRange.end}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedLabel(null);
                  onChange({ start: range.start, end: e.target.value });
                }
              }}
              className="h-8 w-full rounded-md border border-border bg-card px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
function Dashboard() {
  const today = fmtDateEN(new Date());
  const txState = useTransactionsStore();

  const fullRange = useMemo(
    () => getTransactionDateBounds(txState.transactions),
    [txState.transactions],
  );
  const [range, setRange] = useState<DateRange>(fullRange);

  const scale = useMemo(() => computeRangeScale(range, fullRange), [range, fullRange]);
  const orders = useMemo(
    () => computeOrdersAndSales(txState.transactions, range),
    [txState.transactions, range],
  );
  const broadcast = useMemo(() => computeBroadcastMetrics(range, scale), [range, scale]);
  const averages = useMemo(() => computeAverages(orders), [orders]);
  const conversationsCount = useMemo(() => scaledTotalConversations(scale), [scale]);
  const funnelRates = useMemo(
    () => computeFunnelRates(broadcast, conversationsCount, orders.totalTransactions),
    [broadcast, conversationsCount, orders.totalTransactions],
  );

  return (
    <TooltipProvider delayDuration={150}>
      <AppShell title="Overview" subtitle={`${today} · Aroma Abadi workspace`}>
        <div className="space-y-5 pb-[50px]">
          {/* Header row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="text-lg font-semibold">Hello, Aria 👋</div>
              <span className="text-muted-foreground/40 text-[15px] select-none">|</span>
              <DateRangePopover range={range} fullRange={fullRange} onChange={setRange} />
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/inbox"
                className="inline-flex items-center h-9 rounded-md bg-primary px-4 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Open Inbox
              </Link>
              <Link
                to="/broadcasts"
                className="inline-flex items-center h-9 rounded-md border border-border bg-card/60 px-4 text-[14px] font-medium hover:bg-card transition-colors"
              >
                New Broadcast
              </Link>
            </div>
          </div>

          <AudienceSection scale={scale} />
          <BroadcastSection broadcast={broadcast} />
          <ConversationSection
            orders={orders}
            scale={scale}
            totalConversations={conversationsCount}
          />
          <OrdersSection orders={orders} />
          <AveragesSection averages={averages} />
          <ConversionSection
            broadcast={broadcast}
            orders={orders}
            funnelRates={funnelRates}
            totalConversations={conversationsCount}
          />

          {!LITE_MODE && <CrmLoyaltyAnalytics />}

          {/* Activity + Conversations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SectionCard title="Recent Activity" className="lg:col-span-1">
              <ul className="divide-y divide-border">
                {recentActivity.slice(0, 5).map((a) => (
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
              title="Recent Conversations"
              className="lg:col-span-2"
              action={
                <Link
                  to="/inbox"
                  className="text-[11px] font-semibold text-primary hover:underline transition-colors duration-150"
                >
                  OPEN INBOX →
                </Link>
              }
            >
              <ul className="divide-y divide-border">
                {conversations.slice(0, 6).map((c) => {
                  const contact = contacts.find((x) => x.id === c.contactId)!;
                  return (
                    <li
                      key={c.id}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors duration-150"
                    >
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
                        <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          {c.unread}
                        </span>
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
