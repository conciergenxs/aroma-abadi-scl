import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Download,
  Minus,
  Plus,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/scl/app-shell";
import { ConfirmDialog } from "@/components/scl/confirm-dialog";
import { SclSelect } from "@/components/scl/scl-select";

type BillingSection = "subscription" | "payment-methods" | "invoice";
type ModuleView = "subscription" | "manage-plan" | "payment-methods" | "invoice";
type BillingCycle = "monthly" | "yearly";
type InvoiceTab = "subscription" | "addons";

type PlansBillingModuleProps = {
  section: BillingSection;
  onNavigate: (section: BillingSection) => void;
};

type AddOnPurchase = {
  type: "Additional User Accounts" | "Additional Contacts";
  quantity: string;
  monthlyCost: number;
};

type PaymentMethod = {
  id: string;
  brand: "Visa" | "Mastercard";
  masked: string;
  holder: string;
  expiry: string;
  type: string;
  billingAddress: string;
  country: string;
  isDefault: boolean;
};

const formatIdr = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;
const currentMonthlyTotal = 2445000;

export function PlansBillingModule({ section, onNavigate }: PlansBillingModuleProps) {
  const [view, setView] = useState<ModuleView>(section);

  useEffect(() => {
    setView(section);
  }, [section]);

  const goPaymentMethods = () => {
    setView("payment-methods");
    onNavigate("payment-methods");
  };

  if (view === "manage-plan") return <ManagePlanPage onBack={() => setView("subscription")} />;
  if (view === "payment-methods") return <PaymentMethodsPage />;
  if (view === "invoice") return <InvoicePage />;

  return (
    <SubscriptionPage
      onManagePlan={() => setView("manage-plan")}
      onUpdatePaymentMethod={goPaymentMethods}
    />
  );
}

