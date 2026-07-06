import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { AppShell, labelColorClass, labelColorDot } from "@/components/scl/app-shell";
import { ChannelIcon } from "@/components/scl/channel-badge";
import {
  ChevronLeft,
  Mail,
  Phone,
  MessageCircle,
  Trash2,
  Plus,
  X,
  Check,
  ChevronDown,
  Activity as ActivityIcon,
  Image as ImageIcon,
  User2,
  ShoppingBag,
  ExternalLink,
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
import { useBaStore } from "@/components/scl/ba-store";
import { useSkuStore } from "@/components/scl/sku-store";

const SYSTEM_KEYS = new Set([
  "name", "phone", "channel", "labels", "lists", "lastInteraction", "status", "email",
]);
const LABEL_COLORS: LabelColor[] = ["indigo", "pink", "emerald", "amber", "sky", "violet", "slate"];

export const Route = createFileRoute("/contacts/$contactId")({
  head: () => ({ meta: [{ title: "Contact — SCL" }] }),
  component: ContactDetailPage,
});

type Tab = "activity" | "transactions" | "media";

function ContactDetailPage() {
  const { contactId } = useParams({ from: "/contacts/$contactId" });
  const state = useContactsStore();
  const { contacts, labels, lists, properties, activities } = state;
  const { transactions } = useTransactionsStore();
  const navigate = useNavigate();

  const contact = useMemo(() => contacts.find((c) => c.id === contactId), [contacts, contactId]);
  const [tab, setTab] = useState<Tab>("activity");
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

  // Transaction activities — one entry per transaction
  const txActivities = useMemo<ContactActivity[]>(
    () =>
      contactTransactions.map((t) => ({
        id: `tx-act-${t.id}`,
        contactId: contact.id,
        type: "transaction" as const,
        message: `Transaksi ${t.invoice} · ${t.brandName} · ${formatIDR(t.total)} · ${t.status}\n${t.items.map((i) => `${i.skuName} ×${i.qty}`).join(", ")}`,
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
    <AppShell backTo="/contacts" noPadding>
      <div className="flex flex-col h-[calc(100vh-64px)] min-h-0">
        {/* Sticky header */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/80 backdrop-blur px-4 lg:px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm font-medium truncate">{contact.name}</h1>
            {contact.lifecycleStage && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] ${
                  getStageStyle(contact.lifecycleStage).badge
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${getStageStyle(contact.lifecycleStage).dot}`}
                />
                {contact.lifecycleStage}
              </span>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </header>

        {/* 2-panel workspace */}
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-0">
          {/* LEFT: primary content */}
          <section className="flex flex-col min-w-0 min-h-0">
            {/* Contact header card */}
            <div className="border-b border-border px-4 lg:px-6 py-5 flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0">
                <div className="h-14 w-14 rounded-full bg-primary/15 text-primary grid place-items-center text-base font-semibold">
                  {contact.avatar || contact.name.slice(0, 2).toUpperCase()}
                </div>
                <ChannelIcon
                  channel={contact.channel}
                  className="absolute -bottom-0.5 -right-0.5 h-[20px] w-[20px] ring-2 ring-background shadow-sm"
                />
              </div>
              <div className="min-w-0 flex-1">
                <InlineText
                  value={contact.name}
                  onCommit={(v) => v && v !== contact.name && updateField("name", v, "name")}
                  className="text-base font-semibold"
                  placeholder="Contact name"
                />
                <div className="mt-1.5 flex items-center flex-wrap gap-2">
                  {isBA ? (
                    /* BA: brand chips + See Inbox */
                    <>
                      {baRecord?.brandIds?.length ? (
                        baRecord.brandIds.map((bid) => (
                          <span key={bid} className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                            {brandName(bid)}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Belum ada brand</span>
                      )}
                      <Link
                        to="/inbox"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1 text-[11px] font-medium hover:bg-card transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" /> See Inbox
                      </Link>
                    </>
                  ) : (
                    /* Customer: lifecycle select + See Inbox */
                    <>
                      <LifecycleSelect
                        value={contact.lifecycleStage ?? null}
                        onChange={setLifecycle}
                        size="sm"
                      />
                      <Link
                        to="/inbox"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1 text-[11px] font-medium hover:bg-card transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" /> See Inbox
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs — hanya untuk Customer, BA langsung show activity log */}
            {!isBA && (
              <div className="border-b border-border bg-background/60 px-4 lg:px-6">
                <div className="flex items-center gap-1">
                  <TabButton active={tab === "activity"} onClick={() => setTab("activity")} icon={<ActivityIcon className="h-3.5 w-3.5" />} label="Activity Log" count={derivedActivities.length} />
                  <TabButton active={tab === "transactions"} onClick={() => setTab("transactions")} icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Transactions" count={contactTransactions.length} />
                  <TabButton active={tab === "media"} onClick={() => setTab("media")} icon={<ImageIcon className="h-3.5 w-3.5" />} label="Media" />
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
                  <ActivityTab activities={derivedActivities} />
                </>
              ) : (
                <>
                  {tab === "activity" && <ActivityTab activities={derivedActivities} />}
                  {tab === "transactions" && <TransactionsTab transactions={contactTransactions} />}
                  {tab === "media" && <MediaTab />}
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
        className={`w-full rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30 ${className}`}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`w-full text-left truncate rounded-md px-2 py-1 border border-transparent hover:bg-white/[0.04] hover:border-white/10 ${className}`}
    >
      {value || <span className="text-muted-foreground">{placeholder ?? "—"}</span>}
    </button>
  );
}

/* ============================== TABS ============================== */

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
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
        <div className="h-12 w-12 rounded-full bg-white/[0.04] border border-border grid place-items-center">
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-sm text-foreground">Belum ada transaksi.</div>
        <div className="text-[11px] text-muted-foreground">Transaksi dari kontak ini akan muncul di sini.</div>
      </div>
    );
  }

  const totalSpend = transactions.filter((t) => t.status === "Paid").reduce((sum, t) => sum + t.total, 0);
  const paidCount = transactions.filter((t) => t.status === "Paid").length;

  function statusBadge(s: string) {
    if (s === "Paid") return "border-emerald-700 bg-emerald-600 text-white";
    if (s === "Pending") return "border-amber-700 bg-amber-600 text-white";
    return "border-rose-700 bg-rose-600 text-white";
  }

  return (
    <div className="max-w-3xl space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card/60 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Transaksi</div>
          <div className="text-lg font-semibold mt-1">{transactions.length}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/60 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Belanja</div>
          <div className="text-lg font-semibold mt-1">{formatIDR(totalSpend)}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/60 px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid</div>
          <div className="text-lg font-semibold mt-1">{paidCount} <span className="text-xs font-normal text-muted-foreground">/ {transactions.length}</span></div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card/40">
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Invoice</th>
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Tanggal</th>
              <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Brand</th>
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
              <tr key={t.id} className="hover:bg-white/[0.025] transition-colors">
                <td className="px-4 py-3 font-medium text-foreground text-xs">{t.invoice}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(t.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-xs">{t.brandName}</td>
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
                  <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium ${statusBadge(t.status)}`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransactionActivityCard({ message, at }: { message: string; at: string }) {
  // Parse: "Transaksi {invoice} · {brand} · {total} · {status}\n{items}"
  const [header, items] = message.split("\n");
  const parts = header.replace("Transaksi ", "").split(" · ");
  const [invoice, brand, total, status] = parts;
  const statusColor =
    status === "Paid"
      ? "border-emerald-700 bg-emerald-600 text-white"
      : status === "Pending"
      ? "border-amber-700 bg-amber-600 text-white"
      : "border-rose-700 bg-rose-600 text-white";
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

function MediaTab() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
      <div className="h-12 w-12 rounded-full bg-white/[0.04] border border-border grid place-items-center">
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-sm text-foreground">No media available.</div>
      <div className="text-[11px] text-muted-foreground">Upload functionality coming soon.</div>
    </div>
  );
}

/* ============================== RIGHT PANEL ============================== */

function RightPanel({
  contact,
  labels,
  lists,
  customProps,
  onUpdateField,
  onToggleLabel,
  onCreateLabel,
  onToggleList,
  onCreateList,
  onSetCustomProperty,
}: {
  contact: Contact;
  labels: ContactLabel[];
  lists: { id: string; name: string }[];
  customProps: ContactProperty[];
  onUpdateField: <K extends keyof Contact>(key: K, value: Contact[K], label: string) => void;
  onToggleLabel: (id: string) => void;
  onCreateLabel: (name: string) => void;
  onToggleList: (id: string) => void;
  onCreateList: (name: string) => void;
  onToggleBrand: (brandId: string) => void;
  onSetCustomProperty: (key: string, value: unknown, displayName: string) => void;
}) {
  const { brands } = useSkuStore();
  return (
    <div className="p-4 space-y-6">
      <RightSection title="Contact Information">
        <div className="space-y-2.5">
          <FieldRow icon={<Mail className="h-3.5 w-3.5" />} label="Email">
            <InlineText
              value={contact.email ?? ""}
              onCommit={(v) => onUpdateField("email", v, "email")}
              type="email"
              placeholder="Add email"
              className="text-xs"
            />
          </FieldRow>
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
          <FieldRow icon={<User2 className="h-3.5 w-3.5" />} label="Owner">
            <InlineText
              value={contact.ownerId === "me" ? "Me" : contact.ownerId ?? ""}
              onCommit={(v) => onUpdateField("ownerId", v as Contact["ownerId"], "owner")}
              placeholder="Unassigned"
              className="text-xs"
            />
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
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {brand.name}
                <button
                  onClick={() => onToggleBrand(bid)}
                  className="ml-0.5 h-3 w-3 rounded-full grid place-items-center hover:bg-primary/20 text-primary/60 hover:text-primary"
                  aria-label={`Remove ${brand.name}`}
                >
                  ×
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
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card/40 px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
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

      <RightSection title="Contact Properties">
        {customProps.length === 0 ? (
          <div className="text-[11px] text-muted-foreground">
            No custom properties. Create some in Manage Properties.
          </div>
        ) : (
          <div className="space-y-3">
            {customProps.map((p) => (
              <PropertyField
                key={p.id}
                property={p}
                value={contact.customFields?.[p.key]}
                onChange={(v) => onSetCustomProperty(p.key, v, p.name)}
              />
            ))}
          </div>
        )}
      </RightSection>
    </div>
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
  const inputCls = "h-8 w-full rounded-md border border-white/10 bg-white/[0.04] px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30";
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
                          : "border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground"
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
      className="w-full rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
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
            <button type="button" onClick={() => onToggle(l.id)} className="text-muted-foreground hover:text-foreground ml-0.5">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full inline-flex items-center justify-between gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-white/[0.06]"
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
              className="h-7 w-full rounded border border-white/10 bg-white/[0.04] px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
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
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-white/[0.05] inline-flex items-center gap-2"
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
                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-white/[0.05] inline-flex items-center gap-2 border-t border-border mt-1 pt-2"
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
            className="inline-flex items-center gap-1 rounded-md border border-border bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-foreground/80"
          >
            <span className="h-1.5 w-1.5 rounded-sm bg-primary/70" />
            {l.name}
            <button type="button" onClick={() => onToggle(l.id)} className="text-muted-foreground hover:text-foreground ml-0.5">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full inline-flex items-center justify-between gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-white/[0.06]"
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
              className="h-7 w-full rounded border border-white/10 bg-white/[0.04] px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
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
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-white/[0.05] inline-flex items-center gap-2"
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
                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-white/[0.05] inline-flex items-center gap-2 border-t border-border mt-1 pt-2"
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
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso; }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" });
  } catch { return iso; }
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