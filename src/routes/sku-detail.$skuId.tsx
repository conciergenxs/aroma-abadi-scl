import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { useSkuStore } from "@/components/scl/sku-store";
import { useTransactionsStore, formatIDR } from "@/components/scl/transactions-store";
import { useMemo } from "react";
import { Package, TrendingUp, ShoppingCart, DollarSign, Hash, ImageIcon, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/sku-detail/$skuId")({
  head: () => ({ meta: [{ title: "SKU Details — Aroma Abadi" }] }),
  component: SkuDetailPage,
});

function SkuDetailPage() {
  const { skuId } = useParams({ from: "/sku-detail/$skuId" });
  const navigate = useNavigate();
  const { brands } = useSkuStore();
  const { transactions } = useTransactionsStore();

  // Find SKU across all brands/categories
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

  // Transactions that include this SKU
  const relatedTx = useMemo(
    () => transactions.filter((t) => t.items.some((i) => i.skuId === skuId)),
    [transactions, skuId]
  );

  const metrics = useMemo(() => {
    let unitsSold = 0;
    let revenue = 0;
    relatedTx.forEach((t) => {
      if (t.status !== "Cancelled") {
        t.items.forEach((i) => {
          if (i.skuId === skuId) {
            unitsSold += i.qty;
            revenue += i.qty * i.unitPrice;
          }
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
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-sm font-semibold">Transaction History</div>
            <div className="text-xs text-muted-foreground mt-0.5">{relatedTx.length} transaction{relatedTx.length !== 1 ? "s" : ""} involving this SKU</div>
          </div>

          {relatedTx.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No transactions yet for this SKU.</div>
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
                      t.status === "Completed" ? "border-emerald-700 bg-emerald-600 text-white" :
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
