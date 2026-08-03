import { useMemo, useState, type ReactNode } from "react";
import { fmtIDR, fmtNum } from "@/lib/fmt";
import { SectionCard } from "@/components/scl/app-shell";
import {
  chartTooltipStyle, chartLabelStyle, chartItemStyle, axisColor, gridColor, cursorFill, axisTick,
  BRAND_COLORS, CAPTION, fmtPct, useRevealOnScroll, Reveal, InfoHint, MetricStat, StepFunnel,
  type FunnelStage,
} from "@/components/scl/dashboard-ui";
import {
  LOYALTY_TIERS, TIER_COLOR, DATE_RANGE_OPTIONS, TIER_DISTRIBUTION, TIER_MOVEMENT,
  UPGRADE_JOURNEY, TIER_MAINTENANCE, BENEFIT_EFFECTIVENESS, ADVOCACY_REVENUE, REFERRAL_QUALITY,
  newMembersKpi, tierUpgradeRateKpi, repeatPurchaseRateKpi, referralConversionRateKpi,
  pointsRedemptionRateKpi, pointsSummary, benefitUsage, referralFunnel, topAdvocates,
  type TierFilter, type DateRangeFilter, type LoyaltyTier, type SparkPoint, type Advocate,
} from "@/components/scl/loyalty-metrics";
import {
  UserPlus, Repeat, Share2, ArrowUpCircle, Gift, Coins, Wallet, Percent,
  CircleDollarSign, Tags, UserCheck, ShoppingBasket, ArrowUpRight, Clock3, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell, PieChart, Pie, Sankey, ComposedChart, Line,
} from "recharts";

/**
 * CRM & Loyalty Program Analytics — a dedicated dashboard-within-the-
 * dashboard on the Overview page, boxed as one card like every other
 * Overview section. Deliberately self-contained (own Global Filter row,
 * own KPI strip, own 3 sub-sections) so it never repeats a metric that's
 * already covered by the Overview page's existing sections above it — see
 * loyalty-metrics.ts for the data behind every number here.
 */

const STATUS_COLORS = { maintained: "#10b981", gracePeriod: "#f59e0b", atRisk: "#f97316", decayed: "#f43f5e" };
const TOP_ADVOCATES_LIMIT = 5;

// ── Sparkline — tiny trend chart embedded in a KPI card. ────────────────
function Sparkline({ data, color }: { data: SparkPoint[]; color: string }) {
  return (
    <div className="h-8 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={1.5} isAnimationActive animationDuration={600} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── A titled sub-block inside the outer card — mirrors the "Sales Trend" /
// "Qty Sold — by Brand" nesting pattern OrdersSection already uses, one
// level deeper (Tier Overview / Points & Benefits / Referral & Advocacy
// each bundle several of those inner blocks). ───────────────────────────
function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-border">
      <div className="px-5 pt-4 pb-1">
        <div className="text-sm font-semibold">{title}</div>
      </div>
      {children}
    </div>
  );
}

// ── Custom select — native <select> with a custom chevron (matches the
// rest of the app's dropdown styling instead of the browser default). ───
function FilterSelect<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { label: string; value: T }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-8 appearance-none rounded-md border border-border bg-card/60 pl-2.5 pr-7 text-[12px] text-foreground cursor-pointer hover:bg-card transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
    </div>
  );
}