function SubscriptionPage({
  onManagePlan,
  onUpdatePaymentMethod,
}: {
  onManagePlan: () => void;
  onUpdatePaymentMethod: () => void;
}) {
  const [userSeats, setUserSeats] = useState(1);
  const [contactPackage, setContactPackage] = useState("5000");
  const [pendingPurchase, setPendingPurchase] = useState<AddOnPurchase | null>(null);

  const contactOption = contactOptions.find((option) => option.value === contactPackage) ?? contactOptions[0];

  return (
    <div className="space-y-5">
      <PageHeader title="Subscription" description="Manage billing, usage, add-ons, and invoices." />

      <section className="rounded-xl border border-primary/30 bg-card/80 glass overflow-hidden">
        <div className="p-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Current Subscription
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <h2 className="m-0 text-3xl font-semibold leading-tight">Premium</h2>
              <span className="mb-1 text-sm text-muted-foreground">Monthly plan</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <SummaryMetric label="Payment Details" value="Rp2,445,000 / month" />
              <SummaryMetric label="Billing Cycle" value="Monthly" />
              <SummaryMetric label="Next Billing Date" value="30 Jun 2026" />
              <SummaryMetric label="Payment Method" value="Visa •••• 8291" detail="Expires 07/28" />
            </div>
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-background/45 p-4">
            <div>
              <div className="text-xs text-muted-foreground">Estimated monthly total</div>
              <div className="mt-1 text-2xl font-semibold">Rp2,445,000</div>
              <p className="mt-2 text-xs text-muted-foreground">Includes subscription and active recurring add-ons.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onManagePlan} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Manage Plan
              </button>
              <button type="button" onClick={onUpdatePaymentMethod} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card/60 px-3 text-sm font-medium hover:bg-card">
                Update Payment Method
              </button>
            </div>
          </div>
        </div>
      </section>

      <SectionTitle title="Monthly Usage" description="31 May 2026 – 30 Jun 2026" />
      <div className="grid gap-4 lg:grid-cols-3">
        {monthlyUsage.map((item) => (
          <UsageCard key={item.title} {...item} />
        ))}
      </div>

      <SectionTitle title="Plan Limits" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {planLimits.map((item) => (
          <LimitCard
            key={item.title}
            {...item}
            onAdd={item.addon === "users" ? () => setPendingPurchase({ type: "Additional User Accounts", quantity: `${userSeats} user`, monthlyCost: userSeats * 149000 }) : item.addon === "contacts" ? () => setPendingPurchase({ type: "Additional Contacts", quantity: contactOption.label, monthlyCost: contactOption.price }) : undefined}
          />
        ))}
      </div>

      <SectionTitle title="Add-ons" description="Increase workspace limits without changing your subscription plan." />
      <div className="grid gap-4 lg:grid-cols-2">
        <AddOnCard
          title="Additional User Accounts"
          description="Add more workspace seats beyond your current plan limit."
          currentLabel="Current Additional Seats"
          currentValue="0"
          price="Rp149,000 / user / month"
        >
          <div className="flex items-center justify-between rounded-lg border border-border bg-background/45 p-3">
            <span className="text-sm text-muted-foreground">Quantity</span>
            <QuantityStepper value={userSeats} onChange={setUserSeats} />
          </div>
          <AddOnTotal amount={userSeats * 149000} />
          <AddOnActions onCancel={() => setUserSeats(1)} onPurchase={() => setPendingPurchase({ type: "Additional User Accounts", quantity: `${userSeats} user${userSeats > 1 ? "s" : ""}`, monthlyCost: userSeats * 149000 })} />
        </AddOnCard>

        <AddOnCard
          title="Additional Contacts"
          description="Increase the maximum number of stored contacts."
          currentLabel="Current Additional Contacts"
          currentValue="0"
          price="From Rp299,000/month"
        >
          <div className="space-y-2">
            {contactOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setContactPackage(option.value)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${contactPackage === option.value ? "border-primary/50 bg-primary/10" : "border-border bg-background/45 hover:bg-card"}`}
              >
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-sm text-muted-foreground">{formatIdr(option.price)}/month</span>
              </button>
            ))}
          </div>
          <AddOnTotal amount={contactOption.price} />
          <AddOnActions onCancel={() => setContactPackage("5000")} onPurchase={() => setPendingPurchase({ type: "Additional Contacts", quantity: contactOption.label, monthlyCost: contactOption.price })} />
        </AddOnCard>
      </div>

      <PurchaseConfirmDialog purchase={pendingPurchase} onClose={() => setPendingPurchase(null)} />
    </div>
  );
}

function ManagePlanPage({ onBack }: { onBack: () => void }) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const chosenPlan = plans.find((plan) => plan.name === selectedPlan);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Subscription
        </button>
        <div className="flex rounded-md border border-border bg-card/60 p-1">
          {(["monthly", "yearly"] as BillingCycle[]).map((value) => (
            <button key={value} type="button" onClick={() => setCycle(value)} className={`h-8 rounded px-3 text-xs font-medium transition ${cycle === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {value === "monthly" ? "Monthly" : "Yearly"}
              {value === "yearly" && <span className="ml-1 opacity-80">14% saved</span>}
            </button>
          ))}
        </div>
      </div>

      <PageHeader title="Manage Plan" description="Compare plans and choose the best fit for your workspace." />

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} cycle={cycle} onSelect={() => plan.name === "Enterprise" ? toast.info("Sales request prepared") : setSelectedPlan(plan.name)} />
        ))}
      </div>

      <PlanComparisonTable />

      <ConfirmDialog
        open={Boolean(chosenPlan)}
        title="Confirm Plan Change"
        description={chosenPlan ? `Current Plan: Startup\nSelected Plan: ${chosenPlan.name}\nBilling Cycle: ${cycle === "monthly" ? "Monthly" : "Yearly"}\nProration Summary: Unused time is credited automatically.\nNew Monthly Cost: ${chosenPlan.priceLabel}` : undefined}
        confirmLabel="Confirm Plan Change"
        cancelLabel="Cancel"
        onClose={() => setSelectedPlan(null)}
        onConfirm={() => {
          toast.success("Plan change confirmed");
          setSelectedPlan(null);
        }}
      />
    </div>
  );
}

