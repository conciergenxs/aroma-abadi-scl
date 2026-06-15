import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard, ChannelDot } from "@/components/scl/app-shell";
import { templates } from "@/components/scl/mock-data";
import { Plus, Search, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/templates")({
  head: () => ({ meta: [{ title: "Templates — SCL" }] }),
  component: TemplatesPage,
});

const statusTone: Record<string, string> = {
  Approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  Pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Draft: "border-border bg-white/[0.04] text-muted-foreground",
};

const categoryTone: Record<string, string> = {
  Marketing: "border-primary/30 bg-primary/10 text-primary",
  Utility: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  Service: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  Reminder: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

function TemplatesPage() {
  return (
    <AppShell
      title="Message templates"
      subtitle="Reusable, brand-approved messages for WhatsApp & Instagram"
      actions={
        <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" /> New template
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input placeholder="Search templates" className="h-9 w-72 rounded-md border border-border bg-card/60 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40" />
          </div>
          {["All categories", "All channels", "All statuses"].map((f) => (
            <button key={f} className="rounded-md border border-border bg-card/60 px-3 py-2 text-xs hover:bg-card">{f}</button>
          ))}
        </div>

        <SectionCard>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Template name</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Last updated</th>
                  <th className="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {templates.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-md">{t.body}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryTone[t.category]}`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3"><ChannelDot channel={t.channel} /></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.updated}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}