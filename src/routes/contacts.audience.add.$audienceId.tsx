import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/scl/app-shell";
import { contactsStore, useContactsStore } from "@/components/scl/contacts-store";
import { useSkuStore } from "@/components/scl/sku-store";
import { useTransactionsStore } from "@/components/scl/transactions-store";
import { AudienceContactPicker } from "@/components/scl/audience-contact-picker";

export const Route = createFileRoute("/contacts/audience/add/$audienceId")({
  head: () => ({ meta: [{ title: "Add Contacts — SCL" }] }),
  component: AddToAudiencePage,
});

function SuccessView({ audienceName, count, onViewAudience, onBackToList }: { audienceName: string; count: number; onViewAudience: () => void; onBackToList: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/15 grid place-items-center animate-pop-in">
        <CheckCircle2 className="h-9 w-9 text-emerald-500" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground animate-fade-in">Contacts Added!</h2>
      <p className="mt-1.5 text-sm text-muted-foreground animate-fade-in">
        {count} contact{count === 1 ? "" : "s"} added to <span className="font-semibold text-foreground">{audienceName}</span>.
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

function AddToAudiencePage() {
  const { audienceId } = useParams({ from: "/contacts/audience/add/$audienceId" });
  const navigate = useNavigate();
  const { contacts, lists } = useContactsStore();
  const { brands } = useSkuStore();
  const { transactions } = useTransactionsStore();
  const [staged, setStaged] = useState<Set<string>>(new Set());
  const [addedCount, setAddedCount] = useState<number | null>(null);

  const audience = lists.find((l) => l.id === audienceId);

  const toggle = (id: string) => {
    setStaged((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!audience) {
    return (
      <AppShell backTo="/contacts" title="Add Contacts">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground gap-3">
          <div>Audience not found.</div>
        </div>
      </AppShell>
    );
  }

  const handleAdd = () => {
    const contactIds = Array.from(staged);
    if (contactIds.length === 0) { toast.error("Select at least one contact"); return; }
    contactsStore.setContacts((cs) => cs.map((c) => (contactIds.includes(c.id) ? { ...c, listIds: [...c.listIds, audienceId] } : c)));
    toast.success("Contacts added");
    setAddedCount(contactIds.length);
  };

  if (addedCount != null) {
    return (
      <AppShell backTo="/contacts" title={`Add to ${audience.name}`} noPadding>
        <div className="p-6">
          <SuccessView
            audienceName={audience.name}
            count={addedCount}
            onViewAudience={() => navigate({ to: "/contacts", search: { audience: audience.id } })}
            onBackToList={() => navigate({ to: "/contacts" })}
          />
        </div>
      </AppShell>
    );
  }

  // Contacts already in this audience shouldn't clutter the picker — they're already members.
  const eligibleCandidates = contacts.filter((c) => !c.deleted && !c.listIds.includes(audienceId));

  return (
    <AppShell backTo="/contacts" title={`Add to ${audience.name}`} subtitle="Filter or search to bulk-add more contacts to this audience" noPadding>
      <div className="min-h-full flex flex-col">
        <div className="flex-1 p-6">
          <AudienceContactPicker
            candidates={eligibleCandidates}
            transactions={transactions}
            brands={brands.map((b) => b.name)}
            staged={staged}
            onToggle={toggle}
          />
        </div>

        <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate({ to: "/contacts", search: { audience: audience.id } })}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-4 h-9 text-[14px] text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Add to Audience
          </button>
        </div>
      </div>
    </AppShell>
  );
}
