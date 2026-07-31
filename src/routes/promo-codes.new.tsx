import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/scl/app-shell";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { promoStore, describePromoRule } from "@/components/scl/promo-store";
import {
  PromoFormFields, PromoFormActionBar, emptyPromoForm, promoFormToPayload, validatePromoForm,
  type PromoFormState,
} from "@/components/scl/promo-form-fields";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
          className="rounded-md bg-primary text-primary-foreground px-4 h-9 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={onBackToList}
          className="rounded-md border border-border px-4 h-9 text-sm text-foreground hover:bg-muted transition-colors"
        >
          Back to Promo Codes
        </button>
      </div>
    </div>
  );
}

function NewPromoCodePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<PromoFormState>(() => emptyPromoForm());
  const [confirming, setConfirming] = useState(false);
  const [created, setCreated] = useState<CreatedPromo | null>(null);

  const handleCreateClick = () => {
    const error = validatePromoForm(form);
    if (error) { toast.error(error); return; }
    setConfirming(true);
  };

  const handleConfirmCreate = () => {
    const payload = promoFormToPayload(form);
    const id = promoStore.addPromo({
      ...payload,
      createdBy: { name: "Aria Kapoor", jobTitle: "Workspace Owner" },
      createdAt: new Date().toISOString(),
    });
    toast.success("Promo code created");
    setCreated({ id, code: payload.code, name: payload.name });
  };

  if (created) {
    return (
      <AppShell backTo="/promo-codes" title="New Promo Code">
        <SuccessView
          promo={created}
          onViewDetails={() => navigate({ to: "/promo-codes/$promoId", params: { promoId: created.id } })}
          onBackToList={() => navigate({ to: "/promo-codes" })}
        />
      </AppShell>
    );
  }

  return (
    <AppShell backTo="/promo-codes" title="New Promo Code">
      <div className="max-w-3xl space-y-5">
        <PromoFormFields form={form} setForm={setForm} />

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCreateClick}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 h-9 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Promo Code
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/promo-codes" })}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-4 h-9 text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create this promo code?</AlertDialogTitle>
            <AlertDialogDescription>
              {form.name} ({form.code || "auto-generated code"}) — {describePromoRule(form.rule)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreate}>Create Promo Code</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
