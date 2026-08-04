import { createFileRoute, useNavigate } from "@tanstack/react-router";
import sclIconAsset from "@/assets/aroma-abadi-icon-sand.png";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/access-denied")({
  head: () => ({
    meta: [
      { title: "Access Denied — Aroma Abadi" },
      { name: "description", content: "Beauty Ambassador accounts don't have access to the ARMA dashboard." },
    ],
  }),
  component: AccessDeniedPage,
});

function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-[440px] text-center">
        <img src={sclIconAsset} alt="Aroma Abadi" className="h-10 w-auto object-contain mx-auto mb-8" />
        <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/30 grid place-items-center mx-auto mb-5 animate-fade-in">
          <ShieldAlert className="h-7 w-7 text-rose-500" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">You can't access this page</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Beauty Ambassador accounts are for the Aroma Abadi WhatsApp assistant only. The ARMA dashboard is reserved for workspace admins and team members.
        </p>
        <button
          onClick={() => navigate({ to: "/auth" })}
          className="mt-8 w-full rounded-md bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
