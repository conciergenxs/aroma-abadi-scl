import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { fmtDateEN, fmtDateTimeEN } from "@/lib/fmt";
import { AppShell, labelColorClass, labelColorDot } from "@/components/scl/app-shell";
import { ChannelIcon } from "@/components/scl/channel-badge";
import {
  ChevronLeft,
  Phone,
  MessageCircle,
  Trash2,
  Plus,
  X,
  Check,
  ChevronDown,
  Activity as ActivityIcon,
  User2,
  ShoppingBag,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  BadgeCheck,
  Ticket,
  Instagram,
  Music2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  contactsStore,
  useContactsStore,
  type ContactActivity,
  type ContactProperty,
} from "@/components/scl/contacts-store";
import {
  type Contact,
  type ContactLabel,
  type LabelColor,
  type LifecycleStage,
} from "@/components/scl/mock-data";
import { getStageStyle } from "@/components/scl/contacts-store";
import { LifecycleSelect } from "@/components/scl/lifecycle-select";
import { useTransactionsStore, formatIDR } from "@/components/scl/transactions-store";
import { useBaStore, type BA } from "@/components/scl/ba-store";
import { RevealPasswordModal } from "@/components/scl/ba-password-reveal";
import { useSkuStore } from "@/components/scl/sku-store";
import { usePromoStore, type PromoRedemption } from "@/components/scl/promo-store";

const SYSTEM_KEYS = new Set([
  "name", "phone", "channel", "labels", "lists", "lastInteraction", "status", "email",
]);
const LABEL_COLORS: LabelColor[] = ["indigo", "pink", "emerald", "amber", "sky", "violet", "slate"];

export const Route = createFileRoute("/contacts/$contactId")({
  head: () => ({ meta: [{ title: "Contact — SCL" }] }),
  component: ContactDetailPage,
});

type Tab = "activity" | "transactions" | "redeemed";

type ContactRedemption = PromoRedemption & { promoName: string; promoCode: string };

