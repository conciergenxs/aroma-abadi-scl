import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/scl/app-shell";
import { PromoFormActionBar } from "@/components/scl/promo-form-fields";
import { referralStore, useReferralStore, getSeasonStatus } from "@/components/scl/referral-store";
import {
  SeasonFormFields,
  seasonFormFromExisting,
  seasonFormToPayload,
  validateSeasonForm,
  type SeasonFormState,
} from "@/components/scl/referral-season-form";

export const Route = createFileRoute("/referral/edit/$seasonId")({
  head: () => ({ meta: [{ title: "Edit Referral Season — Aroma Abadi" }] }),
  component: EditSeasonPage,
});

function EditSeasonPage() {
  const { seasonId } = useParams({ from: "/referral/edit/$seasonId" });
  const navigate = useNavigate();
  const { seasons } = useReferralStore();
  const season = seasons.find((s) => s.id === seasonId);
  const [form, setForm] = useState<SeasonFormState | null>(() =>
    season ? seasonFormFromExisting(season) : null,
  );
  // Seasons load from localStorage a tick after mount, so on a fresh page load
  // the season can still be missing when the initializer above runs. Adopt it
  // the first time it appears — once only, so later store updates can't wipe
  // edits in progress.
  const initializedRef = useRef(season != null);
  useEffect(() => {
    if (initializedRef.current || !season) return;
    initializedRef.current = true;
    setForm(seasonFormFromExisting(season));
  }, [season]);

  if (!season || !form) {
    return (
      <AppShell backTo="/referral" title="Edit Referral Season">
        <div className="flex flex-col items-center justify-center py-24 text-sm text-muted-foreground">
          Referral season not found.
        </div>
      </AppShell>
    );
  }

  const error = validateSeasonForm(form, seasons, season.id);
  // Anything that has already run is locked down to its end date and notes.
  const started = getSeasonStatus(season) !== "scheduled";
  const detail = () => navigate({ to: "/referral/$seasonId", params: { seasonId: season.id } });

  const handleSave = () => {
    if (error) {
      toast.error(error);
      return;
    }
    referralStore.updateSeason(season.id, seasonFormToPayload(form));
    toast.success("Referral season updated");
    detail();
  };

  return (
    <AppShell backTo={`/referral/${season.id}`} title={`Edit — ${season.name}`} noPadding>
      <div className="min-h-full flex flex-col">
        <div className="flex-1 p-6 animate-fade-in">
          <SeasonFormFields form={form} setForm={setForm} started={started} />
        </div>
        <PromoFormActionBar
          onCancel={detail}
          onSubmit={handleSave}
          submitLabel="Save Changes"
          disabled={!!error}
        />
      </div>
    </AppShell>
  );
}