// ── Global Filter row — Date Range (rolling window or All Time) and Tier.
// Top Advocates' leaderboard window now follows the same Date Range
// filter instead of its own separate control. ───────────────────────────
function GlobalFilterBar({
  window, setWindow, tier, setTier,
}: {
  window: DateRangeFilter; setWindow: (w: DateRangeFilter) => void;
  tier: TierFilter; setTier: (t: TierFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        value={String(window) as DateRangeFilter extends infer T ? string : never}
        onChange={(v) => setWindow((v === "all" ? "all" : Number(v)) as DateRangeFilter)}
        options={DATE_RANGE_OPTIONS.map((o) => ({ label: o.label, value: String(o.value) }))}
      />
      <FilterSelect
        value={tier}
        onChange={setTier}
        options={[{ label: "All Tier", value: "All" }, ...LOYALTY_TIERS.map((t) => ({ label: t, value: t }))]}
      />
    </div>
  );
}

// ── 1a. Tier Distribution — Donut ────────────────────────────────────────
function TierDonut({ tierFilter }: { tierFilter: TierFilter }) {
  const total = TIER_DISTRIBUTION.reduce((s, d) => s + d.count, 0);
  const centerValue = tierFilter === "All" ? total : (TIER_DISTRIBUTION.find((d) => d.tier === tierFilter)?.count ?? 0);
  return (
    <div className="p-4">
      <div className="h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={TIER_DISTRIBUTION} dataKey="count" nameKey="tier" innerRadius={56} outerRadius={82} paddingAngle={3} isAnimationActive animationDuration={700}>
              {TIER_DISTRIBUTION.map((d) => (
                <Cell
                  key={d.tier}
                  fill={TIER_COLOR[d.tier]}
                  fillOpacity={tierFilter === "All" || tierFilter === d.tier ? 1 : 0.2}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={chartTooltipStyle}
              labelStyle={chartLabelStyle}
              itemStyle={chartItemStyle}
              formatter={(v: number, n: string) => [`${fmtNum(v)} members (${((v / total) * 100).toFixed(1)}%)`, n]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center animate-fade-in">
            <div className="text-xl font-semibold stat-value">{fmtNum(centerValue)}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{tierFilter === "All" ? "Total Members" : tierFilter}</div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-1">
        {TIER_DISTRIBUTION.map((d) => (
          <span
            key={d.tier}
            className={`inline-flex items-center gap-1.5 text-[11px] transition-opacity duration-200 ${tierFilter !== "All" && tierFilter !== d.tier ? "opacity-40" : ""}`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: TIER_COLOR[d.tier] }} />
            {d.tier} <span className="text-muted-foreground">({fmtNum(d.count)})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── 1b. Tier Movement — Sankey (Start of cycle → Now) ────────────────────
type SankeyNodeDatum = { name: string; tier: LoyaltyTier; side: "start" | "end" };
function sankeyNodeIndex(tier: LoyaltyTier, side: "start" | "end") {
  return LOYALTY_TIERS.indexOf(tier) + (side === "start" ? 0 : LOYALTY_TIERS.length);
}

function renderSankeyNode(props: { x: number; y: number; width: number; height: number; payload: SankeyNodeDatum; index: number }) {
  const { x, y, width, height, payload } = props;
  const color = TIER_COLOR[payload.tier];
  const isStart = payload.side === "start";
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} fillOpacity={0.9} rx={2} />
      <text
        x={isStart ? x - 8 : x + width + 8}
        y={y + height / 2}
        textAnchor={isStart ? "end" : "start"}
        dominantBaseline="middle"
        fontSize={11}
        fill="var(--foreground)"
      >
        {payload.tier}
      </text>
    </g>
  );
}

type SankeyLinkProps = {
  sourceX: number; sourceY: number; sourceControlX: number;
  targetX: number; targetY: number; targetControlX: number;
  linkWidth: number;
  payload: { source: SankeyNodeDatum };
};
function renderSankeyLink(props: SankeyLinkProps) {
  const { sourceX, sourceY, sourceControlX, targetX, targetY, targetControlX, linkWidth, payload } = props;
  const color = TIER_COLOR[payload.source.tier];
  return (
    <path
      className="transition-opacity duration-150 hover:opacity-80"
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={color}
      strokeWidth={linkWidth}
      strokeOpacity={0.22}
    />
  );
}

function TierMovementSankey() {
  const nodes: SankeyNodeDatum[] = [
    ...LOYALTY_TIERS.map((t): SankeyNodeDatum => ({ name: `${t} · Start`, tier: t, side: "start" })),
    ...LOYALTY_TIERS.map((t): SankeyNodeDatum => ({ name: `${t} · Now`, tier: t, side: "end" })),
  ];
  const links = TIER_MOVEMENT.map((f) => ({
    source: sankeyNodeIndex(f.from, "start"),
    target: sankeyNodeIndex(f.to, "end"),
    value: f.value,
  }));

  return (
    <div className="p-4">
      <div className="flex items-center justify-between px-16 mb-1 text-[9px] uppercase tracking-wide text-muted-foreground">
        <span>Start of Cycle</span>
        <span>End of Cycle</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={{ nodes, links }}
            node={renderSankeyNode}
            link={renderSankeyLink}
            nodePadding={22}
            nodeWidth={10}
            margin={{ top: 4, right: 64, bottom: 4, left: 64 }}
          >
            <Tooltip
              contentStyle={chartTooltipStyle}
              labelStyle={chartLabelStyle}
              itemStyle={chartItemStyle}
              formatter={(v: number) => [`${fmtNum(v)} members`, ""]}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-1">Per review cycle (6 months) · Upgrade, Maintain, or Decay</p>
    </div>
  );
}

// ── 1c. Upgrade Journey — Stat Card + Detail Table ───────────────────────
function UpgradeJourney() {
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3 stagger">
        <MetricStat icon={ArrowUpRight} label="Total Upgrades" value={fmtNum(UPGRADE_JOURNEY.totalUpgrades)} info="Number of members who moved up a tier in the last review cycle." />
        <MetricStat icon={Clock3} label="Avg. Days to Upgrade" value={`${UPGRADE_JOURNEY.avgDaysToUpgrade}d`} info="Average time it takes a member to move up a tier." />
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-[12px]">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Upgrade Path</th>
              <th className="text-right px-3 py-2 font-medium">Members</th>
              <th className="text-right px-3 py-2 font-medium">Avg. Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border stagger">
            {UPGRADE_JOURNEY.paths.map((p) => (
              <tr key={p.path} className="hover:bg-muted/30 transition-colors duration-150">
                <td className="px-3 py-2 font-medium">{p.path}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtNum(p.count)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{p.avgDays}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 1d. Tier Maintenance Status — Stacked Bar + Status Chips ─────────────
function MaintenanceStackedBar({ tierFilter }: { tierFilter: TierFilter }) {
  const data = tierFilter === "All" ? TIER_MAINTENANCE : TIER_MAINTENANCE.filter((r) => r.tier === tierFilter);
  return (
    <div className="p-4">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="tier" stroke={axisColor} tick={axisTick} tickLine={false} axisLine={false} />
            <YAxis stroke={axisColor} tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip cursor={{ fill: cursorFill }} contentStyle={chartTooltipStyle} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} formatter={(v: number, n: string) => [fmtNum(Number(v)), n]} />
            <Bar dataKey="maintained" name="Maintained" stackId="a" fill={STATUS_COLORS.maintained} isAnimationActive animationDuration={700} />
            <Bar dataKey="gracePeriod" name="Grace Period" stackId="a" fill={STATUS_COLORS.gracePeriod} isAnimationActive animationDuration={700} />
            <Bar dataKey="atRisk" name="At Risk" stackId="a" fill={STATUS_COLORS.atRisk} isAnimationActive animationDuration={700} />
            <Bar dataKey="decayed" name="Decayed" stackId="a" fill={STATUS_COLORS.decayed} radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-1">
        {([["Maintained", STATUS_COLORS.maintained], ["Grace Period", STATUS_COLORS.gracePeriod], ["At Risk", STATUS_COLORS.atRisk], ["Decayed", STATUS_COLORS.decayed]] as const).map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── 2a. Points Issued vs Redeemed — Combo Chart ──────────────────────────
function PointsComboChart({ series }: { series: { month: string; pointsIssued: number; pointsRedeemed: number }[] }) {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="month" stroke={axisColor} tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis stroke={axisColor} tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : fmtNum(v))} />
          <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} formatter={(v: number, n: string) => [fmtNum(Number(v)), n === "pointsIssued" ? "Issued" : "Redeemed"]} />
          <Bar dataKey="pointsIssued" name="Issued" fill="var(--chart-2)" radius={[4, 4, 0, 0]} barSize={16} isAnimationActive animationDuration={700} />
          <Line type="monotone" dataKey="pointsRedeemed" name="Redeemed" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive animationDuration={700} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 2b. Benefit Usage — Horizontal Bar ───────────────────────────────────
function BenefitUsageBar({ data }: { data: { benefit: string; count: number }[] }) {
  return (
    <div className="h-56 px-4 pb-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
          <XAxis type="number" stroke={axisColor} tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="benefit" stroke={axisColor} tick={axisTick} tickLine={false} axisLine={false} width={140} />
          <Tooltip cursor={{ fill: cursorFill }} contentStyle={chartTooltipStyle} labelStyle={chartLabelStyle} itemStyle={chartItemStyle} formatter={(v: number) => [fmtNum(Number(v)), "Redemptions"]} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16} isAnimationActive animationDuration={700}>
            {data.map((d, i) => <Cell key={d.benefit} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 2c. Benefit Effectiveness — Ranking Table ────────────────────────────
function BenefitEffectivenessTable() {
  return (
    <div className="overflow-x-auto px-2 pb-3">
      <table className="w-full text-[12px]">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="text-left px-3 py-2 font-medium">#</th>
            <th className="text-left px-3 py-2 font-medium">Benefit</th>
            <th className="text-right px-3 py-2 font-medium">Repeat Purchase</th>
            <th className="text-right px-3 py-2 font-medium">Revenue</th>
            <th className="text-right px-3 py-2 font-medium">Retention</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border stagger">
          {BENEFIT_EFFECTIVENESS.map((b, i) => (
            <tr key={b.benefit} className="hover:bg-muted/30 transition-colors duration-150">
              <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
              <td className="px-3 py-2 font-medium">{b.benefit}</td>
              <td className="px-3 py-2 text-right tabular-nums text-emerald-600">+{fmtPct(b.repeatPurchaseUplift, 0)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-emerald-600">+{fmtPct(b.revenueUplift, 0)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-emerald-600">+{fmtPct(b.retentionUplift, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 3a. Top Advocates — Leaderboard (top 5, compact rows) ────────────────
function AdvocateLeaderboard({ advocates }: { advocates: Advocate[] }) {
  if (advocates.length === 0) {
    return <div className="text-center text-xs text-muted-foreground py-10">No advocates in this tier yet.</div>;
  }
  const max = Math.max(...advocates.map((a) => a.referrals), 1);
  return (
    <div className="p-4 space-y-1.5 stagger">
      {advocates.map((a, i) => (
        <div key={a.contactId} className="flex items-center gap-2.5 rounded-lg border border-border bg-card/40 px-2.5 py-1.5 card-hover transition-all duration-300">
          <span className={`text-[11px] w-4 shrink-0 text-center font-semibold ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-[10px] font-medium shrink-0">{a.avatar}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium truncate leading-tight">{a.name}</div>
            <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground leading-tight">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: TIER_COLOR[a.tier] }} /> {a.tier}
            </span>
          </div>
          <div className="w-14 shrink-0 h-1 rounded-full bg-muted overflow-hidden hidden sm:block">
            <div className="h-full rounded-full animate-grow-x" style={{ width: `${(a.referrals / max) * 100}%`, background: TIER_COLOR[a.tier] }} />
          </div>
          <div className="text-right shrink-0">
            <div className="text-[12px] font-semibold tabular-nums leading-tight">{a.referrals}</div>
            <div className="text-[9px] text-muted-foreground leading-tight">{fmtIDR(a.revenue)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────
export function CrmLoyaltyAnalytics() {
  const { ref, inView } = useRevealOnScroll<HTMLDivElement>();
  const [window, setWindow] = useState<DateRangeFilter>(12);
  const [tier, setTier] = useState<TierFilter>("All");

  const nm = useMemo(() => newMembersKpi(window, tier), [window, tier]);
  const tu = useMemo(() => tierUpgradeRateKpi(window, tier), [window, tier]);
  const rpr = useMemo(() => repeatPurchaseRateKpi(tier), [tier]);
  const rcr = useMemo(() => referralConversionRateKpi(tier), [tier]);
  const prr = useMemo(() => pointsRedemptionRateKpi(window, tier), [window, tier]);
  const points = useMemo(() => pointsSummary(window), [window]);
  const benefitUsageData = useMemo(() => benefitUsage(window), [window]);
  const funnel = useMemo(() => referralFunnel(window), [window]);
  const advocates = useMemo(() => topAdvocates(window, tier).slice(0, TOP_ADVOCATES_LIMIT), [window, tier]);

  const funnelStages: FunnelStage[] = funnel.map((s, i) => ({ label: s.label, value: s.value, color: BRAND_COLORS[i % BRAND_COLORS.length] }));

  return (
    <Reveal innerRef={ref} inView={inView}>
      <SectionCard
        title="CRM & Loyalty Program Analytics"
        action={<GlobalFilterBar window={window} setWindow={setWindow} tier={tier} setTier={setTier} />}
      >
        {/* Top KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 p-4 stagger">
          <MetricStat
            icon={UserPlus}
            label="New Members"
            value={fmtNum(nm.value)}
            sub={nm.applies ? (nm.hasPreviousPeriod ? `${nm.deltaPct >= 0 ? "+" : ""}${(nm.deltaPct * 100).toFixed(1)}% vs previous period` : "No prior period in range") : "Always starts at Bronze"}
            accent={nm.applies && nm.hasPreviousPeriod ? (nm.deltaPct >= 0 ? "up" : "down") : undefined}
            info="Total new members who registered in the selected period."
            spark={<Sparkline data={nm.spark} color="var(--chart-1)" />}
          />
          <MetricStat icon={Repeat} label="Repeat Purchase Rate" value={fmtPct(rpr)} info="Members with 2+ transactions ÷ total members who ever transacted." />
          <MetricStat icon={Share2} label="Referral Conversion Rate" value={fmtPct(rcr)} info="Successful referrals ÷ referrals shared." />
          <MetricStat
            icon={ArrowUpCircle}
            label="Tier Upgrade Rate"
            value={fmtPct(tu.value)}
            info="Members who upgraded ÷ members eligible for review."
            spark={<Sparkline data={tu.spark} color="var(--chart-2)" />}
          />
          <MetricStat icon={Gift} label="Points Redemption Rate" value={fmtPct(prr)} info="Points redeemed ÷ points issued." />
        </div>

        {/* 1. Tier Overview */}
        <SubSection title="Tier Overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border border-t border-border">
            <div>
              <div className={`px-4 pt-3 pb-0.5 inline-flex items-center gap-1 ${CAPTION}`}>
                Tier Distribution <InfoHint text="Member count in each tier." />
              </div>
              <TierDonut tierFilter={tier} />
            </div>
            <div>
              <div className={`px-4 pt-3 pb-0.5 inline-flex items-center gap-1 ${CAPTION}`}>
                Tier Movement <InfoHint text="How members moved between tiers over the review cycle: Upgrade, Maintain, or Decay." />
              </div>
              <TierMovementSankey />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border border-t border-border">
            <div>
              <div className={`px-4 pt-3 pb-0.5 inline-flex items-center gap-1 ${CAPTION}`}>
                Upgrade Journey <InfoHint text="The most common upgrade paths and the average time it takes to move up a tier." />
              </div>
              <UpgradeJourney />
            </div>
            <div>
              <div className={`px-4 pt-3 pb-0.5 inline-flex items-center gap-1 ${CAPTION}`}>
                Tier Maintenance Status <InfoHint text="Members who maintained their tier, entered a grace period, are at risk, or already decayed." />
              </div>
              <MaintenanceStackedBar tierFilter={tier} />
            </div>
          </div>
        </SubSection>

        {/* 2. Points & Benefits */}
        <SubSection title="Points & Benefits">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 stagger">
            <MetricStat icon={Coins} label="Points Issued" value={fmtNum(points.issued)} info="Total loyalty points issued in the selected period." />
            <MetricStat icon={Gift} label="Points Redeemed" value={fmtNum(points.redeemed)} info="Total loyalty points redeemed in the selected period." />
            <MetricStat icon={Wallet} label="Outstanding Points" value={fmtNum(points.outstanding)} info="Points not yet redeemed — cumulative, never resets." />
            <MetricStat icon={Percent} label="Redemption Rate" value={fmtPct(points.redemptionRate)} info="Points redeemed ÷ points issued." />
          </div>
          <div className="border-t border-border p-4">
            <div className={`${CAPTION} mb-2`}>Points Issued vs Redeemed</div>
            <PointsComboChart series={points.series} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border border-t border-border">
            <div>
              <div className={`px-4 pt-3 pb-0.5 inline-flex items-center gap-1 ${CAPTION}`}>
                Benefit Usage <InfoHint text="Which benefits members use the most." />
              </div>
              <BenefitUsageBar data={benefitUsageData} />
            </div>
            <div>
              <div className={`px-4 pt-3 pb-0.5 inline-flex items-center gap-1 ${CAPTION}`}>
                Benefit Effectiveness <InfoHint text="Which benefits are most successful at lifting customer activity after redemption." />
              </div>
              <BenefitEffectivenessTable />
            </div>
          </div>
        </SubSection>

        {/* 3. Referral & Advocacy */}
        <SubSection title="Referral & Advocacy">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border border-t border-border">
            <div>
              <div className={`px-4 pt-3 pb-0.5 inline-flex items-center gap-1 ${CAPTION}`}>
                Referral Funnel <InfoHint text="Referral performance at each stage of the funnel." />
              </div>
              <StepFunnel stages={funnelStages} />
            </div>
            <div>
              <div className={`px-4 pt-3 pb-0.5 inline-flex items-center gap-1 ${CAPTION}`}>
                Top Advocates <InfoHint text="Members with the biggest referral contribution, ranked by successful referrals and referral revenue." />
              </div>
              <AdvocateLeaderboard advocates={advocates} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-t border-border stagger">
            <MetricStat icon={CircleDollarSign} label="Revenue from Referral" value={fmtIDR(ADVOCACY_REVENUE.revenueFromReferral)} info="Total revenue contributed through referrals." />
            <MetricStat icon={Wallet} label="Referral CLV" value={fmtIDR(ADVOCACY_REVENUE.referralCLV)} info="Average lifetime value of a referred customer." />
            <MetricStat icon={Tags} label="Referral AOV" value={fmtIDR(ADVOCACY_REVENUE.referralAOV)} info="Average order value of a referred customer." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-t border-border stagger">
            <MetricStat icon={Repeat} label="Referred Repeat Purchase Rate" value={fmtPct(REFERRAL_QUALITY.repeatPurchaseRate)} info="Repeat purchase rate among referred customers." />
            <MetricStat icon={UserCheck} label="Referred Retention Rate" value={fmtPct(REFERRAL_QUALITY.retentionRate)} info="Retention rate among referred customers." />
            <MetricStat icon={ShoppingBasket} label="Referred AOV" value={fmtIDR(REFERRAL_QUALITY.aov)} info="Average order value among referred customers." />
          </div>
        </SubSection>
      </SectionCard>
    </Reveal>
  );
}