function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultTarget, setDefaultTarget] = useState<PaymentMethod | null>(null);
  const [removeTarget, setRemoveTarget] = useState<PaymentMethod | null>(null);

  const defaultMethod = methods.find((method) => method.isDefault) ?? methods[0];
  const otherMethods = methods.filter((method) => method.id !== defaultMethod.id);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Payment Methods" description="Manage saved cards and default billing method." />
        <button type="button" onClick={openNew} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Payment Method
        </button>
      </div>

      <SectionCard title="Default Payment Method">
        <div className="p-5">
          <PaymentMethodCard method={defaultMethod} primary onEdit={() => { setEditing(defaultMethod); setModalOpen(true); }} />
        </div>
      </SectionCard>

      <SectionCard title="Other Payment Methods">
        <div className="divide-y divide-border">
          {otherMethods.map((method) => (
            <div key={method.id} className="p-5">
              <PaymentMethodCard
                method={method}
                onEdit={() => { setEditing(method); setModalOpen(true); }}
                onSetDefault={() => setDefaultTarget(method)}
                onRemove={() => methods.length === 1 ? toast.error("Cannot remove the only payment method") : setRemoveTarget(method)}
              />
            </div>
          ))}
          {otherMethods.length === 0 && <EmptyState title="No other payment methods" description="Additional cards will appear here." />}
        </div>
      </SectionCard>

      <PaymentMethodModal
        open={modalOpen}
        method={editing}
        onClose={() => setModalOpen(false)}
        onSave={(method) => {
          setMethods((current) => {
            if (editing) return current.map((item) => item.id === editing.id ? { ...item, ...method } : item);
            return [...current, { ...method, id: `pm-${Date.now()}`, isDefault: current.length === 0 }];
          });
          toast.success(editing ? "Payment method updated" : "Payment method added");
          setModalOpen(false);
        }}
      />

      <ConfirmDialog
        open={Boolean(defaultTarget)}
        title="Set as Default"
        description="Use this card as the default payment method for future invoices?"
        confirmLabel="Set as Default"
        cancelLabel="Cancel"
        onClose={() => setDefaultTarget(null)}
        onConfirm={() => {
          if (!defaultTarget) return;
          setMethods((current) => current.map((method) => ({ ...method, isDefault: method.id === defaultTarget.id })));
          setDefaultTarget(null);
          toast.success("Default payment method updated");
        }}
      />

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove Payment Method"
        description="Are you sure you want to remove this payment method?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="destructive"
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (!removeTarget) return;
          setMethods((current) => current.filter((method) => method.id !== removeTarget.id));
          setRemoveTarget(null);
          toast.success("Payment method removed");
        }}
      />
    </div>
  );
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-1 pt-0.5">
      <h2 className="m-0 text-xl font-semibold leading-tight">{title}</h2>
      <p className="m-0 mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="px-1 pt-1">
      <h3 className="m-0 text-base font-semibold">{title}</h3>
      {description && <p className="m-0 mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

function SummaryMetric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/45 p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
      {detail && <div className="mt-0.5 text-xs text-muted-foreground">{detail}</div>}
    </div>
  );
}

function UsageCard({ title, current, max, unit }: { title: string; current: number; max: number; unit: string }) {
  const percent = Math.min(100, Math.round((current / max) * 100));
  return (
    <SectionCard className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="m-0 text-sm font-medium">{title}</h4>
            <p className="m-0 mt-1 text-xs text-muted-foreground">{current.toLocaleString()} / {max.toLocaleString()} {unit} used</p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">{percent}%</span>
        </div>
        <ProgressBar value={percent} className="mt-4" />
      </div>
    </SectionCard>
  );
}

function LimitCard({ title, value, detail, current, max, unlimited, onAdd }: { title: string; value: string; detail: string; current?: number; max?: number; unlimited?: boolean; onAdd?: () => void }) {
  const percent = unlimited || !current || !max ? null : Math.min(100, Math.round((current / max) * 100));
  return (
    <SectionCard>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="m-0 text-sm font-medium">{title}</h4>
            <div className="mt-2 text-xl font-semibold">{value}</div>
            <p className="m-0 mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          {onAdd && <button type="button" onClick={onAdd} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 text-xs font-medium hover:bg-card"><Plus className="h-3.5 w-3.5" /> Add</button>}
        </div>
        {percent === null ? <div className="mt-4 rounded-full border border-border bg-background/50 px-3 py-2 text-xs text-muted-foreground">Unlimited plan limit</div> : <ProgressBar value={percent} className="mt-4" />}
      </div>
    </SectionCard>
  );
}

