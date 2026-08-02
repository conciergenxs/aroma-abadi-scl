import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Download } from "lucide-react";
import { promoStore, downloadAssignedCodesCsv, type AssignedCode } from "@/components/scl/promo-store";
import { useContactsStore } from "@/components/scl/contacts-store";
import {
  PromoFormFields, PromoFormActionBar, emptyPromoForm, promoFormToPayload, validatePromoForm,
  type PromoFormState,
} from "@/components/scl/promo-form-fields";
import { PromoCodeSetupModal } from "@/components/scl/promo-code-setup-modal";

export const Route = createFileRoute("/promo-codes/new")({
  head: () => ({ meta: [{ title: "New Promo Code — SCL" }] }),
  component: NewPromoCodePage,
});

type CreatedPromo = { id: string; code: string; name: string };

function SuccessView({ promo, onViewDetails, onBackToList }: { promo: CreatedPromo; onViewDetails: () => void; onBackToList: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/15 grid place-items-center animate-pop-in">
        <CheckCircle2 className="h-9 w-9 text-emerald-500" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground animate-fade-in">Promo Code Created!</h2>
      <p className="mt-1.5 text-sm text-muted-foreground animate-fade-in">
        <code className="font-mono font-semibold text-foreground bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5">{promo.code}</code>
        {" "}— {promo.name} is ready to use.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3 animate-fade-in">
        <button
          type="button"
          onClick={onViewDetails}
          className="rounded-md bg-primary text-primary-foreground px-4 h-9 text-[14px] font-medium hover:bg-primary/90 transition-colors"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={onBackToList}
          className="rounded-md border border-border px-4 h-9 text-[14px] text-foreground hover:bg-muted transition-colors"
        >
          Back to Promo Codes
        </button>
      </div>
    </div>
  );
}

function NewPromoCodePage() {
  const navigate = useNavigate();
  const { lists } = useContactsStore();
  const [form, setForm] = useState<PromoFormState>(() => emptyPromoForm());
  const [settingCode, setSettingCode] = useState(false);
  const [created, setCreated] = useState<CreatedPromo | null>(null);

  const handleConfirmClick = () => {
    const error = validatePromoForm(form);
    if (error) { toast.error(error); return; }
    setSettingCode(true);
  };

  const handleLaunch = (code: string, assignedCodes?: AssignedCode[]) => {
    const payload = promoFormToPayload({ ...form, code });
    const id = promoStore.addPromo({
      ...payload,
      assignedCodes,
      createdBy: { name: "Aria Kapoor", jobTitle: "Workspace Owner" },
      createdAt: new Date().toISOString(),
    });
    toast.success("Promo code created");
    setSettingCode(false);
    setCreated({ id, code: payload.code, name: payload.name });
  };

  if (created) {
    return (
      <AppShell backTo="/promo-codes" title="New Promo Code" noPadding>
        <div className="p-6">
          <SuccessView
            promo={created}
            onViewDetails={() => navigate({ to: "/promo-codes/$promoId", params: { promoId: created.id } })}
            onBackToList={() => navigate({ to: "/promo-codes" })}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell backTo="/promo-codes" title="New Promo Code" noPadding>
      <div className="min-h-full flex flex-col">
        <div className="flex-1 p-6">
          <PromoFormFields form={form} setForm={setForm} audiences={lists} />
        </div>
        <PromoFormActionBar onCancel={() => navigate({ to: "/promo-codes" })} onSubmit={handleConfirmClick} submitLabel="Confirm Promo Code" />
      </div>

      {settingCode && (
        <PromoCodeSetupModal form={form} onCancel={() => setSettingCode(false)} onConfirm={handleLaunch} />
      )}
    </AppShell>
  );
}
