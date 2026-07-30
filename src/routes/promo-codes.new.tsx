import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { useState } from "react";
import { toast } from "sonner";
import { promoStore } from "@/components/scl/promo-store";
import {
  PromoFormFields, emptyPromoForm, promoFormToPayload, validatePromoForm,
  type PromoFormState,
} from "@/components/scl/promo-form-fields";

export const Route = createFileRoute("/promo-codes/new")({
  head: () => ({ meta: [{ title: "New Promo Code — SCL" }] }),
  component: NewPromoCodePage,
});

function NewPromoCodePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<PromoFormState>(() => emptyPromoForm());

  const handleSave = () => {
    const error = validatePromoForm(form);
    if (error) { toast.error(error); return; }
    promoStore.addPromo({
      ...promoFormToPayload(form),
      createdBy: { name: "Aria Kapoor", jobTitle: "Workspace Owner" },
      createdAt: new Date().toISOString(),
    });
    toast.success("Promo code created");
    navigate({ to: "/promo-codes" });
  };

  return (
    <AppShell backTo="/promo-codes" title="New Promo Code">
      <div className="max-w-3xl space-y-5">
        <PromoFormFields form={form} setForm={setForm} />

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save Promo Code
          </button>
          <button
            onClick={() => navigate({ to: "/promo-codes" })}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-4 h-9 text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </AppShell>
  );
}