function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const tone = value >= 100 ? "bg-destructive" : value > 80 ? "bg-primary" : "bg-primary";
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className}`}>
      <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function AddOnCard({ title, description, currentLabel, currentValue, price, children }: { title: string; description: string; currentLabel: string; currentValue: string; price: string; children: ReactNode }) {
  return (
    <SectionCard>
      <div className="p-5 space-y-4">
        <div>
          <h4 className="m-0 text-base font-semibold">{title}</h4>
          <p className="m-0 mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SummaryMetric label={currentLabel} value={currentValue} />
          <SummaryMetric label="Price" value={price} />
        </div>
        {children}
      </div>
    </SectionCard>
  );
}

function QuantityStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-border bg-card/70">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} className="grid h-8 w-8 place-items-center hover:bg-white/[0.04]" aria-label="Decrease quantity"><Minus className="h-3.5 w-3.5" /></button>
      <div className="grid h-8 w-10 place-items-center border-x border-border text-sm font-medium">{value}</div>
      <button type="button" onClick={() => onChange(value + 1)} className="grid h-8 w-8 place-items-center hover:bg-white/[0.04]" aria-label="Increase quantity"><Plus className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function AddOnTotal({ amount }: { amount: number }) {
  return <div className="flex items-center justify-between rounded-lg border border-border bg-background/45 p-3 text-sm"><span className="text-muted-foreground">Live total</span><span className="font-semibold">{formatIdr(amount)} / month</span></div>;
}

function AddOnActions({ onCancel, onPurchase }: { onCancel: () => void; onPurchase: () => void }) {
  return <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="h-9 rounded-md border border-border bg-card/60 px-3 text-sm font-medium hover:bg-card">Cancel</button><button type="button" onClick={onPurchase} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">Purchase Add-on</button></div>;
}

function PurchaseConfirmDialog({ purchase, onClose }: { purchase: AddOnPurchase | null; onClose: () => void }) {
  return (
    <ConfirmDialog
      open={Boolean(purchase)}
      title="Confirm Purchase"
      description={purchase ? `Add-on Type: ${purchase.type}\nQuantity: ${purchase.quantity}\nMonthly Cost: ${formatIdr(purchase.monthlyCost)}\nNew Monthly Total: ${formatIdr(currentMonthlyTotal + purchase.monthlyCost)}` : undefined}
      confirmLabel="Confirm Purchase"
      cancelLabel="Cancel"
      onClose={onClose}
      onConfirm={() => { toast.success("Add-on purchased successfully."); onClose(); }}
    />
  );
}

function InvoicePage() {
  const [tab, setTab] = useState<InvoiceTab>("subscription");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const source = tab === "subscription" ? subscriptionInvoices : addonInvoices;
  const rows = source.filter((row) => {
    if (statusFilter !== "all" && row.status.toLowerCase() !== statusFilter) return false;
    if (dateFilter === "all") return true;
    return row.dateKey === dateFilter;
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Invoice" description="Review billing history and download invoices." />
      <SectionCard
        title="Invoice History"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SclSelect value={dateFilter} onChange={setDateFilter} options={invoiceDateOptions} size="sm" className="w-44" ariaLabel="Invoice Date" />
            <SclSelect value={statusFilter} onChange={setStatusFilter} options={invoiceStatusOptions} size="sm" className="w-36" ariaLabel="Status" />
          </div>
        }
      >
        <div className="px-5 pt-4">
          <div className="flex items-center gap-1 border-b border-border">
            {(["subscription", "addons"] as InvoiceTab[]).map((item) => (
              <button key={item} type="button" onClick={() => setTab(item)} className={`relative px-3 py-2 text-sm transition ${tab === item ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {item === "subscription" ? "Subscription" : "Add-ons"}
                {tab === item && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="No invoices found" description="Invoices will appear here once billing activity is generated." />
        ) : (
          <InvoiceTable rows={rows} />
        )}
      </SectionCard>
    </div>
  );
}

