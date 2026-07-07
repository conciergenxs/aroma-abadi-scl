import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { useSkuStore } from "@/components/scl/sku-store";
import { useTransactionsStore, formatIDR } from "@/components/scl/transactions-store";
import { Fragment, useMemo, useState } from "react";
import {
  Package, TrendingUp, ShoppingCart, DollarSign, Hash,
  ImageIcon, ChevronRight, Calendar, Search, ChevronLeft,
} from "lucide-react";

export const Route = createFileRoute("/sku-detail/$skuId")({
  head: () => ({ meta: [{ title: "SKU Details — Aroma Abadi" }] }),
  component: SkuDetailPage,
});

// Default date range: last 30 days
function defaultFrom() {
  const d = new Date(); d.setDate(d.getDate() - 29);
  return d.toISOString().slice(0, 10);
}
function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const STATUS_COLORS: Record<string, string> = {
  Shipped:   "border-emerald-700 bg-emerald-600 text-white",
  Processed: "border-sky-700    bg-sky-500     text-white",
  Cancelled: "border-rose-700   bg-rose-600    text-white",
};

function SkuDetailPage() {
  const { skuId } = useParams({ from: "/sku-detail/$skuId" });
  const navigate  = useNavigate();
  const { brands }        = useSkuStore();
  const { transactions }  = useTransactionsStore();

  // ── Filters ────────────────────────────────────────────────────────────
  const [search,     setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Processed" | "Shipped" | "Cancelled">("all");
  const [preset,     setPreset]     = useState<DatePreset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");
  const [page,       setPage]       = useState(1);
  const PAGE_SIZE = 10;

  // ── Date range ─────────────────────────────────────────────────────────
  const dateRange = useMemo(() => {
    const now = new Date(); const to = new Date(now); to.setHours(23,59,59,999);
    if (preset === "7d")  { const f = new Date(now); f.setDate(f.getDate()-6);  return { from:f, to }; }
    if (preset === "30d") { const f = new Date(now); f.setDate(f.getDate()-29); return { from:f, to }; }
    if (preset === "90d") { const f = new Date(now); f.setDate(f.getDate()-89); return { from:f, to }; }
    if (preset === "all") return null;
    if (preset === "custom" && customFrom && customTo)
      return { from: new Date(customFrom+"T00:00:00"), to: new Date(customTo+"T23:59:59") };
    return null;
  }, [preset, customFrom, customTo]);

  // ── Find SKU ───────────────────────────────────────────────────────────
  const found = useMemo(() => {
    for (const b of brands) for (const c of b.categories) for (const s of c.skus)
      if (s.id === skuId) return { sku:s, brand:b, category:c };
    return null;
  }, [brands, skuId]);

  // ── All tx for this SKU ────────────────────────────────────────────────
  const allRelatedTx = useMemo(
    () => transactions.filter((t) => t.items.some((i) => i.skuId === skuId)),
    [transactions, skuId],
  );

  // ── Filtered tx ────────────────────────────────────────────────────────
  const filteredTx = useMemo(() => {
    let list = allRelatedTx;
    if (dateRange) list = list.filter((t) => { const d=new Date(t.date); return d>=dateRange.from && d<=dateRange.to; });
    if (filterStatus !== "all") list = list.filter((t) => t.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.invoice.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.baName.toLowerCase().includes(q) ||
        t.store.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allRelatedTx, dateRange, filterStatus, search]);

  // ── Metrics from filtered data ─────────────────────────────────────────
  const metrics = useMemo(() => {
    let unitsSold=0, revenue=0;
    filteredTx.forEach((t) => {
      if (t.status !== "Cancelled") t.items.forEach((i) => {
        if (i.skuId === skuId) { unitsSold += i.qty; revenue += i.qty * i.unitPrice; }
      });
    });
    return {
      unitsSold, revenue,
      avgOrderValue: filteredTx.length ? Math.round(revenue/filteredTx.length) : 0,
      txCount: filteredTx.length,
    };
  }, [filteredTx, skuId]);

  // ── Pagination ─────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredTx.length / PAGE_SIZE));
  const pagedTx    = filteredTx.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

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
    <AppShell backTo="/sku" title="SKU Details" subtitle={sku.name}>
      <div className="space-y-5 animate-fade-in">

        {/* Breadcrumb — all clickable */}
        <nav className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
          <button
            type="button"
            onClick={() => navigate({ to: "/sku" })}
            className="hover:text-foreground transition-colors hover:underline underline-offset-2"
          >SKU & Knowledge</button>
          <ChevronRight className="h-3 w-3 opacity-40 shrink-0" />
          <button
            type="button"
            onClick={() => navigate({ to: "/sku" })}
            className="hover:text-foreground transition-colors hover:underline underline-offset-2"
          >{brand.name}</button>
          <ChevronRight className="h-3 w-3 opacity-40 shrink-0" />
          <button
            type="button"
            onClick={() => navigate({ to: "/sku" })}
            className="hover:text-foreground transition-colors hover:underline underline-offset-2"
          >{category.name}</button>
          <ChevronRight className="h-3 w-3 opacity-40 shrink-0" />
          <span className="text-foreground font-medium truncate">{sku.name}</span>
        </nav>

        {/* SKU Header — full width */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-start gap-5 shadow-sm">
          <div className="h-24 w-24 rounded-lg bg-gray-50 border border-gray-200 grid place-items-center overflow-hidden shrink-0">
            {sku.photoUrl
              ? <img src={sku.photoUrl} alt={sku.name} className="h-full w-full object-cover" />
              : <ImageIcon className="h-8 w-8 text-primary/40" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">{sku.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">{sku.code}</div>
              </div>
              <div className="text-xl font-bold text-primary shrink-0">{formatIDR(sku.price)}</div>
            </div>
            {sku.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">{sku.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{brand.name}</span>
              <span className="text-muted-foreground/60">·</span>
              <span>{category.name}</span>
            </div>
          </div>
        </div>

        {/* ── Filters row ── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search invoice, customer, BA…"
              className="h-9 w-56 rounded-md border border-border bg-card/60 pl-9 pr-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1">
            {(["all", "Processed", "Shipped", "Cancelled"] as const).map((s) => (
              <button key={s} type="button"
                onClick={() => { setFilterStatus(s); setPage(1); }}
                className={`px-3 h-9 rounded-md text-[11px] font-medium border transition-colors ${
                  filterStatus === s
                    ? "border-primary/40 bg-primary/15 text-foreground"
                    : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card"
                }`}>
                {s === "all" ? "All Status" : s}
              </button>
            ))}
          </div>

          {/* Date preset */}
          <div className="flex items-center gap-1 ml-auto">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {(["7d","30d","90d","all","custom"] as DatePreset[]).map((p) => (
              <button key={p} type="button"
                onClick={() => { setPreset(p); setPage(1); }}
                className={`px-3 h-9 rounded-md text-[11px] font-medium border transition-colors ${
                  preset === p
                    ? "border-primary/40 bg-primary/15 text-foreground"
                    : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card"
                }`}>
                {p==="7d"?"7 Hari":p==="30d"?"30 Hari":p==="90d"?"90 Hari":p==="all"?"Semua":"Custom"}
              </button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={(e)=>{setCustomFrom(e.target.value);setPage(1);}}
                className="h-9 rounded-md border border-border bg-card px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
              <span className="text-[11px] text-muted-foreground">–</span>
              <input type="date" value={customTo} onChange={(e)=>{setCustomTo(e.target.value);setPage(1);}}
                className="h-9 rounded-md border border-border bg-card px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>
          )}
        </div>

        {/* Metrics — full width 4 cols */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Unit Terjual",    value: String(metrics.unitsSold), icon: ShoppingCart, color:"text-sky-600",     bg:"bg-sky-50" },
            { label:"Total Revenue",   value: formatIDR(metrics.revenue),         icon: DollarSign,   color:"text-emerald-600", bg:"bg-emerald-50" },
            { label:"Transaksi",       value: String(metrics.txCount),   icon: Hash,         color:"text-violet-600",  bg:"bg-violet-50" },
            { label:"Rata-rata Order", value: formatIDR(metrics.avgOrderValue),   icon: TrendingUp,   color:"text-amber-600",   bg:"bg-amber-50" },
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

        {/* Transaction Table — full width */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Riwayat Transaksi</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {filteredTx.length} transaksi
                {allRelatedTx.length !== filteredTx.length && <span className="ml-1 opacity-60">· {allRelatedTx.length} total</span>}
              </div>
            </div>
          </div>

          {filteredTx.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Tidak ada transaksi di periode ini.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {["Invoice","Customer","BA","Store","Kota","Qty","Subtotal","Status"].map((h) => (
                        <th key={h} className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${h==="Qty"||h==="Subtotal"?"text-right":"text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedTx.map((t) => {
                      const line = t.items.find((i) => i.skuId === skuId)!;
                      return (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="text-[13px] font-medium">{t.invoice}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {formatDate(t.date)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[13px]">{t.customerName}</td>
                          <td className="px-4 py-3 text-[13px] text-muted-foreground">{t.baName}</td>
                          <td className="px-4 py-3 text-[13px] text-muted-foreground">{t.store}</td>
                          <td className="px-4 py-3 text-[13px] text-muted-foreground">{t.city}</td>
                          <td className="px-4 py-3 text-right text-[13px] font-medium tabular-nums">{line.qty}</td>
                          <td className="px-4 py-3 text-right text-[13px] font-medium tabular-nums">{formatIDR(line.qty * line.unitPrice)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[t.status] ?? "border-gray-400 bg-gray-400 text-white"}`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Menampilkan {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filteredTx.length)} dari {filteredTx.length}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}
                      className="h-7 w-7 grid place-items-center rounded border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    {Array.from({length:totalPages},(_,i)=>i+1).filter(p=> p===1||p===totalPages||Math.abs(p-page)<=1).map((p,idx,arr)=>(
                      <Fragment key={p}>
                        {idx>0 && arr[idx-1]!==p-1 && <span className="px-1 text-muted-foreground">…</span>}
                        <button type="button" onClick={()=>setPage(p)}
                          className={`h-7 w-7 rounded border text-[11px] ${p===page?"border-primary/40 bg-primary/15 text-foreground":"border-gray-200 bg-white hover:bg-gray-50"}`}>
                          {p}
                        </button>
                      </Fragment>
                    ))}
                    <button type="button" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}
                      className="h-7 w-7 grid place-items-center rounded border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </AppShell>
  );
}
