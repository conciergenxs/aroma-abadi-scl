import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtIDR, fmtNum } from "@/lib/fmt";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
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
  scaledTotalConversations,
  clipToMaxWindow,
  computeAudienceReading,
  maxWindowFor,
  MAX_RANGE_MONTHS,
  type AudienceReading,
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
  useMeasuredWidth,
  trendTicks,
  Reveal,
  InfoHint,
  MetricStat,
  CornerStat,
  StepFunnel,
  type FunnelStage,
  TrendAxisTick,
  trendLabel,
} from "@/components/scl/dashboard-ui";
import { CrmLoyaltyAnalytics } from "@/components/scl/loyalty-analytics-section";
import { BoundedDateInput, fmtDateWithYear } from "@/components/scl/date-range-popover";
import { LITE_MODE, PUBLIC_SITE } from "@/lib/feature-flags";

export const Route = createFileRoute("/")({
  // On the public-site deployment the root belongs to the company page, not
  // to the workspace — see PUBLIC_SITE.
  beforeLoad: () => {
    if (PUBLIC_SITE) throw redirect({ to: "/company" });
  },
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
        <div key={`${item.brand}-${item.name}`} className="flex items-center gap-2.5">
          <span className="text-[11px] w-3.5 shrink-0 text-muted-foreground tabular-nums">
            {i + 1}
          </span>
          {/* Keyed on brand + name, not name alone: two different products in
              this catalogue are both called "Translucent Loose Setting
              Powder", at Rp 189.000 and Rp 745.000, and React logs a
              duplicate-key error when the name is the only identity. */}
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
  info,
  icon: Icon,
  items,
  color,
}: {
  title: string;
  info: string;
  icon: React.ElementType;
  items: RankedProduct[];
  color: string;
}) {
  return (
    <div>
      <div className={`flex items-center gap-1.5 px-4 pt-3 pb-0.5 ${CAPTION}`}>
        <Icon className="h-3 w-3" /> {title} <InfoHint text={info} />
      </div>
      <RankedBarList items={items} color={color} />
    </div>
  );
}

// ── A. Audience & Segmentation ───────────────────────────────────────────
/**
 * Every tile here is a standing count, so a date range cannot total it — it
 * can only say where the count stood at each end of the window. The two
 * figures and the two dates are one statement, which is why the dates sit
 * under the number rather than being left to the picker in the header.
 */
