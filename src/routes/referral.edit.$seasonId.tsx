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
  // Opened from the Referral list (?from=list) or from a season's own page —
  // back and cancel return to whichever it was.
  validateSearch: (search: Record<string, unknown>): { from?: "list" } =>
    search.from === "list" ? { from: "list" } : {},
  component: EditSeasonPage,
});

function EditSeasonPage() {
  const { seasonId } = useParams({ from: "/referral/edit/$seasonId" });
  const { from } = Route.useSearch();
  const navigate = useNavigate();
  const { seasons, loaded } = useReferralStore();
  const season = seasons.find((s) => s.id === seasonId);
  const [form, setForm] = useState<SeasonFormState | null>(() =>
    season ? seasonFormFromExisting(season) : null,
  );
  // Seasons load from localStorage a tick after mount, so the first render
  // still shows seed data. Adopt the stored season exactly once, when the load
  // has actually happened — keying off "a season existed on render 1" would
  // keep the seed values and save them back over the real record.
  const adoptedRef = useRef(false);
  useEffect(() => {
    if (adoptedRef.current || !loaded || !season) return;
    adoptedRef.current = true;
    setForm(seasonFormFromExisting(season));
  }, [loaded, season]);

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
  const status = getSeasonStatus(season);
  const started = status !== "scheduled";
  const backToList = from === "list";
  const goBack = () =>
    backToList
      ? navigate({ to: "/referral" })
      : navigate({ to: "/referral/$seasonId", params: { seasonId: season.id } });

  const handleSave = () => {
    if (status === "ended") {
      toast.error("A season that has ended can't be changed");
      return;
    }
    if (error) {
      toast.error(error);
      return;
    }
    referralStore.updateSeason(season.id, seasonFormToPayload(form));
    toast.success("Referral season updated");
    goBack();
  };

  return (
    <AppShell
      backTo={backToList ? "/referral" : `/referral/${season.id}`}
      title={`Edit — ${season.name}`}
      noPadding
    >
      <div className="min-h-full flex flex-col">
        <div className="flex-1 p-6 animate-fade-in pb-[60px]">
          <SeasonFormFields
            form={form}
            setForm={setForm}
            started={started}
            ended={status === "ended"}
          />
        </div>
        <PromoFormActionBar
          onCancel={goBack}
          onSubmit={handleSave}
          submitLabel="Save Changes"
          disabled={!!error || status === "ended"}
          reason={status === "ended" ? "A season that has ended can't be changed" : error}
        />
      </div>
    </AppShell>
  );
}
