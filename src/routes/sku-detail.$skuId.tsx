import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { useSkuStore } from "@/components/scl/sku-store";
import { useTransactionsStore, formatIDR } from "@/components/scl/transactions-store";
import { useMemo, useState } from "react";
import { Package, TrendingUp, ShoppingCart, DollarSign, Hash, ImageIcon, ChevronRight, Calendar } from "lucide-react";

export const Route = createFileRoute("/sku-detail/$skuId")({
  head: () => ({ meta: [{ title: "SKU Details — Aroma Abadi" }] }),
  component: SkuDetailPage,
});

type DatePreset = "7d" | "30d" | "90d" | "custom";

function SkuDetailPage() {
  const { skuId } = useParams({ from: "/sku-detail/$skuId" });
  const navigate = useNavigate();
  const { brands } = useSkuStore();
  const { transactions } = useTransactionsStore();

  // ── Date filter state ──────────────────────────────────────────────────
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const dateRange = useMemo(() => {
    const now = new Date();
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    if (preset === "7d")  { const f = new Date(now); f.setDate(f.getDate() - 6);  return { from: f, to }; }
    if (preset === "30d") { const f = new Date(now); f.setDate(f.getDate() - 29); return { from: f, to }; }
    if (preset === "90d") { const f = new Date(now); f.setDate(f.getDate() - 89); return { from: f, to }; }
    if (preset === "custom" && customFrom && customTo) {
      return { from: new Date(customFrom + "T00:00:00"), to: new Date(customTo + "T23:59:59") };
    }
    return null;
  }, [preset, customFrom, customTo]);

  // ── Find SKU ───────────────────────────────────────────────────────────
  const found = useMemo(() => {
    for (const b of brands) {
      for (const c of b.categories) {
        for (const s of c.skus) {
          if (s.id === skuId) return { sku: s, brand: b, category: c };
        }
      }
    }
    return null;
  }, [brands, skuId]);

  // ── All transactions for this SKU ──────────────────────────────────────
  const allRelatedTx = useMemo(
    () => transactions.filter((t) => t.items.some((i) => i.skuId === skuId)),
    [transactions, skuId]
  );

  // ── Filtered by date range ─────────────────────────────────────────────
  const relatedTx = useMemo(() => {
    if (!dateRange) return allRelatedTx;
    return allRelatedTx.filter((t) => {
      const d = new Date(t.date);
      return d >= dateRange.from && d <= dateRange.to;
    });
  }, [allRelatedTx, dateRange]);

  // ── Metrics (filtered) ─────────────────────────────────────────────────
  const metrics = useMemo(() => {
    let unitsSold = 0, revenue = 0;
    relatedTx.forEach((t) => {
      if (t.status !== "Cancelled") {
        t.items.forEach((i) => {
          if (i.skuId === skuId) { unitsSold += i.qty; revenue += i.qty * i.unitPrice; }
        });
      }
    });
    return {
      unitsSold,
      revenue,
      avgOrderValue: relatedTx.length ? Math.round(revenue / relatedTx.length) : 0,
      txCount: relatedTx.length,
    };
  }, [relatedTx, skuId]);

  if (!found) {
    return (
      <AppShell backTo="/sku" title="SKU Details">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground gap-3">
          <Package className="h-10 w-10 text-muted-foreground/30" />
          <div>SKU not found.</div>
        </div>
      </AppShell>
    );
  }

  const { sku, brand, category } = found;

  return (
    <AppShell backTo="/sku" title={sku.name}>
      <div className="max-w-4xl space-y-6 animate-fade-in">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-muted-foreground">
          <button onClick={() => navigate({ to: "/sku" })} className="hover:text-foreground transition-colors">SKU & Knowledge</button>
          <ChevronRight className="h-3 w-3 opacity-40" />
          <span>{brand.name}</span>
          <ChevronRight className="h-3 w-3 opacity-40" />
          <span>{category.name}</span>
          <ChevronRight className="h-3 w-3 opacity-40" />
          <span className="text-foreground font-medium truncate">{sku.name}</span>
        </nav>

        {/* SKU Header card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-start gap-5 shadow-sm">
          <div className="h-24 w-24 rounded-lg bg-gray-50 border border-gray-200 grid place-items-center overflow-hidden shrink-0">
            {sku.photoUrl
              ? <img src={sku.photoUrl} alt={sku.name} className="h-full w-full object-cover" />
              : <ImageIcon className="h-8 w-8 text-primary/40" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-semibold">{sku.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 font-mono">{sku.code}</div>
            <div className="text-base font-bold text-primary mt-2">{formatIDR(sku.price)}</div>
            {sku.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{sku.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{brand.name}</span>
              <span className="text-muted-foreground/60">·</span>
              <span>{category.name}</span>
            </div>
          </div>
        </div>

        {/* ── Date Filter ── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-medium">Period:</span>
          </div>
          <div className="flex items-center gap-1">
            {(["7d", "30d", "90d", "custom"] as DatePreset[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                className={`px-3 h-7 rounded-md text-[11px] font-medium border transition-colors ${
                  preset === p
                    ? "border-primary/40 bg-primary/15 text-foreground"
                    : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card"
                }`}
              >
                {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : p === "90d" ? "90 Days" : "Custom"}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-7 rounded-md border border-border bg-card px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <span className="text-[11px] text-muted-foreground">–</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-7 rounded-md border border-border bg-card px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Units Sold", value: metrics.unitsSold.toLocaleString(), icon: ShoppingCart, color: "text-sky-600", bg: "bg-sky-50" },
            { label: "Total Revenue", value: formatIDR(metrics.revenue), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Transactions", value: metrics.txCount.toLocaleString(), icon: Hash, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Avg Order Value", value: formatIDR(metrics.avgOrderValue), icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-gray-200 bg-white p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
              <div className={`h-9 w-9 rounded-md ${m.bg} grid place-items-center shrink-0`}>
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground">{m.label}</div>
                <div className="text-base font-semibold mt-0.5 truncate">{m.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Transaction History */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Transaction History</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {relatedTx.length} transaction{relatedTx.length !== 1 ? "s" : ""}
                {allRelatedTx.length !== relatedTx.length && (
                  <span className="ml-1 text-muted-foreground/60">· {allRelatedTx.length} total</span>
                )}
              </div>
            </div>
          </div>

          {relatedTx.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No transactions in this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Invoice</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Customer</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">BA</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Store</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Qty</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Subtotal</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {relatedTx.map((t) => {
                    const line = t.items.find((i) => i.skuId === skuId)!;
                    const statusColor =
                      t.status === "Shipped"   ? "border-emerald-700 bg-emerald-600 text-white" :
                      t.status === "Cancelled" ? "border-rose-700 bg-rose-600 text-white" :
                                                 "border-sky-700 bg-sky-600 text-white";
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-[13px] font-medium">{t.invoice}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[13px]">{t.customerName}</td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground">{t.baName}</td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground">{t.store}</td>
                        <td className="px-4 py-3 text-right text-[13px] font-medium tabular-nums">{line.qty}</td>
                        <td className="px-4 py-3 text-right text-[13px] font-medium tabular-nums">{formatIDR(line.qty * line.unitPrice)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusColor}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
