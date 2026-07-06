import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { useTransactionsStore, formatIDR, type Transaction, type TxStatus } from "@/components/scl/transactions-store";
import { Search, Receipt, TrendingUp, Wallet, Package, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transaction Records — Aroma Abadi" },
      { name: "description", content: "Catatan transaksi penjualan Aroma Abadi per store, BA, dan brand." },
      { property: "og:title", content: "Transaction Records — Aroma Abadi" },
      { property: "og:description", content: "Pantau transaksi WhatsApp & in-store Aroma Abadi." },
    ],
  }),
  component: TransactionsPage,
});

function statusBadge(s: TxStatus) {
  if (s === "Paid") return "border-emerald-700 bg-emerald-600 text-white";
  if (s === "Pending") return "border-amber-700 bg-amber-600 text-white";
  return "border-rose-700 bg-rose-600 text-white";
}

function TransactionsPage() {
  const { transactions } = useTransactionsStore();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<string>("all");
  const [store, setStore] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [open, setOpen] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const cities = useMemo(() => Array.from(new Set(transactions.map((t) => t.city))).sort(), [transactions]);
  const stores = useMemo(() => {
    const src = city === "all" ? transactions : transactions.filter((t) => t.city === city);
    return Array.from(new Set(src.map((t) => t.store))).sort();
  }, [transactions, city]);
  const brands = useMemo(() => Array.from(new Set(transactions.map((t) => t.brandName))).sort(), [transactions]);

  // Reset store when city changes
  const handleCityChange = (v: string) => { setCity(v); setStore("all"); };

  const filtered = transactions.filter((t) => {
    if (city !== "all" && t.city !== city) return false;
    if (store !== "all" && t.store !== store) return false;
    if (brand !== "all" && t.brandName !== brand) return false;
    if (status !== "all" && t.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !t.invoice.toLowerCase().includes(q) &&
        !t.customerName.toLowerCase().includes(q) &&
        !t.baName.toLowerCase().includes(q) &&
        !t.store.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePageSize = pageSize === 0 ? filtered.length : pageSize;
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / safePageSize)));
  const paginated = pageSize === 0 ? filtered : filtered.slice((safePage - 1) * safePageSize, safePage * safePageSize);

  const today = new Date().toDateString();
  const todayTx = transactions.filter((t) => new Date(t.date).toDateString() === today);
  const revenue = todayTx.reduce((acc, t) => acc + (t.status === "Paid" ? t.total : 0), 0);
  const aov = todayTx.length ? Math.round(revenue / Math.max(1, todayTx.length)) : 0;
  const topSku = (() => {
    const map = new Map<string, number>();
    transactions.forEach((t) => t.items.forEach((i) => map.set(i.skuName, (map.get(i.skuName) || 0) + i.qty)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  })();

  return (
    <AppShell title="Transaction Records" subtitle="Catatan transaksi penjualan Aroma Abadi">
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard label="Revenue Hari Ini" value={formatIDR(revenue)} icon={Wallet} />
          <StatCard label="Transaksi Hari Ini" value={todayTx.length.toLocaleString("id-ID")} icon={Receipt} />
          <StatCard label="AOV Hari Ini" value={formatIDR(aov)} icon={TrendingUp} />
          <StatCard label="Top SKU" value={topSku} icon={Package} />
        </div>

        {/* Toolbar */}
        <SectionCard>
          <div className="p-3 flex flex-wrap items-center gap-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari invoice, customer, BA, store…"
                className="h-8 w-72 max-w-full rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <Select value={city} onChange={handleCityChange} options={[{ value: "all", label: "Semua Kota" }, ...cities.map((c) => ({ value: c, label: c }))]} />
            <Select value={store} onChange={setStore} options={[{ value: "all", label: "Semua Store" }, ...stores.map((s) => ({ value: s, label: s }))]} />
            <Select value={brand} onChange={setBrand} options={[{ value: "all", label: "Semua Brand" }, ...brands.map((c) => ({ value: c, label: c }))]} />
            <Select value={status} onChange={setStatus} options={[
              { value: "all", label: "Semua Status" },
              { value: "Paid", label: "Paid" },
              { value: "Pending", label: "Pending" },
              { value: "Refunded", label: "Refunded" },
            ]} />
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">{filtered.length} transaksi</span>
              <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span>Tampil</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="h-7 rounded-md border border-border bg-card/60 px-2 pr-6 text-xs appearance-none"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.35rem center", backgroundSize: "1.2em 1.2em" }}
                >
                  {[5, 10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                  <option value={0}>Semua</option>
                </select>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <Th>Invoice</Th>
                  <Th>Tanggal</Th>
                  <Th>Customer</Th>
                  <Th>BA</Th>
                  <Th>Store / Kota</Th>
                  <Th>Brand</Th>
                  <Th>Items</Th>
                  <Th>Total</Th>
                  <Th>Bayar</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="stagger">
                {paginated.map((t) => (
                  <tr key={t.id} className="border-b border-border hover:bg-white/[0.025] cursor-pointer align-top transition-colors" onClick={() => setOpen(t)}>
                    <Td className="font-medium text-foreground">{t.invoice}</Td>
                    <Td>{new Date(t.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</Td>
                    <Td>{t.customerName}</Td>
                    <Td>{t.baName}</Td>
                    <Td>{t.store} · <span className="text-muted-foreground">{t.city}</span></Td>
                    <Td>{t.brandName}</Td>
                    <Td>
                      <ul className="space-y-1">
                        {t.items.map((i, idx) => (
                          <li key={idx} className="leading-tight">
                            <span className="text-foreground">{i.skuName}</span>
                            <span className="text-muted-foreground"> · {i.qty} pcs</span>
                          </li>
                        ))}
                      </ul>
                    </Td>
                    <Td className="font-medium text-foreground whitespace-nowrap">{formatIDR(t.total)}</Td>
                    <Td>{t.paymentMethod}</Td>
                    <Td>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusBadge(t.status)}`}>{t.status}</span>
                    </Td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-10 text-muted-foreground text-sm">Tidak ada transaksi</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border text-[11px] text-muted-foreground">
              <span>
                {((safePage - 1) * safePageSize) + 1}–{Math.min(safePage * safePageSize, filtered.length)} dari {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="h-7 w-7 grid place-items-center rounded border border-border bg-card/40 hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : safePage <= 4 ? i + 1 : safePage >= totalPages - 3 ? totalPages - 6 + i : safePage - 3 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`h-7 w-7 grid place-items-center rounded border text-[11px] font-medium transition-colors ${p === safePage ? "border-primary/40 bg-primary/15 text-foreground" : "border-border bg-card/40 hover:bg-card text-muted-foreground"}`}
                    >{p}</button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="h-7 w-7 grid place-items-center rounded border border-border bg-card/40 hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {open && <TxDrawer tx={open} onClose={() => setOpen(null)} />}
    </AppShell>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left font-medium px-3 py-2.5 text-xs uppercase tracking-wide ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Receipt }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 glass p-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-md bg-primary/10 grid place-items-center"><Icon className="h-4 w-4 text-primary" /></div>
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="text-base font-semibold mt-0.5 truncate">{value}</div>
      </div>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-8 rounded-md border border-border bg-card/60 px-2 text-xs">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function TxDrawer({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-l border-border overflow-y-auto slide-in-right">
        <div className="p-5 border-b border-border flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Invoice</div>
            <div className="text-base font-semibold">{tx.invoice}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{new Date(tx.date).toLocaleString("id-ID")}</div>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Tutup</button>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <Row label="Customer" value={tx.customerName} />
          <Row label="BA" value={tx.baName} />
          <Row label="Store" value={`${tx.store} · ${tx.city}`} />
          <Row label="Brand" value={tx.brandName} />
          <Row label="Metode Bayar" value={tx.paymentMethod} />
          <Row label="Status" value={tx.status} />
          {tx.note && <Row label="Catatan BA" value={tx.note} />}

          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Items</div>
            <ul className="divide-y divide-border rounded-md border border-border">
              {tx.items.map((i, idx) => (
                <li key={idx} className="px-3 py-2 flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{i.skuName} · {i.qty} pcs</div>
                    <div className="text-xs text-muted-foreground">{i.skuCode} · {formatIDR(i.unitPrice)}</div>
                  </div>
                  <div className="text-right font-medium">{formatIDR(i.unitPrice * i.qty)}</div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between mt-3 text-sm font-semibold">
              <span>Total</span>
              <span>{formatIDR(tx.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
