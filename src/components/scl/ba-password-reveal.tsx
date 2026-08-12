import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";

// Stand-in for a real "confirm your account password" check — this app has
// no backend auth session to verify against, so this reuses whatever
// password the admin actually typed when signing in this session (stored by
// auth.tsx). Falls back to this fixed demo value if no session password was
// ever captured (e.g. a stale/pre-existing "authed" session).
export const MOCK_ACCOUNT_PASSWORD = "AriaK@2026";
const ACCOUNT_PASSWORD_KEY = "scl_account_password";

export function getAccountPassword(): string {
  if (typeof window === "undefined") return MOCK_ACCOUNT_PASSWORD;
  return window.localStorage.getItem(ACCOUNT_PASSWORD_KEY) || MOCK_ACCOUNT_PASSWORD;
}

export function RevealPasswordModal({
  label,
  onClose,
  onConfirmed,
}: {
  label: string;
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setChecking(true);
    await new Promise((r) => setTimeout(r, 450));
    setChecking(false);
    if (value !== getAccountPassword()) {
      setError("Incorrect password. Try again.");
      return;
    }
    onConfirmed();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 modal-backdrop">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-background border border-border rounded-xl overflow-hidden modal-content"
      >
        <div className="p-5 border-b border-border">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Confirm Your Password
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your account password to view{" "}
            <span className="text-foreground font-medium">{label}</span>'s login password.
          </p>
        </div>
        <div className="p-5 space-y-2">
          <input
            autoFocus
            type="password"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder="Your account password"
            className="h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 h-9 text-[14px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={checking || !value}
            className="rounded-md bg-primary text-primary-foreground px-3 h-9 text-[14px] font-medium disabled:opacity-60 inline-flex items-center gap-1.5"
          >
            {checking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {checking ? "Verifying…" : "Confirm"}
          </button>
        </div>
      </form>
    </div>
  );
}
