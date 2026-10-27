import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/scl/app-shell";
import { PromoFormActionBar } from "@/components/scl/promo-form-fields";
import { referralStore, useReferralStore } from "@/components/scl/referral-store";
import {
  SeasonFormFields,
  emptySeasonForm,
  seasonFormToPayload,
  validateSeasonForm,
  type SeasonFormState,
} from "@/components/scl/referral-season-form";
import { LITE_MODE } from "@/lib/feature-flags";

export const Route = createFileRoute("/referral/new")({
  // The lite build doesn't carry Referral, so the URL doesn't either.
  beforeLoad: () => {
    if (LITE_MODE) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: "New Referral Season — Aroma Abadi" }] }),
  component: NewSeasonPage,
});

function NewSeasonPage() {
  const navigate = useNavigate();
  const { seasons } = useReferralStore();
  const [form, setForm] = useState<SeasonFormState>(() => emptySeasonForm());
  const error = validateSeasonForm(form, seasons);

  const handleCreate = () => {
    if (error) {
      toast.error(error);
      return;
    }
    const id = referralStore.addSeason({
      ...seasonFormToPayload(form),
      createdBy: { name: "Aria Kapoor", jobTitle: "Workspace Owner" },
    });
    toast.success("Referral season created");
    navigate({ to: "/referral/$seasonId", params: { seasonId: id } });
  };

  return (
    <AppShell
      backTo="/referral"
      title="New Referral Season"
      subtitle="Applies to every customer's referral code while it runs"
      noPadding
    >
      <div className="min-h-full flex flex-col">
        <div className="flex-1 p-6 animate-fade-in pb-[60px]">
          <SeasonFormFields form={form} setForm={setForm} />
        </div>
        <PromoFormActionBar
          onCancel={() => navigate({ to: "/referral" })}
          onSubmit={handleCreate}
          submitLabel="Create Season"
          disabled={!!error}
          reason={error}
        />
      </div>
    </AppShell>
  );
}