type InvoiceRow = { date: string; dateKey: string; amount: string; description: string; status: "Paid" | "Pending" | "Failed" };

function InvoiceTable({ rows }: { rows: InvoiceRow[] }) {
  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/20 text-xs text-muted-foreground">
          <tr><th className="px-5 py-3 text-left font-medium">Invoice Date</th><th className="px-5 py-3 text-left font-medium">Amount</th><th className="px-5 py-3 text-left font-medium">Description</th><th className="px-5 py-3 text-left font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Download</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={`${row.date}-${row.description}`} className="hover:bg-white/[0.03]">
              <td className="px-5 py-3">{row.date}</td>
              <td className="px-5 py-3">{row.amount}</td>
              <td className="px-5 py-3 text-muted-foreground">{row.description}</td>
              <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
              <td className="px-5 py-3 text-right"><button type="button" onClick={() => downloadInvoice(row)} className="inline-grid h-8 w-8 place-items-center rounded-md border border-border bg-card/60 hover:bg-card" aria-label="Download invoice"><Download className="h-4 w-4" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: "Paid" | "Pending" | "Failed" }) {
  const tone =
    status === "Paid"
      ? "border-primary/30 bg-primary/10 text-primary"
      : status === "Pending"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
      : "border-destructive/30 bg-destructive/10 text-destructive";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}>{status}</span>;
}

