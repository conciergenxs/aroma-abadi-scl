import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard, ChannelDot, Tag } from "@/components/scl/app-shell";
import { contacts } from "@/components/scl/mock-data";
import { Search, Filter, Plus, Download, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Contacts — SCL" }] }),
  component: ContactsPage,
});

function ContactsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allSelected = selected.length === contacts.length;

  return (
    <AppShell
      title="Contacts"
      subtitle={`${contacts.length} contacts shown · 9 active segments`}
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" /> New contact
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input placeholder="Search name, phone, IG handle…" className="h-9 w-80 rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40" />
          </div>
          {["All channels", "All tags", "All statuses"].map((f) => (
            <button key={f} className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-3 py-2 text-xs hover:bg-card">
              {f}
              <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
            </button>
          ))}
          <button className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-3 py-2 text-xs hover:bg-card">
            <Filter className="h-3 w-3" /> Filters
          </button>
          <div className="ml-auto flex items-center gap-2">
            {selected.length > 0 && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{selected.length} selected</span>
                <button className="rounded-md border border-border bg-card/60 px-2.5 py-1.5 hover:bg-card">Add tag</button>
                <button className="rounded-md border border-border bg-card/60 px-2.5 py-1.5 hover:bg-card">Broadcast</button>
                <button className="rounded-md border border-destructive/40 text-destructive px-2.5 py-1.5 hover:bg-destructive/10">Delete</button>
              </div>
            )}
            <button className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-3 py-2 text-xs hover:bg-card">
              <Download className="h-3 w-3" /> Export
            </button>
          </div>
        </div>

        <SectionCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-white/[0.02]">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="accent-[oklch(0.62_0.17_40)]"
                      checked={allSelected}
                      onChange={() => setSelected(allSelected ? [] : contacts.map((c) => c.id))}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Phone number</th>
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Tags</th>
                  <th className="px-4 py-3 text-left font-medium">Last interaction</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="accent-[oklch(0.62_0.17_40)]"
                        checked={selected.includes(c.id)}
                        onChange={() => toggle(c.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-white/10 to-white/0 border border-border grid place-items-center text-[11px] font-medium">
                          {c.avatar}
                        </div>
                        <div className="leading-tight">
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground">{c.instagram ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{c.phone}</td>
                    <td className="px-4 py-3"><ChannelDot channel={c.channel} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map((t) => <Tag key={t.label} tone={t.tone}>{t.label}</Tag>)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.lastInteraction}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs ${
                        c.status === "Active" ? "text-emerald-300" : c.status === "Inactive" ? "text-muted-foreground" : "text-rose-300"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          c.status === "Active" ? "bg-emerald-400" : c.status === "Inactive" ? "bg-muted-foreground" : "bg-rose-400"
                        }`} />
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
            <span>Showing 1–{contacts.length} of 29,841</span>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded border border-border hover:bg-white/[0.05]">Prev</button>
              <button className="px-2 py-1 rounded border border-border bg-white/[0.04]">1</button>
              <button className="px-2 py-1 rounded border border-border hover:bg-white/[0.05]">2</button>
              <button className="px-2 py-1 rounded border border-border hover:bg-white/[0.05]">3</button>
              <button className="px-2 py-1 rounded border border-border hover:bg-white/[0.05]">Next</button>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}