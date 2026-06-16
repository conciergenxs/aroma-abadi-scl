import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { AppShell, labelColorClass, labelColorDot } from "@/components/scl/app-shell";
import { ArrowLeft, Mail, Phone, MessageCircle, Tag as TagIcon, ListChecks, User2, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  contactsStore,
  useContactsStore,
} from "@/components/scl/contacts-store";

const SYSTEM_KEYS = new Set([
  "name", "phone", "channel", "labels", "lists", "lastInteraction", "status", "email",
]);

export const Route = createFileRoute("/contacts/$contactId")({
  head: () => ({ meta: [{ title: "Contact — SCL" }] }),
  component: ContactDetailPage,
});

function ContactDetailPage() {
  const { contactId } = useParams({ from: "/contacts/$contactId" });
  const { contacts, labels, lists, properties } = useContactsStore();
  const navigate = useNavigate();

  const contact = useMemo(() => contacts.find((c) => c.id === contactId), [contacts, contactId]);

  const customProps = useMemo(
    () => properties.filter((p) => !SYSTEM_KEYS.has(p.key) && !p.system),
    [properties],
  );

  if (!contact) {
    return (
      <AppShell title="Contact" noPadding>
        <div className="flex flex-col h-[calc(100vh-64px)] items-center justify-center text-sm text-muted-foreground gap-3">
          <div>Contact not found.</div>
          <Link to="/contacts" className="rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs hover:bg-card">
            Back to Contacts
          </Link>
        </div>
      </AppShell>
    );
  }

  const contactLabels = labels.filter((l) => contact.labelIds.includes(l.id));
  const contactLists = lists.filter((l) => contact.listIds.includes(l.id));

  const handleDelete = () => {
    contactsStore.setContacts((cs) => cs.filter((c) => c.id !== contact.id));
    toast.success("Contact deleted successfully");
    navigate({ to: "/contacts" });
  };

  return (
    <AppShell title={contact.name} noPadding>
      <div className="flex flex-col h-[calc(100vh-64px)] min-h-0">
        {/* Sticky header */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/80 backdrop-blur px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/contacts"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-xs hover:bg-card"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Link>
            <h1 className="text-sm font-medium">{contact.name}</h1>
            {contact.lifecycleStage && (
              <span className="rounded-md border border-border bg-card/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                {contact.lifecycleStage}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
            {/* Profile header */}
            <section className="rounded-xl border border-border bg-card/40 p-5 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/15 text-primary grid place-items-center text-sm font-semibold">
                {contact.avatar || contact.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-base font-medium truncate">{contact.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {contact.email || contact.phone}
                </div>
              </div>
            </section>

            {/* Contact information */}
            <Section title="Contact Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Row icon={<User2 className="h-3.5 w-3.5" />} label="Name" value={contact.name} />
                <Row icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={contact.phone} />
                <Row icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={contact.email ?? "—"} />
                <Row icon={<MessageCircle className="h-3.5 w-3.5" />} label="Channel" value={contact.channel} />
                <Row label="Owner" value={contact.ownerId === "me" ? "Me" : contact.ownerId ?? "Unassigned"} />
                <Row label="Status" value={contact.status} />
                <Row label="Lifecycle Stage" value={contact.lifecycleStage ?? "—"} />
                <Row label="Last Interaction" value={contact.lastInteraction} />
              </div>
              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                  <TagIcon className="h-3 w-3" /> Labels
                </div>
                {contactLabels.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No labels</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {contactLabels.map((l) => (
                      <span
                        key={l.id}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${labelColorClass[l.color]}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${labelColorDot[l.color]}`} />
                        {l.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Section>

            {/* Additional information */}
            {customProps.length > 0 && (
              <Section title="Additional Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customProps.map((p) => {
                    const raw = contact.customFields?.[p.key];
                    const display = Array.isArray(raw)
                      ? raw.join(", ")
                      : raw === true
                      ? "Yes"
                      : raw === false
                      ? "No"
                      : raw === undefined || raw === null || raw === ""
                      ? "—"
                      : String(raw);
                    return <Row key={p.id} label={p.name} value={display} />;
                  })}
                </div>
              </Section>
            )}

            {/* Lists */}
            <Section title="Lists">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                <ListChecks className="h-3 w-3" /> Member of
              </div>
              {contactLists.length === 0 ? (
                <div className="text-xs text-muted-foreground">Not in any list</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {contactLists.map((l) => (
                    <span
                      key={l.id}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-foreground/80"
                    >
                      <span className="h-1.5 w-1.5 rounded-sm bg-primary/70" />
                      {l.name}
                    </span>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card/40">
      <header className="px-5 py-4 border-b border-border">
        <div className="text-sm font-medium">{title}</div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 inline-flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="text-xs text-foreground break-words">{value}</div>
    </div>
  );
}