function downloadInvoice(row: { date: string; amount: string; description: string }) {
  const blob = new Blob([`Invoice\n${row.date}\n${row.amount}\n${row.description}`], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-${row.date.replaceAll(" ", "-")}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast.success("Invoice PDF exported");
}

function PlanCard({ plan, cycle, onSelect }: { plan: (typeof plans)[number]; cycle: BillingCycle; onSelect: () => void }) {
  const disabled = plan.current;
  return (
    <SectionCard className={plan.badge ? "border-primary/40" : ""}>
      <div className="p-5 flex h-full min-h-[360px] flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="m-0 text-lg font-semibold">{plan.name}</h3>
          {plan.badge && <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{plan.badge}</span>}
        </div>
        <div className="mt-4 text-2xl font-semibold">{plan.priceLabel}</div>
        {cycle === "yearly" && plan.numericPrice > 0 && <div className="mt-1 text-xs text-primary">14% saved yearly</div>}
        <div className="mt-5 space-y-2 flex-1">
          {plan.features.map((feature) => <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-primary" /> {feature}</div>)}
        </div>
        <button type="button" disabled={disabled} onClick={onSelect} className={`mt-6 h-9 rounded-md px-3 text-sm font-medium ${disabled ? "cursor-not-allowed border border-border bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>{plan.button}</button>
      </div>
    </SectionCard>
  );
}

function PlanComparisonTable() {
  return (
    <SectionCard title="Plan Comparison">
      <div className="overflow-auto scl-scroll">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border bg-muted/20 text-xs text-muted-foreground"><tr><th className="px-5 py-3 text-left font-medium">Feature</th>{plans.map((plan) => <th key={plan.name} className="px-5 py-3 text-left font-medium">{plan.name}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {comparisonRows.map((row) => <tr key={row.feature} className="hover:bg-white/[0.03]"><td className="px-5 py-3 font-medium">{row.feature}</td>{row.values.map((value, index) => <td key={`${row.feature}-${plans[index].name}`} className="px-5 py-3 text-muted-foreground">{value === "check" ? <Check className="h-4 w-4 text-primary" /> : value === "x" ? <X className="h-4 w-4 text-muted-foreground/50" /> : value}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function PaymentMethodCard({ method, primary, onEdit, onSetDefault, onRemove }: { method: PaymentMethod; primary?: boolean; onEdit: () => void; onSetDefault?: () => void; onRemove?: () => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr_auto] lg:items-center">
      <div className="rounded-xl border border-primary/30 bg-card/80 p-4">
        <div className="flex items-center justify-between"><CreditCard className="h-5 w-5 text-primary" />{primary && <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">Default</span>}</div>
        <div className="mt-8 text-lg font-semibold">{method.brand} {method.masked}</div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{method.holder}</span><span>{method.expiry}</span></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3"><SummaryMetric label="Card Holder" value={method.holder} /><SummaryMetric label="Expiry Date" value={method.expiry} /><SummaryMetric label="Card Type" value={method.type} /></div>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onEdit} className="h-8 rounded-md border border-border bg-card/60 px-2.5 text-xs font-medium hover:bg-card">Edit</button>
        {onSetDefault && <button type="button" onClick={onSetDefault} className="h-8 rounded-md border border-border bg-card/60 px-2.5 text-xs font-medium hover:bg-card">Set as Default</button>}
        {onRemove && <button type="button" onClick={onRemove} className="h-8 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 text-xs font-medium text-destructive hover:bg-destructive/15">Remove</button>}
      </div>
    </div>
  );
}

function PaymentMethodModal({ open, method, onClose, onSave }: { open: boolean; method: PaymentMethod | null; onClose: () => void; onSave: (method: Omit<PaymentMethod, "id" | "isDefault">) => void }) {
  const [holder, setHolder] = useState(method?.holder ?? "");
  const [cardNumber, setCardNumber] = useState(method ? `•••• •••• •••• ${method.masked.slice(-4)}` : "");
  const [expiry, setExpiry] = useState(method?.expiry ?? "");
  const [cvv, setCvv] = useState("");
  const [address, setAddress] = useState(method?.billingAddress ?? "");
  const [country, setCountry] = useState(method?.country ?? "Indonesia");

  useEffect(() => {
    if (!open) return;
    setHolder(method?.holder ?? "");
    setCardNumber(method ? `•••• •••• •••• ${method.masked.slice(-4)}` : "");
    setExpiry(method?.expiry ?? "");
    setCvv("");
    setAddress(method?.billingAddress ?? "");
    setCountry(method?.country ?? "Indonesia");
  }, [open, method]);

  if (!open) return null;

  const save = () => {
    if (!holder.trim() || !cardNumber.trim() || !expiry.trim() || !cvv.trim() || !address.trim() || !country.trim()) {
      toast.error("Complete all payment fields");
      return;
    }
    const digits = cardNumber.replace(/\D/g, "");
    if (!method && digits.length < 12) {
      toast.error("Enter a valid card number");
      return;
    }
    onSave({ brand: cardNumber.startsWith("5") ? "Mastercard" : "Visa", masked: `•••• ${digits.slice(-4) || method?.masked.slice(-4) || "0000"}`, holder, expiry, type: "Credit Card", billingAddress: address, country });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-full max-w-xl rounded-xl border border-border bg-popover shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><h3 className="m-0 text-base font-semibold">{method ? "Edit Payment Method" : "Add Payment Method"}</h3><button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md hover:bg-white/[0.04]" aria-label="Close"><X className="h-4 w-4" /></button></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <PaymentField label="Cardholder Name" value={holder} onChange={setHolder} />
          <PaymentField label="Card Number" value={cardNumber} onChange={setCardNumber} />
          <PaymentField label="Expiry Date" value={expiry} onChange={setExpiry} placeholder="MM/YY" />
          <PaymentField label="CVV" value={cvv} onChange={setCvv} />
          <PaymentField label="Billing Address" value={address} onChange={setAddress} className="sm:col-span-2" />
          <PaymentField label="Country" value={country} onChange={setCountry} />
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4"><button type="button" onClick={onClose} className="h-9 rounded-md border border-border bg-card/60 px-3 text-sm font-medium hover:bg-card">Cancel</button><button type="button" onClick={save} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">{method ? "Save Changes" : "Save Payment Method"}</button></div>
      </div>
    </div>
  );
}

function PaymentField({ label, value, onChange, placeholder, className = "" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) {
  return <label className={`block ${className}`}><span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1 h-9 w-full rounded-md border border-border bg-background/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" /></label>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="grid place-items-center px-5 py-10 text-center"><ReceiptText className="mb-3 h-8 w-8 text-muted-foreground/50" /><h4 className="m-0 text-sm font-medium">{title}</h4><p className="m-0 mt-1 text-xs text-muted-foreground">{description}</p></div>;
}

const monthlyUsage = [
  { title: "Broadcast Messages", current: 14, max: 300000, unit: "used" },
  { title: "Flow Enrollments", current: 1240, max: 10000, unit: "used" },
  { title: "Automation Runs", current: 4320, max: 25000, unit: "used" },
];

const planLimits = [
  { title: "Channels", value: "8 / 10", detail: "connected", current: 8, max: 10 },
  { title: "User Accounts", value: "9 / 9", detail: "in use", current: 9, max: 9, addon: "users" as const },
  { title: "Contacts", value: "38,723 / 40,000", detail: "used", current: 38723, max: 40000, addon: "contacts" as const },
  { title: "Active Flows", value: "22 / 25", detail: "used", current: 22, max: 25 },
  { title: "Automation Rules", value: "96 / Unlimited", detail: "no progress cap", unlimited: true },
];

const contactOptions = [
  { value: "5000", label: "+5,000 contacts", price: 299000 },
  { value: "10000", label: "+10,000 contacts", price: 499000 },
  { value: "25000", label: "+25,000 contacts", price: 999000 },
];

const invoiceDateOptions = [
  { value: "all", label: "All invoice dates" },
  { value: "jun-2026", label: "June 2026" },
  { value: "may-2026", label: "May 2026" },
  { value: "apr-2026", label: "April 2026" },
];

const subscriptionInvoices = [
  { date: "31 May 2026", amount: "Rp2,445,000", description: "Premium Monthly Subscription" },
  { date: "30 Apr 2026", amount: "Rp2,445,000", description: "Premium Monthly Subscription" },
];

const addonInvoices = [
  { date: "12 Jun 2026", amount: "Rp149,000", description: "Additional User Account" },
  { date: "05 Jun 2026", amount: "Rp299,000", description: "Additional 5,000 Contacts" },
];

const plans = [
  { name: "Startup", priceLabel: "Free", numericPrice: 0, current: true, button: "Current Plan", features: ["3 users", "100 contacts", "100 broadcasts", "3 channels", "3 flows", "5 automations"] },
  { name: "Pro", priceLabel: "IDR 2,390,000/month", numericPrice: 2390000, button: "Switch Plan", features: ["10 users", "5,000 contacts", "5,000 broadcasts", "5 channels", "10 flows", "10 automations"] },
  { name: "Premium", priceLabel: "IDR 4,190,000/month", numericPrice: 4190000, badge: "Popular", button: "Switch Plan", features: ["20 users", "40,000 contacts", "300,000 broadcasts", "10 channels", "25 flows", "Unlimited automations"] },
  { name: "Enterprise", priceLabel: "Custom", numericPrice: 0, button: "Contact Sales", features: ["Custom users", "Custom contacts", "Unlimited broadcasts", "Unlimited channels", "Unlimited automations"] },
];

const comparisonRows = [
  { feature: "Contacts", values: ["100", "5,000", "40,000", "Custom"] },
  { feature: "Broadcasts", values: ["100", "5,000", "300,000", "Unlimited"] },
  { feature: "Channels", values: ["3", "5", "10", "Unlimited"] },
  { feature: "Active Flows", values: ["3", "10", "25", "50+"] },
  { feature: "Automation Rules", values: ["5", "10", "Unlimited", "Unlimited"] },
  { feature: "Analytics", values: ["Basic", "Standard", "Advanced", "Custom"] },
  { feature: "AI Agents", values: ["x", "check", "check", "check"] },
  { feature: "API Access", values: ["x", "check", "check", "check"] },
  { feature: "Custom Roles", values: ["x", "x", "check", "check"] },
  { feature: "Multi-Team Support", values: ["x", "check", "check", "check"] },
];

const initialPaymentMethods: PaymentMethod[] = [
  { id: "pm-visa", brand: "Visa", masked: "•••• 8291", holder: "Aria Kapoor", expiry: "07/28", type: "Credit Card", billingAddress: "Jl. Sudirman No. 18", country: "Indonesia", isDefault: true },
  { id: "pm-mastercard", brand: "Mastercard", masked: "•••• 4420", holder: "SCL Finance", expiry: "11/27", type: "Credit Card", billingAddress: "Jl. Sudirman No. 18", country: "Indonesia", isDefault: false },
];