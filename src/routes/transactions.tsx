import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, SectionCard } from "@/components/scl/app-shell";
import {
  useTransactionsStore,
  formatIDR,
  txStatusBadge,
  type Transaction,
  type TxStatus,
} from "@/components/scl/transactions-store";
import { fmtDateEN, fmtNum } from "@/lib/fmt";
import {
  Search,
  Receipt,
  TrendingUp,
  Wallet,
  Package,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
} from "lucide-react";
import { TransactionPeek } from "@/components/scl/transaction-peek";
import { useLiveContacts } from "@/components/scl/contacts-store";

export const Route = createFileRoute("/transactions")({
  // ?tx=<id> opens that order straight away — used by links from elsewhere
  // (e.g. a referral's transaction).
  validateSearch: (search: Record<string, unknown>): { tx?: string } =>
    typeof search.tx === "string" ? { tx: search.tx } : {},
  head: () => ({
    meta: [
      { title: "Transaction Records — Aroma Abadi" },
      { property: "og:title", content: "Transaction Records — Aroma Abadi" },
    ],
  }),
  component: TransactionsPage,
});

/** The Jakarta calendar date an order falls on, as YYYY-MM-DD. Built from
 * epoch milliseconds so it reads the same in Node and in the browser. */
function wibDay(iso: string) {
  return new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Listed in the order an order actually travels, so the dropdown reads as a
 * journey rather than an alphabet. Typed as TxStatus so adding a stage to the
 * store without adding it here is a compile error. */
const TX_STATUSES: TxStatus[] = ["Processed", "Shipped", "Cancelled"];

function TransactionsPage() {
  const navigate = useNavigate();
  const { transactions } = useTransactionsStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const contacts = useLiveContacts();
  const [open, setOpen] = useState<Transaction | null>(null);
  const { tx: linkedTx } = Route.useSearch();
  useEffect(() => {
    if (!linkedTx) return;
    const match = transactions.find((t) => t.id === linkedTx);
    if (match) setOpen(match);
  }, [linkedTx, transactions]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const brands = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => t.brandNames.forEach((b) => set.add(b)));
    return Array.from(set).sort();
  }, [transactions]);

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (status !== "all" && t.status !== status) return false;
        if (brand !== "all" && !t.brandNames.includes(brand)) return false;
        if (dateFrom) {
          const txDate = new Date(t.date);
          txDate.setHours(0, 0, 0, 0);
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (txDate < from) return false;
        }
        if (dateTo) {
          const txDate = new Date(t.date);
          txDate.setHours(23, 59, 59, 999);
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (txDate > to) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          if (
            !t.invoice.toLowerCase().includes(q) &&
            !t.customerName.toLowerCase().includes(q) &&
            !t.items.some((i) => i.skuName.toLowerCase().includes(q))
          )
            return false;
        }
        return true;
      }),
    [transactions, status, brand, dateFrom, dateTo, search],
  );

  const safePageSize = pageSize === 0 ? filtered.length || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(filtered.length / safePageSize));
  const safePage = Math.min(page, totalPages);
  const paginated =
    pageSize === 0
      ? filtered
      : filtered.slice((safePage - 1) * safePageSize, safePage * safePageSize);

  // The tiles describe the most recent trading day in the records rather than
  // the wall clock: reading the clock during render would differ between the
  // server render and hydration, and a quiet day would blank all three tiles.
  // The day an order belongs to is its Jakarta calendar date — `toDateString()`
  // would answer differently on the server (UTC) than in the browser (UTC+7)
  // for anything ordered after 5pm, and React would report a mismatch.
  const latestDay = useMemo(() => {
    let latest = "";
    for (const t of transactions) {
      const day = wibDay(t.date);
      if (day > latest) latest = day;
    }
    return latest;
  }, [transactions]);
  const todayTx = transactions.filter((t) => wibDay(t.date) === latestDay);
  const revenue = todayTx.reduce((acc, t) => acc + t.total, 0);
  const aov = todayTx.length ? Math.round(revenue / Math.max(1, todayTx.length)) : 0;
  const dayLabel = latestDay ? fmtDateEN(`${latestDay}T00:00:00Z`) : "—";
  const topSku = (() => {
    const map = new Map<string, number>();
    transactions.forEach((t) =>
      t.items.forEach((i) => map.set(i.skuName, (map.get(i.skuName) || 0) + i.qty)),
    );
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  })();

  const showPagination = pageSize > 0;
  const from = filtered.length === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const to = Math.min(safePage * safePageSize, filtered.length);

  return (
    <AppShell title="Transaction Records" subtitle="Every order placed through ARMA on WhatsApp">
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 stagger">
          <StatCard label={`Revenue · ${dayLabel}`} value={formatIDR(revenue)} icon={Wallet} />
          <StatCard label={`Orders · ${dayLabel}`} value={fmtNum(todayTx.length)} icon={Receipt} />
          <StatCard label={`AOV · ${dayLabel}`} value={formatIDR(aov)} icon={TrendingUp} />
          <StatCard label="Top SKU" value={topSku} icon={Package} />
        </div>

        {/* Toolbar */}
        <SectionCard>
          <div className="p-3 flex flex-wrap items-center gap-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search invoice, customer or item…"
                className="h-8 w-64 max-w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow"
              />
            </div>
            <Select
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All Statuses" },
                ...TX_STATUSES.map((st) => ({ value: st, label: st })),
              ]}
            />
            <Select
              value={brand}
              onChange={(v) => {
                setBrand(v);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All Brands" },
                ...brands.map((c) => ({ value: c, label: c })),
              ]}
            />

            {/* Date range */}
            <div className="ml-auto flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                title="From date"
              />
              <span className="text-[11px] text-muted-foreground">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                title="To date"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setPage(1);
                  }}
                  className="h-8 w-8 grid place-items-center rounded-md border border-gray-200 text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border">
                  <Th>Invoice</Th>
                  <Th>Customer</Th>
                  <Th>Brand</Th>
                  <Th>Items</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody key={`${safePage}-${pageSize}`} className="stagger">
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
                          {fmtDateEN(t.date)}
                        </div>
                      </Td>

                      {/* Customer — clickable */}
                      <Td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (contactMatch)
                              navigate({
                                to: "/contacts/$contactId",
                                params: { contactId: contactMatch.id },
                              });
                          }}
                          className={`text-left transition-colors ${contactMatch ? "hover:text-primary hover:underline underline-offset-2 cursor-pointer" : "cursor-default"}`}
                        >
                          {t.customerName}
                        </button>
                      </Td>

                      {/* Multi-brand */}
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {t.brandNames.map((b) => (
                            <span
                              key={b}
                              className="inline-flex items-center rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-medium text-foreground"
                            >
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
                                  navigate({
                                    to: "/sku-detail/$skuId",
                                    params: { skuId: i.skuId },
                                  });
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
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${txStatusBadge(t.status)}`}
                        >
                          {t.status}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                      {transactions.length === 0
                        ? "No orders have come through ARMA yet."
                        : "No transactions match these filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>
                {filtered.length === 0 ? "0" : `${from}–${to}`} of {filtered.length} transaction
                {filtered.length !== 1 ? "s" : ""}
              </span>
              <label className="flex items-center gap-1">
                <span>Rows</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-7 rounded-md border border-gray-200 bg-white pl-2 pr-6 text-xs scl-native-select"
                >
                  {[5, 10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                  <option value={0}>All</option>
                </select>
              </label>
            </div>
            {showPagination && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="press tap h-7 w-7 grid place-items-center rounded border border-border bg-card/40 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  const p =
                    totalPages <= 7
                      ? i + 1
                      : safePage <= 4
                        ? i + 1
                        : safePage >= totalPages - 3
                          ? totalPages - 6 + i
                          : safePage - 3 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`press tap h-7 w-7 grid place-items-center rounded border text-[11px] font-medium transition-colors ${p === safePage ? "border-primary/40 bg-primary/15 text-foreground" : "border-border bg-card/40 hover:bg-white text-muted-foreground"}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="press tap h-7 w-7 grid place-items-center rounded border border-border bg-card/40 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {open && (
        <TransactionPeek
          tx={open}
          onClose={() => {
            setOpen(null);
            // Drop ?tx, or the drawer would reopen on the next store update
            // and on every press of the browser's back button.
            if (linkedTx) navigate({ to: "/transactions", search: {}, replace: true });
          }}
        />
      )}
    </AppShell>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`text-left font-medium px-3 py-2.5 text-xs uppercase tracking-wide ${className}`}
    >
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>;
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Receipt;
}) {
  return (
    // min-w-0 so a long value can't widen this card's grid track past its
    // share of the row, and shrink-0 so it can't squash the icon tile either —
    // "Real Flawless Feather Matte Powder Foundation" was doing both.
    <div className="min-w-0 rounded-xl border border-border bg-card/60 glass p-4 flex items-start gap-3 lift-sm">
      <div className="h-9 w-9 shrink-0 rounded-md bg-primary/10 grid place-items-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="stat-value text-[14px] font-semibold mt-0.5 truncate">{value}</div>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border border-gray-200 bg-white pl-2 pr-6 text-xs scl-native-select transition-colors hover:border-gray-300"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