function ContactDetailPage() {
  const { contactId } = useParams({ from: "/contacts/$contactId" });
  const state = useContactsStore();
  const { contacts, labels, lists, properties, activities } = state;
  const { transactions } = useTransactionsStore();
  const { promos } = usePromoStore();
  const navigate = useNavigate();

  const contact = useMemo(() => contacts.find((c) => c.id === contactId), [contacts, contactId]);
  const [tab, setTab] = useState<Tab>("activity");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { bas } = useBaStore();
  const { brands } = useSkuStore();

  const isBA = contact?.labelIds.includes("lb-ba") ?? false;
  const baRecord = useMemo(
    () => contact ? bas.find((b) => b.waNumber.replace(/\s/g, "") === contact.phone.replace(/\s/g, "")) : undefined,
    [bas, contact],
  );
  const brandName = (id: string) => brands.find((b) => b.id === id)?.name ?? id.replace("brand-", "").replace(/-/g, " ");

  const customProps = useMemo(
    () => properties.filter((p) => !SYSTEM_KEYS.has(p.key) && !p.system),
    [properties],
  );

  if (!contact) {
    return (
      <AppShell backTo="/contacts" title="Contact" noPadding>
        <div className="flex flex-col h-[calc(100vh-64px)] items-center justify-center text-sm text-muted-foreground gap-3">
          <div>Contact not found.</div>
          <Link to="/contacts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Contacts
          </Link>
        </div>
      </AppShell>
    );
  }

  const contactLabels = labels.filter((l) => contact.labelIds.includes(l.id));
  const contactLists = lists.filter((l) => contact.listIds.includes(l.id));
  const contactActivities = activities[contact.id] ?? [];

  // Transactions linked to this contact
  const contactTransactions = useMemo(
    () => transactions.filter((t) => t.customerId === contact.id),
    [transactions, contact.id],
  );

  // Promo code redemptions linked to this contact, across every promo code
  const contactRedemptions = useMemo<ContactRedemption[]>(
    () =>
      promos
        .flatMap((p) =>
          p.redemptions
            .filter((r) => r.contactId === contact.id)
            .map((r) => ({ ...r, promoName: p.name, promoCode: p.code })),
        )
        .sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()),
    [promos, contact.id],
  );

  // Transaction activities — one entry per transaction
  const txActivities = useMemo<ContactActivity[]>(
    () =>
      contactTransactions.map((t) => ({
        id: `tx-act-${t.id}`,
        contactId: contact.id,
        type: "transaction" as const,
        message: `Transaction ${t.invoice} · ${t.brandName} · ${formatIDR(t.total)} · ${t.status}\n${t.items.map((i) => `${i.skuName} ×${i.qty}`).join(", ")}`,
        at: t.date,
      })),
    [contactTransactions, contact.id],
  );

  const derivedActivities = useMemo<ContactActivity[]>(() => {
    const base = contact.stageEnteredAt ?? new Date().toISOString();
    const out: ContactActivity[] = [...contactActivities];
    if (out.length === 0) {
      if (contact.lifecycleStage) {
        out.push({
          id: `d-stage-${contact.id}`,
          contactId: contact.id,
          type: "lifecycle",
          message: `Lifecycle set to ${contact.lifecycleStage}`,
          at: base,
        });
      }
      contactLabels.forEach((l, i) =>
        out.push({
          id: `d-lb-${contact.id}-${i}`,
          contactId: contact.id,
          type: "label_added",
          message: `Added label "${l.name}"`,
          at: base,
        }),
      );
      contactLists.forEach((l, i) =>
        out.push({
          id: `d-ls-${contact.id}-${i}`,
          contactId: contact.id,
          type: "list_added",
          message: `Added to list "${l.name}"`,
          at: base,
        }),
      );
      out.push({
        id: `d-created-${contact.id}`,
        contactId: contact.id,
        type: "created",
        message: "Contact created",
        at: base,
      });
    }
    // Merge transaction history
    const merged = [...out, ...txActivities];
    merged.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return merged;
  }, [contact, contactActivities, contactLabels, contactLists, txActivities]);

  const filteredActivities = useMemo(() => {
    if (!dateFrom && !dateTo) return derivedActivities;
    return derivedActivities.filter((a) => {
      const d = a.at.slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [derivedActivities, dateFrom, dateTo]);

  const filteredTransactions = useMemo(() => {
    if (!dateFrom && !dateTo) return contactTransactions;
    return contactTransactions.filter((t) => {
      const d = t.date.slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [contactTransactions, dateFrom, dateTo]);

  const filteredRedemptions = useMemo(() => {
    if (!dateFrom && !dateTo) return contactRedemptions;
    return contactRedemptions.filter((r) => {
      const d = r.redeemedAt.slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [contactRedemptions, dateFrom, dateTo]);

  const handleDelete = () => {
    if (!confirm(`Delete ${contact.name}? They will be moved to Recently Deleted.`)) return;
    contactsStore.softDeleteContacts([contact.id]);
    toast.success("Contact moved to Recently Deleted");
    navigate({ to: "/contacts" });
  };

  const updateField = <K extends keyof Contact>(key: K, value: Contact[K], label: string) => {
    const prev = contact[key];
    if (sameValue(prev, value)) return;
    contactsStore.setContacts((cs) =>
      cs.map((c) => (c.id === contact.id ? { ...c, [key]: value } : c)),
    );
    contactsStore.addActivity(
      contact.id,
      "updated",
      `Updated ${label}\n${displayValue(prev)} → ${displayValue(value)}`,
    );
    toast.success("Contact updated");
  };

  const toggleLabel = (id: string) => {
    const has = contact.labelIds.includes(id);
    const l = labels.find((x) => x.id === id);
    contactsStore.setContacts((cs) =>
      cs.map((c) =>
        c.id === contact.id
          ? { ...c, labelIds: has ? c.labelIds.filter((x) => x !== id) : [...c.labelIds, id] }
          : c,
      ),
    );
    if (l) {
      contactsStore.addActivity(
        contact.id,
        has ? "label_removed" : "label_added",
        has ? `Removed label "${l.name}"` : `Added label "${l.name}"`,
      );
      toast.success("Label updated");
    }
  };

  const toggleList = (id: string) => {
    const has = contact.listIds.includes(id);
    const ls = lists.find((x) => x.id === id);
    contactsStore.setContacts((cs) =>
      cs.map((c) =>
        c.id === contact.id
          ? { ...c, listIds: has ? c.listIds.filter((x) => x !== id) : [...c.listIds, id] }
          : c,
      ),
    );
    if (ls) {
      contactsStore.addActivity(
        contact.id,
        has ? "list_removed" : "list_added",
        has ? `Removed from list "${ls.name}"` : `Added to list "${ls.name}"`,
      );
      toast.success("List updated");
    }
  };

  const toggleBrand = (brandId: string) => {
    const ids = contact.brandIds ?? [];
    const has = ids.includes(brandId);
    contactsStore.setContacts((cs) =>
      cs.map((c) =>
        c.id === contact.id
          ? { ...c, brandIds: has ? (c.brandIds ?? []).filter((x) => x !== brandId) : [...(c.brandIds ?? []), brandId] }
          : c,
      ),
    );
    contactsStore.addActivity(
      contact.id,
      "updated",
      has ? `Removed brand association` : `Added brand association`,
    );
    toast.success("Brands updated");
  };

  const createLabel = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = `lb-${Date.now()}`;
    const color = LABEL_COLORS[labels.length % LABEL_COLORS.length];
    contactsStore.setLabels((l) => [...l, { id, name: trimmed, color }]);
    contactsStore.setContacts((cs) =>
      cs.map((c) => (c.id === contact.id ? { ...c, labelIds: [...c.labelIds, id] } : c)),
    );
    contactsStore.addActivity(contact.id, "label_added", `Added label "${trimmed}"`);
    toast.success("Label updated");
  };

  const createList = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = `ls-${Date.now()}`;
    contactsStore.setLists((l) => [...l, { id, name: trimmed }]);
    contactsStore.setContacts((cs) =>
      cs.map((c) => (c.id === contact.id ? { ...c, listIds: [...c.listIds, id] } : c)),
    );
    contactsStore.addActivity(contact.id, "list_added", `Added to list "${trimmed}"`);
    toast.success("List updated");
  };

  const setCustomProperty = (key: string, value: unknown, displayName: string) => {
    const prev = contact.customFields?.[key];
    if (sameValue(prev, value)) return;
    contactsStore.setContacts((cs) =>
      cs.map((c) =>
        c.id === contact.id
          ? { ...c, customFields: { ...(c.customFields ?? {}), [key]: value } }
          : c,
      ),
    );
    contactsStore.addActivity(
      contact.id,
      "updated",
      `Updated ${displayName}\n${displayValue(prev)} → ${displayValue(value)}`,
    );
    toast.success("Contact updated");
  };

  const setLifecycle = (next: LifecycleStage | null) => {
    if (next === contact.lifecycleStage) return;
    const prev = contact.lifecycleStage;
    contactsStore.setContacts((cs) =>
      cs.map((c) =>
        c.id === contact.id
          ? {
              ...c,
              lifecycleStage: next ?? undefined,
              stageEnteredAt: next ? new Date().toISOString() : undefined,
            }
          : c,
      ),
    );
    const msg = next
      ? prev
        ? `Lifecycle changed from ${prev} → ${next}`
        : `Lifecycle set to ${next}`
      : `Lifecycle cleared${prev ? ` (was ${prev})` : ""}`;
    contactsStore.addActivity(contact.id, "lifecycle", msg);
    toast.success("Lifecycle stage updated");
  };

  return (
    <AppShell backTo="/contacts" title="Contact Details" noPadding>
      <div className="flex flex-col h-[calc(100vh-64px)] min-h-0">
        {/* 2-panel workspace */}
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-0">
          {/* LEFT: primary content */}
          <section className="flex flex-col min-w-0 min-h-0">
            {/* Contact header bar */}
            <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3 border-b border-border">
              <div className="flex flex-col gap-1 min-w-0">
                <h1 className="text-base font-semibold truncate">{contact.name}</h1>
                {!isBA && (
                  <LifecycleDropdown
                    value={contact.lifecycleStage ?? null}
                    onChange={setLifecycle}
                  />
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to="/inbox" className="inline-flex items-center gap-1.5 h-9 rounded-md border border-border bg-card/60 px-3 text-[14px] font-medium hover:bg-card transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" /> See Inbox
                </Link>
                <button onClick={handleDelete} className="inline-flex items-center gap-1.5 h-9 rounded-md border border-border bg-card/60 px-3 text-[14px] text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>

            {/* Tabs */}
            {!isBA && (
              <div className="border-b border-border bg-background/60 px-4 lg:px-6">
                <div className="flex items-center gap-1">
                  <TabButton active={tab === "activity"} onClick={() => setTab("activity")} icon={<ActivityIcon className="h-3.5 w-3.5" />} label="Activity Log" count={filteredActivities.length} />
                  <TabButton active={tab === "transactions"} onClick={() => setTab("transactions")} icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Transactions" count={filteredTransactions.length} />
                  <TabButton active={tab === "redeemed"} onClick={() => setTab("redeemed")} icon={<Ticket className="h-3.5 w-3.5" />} label="Code Redeem" count={filteredRedemptions.length} />
                  <div className="ml-auto flex items-center gap-1.5 py-1.5">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-7 rounded border border-border bg-white px-2 text-[11px] focus:outline-none"
                      title="From date"
                    />
                    <span className="text-[10px] text-muted-foreground">—</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-7 rounded border border-border bg-white px-2 text-[11px] focus:outline-none"
                      title="To date"
                    />
                    {(dateFrom || dateTo) && (
                      <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-150">Clear</button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              {isBA ? (
                /* BA: always show activity log directly */
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity Log</span>
                    {derivedActivities.length > 0 && (
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-muted-foreground">{derivedActivities.length}</span>
                    )}
                  </div>
                  <ActivityTab activities={filteredActivities} />
                </>
              ) : (
                <>
                  {tab === "activity" && <ActivityTab activities={filteredActivities} />}
                  {tab === "transactions" && <TransactionsTab transactions={filteredTransactions} />}
                  {tab === "redeemed" && <RedeemedTab redemptions={filteredRedemptions} />}
                </>
              )}
            </div>
          </section>

          {/* RIGHT: contact data panel */}
          <aside className="border-l border-border overflow-y-auto bg-card/20">
            <RightPanel
              contact={contact}
              labels={labels}
              lists={lists}
              customProps={customProps}
              baRecord={baRecord}
              onUpdateField={updateField}
              onToggleLabel={toggleLabel}
              onCreateLabel={createLabel}
              onToggleList={toggleList}
              onCreateList={createList}
              onToggleBrand={toggleBrand}
              onSetCustomProperty={setCustomProperty}
            />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

/* ============================== INLINE EDIT ============================== */

function InlineText({
  value,
  onCommit,
  className = "",
  placeholder,
  type = "text",
}: {
  value: string;
  onCommit: (v: string) => void;
  className?: string;
  placeholder?: string;
  type?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  useEffect(() => { setDraft(value); }, [value]);

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); if (draft !== value) onCommit(draft); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); }
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        placeholder={placeholder}
        className={`w-full rounded-md border border-white/10 bg-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30 ${className}`}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`w-full text-left truncate rounded-md px-2 py-1 border border-transparent hover:bg-white hover:border-white/10 ${className}`}
    >
      {value || <span className="text-muted-foreground">{placeholder ?? "—"}</span>}
    </button>
  );
}

/* ============================== TABS ============================== */

const LIFECYCLE_STAGES: LifecycleStage[] = ["New Lead","Contacted","Qualified","Pending Payment","Customer","Lost","No Reply"];

function LifecycleDropdown({ value, onChange }: { value: LifecycleStage | null; onChange: (s: LifecycleStage | null) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const style = value ? getStageStyle(value) : null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
          style
            ? style.badge
            : "border-border text-muted-foreground hover:border-foreground/30"
        }`}
      >
        {value ?? "Set stage"}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 min-w-[160px] rounded-lg border border-border bg-white shadow-lg py-1 animate-fade-in">
          {LIFECYCLE_STAGES.map((s) => {
            const st = getStageStyle(s);
            const active = value === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => { onChange(active ? null : s); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left hover:bg-gray-50 transition-colors ${active ? "font-semibold" : ""}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                {s}
                {active && <Check className="h-3 w-3 ml-auto text-primary" />}
              </button>
            );
          })}
          {value && (
            <>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left text-muted-foreground hover:bg-gray-50 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" /> Clear stage
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 text-xs transition border-b-2 -mb-px ${
        active
          ? "text-foreground border-primary"
          : "text-muted-foreground border-transparent hover:text-foreground"
      }`}
    >
      {icon}
      {label}
      {typeof count === "number" && count > 0 && (
        <span className="ml-1 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {count}
        </span>
      )}
    </button>
  );
}

function ActivityTab({ activities }: { activities: ContactActivity[] }) {
  if (activities.length === 0) {
    return <div className="text-xs text-muted-foreground text-center py-12">No activity yet.</div>;
  }
  const groups = groupByDay(activities);
  return (
    <div className="space-y-6 max-w-3xl">
      {groups.map((g) => (
        <div key={g.key}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">{g.label}</div>
          <ol className="relative border-l border-border ml-1.5 space-y-3">
            {g.items.map((a) => (
              <li key={a.id} className="pl-4 relative">
                <span className={`absolute -left-[5px] top-1.5 h-2 w-2 rounded-full ${activityDot(a.type)}`} />
                {a.type === "transaction" ? (
                  <TransactionActivityCard message={a.message} at={a.at} />
                ) : (
                  <>
                    <div className="text-xs text-foreground whitespace-pre-line">{a.message}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{formatTime(a.at)}</div>
                  </>
                )}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function activityDot(type: ContactActivity["type"]) {
  switch (type) {
    case "created": return "bg-emerald-400";
    case "lifecycle": return "bg-primary";
    case "label_added":
    case "label_removed": return "bg-pink-400";
    case "list_added":
    case "list_removed": return "bg-sky-400";
    case "note": return "bg-amber-400";
    case "transaction": return "bg-emerald-500";
    default: return "bg-muted-foreground";
  }
}

function TransactionsTab({ transactions }: { transactions: import("@/components/scl/transactions-store").Transaction[] }) {
  const [peekTx, setPeekTx] = useState<typeof transactions[0] | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
        <div className="h-12 w-12 rounded-full bg-white border border-border grid place-items-center">
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-sm text-foreground">No transactions yet.</div>
        <div className="text-[11px] text-muted-foreground">Transactions from this contact will appear here.</div>
      </div>
    );
  }

  const totalSpend = transactions.filter((t) => t.status !== "Cancelled").reduce((sum, t) => sum + t.total, 0);
  const completedCount = transactions.filter((t) => t.status !== "Cancelled").length;

  // Favorite Brand
  const favoriteBrand = (() => {
    const counts: Record<string, number> = {};
    for (const t of transactions) { counts[t.brandName] = (counts[t.brandName] ?? 0) + 1; }
    let best = "N/A", bestCount = 0;
    for (const [b, c] of Object.entries(counts)) { if (c > bestCount) { best = b; bestCount = c; } }
    return best;
  })();

  // Favorite Product
  const favoriteProduct = (() => {
    const counts: Record<string, number> = {};
    for (const t of transactions) {
      for (const item of t.items) { counts[item.skuName] = (counts[item.skuName] ?? 0) + item.qty; }
    }
    let best = "N/A", bestCount = 0;
    for (const [p, c] of Object.entries(counts)) { if (c > bestCount) { best = p; bestCount = c; } }
    return best;
  })();

  // Est. Purchase Time
  const estPurchaseTime = (() => {
    if (transactions.length < 2) return "N/A";
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let totalGap = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalGap += (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / (1000 * 60 * 60 * 24);
    }
    const avg = Math.round(totalGap / (sorted.length - 1));
    return `Per ${avg} Days`;
  })();

  function statusBadge(s: string) {
    if (s === "Shipped") return "border-emerald-700 bg-emerald-600 text-white";
    if (s === "Processed") return "border-amber-700 bg-amber-600 text-white";
    return "border-rose-700 bg-rose-600 text-white";
  }

  return (
    <div className="max-w-3xl space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card/60 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Transactions</div>
          <div className="text-lg font-semibold mt-1">{transactions.length}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/60 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Spend</div>
          <div className="text-lg font-semibold mt-1">{formatIDR(totalSpend)}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/60 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed</div>
          <div className="text-lg font-semibold mt-1">{completedCount} <span className="text-xs font-normal text-muted-foreground">/ {transactions.length}</span></div>
        </div>
        <div className="rounded-lg border border-border bg-card/60 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Favorite Brand</div>
          <div className="text-sm font-semibold mt-1 truncate">{favoriteBrand}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/60 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Favorite Product</div>
          <div className="text-sm font-semibold mt-1 truncate">{favoriteProduct}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/60 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Est. Purchase Time</div>
          <div className="text-sm font-semibold mt-1">{estPurchaseTime}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-white">
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Invoice</th>
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Brands</th>
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Items</th>
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Total</th>
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((t) => (
              <tr key={t.id} onClick={() => setPeekTx(t)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground text-xs">{t.invoice}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {fmtDateEN(t.date)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(t.brandNames ?? [t.brandName]).map((b) => (
                      <span key={b} className="inline-flex items-center rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-medium">{b}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <ul className="space-y-0.5">
                    {t.items.map((i, idx) => (
                      <li key={idx} className="text-foreground leading-snug">
                        {i.skuName}
                        <span className="text-muted-foreground"> ×{i.qty}</span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-3 text-xs font-medium text-foreground whitespace-nowrap">{formatIDR(t.total)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusBadge(t.status)}`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {peekTx && (
        <div className="fixed inset-0 z-50 flex animate-fade-in">
          <div className="flex-1 bg-black/40 backdrop-blur-[2px]" onClick={() => setPeekTx(null)} />
          <div className="w-full max-w-md bg-background border-l border-border overflow-y-auto slide-in-right shadow-2xl">
            <div className="p-5 border-b border-border flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Invoice</div>
                <div className="text-base font-semibold">{peekTx.invoice}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{fmtDateTimeEN(peekTx.date)}</div>
              </div>
              <button onClick={() => setPeekTx(null)} className="h-8 w-8 grid place-items-center rounded hover:bg-gray-100 text-muted-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <PeekRow label="Store"><span className="font-medium">{peekTx.store} · {peekTx.city}</span></PeekRow>
              <PeekRow label="Brand">
                <div className="flex flex-wrap gap-1">
                  {(peekTx.brandNames ?? [peekTx.brandName]).map((b) => (
                    <span key={b} className="inline-flex items-center rounded-full border border-border bg-background/40 px-2 py-0.5 text-[11px] font-medium">{b}</span>
                  ))}
                </div>
              </PeekRow>
              <PeekRow label="BA"><span className="font-medium">{peekTx.baName}</span></PeekRow>
              <PeekRow label="Payment Method"><span className="font-medium">{peekTx.paymentMethod}</span></PeekRow>
              <PeekRow label="Status">
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusBadge(peekTx.status)}`}>{peekTx.status}</span>
              </PeekRow>
              {peekTx.note && <PeekRow label="BA Note"><span className="text-muted-foreground italic">{peekTx.note}</span></PeekRow>}
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Items</div>
                <ul className="divide-y divide-border rounded-md border border-border overflow-hidden">
                  {peekTx.items.map((i, idx) => (
                    <li key={idx} className="px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[13px]">{i.skuName}</div>
                        <div className="text-xs text-muted-foreground">{i.skuCode} · {i.qty} pcs · {formatIDR(i.unitPrice)}</div>
                      </div>
                      <div className="text-right font-medium tabular-nums text-sm">{formatIDR(i.unitPrice * i.qty)}</div>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between mt-3 text-sm font-semibold border-t border-border pt-3">
                  <span>Total</span>
                  <span>{formatIDR(peekTx.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const REDEEM_CHANNEL_META: Record<PromoRedemption["channel"], { label: string; icon: typeof Instagram; badge: string }> = {
  instagram: { label: "Instagram", icon: Instagram, badge: "border-fuchsia-700 bg-fuchsia-600 text-white" },
  tiktok: { label: "TikTok", icon: Music2, badge: "border-slate-700 bg-slate-800 text-white" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, badge: "border-emerald-700 bg-emerald-600 text-white" },
};

function RedeemChannelBadge({ channel }: { channel: PromoRedemption["channel"] }) {
  const meta = REDEEM_CHANNEL_META[channel];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium border ${meta.badge}`}>
      <Icon className="h-2.5 w-2.5" /> {meta.label}
    </span>
  );
}

function RedeemedTab({ redemptions }: { redemptions: ContactRedemption[] }) {
  if (redemptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
        <div className="h-12 w-12 rounded-full bg-white border border-border grid place-items-center">
          <Ticket className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-sm text-foreground">No promo codes redeemed yet.</div>
        <div className="text-[11px] text-muted-foreground">Promo codes this contact has redeemed will appear here.</div>
      </div>
    );
  }

  const totalDiscount = redemptions.reduce((sum, r) => sum + r.discountValue, 0);

  return (
    <div className="max-w-3xl space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-card/60 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Redemptions</div>
          <div className="text-lg font-semibold mt-1">{redemptions.length}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/60 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Discount Received</div>
          <div className="text-lg font-semibold mt-1">{formatIDR(totalDiscount)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-white">
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Promo Code</th>
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Transaction</th>
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Store</th>
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Channel</th>
              <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Discount</th>
              <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Redeemed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {redemptions.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground text-xs">{r.promoName}</div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{r.promoCode}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-mono text-foreground/90">{r.invoice}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{r.sourceName}</div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.store}</td>
                <td className="px-4 py-3"><RedeemChannelBadge channel={r.channel} /></td>
                <td className="px-4 py-3 text-right text-xs font-medium text-foreground whitespace-nowrap">{formatIDR(r.discountValue)}</td>
                <td className="px-4 py-3 text-right text-[11px] text-muted-foreground whitespace-nowrap">{fmtDateTimeEN(r.redeemedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PeekRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground shrink-0">{label}</span>
      <div className="text-sm text-right">{children}</div>
    </div>
  );
}

function TransactionActivityCard({ message, at }: { message: string; at: string }) {
  // Parse: "Transaction {invoice} · {brand} · {total} · {status}\n{items}"
  const [header, items] = message.split("\n");
  const parts = header.replace("Transaction ", "").split(" · ");
  const [invoice, brand, total, status] = parts;
  const statusColor =
    status === "Shipped"
      ? "border-emerald-700 bg-emerald-600 text-white"
      : status === "Cancelled"
      ? "border-rose-700 bg-rose-600 text-white"
      : "border-sky-700 bg-sky-600 text-white"; // Processed
  return (
    <div className="rounded-md border border-border bg-card/60 px-3 py-2.5 mt-1 mb-1 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShoppingBag className="h-3 w-3 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-foreground">{invoice}</span>
          <span className="text-[10px] text-muted-foreground">· {brand}</span>
        </div>
        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border ${statusColor}`}>{status}</span>
      </div>
      <div className="text-[11px] text-muted-foreground">{items}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{total}</span>
        <span className="text-[10px] text-muted-foreground">{formatTime(at)}</span>
      </div>
    </div>
  );
}


/* ============================== RIGHT PANEL ============================== */

function RightPanel({
  contact,
  labels,
  lists,
  customProps,
  baRecord,
  onUpdateField,
  onToggleLabel,
  onCreateLabel,
  onToggleList,
  onCreateList,
  onToggleBrand,
  onSetCustomProperty,
}: {
  contact: Contact;
  labels: ContactLabel[];
  lists: { id: string; name: string }[];
  customProps: ContactProperty[];
  baRecord: BA | undefined;
  onUpdateField: <K extends keyof Contact>(key: K, value: Contact[K], label: string) => void;
  onToggleLabel: (id: string) => void;
  onCreateLabel: (name: string) => void;
  onToggleList: (id: string) => void;
  onCreateList: (name: string) => void;
  onToggleBrand: (brandId: string) => void;
  onSetCustomProperty: (key: string, value: unknown, displayName: string) => void;
}) {
  const { brands } = useSkuStore();
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="p-4 space-y-6">
      {baRecord && (
        <RightSection title="BA Login Credentials DEBUG">
          <div className="space-y-2.5">
            <FieldRow icon={<BadgeCheck className="h-3.5 w-3.5" />} label="Username">
              <div className="text-xs text-foreground/90 px-2 py-1">{baRecord.username}</div>
            </FieldRow>
            <FieldRow icon={<User2 className="h-3.5 w-3.5" />} label="Area Coordinator">
              <div className="text-xs text-foreground/90 px-2 py-1">{baRecord.areaCoordinator || "—"}</div>
            </FieldRow>
            <FieldRow icon={<KeyRound className="h-3.5 w-3.5" />} label="Password">
              <div className="flex items-center gap-1.5 px-2 py-1">
                <code className="font-mono text-xs text-foreground/90">{revealed ? baRecord.password : "••••••••••••"}</code>
                <button
                  onClick={() => setRevealed((r) => !r)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={revealed ? "Hide" : "Show (requires your account password)"}
                >
                  {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(baRecord.password); toast.success("Password copied"); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </FieldRow>
          </div>
        </RightSection>
      )}

      <RightSection title="Contact Information">
        <div className="space-y-2.5">
          <FieldRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone">
            <InlineText
              value={contact.phone}
              onCommit={(v) => onUpdateField("phone", v, "phone")}
              type="tel"
              placeholder="Add phone"
              className="text-xs"
            />
          </FieldRow>
          <FieldRow icon={<MessageCircle className="h-3.5 w-3.5" />} label="Channel">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-foreground/90">
              <ChannelIcon channel={contact.channel} className="h-3.5 w-3.5" />
              <span className="capitalize">{contact.channel}</span>
            </div>
          </FieldRow>
        </div>
      </RightSection>

      <RightSection title="Labels">
        <LabelSelector
          labels={labels}
          selectedIds={contact.labelIds}
          onToggle={onToggleLabel}
          onCreate={onCreateLabel}
        />
      </RightSection>

      <RightSection title="Brands">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(contact.brandIds ?? []).length === 0 && (
            <span className="text-[11px] text-muted-foreground">No brands assigned</span>
          )}
          {(contact.brandIds ?? []).map((bid) => {
            const brand = brands.find((b) => b.id === bid);
            return brand ? (
              <span
                key={bid}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
              >
                {brand.name}
                <button
                  onClick={() => onToggleBrand(bid)}
                  className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full hover:bg-primary/20 text-primary/60 hover:text-primary transition-colors"
                  aria-label={`Remove ${brand.name}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ) : null;
          })}
        </div>
        <div className="flex flex-wrap gap-1">
          {brands
            .filter((b) => !(contact.brandIds ?? []).includes(b.id))
            .map((b) => (
              <button
                key={b.id}
                onClick={() => onToggleBrand(b.id)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                + {b.name}
              </button>
            ))}
        </div>
      </RightSection>

      <RightSection title="Audience">
        <ListSelector
          lists={lists}
          selectedIds={contact.listIds}
          onToggle={onToggleList}
          onCreate={onCreateList}
        />
      </RightSection>

    </div>
  );
}

function BALoginCredentials({ baRecord }: { baRecord: BA }) {
  const [revealed, setRevealed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <RightSection title="BA Login Credentials">
      <div className="space-y-2.5">
        <FieldRow icon={<BadgeCheck className="h-3.5 w-3.5" />} label="Username">
          <div className="text-xs text-foreground/90 px-2 py-1">{baRecord.username}</div>
        </FieldRow>
        <FieldRow icon={<User2 className="h-3.5 w-3.5" />} label="Area Coordinator">
          <div className="text-xs text-foreground/90 px-2 py-1">{baRecord.areaCoordinator || "—"}</div>
        </FieldRow>
        <FieldRow icon={<KeyRound className="h-3.5 w-3.5" />} label="Password">
          <div className="flex items-center gap-1.5 px-2 py-1">
            <code className="font-mono text-xs text-foreground/90">{revealed ? baRecord.password : "••••••••••••"}</code>
            <button
              onClick={() => (revealed ? setRevealed(false) : setShowConfirm(true))}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={revealed ? "Hide" : "Show (requires your account password)"}
            >
              {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(baRecord.password); toast.success("Password copied"); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Copy"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </FieldRow>
      </div>

      {showConfirm && (
        <RevealPasswordModal
          label={baRecord.name}
          onClose={() => setShowConfirm(false)}
          onConfirmed={() => { setRevealed(true); setShowConfirm(false); }}
        />
      )}
    </RightSection>
  );
}

function RightSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

function FieldRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-2">
      <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function PropertyField({
  property,
  value,
  onChange,
}: {
  property: ContactProperty;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const inputCls = "h-8 w-full rounded-md border border-white/10 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30";
  return (
    <div>
      <div className="text-[10px] text-muted-foreground mb-1">{property.name}</div>
      {(() => {
        switch (property.type) {
          case "multiline":
            return (
              <DraftTextarea
                value={(value as string) ?? ""}
                onCommit={(v) => onChange(v)}
              />
            );
          case "number":
            return (
              <DraftInput
                value={value == null ? "" : String(value)}
                type="number"
                className={inputCls}
                onCommit={(v) => onChange(v === "" ? "" : Number(v))}
              />
            );
          case "boolean":
            return (
              <button
                type="button"
                onClick={() => onChange(!value)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${value ? "bg-primary" : "bg-white/10"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${value ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            );
          case "select":
            return (
              <select
                value={(value as string) ?? ""}
                onChange={(e) => onChange(e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                {(property.options ?? []).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            );
          case "multiselect": {
            const selected = Array.isArray(value) ? (value as string[]) : [];
            return (
              <div className="flex flex-wrap gap-1">
                {(property.options ?? []).map((o) => {
                  const on = selected.includes(o);
                  return (
                    <button
                      type="button"
                      key={o}
                      onClick={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])}
                      className={`rounded-md border px-1.5 py-0.5 text-[10px] ${
                        on
                          ? "border-primary/60 bg-primary/15 text-foreground"
                          : "border-white/10 bg-white text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            );
          }
          case "date":
            return (
              <input
                type="date"
                value={(value as string) ?? ""}
                onChange={(e) => onChange(e.target.value)}
                className={inputCls}
              />
            );
          default:
            return (
              <DraftInput
                value={(value as string) ?? ""}
                type={property.type === "email" ? "email" : property.type === "phone" ? "tel" : property.type === "url" ? "url" : "text"}
                className={inputCls}
                onCommit={(v) => onChange(v)}
              />
            );
        }
      })()}
    </div>
  );
}

function DraftInput({
  value,
  onCommit,
  type = "text",
  className = "",
}: {
  value: string;
  onCommit: (v: string) => void;
  type?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return (
    <input
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { if (draft !== value) onCommit(draft); }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") { setDraft(value); (e.target as HTMLInputElement).blur(); }
      }}
      className={className}
    />
  );
}

function DraftTextarea({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { if (draft !== value) onCommit(draft); }}
      onKeyDown={(e) => {
        if (e.key === "Escape") { setDraft(value); (e.target as HTMLTextAreaElement).blur(); }
      }}
      rows={2}
      className="w-full rounded-md border border-white/10 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
    />
  );
}

/* ============================== SELECTORS ============================== */

function LabelSelector({
  labels,
  selectedIds,
  onToggle,
  onCreate,
}: {
  labels: ContactLabel[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const filtered = labels.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));
  const exact = labels.some((l) => l.name.toLowerCase() === search.trim().toLowerCase());
  const canCreate = search.trim().length > 0 && !exact;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) { setOpen(false); setSearch(""); }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setSearch(""); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const selected = labels.filter((l) => selectedIds.includes(l.id));

  return (
    <div className="relative" ref={wrapRef}>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {selected.map((l) => (
          <span
            key={l.id}
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] ${labelColorClass[l.color]}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${labelColorDot[l.color]}`} />
            {l.name}
            <button type="button" onClick={() => onToggle(l.id)} className="text-muted-foreground hover:text-foreground ml-0.5 transition-colors duration-150">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full inline-flex items-center justify-between gap-1.5 rounded-md border border-white/10 bg-white px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-gray-50 transition-colors duration-150"
      >
        <span className="inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add label</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-white/10 bg-popover shadow-xl overflow-hidden">
          <div className="p-1.5 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && canCreate) { onCreate(search.trim()); setSearch(""); } }}
              placeholder="Search or create label…"
              className="h-7 w-full rounded border border-white/10 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.map((l) => {
              const on = selectedIds.includes(l.id);
              return (
                <button
                  type="button"
                  key={l.id}
                  onClick={() => onToggle(l.id)}
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-50 inline-flex items-center gap-2 transition-colors duration-150"
                >
                  <span className={`h-2 w-2 rounded-full ${labelColorDot[l.color]}`} />
                  <span className="flex-1">{l.name}</span>
                  {on && <Check className="h-3 w-3 text-primary" />}
                </button>
              );
            })}
            {canCreate && (
              <button
                type="button"
                onClick={() => { onCreate(search.trim()); setSearch(""); }}
                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-50 inline-flex items-center gap-2 border-t border-border mt-1 pt-2 transition-colors duration-150"
              >
                <Plus className="h-3 w-3 text-primary" />
                Create <span className="font-medium text-foreground">"{search.trim()}"</span>
              </button>
            )}
            {filtered.length === 0 && !canCreate && (
              <div className="px-2 py-3 text-[11px] text-muted-foreground text-center">No labels</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ListSelector({
  lists,
  selectedIds,
  onToggle,
  onCreate,
}: {
  lists: { id: string; name: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const filtered = lists.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));
  const exact = lists.some((l) => l.name.toLowerCase() === search.trim().toLowerCase());
  const canCreate = search.trim().length > 0 && !exact;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) { setOpen(false); setSearch(""); }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setSearch(""); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const selected = lists.filter((l) => selectedIds.includes(l.id));

  return (
    <div className="relative" ref={wrapRef}>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {selected.map((l) => (
          <span
            key={l.id}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-1.5 py-0.5 text-[10px] text-foreground/80"
          >
            <span className="h-1.5 w-1.5 rounded-sm bg-primary/70" />
            {l.name}
            <button type="button" onClick={() => onToggle(l.id)} className="text-muted-foreground hover:text-foreground ml-0.5 transition-colors duration-150">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full inline-flex items-center justify-between gap-1.5 rounded-md border border-white/10 bg-white px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-gray-50 transition-colors duration-150"
      >
        <span className="inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add to list</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-white/10 bg-popover shadow-xl overflow-hidden">
          <div className="p-1.5 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && canCreate) { onCreate(search.trim()); setSearch(""); } }}
              placeholder="Search or create list…"
              className="h-7 w-full rounded border border-white/10 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.map((l) => {
              const on = selectedIds.includes(l.id);
              return (
                <button
                  type="button"
                  key={l.id}
                  onClick={() => onToggle(l.id)}
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-50 inline-flex items-center gap-2 transition-colors duration-150"
                >
                  <span className="h-2 w-2 rounded-sm bg-primary/70" />
                  <span className="flex-1">{l.name}</span>
                  {on && <Check className="h-3 w-3 text-primary" />}
                </button>
              );
            })}
            {canCreate && (
              <button
                type="button"
                onClick={() => { onCreate(search.trim()); setSearch(""); }}
                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-50 inline-flex items-center gap-2 border-t border-border mt-1 pt-2 transition-colors duration-150"
              >
                <Plus className="h-3 w-3 text-primary" />
                Create <span className="font-medium text-foreground">"{search.trim()}"</span>
              </button>
            )}
            {filtered.length === 0 && !canCreate && (
              <div className="px-2 py-3 text-[11px] text-muted-foreground text-center">No lists</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== UTIL ============================== */

function formatDate(iso: string) {
  try { return fmtDateEN(iso); } catch { return iso; }
}

function formatTime(iso: string) {
  try { return fmtDateTimeEN(iso); } catch { return iso; }
}

function groupByDay(activities: ContactActivity[]) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);
  const map = new Map<string, { key: string; label: string; items: ContactActivity[] }>();
  for (const a of activities) {
    const d = new Date(a.at); d.setHours(0, 0, 0, 0);
    const key = d.toISOString();
    let label: string;
    if (d.getTime() === today.getTime()) label = "Today";
    else if (d.getTime() === yesterday.getTime()) label = "Yesterday";
    else label = formatDate(a.at);
    if (!map.has(key)) map.set(key, { key, label, items: [] });
    map.get(key)!.items.push(a);
  }
  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
}

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b === "") return true;
  if (b == null && a === "") return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  }
  return false;
}

function displayValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length === 0 ? "—" : v.join(", ");
  return String(v);
}