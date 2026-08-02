import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/scl/app-shell";
import { contactsStore, useContactsStore } from "@/components/scl/contacts-store";
import { useSkuStore } from "@/components/scl/sku-store";
import { useTransactionsStore } from "@/components/scl/transactions-store";
import { AudienceContactPicker } from "@/components/scl/audience-contact-picker";

export const Route = createFileRoute("/contacts/audience/new")({
  head: () => ({ meta: [{ title: "New Audience — SCL" }] }),
  component: NewAudiencePage,
});

type CreatedAudience = { id: string; name: string; count: number };

function SuccessView({ audience, onViewAudience, onBackToList }: { audience: CreatedAudience; onViewAudience: () => void; onBackToList: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/15 grid place-items-center animate-pop-in">
        <CheckCircle2 className="h-9 w-9 text-emerald-500" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground animate-fade-in">Audience Created!</h2>
      <p className="mt-1.5 text-sm text-muted-foreground animate-fade-in">
        <span className="font-semibold text-foreground">{audience.name}</span>
        {" "}is ready with {audience.count} contact{audience.count === 1 ? "" : "s"}.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3 animate-fade-in">
        <button
          type="button"
          onClick={onViewAudience}
          className="rounded-md bg-primary text-primary-foreground px-4 h-9 text-[14px] font-medium hover:bg-primary/90 transition-colors"
        >
          View Audience
        </button>
        <button
          type="button"
          onClick={onBackToList}
          className="rounded-md border border-border px-4 h-9 text-[14px] text-foreground hover:bg-muted transition-colors"
        >
          Back to Contacts
        </button>
      </div>
    </div>
  );
}

function NewAudiencePage() {
  const navigate = useNavigate();
  const { contacts } = useContactsStore();
  const { brands } = useSkuStore();
  const { transactions } = useTransactionsStore();
  const [name, setName] = useState("");
  const [staged, setStaged] = useState<Set<string>>(new Set());
  const [created, setCreated] = useState<CreatedAudience | null>(null);

  const toggle = (id: string) => {
    setStaged((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Audience name is required"); return; }
    const id = `ls-${Date.now()}`;
    const contactIds = Array.from(staged);
    contactsStore.setLists((l) => [...l, { id, name: name.trim() }]);
    if (contactIds.length) {
      contactsStore.setContacts((cs) => cs.map((c) => (contactIds.includes(c.id) ? { ...c, listIds: [...c.listIds, id] } : c)));
    }
    toast.success("Audience created");
    setCreated({ id, name: name.trim(), count: contactIds.length });
  };

  if (created) {
    return (
      <AppShell backTo="/contacts" title="New Audience" noPadding>
        <div className="p-6">
          <SuccessView
            audience={created}
            onViewAudience={() => navigate({ to: "/contacts", search: { audience: created.id } })}
            onBackToList={() => navigate({ to: "/contacts" })}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell backTo="/contacts" title="New Audience" subtitle="Name your audience, then filter or search to bulk-add contacts" noPadding>
      <div className="min-h-full flex flex-col">
        <div className="flex-1 p-6 space-y-4">
          <div className="max-w-sm">
            <label className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Audience Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. High-Value Sisley Buyers"
              className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <AudienceContactPicker
            candidates={contacts.filter((c) => !c.deleted)}
            transactions={transactions}
            brands={brands.map((b) => b.name)}
            staged={staged}
            onToggle={toggle}
          />
        </div>

        <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate({ to: "/contacts" })}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-4 h-9 text-[14px] text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Audience
          </button>
        </div>
      </div>
    </AppShell>
  );
}
