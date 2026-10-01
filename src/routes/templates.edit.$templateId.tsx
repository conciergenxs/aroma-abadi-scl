import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { canEditTemplate, useTemplatesStore } from "@/components/scl/templates-store";
import { TemplateForm } from "./templates.new";

export const Route = createFileRoute("/templates/edit/$templateId")({
  head: () => ({ meta: [{ title: "Edit Template — SCL" }] }),
  component: EditTemplatePage,
});

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <AppShell backTo="/templates" title="Edit Template">
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card/60 glass p-8 text-center animate-fade-in">
        <div className="text-[15px] font-semibold">{title}</div>
        <p className="mt-2 text-[13px] text-muted-foreground">{body}</p>
        <Link
          to="/templates"
          className="press mt-5 inline-flex items-center rounded-md bg-primary px-4 h-9 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Back to Templates
        </Link>
      </div>
    </AppShell>
  );
}

function EditTemplatePage() {
  const { templateId } = useParams({ from: "/templates/edit/$templateId" });
  const { templates } = useTemplatesStore();
  const template = templates.find((t) => t.id === templateId);

  if (!template) {
    return (
      <Notice
        title="Template not found"
        body="It may have been deleted, or the link points at a template that never existed."
      />
    );
  }

  // Guarded here as well as in the UI that links here, so typing the URL by
  // hand cannot open an editor for a template Meta is already holding.
  if (!canEditTemplate(template.status)) {
    return (
      <Notice
        title={`This template is ${template.status.toLowerCase()}`}
        body="Only drafts can be edited — once a template has gone to Meta its wording is locked. Duplicate it to start a new version."
      />
    );
  }

  return <TemplateForm existing={template} />;
}
