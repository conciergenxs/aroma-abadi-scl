import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { useState } from "react";
import { toast } from "sonner";
import { promoStore, usePromoStore } from "@/components/scl/promo-store";
import { useContactsStore } from "@/components/scl/contacts-store";
import {
  PromoFormFields, PromoFormActionBar, promoFormFromExisting, promoFormToPayload, validatePromoForm,
  type PromoFormState,
} from "@/components/scl/promo-form-fields";

export const Route = createFileRoute("/promo-codes/edit/$promoId")({
  head: () => ({ meta: [{ title: "Edit Promo Code — SCL" }] }),
  component: EditPromoCodePage,
});

function EditPromoCodePage() {
  const { promoId } = useParams({ from: "/promo-codes/edit/$promoId" });
  const navigate = useNavigate();
  const { promos } = usePromoStore();
  const { lists } = useContactsStore();
  const promo = promos.find((p) => p.id === promoId);
  const [form, setForm] = useState<PromoFormState | null>(() => (promo ? promoFormFromExisting(promo) : null));

  if (!promo || !form) {
    return (
      <AppShell backTo="/promo-codes" title="Edit Promo Code">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground gap-3">
          <div>Promo code not found.</div>
        </div>
      </AppShell>
    );
  }

  const detailPath = `/promo-codes/${promo.id}`;

  const handleSave = () => {
    const error = validatePromoForm(form);
    if (error) { toast.error(error); return; }
    promoStore.updatePromo(promo.id, promoFormToPayload(form));
    toast.success("Promo code updated");
    navigate({ to: "/promo-codes/$promoId", params: { promoId: promo.id } });
  };

  return (
    <AppShell backTo={detailPath} title={`Edit — ${promo.code}`} noPadding>
      <div className="min-h-full flex flex-col">
        <div className="flex-1 p-6">
          <PromoFormFields form={form} setForm={setForm} audiences={lists} />
        </div>
        <PromoFormActionBar
          onCancel={() => navigate({ to: "/promo-codes/$promoId", params: { promoId: promo.id } })}
          onSubmit={handleSave}
          submitLabel="Save Changes"
        />
      </div>
    </AppShell>
  );
}
