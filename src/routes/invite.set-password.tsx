import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import sclIconAsset from "@/assets/aroma-abadi-icon-sand.png";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/set-password")({
  head: () => ({
    meta: [
      { title: "Set your password — Aroma Abadi" },
      { name: "description", content: "Finish setting up your Aroma Abadi workspace account." },
    ],
  }),
  // The real invite link carries the invitee's phone number and the role
  // assigned to them in Roles & Permissions — falls back to illustrative
  // defaults when opened without those params (e.g. typed in directly).
  validateSearch: (search: Record<string, unknown>): { phone?: string; role?: string } => ({
    phone: typeof search.phone === "string" ? search.phone : undefined,
    role: typeof search.role === "string" ? search.role : undefined,
  }),
  component: SetPasswordPage,
});

const DEFAULT_INVITED_PHONE = "+62 812 3456 7890";
const DEFAULT_INVITED_ROLE = "Member";

function SetPasswordPage() {
  const navigate = useNavigate();
  const { phone: invitedPhone, role: invitedRole } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords don't match.");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success("Password set. You can now sign in.");
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-[440px]">
        <img src={sclIconAsset} alt="Aroma Abadi" className="h-10 w-auto object-contain mb-8" />
        <h1 className="text-2xl font-semibold tracking-tight">Set your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You've been invited to join the Aroma Abadi workspace as{" "}
          <span className="text-foreground">{invitedPhone || DEFAULT_INVITED_PHONE}</span>, with the
          role of <span className="text-foreground">{invitedRole || DEFAULT_INVITED_ROLE}</span>.
          Create a password to finish setting up your account.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Password">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputCls} pr-10`}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Field label="Confirm Password">
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
              autoComplete="new-password"
            />
          </Field>

          {error && (
            <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Setting password…" : "Set Password & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-card/60 px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