function AudienceSection({ audience }: { audience: AudienceReading }) {
  const { ref, inView } = useRevealOnScroll<HTMLDivElement>();
  const { start, end, range, singleDay } = audience;
  const period = singleDay
    ? fmtDateWithYear(range.end)
    : `${fmtDateWithYear(range.start)} – ${fmtDateWithYear(range.end)}`;
  const tiles = [
    {
      icon: Users,
      label: "Customer Contacts",
      from: start.contacts,
      to: end.contacts,
      info: "Number of contacts you own (Total Users).",
    },
    // "Active Contacts" and "Active Customers" count different things — this
    // one everyone who interacted, the next only those who bought. Both were
    // once labelled "Active Customers"; the owner's metric sheet names them
    // apart, and the hint under each label is what settles which is which.
    {
      icon: UserCheck,
      label: "Active Contacts",
      from: start.activeContacts,
      to: end.activeContacts,
      info: "Contacts who interacted in the last 6 months.",
    },
    {
      icon: BadgeCheck,
      label: "Active Customers",
      from: start.activeCustomers,
      to: end.activeCustomers,
      info: "Contacts who made a transaction in the last 6 months.",
    },
    {
      icon: MoonStar,
      label: "Sleeping Customers",
      from: start.sleepingCustomers,
      to: end.sleepingCustomers,
      info: "Contacts who made a transaction before, but not in the last 6 months.",
    },
    {
      icon: Sparkles,
      label: "Potential Customers",
      from: start.potentialCustomers,
      to: end.potentialCustomers,
      info: "Active Contacts who have never made a transaction.",
    },
  ];
  return (
    <Reveal innerRef={ref} inView={inView}>
      <SectionCard title="Audience & Segmentation">
        {/* One column on a phone, not two. These tiles each carry two
            four-digit figures now, and "3.030 – 3.180" needs 130px where a
            half-width tile at 390px leaves 118 — the dash wrapped away from
            the number it joins. A full-width tile reads cleanly and the
            three-across layout returns as soon as there is room for it. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 gap-3 p-4 stagger">
          {tiles.map((t) => (
            <MetricStat
              key={t.label}
              icon={t.icon}
              label={t.label}
              value={fmtNum(t.to)}
              valueRange={singleDay ? undefined : { from: fmtNum(t.from), to: fmtNum(t.to) }}
              sub={period}
              info={t.info}
            />
          ))}
        </div>
      </SectionCard>
    </Reveal>
  );
}

// ── B. Broadcast & Messaging ─────────────────────────────────────────────
function BroadcastSection({ broadcast }: { broadcast: BroadcastMetrics }) {
  const { ref, inView } = useRevealOnScroll<HTMLDivElement>();
  const stages: FunnelStage[] = [
    { label: "Broadcast Sent", value: broadcast.broadcastSent, color: "var(--chart-1)" },
    { label: "Broadcast Reach", value: broadcast.reach, color: "var(--chart-2)" },
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
            sub={`across ${fmtNum(broadcast.campaignsSent)} broadcasts`}
            info="Number of broadcast messages sent."
          />
          <MetricStat
            icon={Megaphone}
            label="Broadcast Reach"
            value={fmtNum(broadcast.reach)}
            info="Number of broadcast message recipients."
          />
          <MetricStat
            icon={MessageSquare}
            label="Message Received"
            value={fmtNum(broadcast.messageReceived)}
            info="Number of messages received from conversations started by customers."
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
                info="Rate of broadcast messages received by contacts (Reach ÷ Sent)."
              />
              <MetricStat
                icon={Eye}
                label="Read Rate"
                value={fmtPct(broadcast.readRate)}
                info="Rate of broadcast messages read by contacts."
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
              info="Products asked about the most."
              icon={HelpCircle}
              items={scaleRankedProducts(mostAskedProducts, scale)}
              color="var(--chart-1)"
            />
            <RankedListColumn
              title="Most Added to Cart"
              info="Products added to cart the most."
              icon={ShoppingCart}
              items={orders.mostAddedToCart}
              color="var(--chart-2)"
            />
            <RankedListColumn
              title="Most Unfulfilled"
              info="Products asked about the most but not fulfilled because they are out of stock or not available."
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
  const { ref: trendRef, width: trendWidth } = useMeasuredWidth<HTMLDivElement>();
  // Until the axis has been measured, Recharts' own thinning stands in — one
  // frame of its spacing beats a frame of two labels.
  const xTicks = trendTicks(
    orders.salesTrend.map((p) => p.bucket),
    orders.trendGranularity,
    trendWidth,
  );
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
            info="Number of transactions made / paid (total count)."
          />
          <MetricStat
            icon={CircleDollarSign}
            label="Total Sales"
            value={fmtIDR(orders.totalSales)}
            info="Total sales (IDR)."
          />
        </div>
        <div className="border-t border-border p-4">
          <div className={`${CAPTION} mb-2`}>Sales Trend</div>
          <div className="h-52" ref={trendRef}>
            {inView && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={orders.salesTrend}
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
                    dataKey="bucket"
                    stroke={axisColor}
                    tickLine={false}
                    axisLine={false}
                    // Evenly stepped labels, chosen against the measured
                    // width — see trendTicks. Recharts' own thinning only
                    // stands in for the frame before the axis is measured.
                    ticks={xTicks.length ? xTicks : undefined}
                    interval={xTicks.length ? 0 : "preserveStartEnd"}
                    minTickGap={16}
                    tick={<TrendAxisTick granularity={orders.trendGranularity} />}
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
                    labelFormatter={(b: string) => trendLabel(b, orders.trendGranularity)}
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
            Qty Sold — by Brand <InfoHint text="Number of items sold (per brand)." />
          </div>
          {/* The row pitch is what is held fixed here, not the panel height: a
              bar plus the air around it comes to 35px whether the range turned
              up two brands or five, so the bars never crowd at one filter and
              drift apart at another. The 36px covers the value axis beneath
              them and the top margin. */}
          <div style={{ height: Math.max(1, orders.qtyByBrand.length) * 35 + 36 }}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 stagger">
          <MetricStat
            icon={Repeat}
            label="Avg. Messages Between Transactions"
            value={avgMessagesBetweenTransaction.toFixed(1)}
            info="Average number of messages sent between transactions."
          />
          <MetricStat
            icon={Wallet}
            label="Avg. Order Value"
            value={fmtIDR(averages.avgOrderValue)}
            info="Average order value (Sales ÷ Orders)."
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
            subInline
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
    { label: "Broadcast Sent", value: broadcast.broadcastSent, color: "var(--chart-1)" },
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
                info="Rate of conversations after a broadcast is sent (Total Replies ÷ Total Broadcast)."
              />
              <MetricStat
                icon={TrendingUp}
                label="Conversion Rate"
                value={fmtPct(funnelRates.conversionRate)}
                info="Rate of transactions from conversations (Transactions ÷ Conversations)."
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

/**
 * The windows the Overview offers, longest-ago last.
 *
 * There is no "Lifetime" here any more. Every segment on this page is defined
 * against the last six months, so an all-time view was answering a different
 * question than the one its tiles were labelled with. "Today" took its place
 * at the top of the list, and six months is the longest window offered —
 * which is also the cap a custom range is held to.
 *
 * Every window is measured back from the last day the data has, not from the
 * wall clock, so "Last 7 Days" is seven days of actual trading rather than a
 * week that may be half empty.
 */
function overviewPresets(fullRange: DateRange): { label: string; range: DateRange }[] {
  const clampStart = (iso: string) => (iso < fullRange.start ? fullRange.start : iso);
  const trailing = (days: number) => ({
    start: clampStart(addDaysIso(fullRange.end, -(days - 1))),
    end: fullRange.end,
  });
  const sixMonths = maxWindowFor(fullRange.end);
  return [
    { label: "Today", range: { start: fullRange.end, end: fullRange.end } },
    { label: "Last 7 Days", range: trailing(7) },
    { label: "Last 30 Days", range: trailing(30) },
    { label: "Last 90 Days", range: trailing(90) },
    { label: "Last 6 Months", range: { start: clampStart(sixMonths.start), end: sixMonths.end } },
  ];
}

function DateRangePopover({
  requested,
  range,
  clipped,
  fullRange,
  selectedLabel,
  onChange,
}: {
  /** What the user asked for — the custom pair as typed, before the
   *  six-month rule has had its say. */
  requested: DateRange;
  /** What the page is actually reading. */
  range: DateRange;
  clipped: boolean;
  fullRange: DateRange;
  selectedLabel: string | null;
  onChange: (range: DateRange, presetLabel: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const label = selectedLabel ?? `${fmtShortDate(range.start)} – ${fmtShortDate(range.end)}`;
  const windowStart = maxWindowFor(fullRange.end).start;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 h-9 rounded-md border border-border bg-card/60 px-3 text-[13px] text-muted-foreground hover:text-foreground hover:bg-card transition-colors duration-150"
      >
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span className="max-w-[160px] truncate">{label}</span>
        {clipped && (
          <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[12px] font-medium text-amber-700 leading-none">
            6 mo
          </span>
        )}
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-border bg-popover shadow-xl p-2 animate-scale-in origin-top-left">
          <div className="space-y-0.5">
            {overviewPresets(fullRange).map((p) => {
              const active = selectedLabel === p.label;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    onChange(p.range, p.label);
                    setOpen(false);
                  }}
                  className={`w-full text-left h-8 px-3 rounded-md text-[13px] font-medium transition-colors duration-150 ${
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
            <div className="text-[12px] uppercase tracking-wider text-muted-foreground px-2">
              Custom Range
            </div>
            {/* Bound to the clipped dates, not to what was typed: these two
                fields have to agree with the figures on the page, and the
                badge below is what explains the difference. */}
            <BoundedDateInput
              value={range.start}
              min={fullRange.start}
              max={range.end}
              label="From date"
              onCommit={(iso) => onChange({ start: iso, end: requested.end }, null)}
            />
            <BoundedDateInput
              value={range.end}
              min={fullRange.start}
              max={fullRange.end}
              label="To date"
              onCommit={(iso) => onChange({ start: requested.start, end: iso }, null)}
            />
            {clipped ? (
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[12px] leading-snug text-amber-700">
                You asked for {fmtDateWithYear(requested.start)} – {fmtDateWithYear(requested.end)}.
                Every segment here is defined over 6 months, so the last {MAX_RANGE_MONTHS} months
                of it are shown.
              </p>
            ) : (
              <p className="px-2 pt-0.5 text-[12px] leading-snug text-muted-foreground">
                Up to {MAX_RANGE_MONTHS} months, back to {fmtDateWithYear(windowStart)}. Data runs{" "}
                {fmtDateWithYear(fullRange.start)} – {fmtDateWithYear(fullRange.end)}.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
function Dashboard() {
  const txState = useTransactionsStore();

  const fullRange = useMemo(
    () => getTransactionDateBounds(txState.transactions),
    [txState.transactions],
  );
  // What was asked for, which is not always what gets read: a custom range
  // longer than six months is shortened to its last six. Both are kept so
  // the picker can show the dates in force and still say which ones were
  // typed.
  const [requested, setRequested] = useState<DateRange>(() => {
    const end = fullRange.end;
    const start = addDaysIso(end, -29);
    return { start: start < fullRange.start ? fullRange.start : start, end };
  });
  // Opening on a single day would be a near-empty dashboard, and there is no
  // all-time view left to open on, so the month is the landing window.
  const [selectedLabel, setSelectedLabel] = useState<string | null>("Last 30 Days");
  const { range, clipped } = useMemo(() => clipToMaxWindow(requested), [requested]);

  const applyRange = (next: DateRange, presetLabel: string | null) => {
    // Pulling the end date back behind the start leaves a window that runs
    // backwards, and every tile on the page empties with no explanation. The
    // date the user just set is the one they meant, so the other end follows
    // it rather than the page breaking.
    const ordered = next.end < next.start ? { start: next.end, end: next.end } : next;
    setRequested(ordered);
    setSelectedLabel(presetLabel);
  };

  const scale = useMemo(
    () => computeRangeScale(txState.transactions, range, fullRange),
    [txState.transactions, range, fullRange],
  );
  const audience = useMemo(
    () => computeAudienceReading(txState.transactions, range),
    [txState.transactions, range],
  );
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
      <AppShell
        title="Overview"
        subtitle="ARMA Workspace"
        titleAside={
          <DateRangePopover
            requested={requested}
            range={range}
            clipped={clipped}
            fullRange={fullRange}
            selectedLabel={selectedLabel}
            onChange={applyRange}
          />
        }
      >
        <div className="space-y-5 pb-[50px]">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="text-lg font-semibold">Hello, Aria 👋</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/inbox"
                className="press inline-flex items-center h-9 rounded-md bg-primary px-4 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
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

          <AudienceSection audience={audience} />
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
        </div>
      </AppShell>
    </TooltipProvider>
  );
}
