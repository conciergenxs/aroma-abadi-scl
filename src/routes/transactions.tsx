import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import { useTransactionsStore, formatIDR, type Transaction } from "@/components/scl/transactions-store";
import { Search, Receipt, TrendingUp, Wallet, Package, ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";
import { contacts } from "@/components/scl/mock-data";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Transaction Records — Aroma Abadi" },
      { property: "og:title", content: "Transaction Records — Aroma Abadi" },
    ],
  }),
  component: TransactionsPage,
});

function statusBadge(s: string) {
  if (s === "Shipped") return "border-emerald-700 bg-emerald-600 text-white";
  if (s === "Cancelled") return "border-rose-700 bg-rose-600 text-white";
  return "border-sky-700 bg-sky-600 text-white"; // Processed
}

function TransactionsPage() {
  const navigate = useNavigate();
  const { transactions } = useTransactionsStore();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<string>("all");
  const [store, setStore] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [open, setOpen] = useState<Transaction | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const cities = useMemo(() => Array.from(new Set(transactions.map((t) => t.city))).sort(), [transactions]);
  const stores = useMemo(() => {
    const src = city === "all" ? transactions : transactions.filter((t) => t.city === city);
    return Array.from(new Set(src.map((t) => t.store))).sort();
  }, [transactions, city]);
  const brands = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => t.brandNames.forEach((b) => set.add(b)));
    return Array.from(set).sort();
  }, [transactions]);

  const handleCityChange = (v: string) => { setCity(v); setStore("all"); };

  const filtered = useMemo(() => transactions.filter((t) => {
    if (city !== "all" && t.city !== city) return false;
    if (store !== "all" && t.store !== store) return false;
    if (brand !== "all" && !t.brandNames.includes(brand)) return false;
    if (dateFrom) {
      const txDate = new Date(t.date); txDate.setHours(0, 0, 0, 0);
      const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
      if (txDate < from) return false;
    }
    if (dateTo) {
      const txDate = new Date(t.date); txDate.setHours(23, 59, 59, 999);
      const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
      if (txDate > to) return false;
    }
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
  }), [transactions, city, store, brand, dateFrom, dateTo, search]);

  const safePageSize = pageSize === 0 ? filtered.length || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(filtered.length / safePageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = pageSize === 0 ? filtered : filtered.slice((safePage - 1) * safePageSize, safePage * safePageSize);

  const today = new Date().toDateString();
  const todayTx = transactions.filter((t) => new Date(t.date).toDateString() === today);
  const revenue = todayTx.reduce((acc, t) => acc + t.total, 0);
  const aov = todayTx.length ? Math.round(revenue / Math.max(1, todayTx.length)) : 0;
  const topSku = (() => {
    const map = new Map<string, number>();
    transactions.forEach((t) => t.items.forEach((i) => map.set(i.skuName, (map.get(i.skuName) || 0) + i.qty)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  })();

  const showPagination = pageSize > 0;
  const from = filtered.length === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const to = Math.min(safePage * safePageSize, filtered.length);

  return (
    <AppShell title="Transaction Records" subtitle="Sales transactions per store, BA, and brand">
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard label="Today's Revenue" value={formatIDR(revenue)} icon={Wallet} />
          <StatCard label="Today's Transactions" value={todayTx.length.toLocaleString()} icon={Receipt} />
          <StatCard label="Today's AOV" value={formatIDR(aov)} icon={TrendingUp} />
          <StatCard label="Top SKU" value={topSku} icon={Package} />
        </div>

        {/* Toolbar */}
        <SectionCard>
          <div className="p-3 flex flex-wrap items-center gap-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search invoice, customer, BA, store…"
                className="h-8 w-64 max-w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow"
              />
            </div>
            <Select value={city} onChange={(v) => { handleCityChange(v); setPage(1); }} options={[{ value: "all", label: "All Cities" }, ...cities.map((c) => ({ value: c, label: c }))]} />
            <Select value={store} onChange={(v) => { setStore(v); setPage(1); }} options={[{ value: "all", label: "All Stores" }, ...stores.map((s) => ({ value: s, label: s }))]} />
            <Select value={brand} onChange={(v) => { setBrand(v); setPage(1); }} options={[{ value: "all", label: "All Brands" }, ...brands.map((c) => ({ value: c, label: c }))]} />

            {/* Date range */}
            <div className="ml-auto flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40" title="From date" />
              <span className="text-[11px] text-muted-foreground">–</span>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40" title="To date" />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
                  className="h-8 w-8 grid place-items-center rounded-md border border-gray-200 text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <Th>Invoice</Th>
                  <Th>Customer</Th>
                  <Th>BA</Th>
                  <Th>Store / City</Th>
                  <Th>Brand</Th>
                  <Th>Items</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="stagger">
                {paginated.map((t) => {
                  const contactMatch = contacts.find((c) => c.id === t.customerId);
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-border hover:bg-gray-50 cursor-pointer align-top transition-colors group"
                      onClick={() => setOpen(t)}
                    >
                      {/* Invoice + date stacked */}
                      <Td>
                        <div className="font-medium text-foreground">{t.invoice}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </Td>

                      {/* Customer — clickable */}
                      <Td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (contactMatch) navigate({ to: "/contacts/$contactId", params: { contactId: contactMatch.id } });
                          }}
                          className={`text-left transition-colors ${contactMatch ? "hover:text-primary hover:underline underline-offset-2 cursor-pointer" : "cursor-default"}`}
                        >
                          {t.customerName}
                        </button>
                      </Td>

                      {/* BA — clickable */}
                      <Td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const ba = contacts.find((c) => c.labelIds.includes("lb-ba") && c.name === t.baName);
                            if (ba) navigate({ to: "/contacts/$contactId", params: { contactId: ba.id } });
                          }}
                          className="text-left text-muted-foreground hover:text-primary hover:underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          {t.baName}
                        </button>
                      </Td>

                      <Td>{t.store} · <span className="text-muted-foreground">{t.city}</span></Td>

                      {/* Multi-brand */}
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {t.brandNames.map((b) => (
                            <span key={b} className="inline-flex items-center rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-medium text-foreground">
                              {b}
                            </span>
                          ))}
                        </div>
                      </Td>

                      {/* Items — each clickable to SKU details */}
                      <Td>
                        <ul className="space-y-1">
                          {t.items.map((i, idx) => (
                            <li key={idx} className="leading-tight">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate({ to: "/sku/$skuId", params: { skuId: i.skuId } });
                                }}
                                className="text-left hover:text-primary hover:underline underline-offset-2 transition-colors text-foreground"
                              >
                                {i.skuName}
                              </button>
                              <span className="text-muted-foreground"> · {i.qty} pcs</span>
                            </li>
                          ))}
                        </ul>
                      </Td>

                      <Td>
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusBadge(t.status)}`}>
                          {t.status}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">No transactions found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>{filtered.length === 0 ? "0" : `${from}–${to}`} of {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</span>
              <label className="flex items-center gap-1">
                <span>Rows</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="h-7 rounded-md border border-gray-200 bg-white pl-2 pr-6 text-xs appearance-none"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.35rem center", backgroundSize: "1.2em 1.2em" }}
                >
                  {[5, 10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                  <option value={0}>All</option>
                </select>
              </label>
            </div>
            {showPagination && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}
                  className="h-7 w-7 grid place-items-center rounded border border-border bg-card/40 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : safePage <= 4 ? i + 1 : safePage >= totalPages - 3 ? totalPages - 6 + i : safePage - 3 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`h-7 w-7 grid place-items-center rounded border text-[11px] font-medium transition-colors ${p === safePage ? "border-primary/40 bg-primary/15 text-foreground" : "border-border bg-card/40 hover:bg-white text-muted-foreground"}`}
                    >{p}</button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                  className="h-7 w-7 grid place-items-center rounded border border-border bg-card/40 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {open && <TxDrawer tx={open} onClose={() => setOpen(null)} navigate={navigate} />}
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
    <div className="rounded-xl border border-border bg-card/60 glass p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
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
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border border-gray-200 bg-white pl-2 pr-6 text-xs appearance-none transition-colors hover:border-gray-300"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.35rem center", backgroundSize: "1.2em 1.2em" }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function TxDrawer({ tx, onClose, navigate }: { tx: Transaction; onClose: () => void; navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      <div className="flex-1 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-l border-border overflow-y-auto slide-in-right shadow-2xl">
        <div className="p-5 border-b border-border flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Invoice</div>
            <div className="text-base font-semibold">{tx.invoice}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{new Date(tx.date).toLocaleString("id-ID")}</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded hover:bg-gray-100 text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <Row label="Customer">
            <button
              onClick={() => {
                const c = contacts.find((c) => c.id === tx.customerId);
                if (c) { onClose(); navigate({ to: "/contacts/$contactId", params: { contactId: c.id } }); }
              }}
              className="font-medium hover:text-primary hover:underline underline-offset-2 transition-colors"
            >
              {tx.customerName}
            </button>
          </Row>
          <Row label="BA">
            <button
              onClick={() => {
                const ba = contacts.find((c) => c.labelIds.includes("lb-ba") && c.name === tx.baName);
                if (ba) { onClose(); navigate({ to: "/contacts/$contactId", params: { contactId: ba.id } }); }
              }}
              className="font-medium hover:text-primary hover:underline underline-offset-2 transition-colors"
            >
              {tx.baName}
            </button>
          </Row>
          <Row label="Store"><span className="font-medium">{tx.store} · {tx.city}</span></Row>
          <Row label="Brand">
            <div className="flex flex-wrap gap-1">
              {tx.brandNames.map((b) => (
                <span key={b} className="inline-flex items-center rounded-full border border-border bg-background/40 px-2 py-0.5 text-[11px] font-medium">{b}</span>
              ))}
            </div>
          </Row>
          <Row label="Payment Method"><span className="font-medium">{tx.paymentMethod}</span></Row>
          <Row label="Status">
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
              tx.status === "Shipped" ? "border-emerald-700 bg-emerald-600 text-white" : "border-sky-700 bg-sky-600 text-white"
            }`}>{tx.status}</span>
          </Row>
          {tx.note && <Row label="BA Note"><span className="text-muted-foreground italic">{tx.note}</span></Row>}

          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Items</div>
            <ul className="divide-y divide-border rounded-md border border-border overflow-hidden">
              {tx.items.map((i, idx) => (
                <li key={idx} className="px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors group/item">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => { onClose(); navigate({ to: "/sku/$skuId", params: { skuId: i.skuId } }); }}
                      className="font-medium text-left hover:text-primary hover:underline underline-offset-2 transition-colors"
                    >
                      {i.skuName}
                    </button>
                    <div className="text-xs text-muted-foreground">{i.skuCode} · {i.qty} pcs · {formatIDR(i.unitPrice)}</div>
                  </div>
                  <div className="text-right font-medium tabular-nums">{formatIDR(i.unitPrice * i.qty)}</div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between mt-3 text-sm font-semibold border-t border-border pt-3">
              <span>Total</span>
              <span>{formatIDR(tx.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground shrink-0">{label}</span>
      <div className="text-sm text-right">{children}</div>
    </div>
  );
}
