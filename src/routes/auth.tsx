import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ClipboardEvent, type KeyboardEvent } from "react";
import sclIconAsset from "@/assets/aroma-abadi-icon-sand.png";
import { Eye, EyeOff, Loader2, Phone, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Aroma Abadi" },
      { name: "description", content: "Sign in to the Aroma Abadi workspace to manage customer WhatsApp conversations." },
      { property: "og:title", content: "Sign in — Aroma Abadi" },
      { property: "og:description", content: "Access your Aroma Abadi workspace." },
    ],
  }),
  // Beauty Ambassador login has no visible entry point in the UI (BAs don't
  // get dashboard access, so it isn't advertised) — /auth?mode=ba is the
  // deliberate back door for demoing/testing the access-denied flow.
  validateSearch: (search: Record<string, unknown>): { mode?: "ba" } =>
    search.mode === "ba" ? { mode: "ba" } : {},
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot" | "forgot-otp" | "forgot-reset" | "ba";

// Demo-only OTP — this app has no real SMS/WhatsApp gateway, so the reset
// flow accepts any complete 6-digit code as verified.
const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

function AuthPage() {
  const navigate = useNavigate();
  const { mode: modeParam } = Route.useSearch();
  const [mode, setMode] = useState<Mode>(modeParam === "ba" ? "ba" : "signin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [remember, setRemember] = useState(true);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  function validatePhone(v: string) {
    return /^\+?[\d\s-]{8,}$/.test(v.trim());
  }
  function validateEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  async function sendOtp() {
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setOtp("");
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    toast.success(`OTP sent to ${phone} via WhatsApp`);
  }

  async function verifyOtp(e?: FormEvent) {
    e?.preventDefault();
    if (loading) return;
    setError(null);
    if (otp.length < OTP_LENGTH) return setError("Enter the 6-digit code.");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setPassword("");
    setConfirmPassword("");
    setMode("forgot-reset");
  }

  // Auto-verify once all 6 digits are in, so the user doesn't have to also
  // press a button — the manual "Verify Code" button stays as a fallback.
  useEffect(() => {
    if (mode === "forgot-otp" && otp.length === OTP_LENGTH) verifyOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords don't match.");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success("Password reset. Please sign in with your new password.");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setMode("signin");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signin") {
      if (!validatePhone(phone)) return setError("Enter a valid WhatsApp number.");
      if (password.length < 6) return setError("Password must be at least 6 characters.");
      setLoading(true);
      await new Promise((r) => setTimeout(r, 700));
      setLoading(false);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("scl_authed", "1");
        window.localStorage.setItem("scl_account_password", password);
      }
      toast.success("Welcome back, Aria.");
      navigate({ to: "/" });
      return;
    }

    if (mode === "signup") {
      if (!fullName.trim()) return setError("Please enter your full name.");
      if (!company.trim()) return setError("Please enter your company name.");
      if (!validatePhone(phone)) return setError("Enter a valid WhatsApp number.");
      if (email.trim() && !validateEmail(email)) return setError("Enter a valid email address.");
      if (password.length < 6) return setError("Password must be at least 6 characters.");
      if (password !== confirmPassword) return setError("Passwords don't match.");
      setLoading(true);
      await new Promise((r) => setTimeout(r, 900));
      setLoading(false);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("scl_authed", "1");
        window.localStorage.setItem("scl_account_password", password);
      }
      toast.success("Workspace created. Welcome to SCL.");
      navigate({ to: "/" });
      return;
    }

    if (mode === "forgot") {
      if (!validatePhone(phone)) return setError("Enter a valid WhatsApp number.");
      await sendOtp();
      setMode("forgot-otp");
      return;
    }
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex">
      {/* LEFT — Visual panel */}
      <aside className="relative hidden lg:flex lg:w-1/2 p-3">
        <div className="relative w-full overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground">
          {/* Aroma Abadi warm glow blobs */}
          <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-sidebar-primary/30 blur-[110px]" />
          <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-[oklch(0.55_0.14_30)]/40 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[oklch(0.78_0.07_70)]/20 blur-[100px]" />
          {/* Grid + noise */}
          <div className="absolute inset-0 scl-grid-bg opacity-40 pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>\")",
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col justify-between p-10">
            <div><img src={sclIconAsset} alt="Aroma Abadi" className="h-10 w-auto object-contain" /></div>
            <div className="max-w-lg">
              <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.05] text-sidebar-foreground">
                Connect conversations.
                <br />
                <span className="bg-gradient-to-r from-sidebar-primary via-[oklch(0.82_0.08_70)] to-[oklch(0.88_0.06_80)] bg-clip-text text-transparent">
                  Grow relationships.
                </span>
              </h1>
              <p className="mt-4 text-sm text-sidebar-foreground/70 max-w-md leading-relaxed">
                Manage Aroma Abadi's customer WhatsApp conversations in one workspace.
              </p>
            </div>
            <div />
          </div>
        </div>
      </aside>

      {/* RIGHT — Auth panel */}
      <main className="relative flex-1 flex items-center justify-center px-6 py-10">
        {/* Mobile background gradient */}
        <div className="absolute inset-0 lg:hidden pointer-events-none">
          <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-orange-500/10 blur-[100px]" />
        </div>

        <div className="relative w-full max-w-[440px]">

          <div className="flex flex-col items-start">
            {mode === "signin" && (
              <>
                <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in to continue managing your customer conversations.
                </p>
              </>
            )}
            {mode === "ba" && (
              <>
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(null); }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition mb-4"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to Sign In
                </button>
                <h2 className="text-2xl font-semibold tracking-tight">Beauty Ambassador Login</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in with your WhatsApp number and password.
                </p>
              </>
            )}
            {mode === "signup" && (
              <>
                <h2 className="text-2xl font-semibold tracking-tight">Create your workspace</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get started with Aroma Abadi and manage customer conversations from one place.
                </p>
              </>
            )}
            {mode === "forgot" && (
              <>
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(null); }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition mb-4"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to Sign In
                </button>
                <h2 className="text-2xl font-semibold tracking-tight">Reset your password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your WhatsApp number and we'll send you a verification code.
                </p>
              </>
            )}
            {mode === "forgot-otp" && (
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(null); }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition mb-4"
                >
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
                <h2 className="text-2xl font-semibold tracking-tight text-center">Enter verification code</h2>
                <p className="mt-1 text-sm text-muted-foreground text-center">
                  We sent a 6-digit code to <span className="text-foreground">{phone || "your WhatsApp number"}</span> via WhatsApp.
                </p>
              </div>
            )}
            {mode === "forgot-reset" && (
              <>
                <h2 className="text-2xl font-semibold tracking-tight">Set a new password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a new password for your account.
                </p>
              </>
            )}
          </div>

          {/* BA Login Form — Beauty Ambassadors don't get dashboard access;
              a successful submit routes to /access-denied, not "/". */}
          {mode === "ba" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                if (!validatePhone(phone)) return setError("Enter your WhatsApp number.");
                if (password.length < 4) return setError("Password must be at least 4 characters.");
                setLoading(true);
                await new Promise((r) => setTimeout(r, 700));
                setLoading(false);
                navigate({ to: "/access-denied" });
              }}
              className="mt-6 space-y-4"
            >
              <Field label="WhatsApp Number">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 812 3456 7890"
                    className={`${inputCls} pl-9`}
                    autoComplete="tel"
                  />
                </div>
              </Field>
              <Field label="Password">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls} pr-10`}
                    autoComplete="current-password"
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
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          )}

          {/* OTP verification */}
          {mode === "forgot-otp" && (
            <form onSubmit={verifyOtp} className="mt-6 space-y-4">
              <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(null); }} />
              {error && (
                <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 text-center">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || otp.length < OTP_LENGTH}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Verifying…" : "Verify Code"}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                {resendCooldown > 0 ? (
                  <>Resend code in {resendCooldown}s</>
                ) : (
                  <>
                    Didn't get a code?{" "}
                    <button type="button" onClick={sendOtp} className="text-primary hover:underline transition-colors duration-150">
                      Resend OTP
                    </button>
                  </>
                )}
              </p>
            </form>
          )}

          {/* Set new password after OTP verification */}
          {mode === "forgot-reset" && (
            <form onSubmit={resetPassword} className="mt-6 space-y-4">
              <Field label="New Password">
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
              <Field label="Confirm New Password">
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
                {loading ? "Saving…" : "Set New Password"}
              </button>
            </form>
          )}

          {/* SCL Admin Forms */}
          {(mode === "signin" || mode === "signup" || mode === "forgot") && (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <>
                  <Field label="Full Name">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Aria Kapoor"
                      className={inputCls}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Company Name">
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Brands"
                      className={inputCls}
                      autoComplete="organization"
                    />
                  </Field>
                </>
              )}

              {(mode === "signin" || mode === "signup" || mode === "forgot") && (
                <Field label="Phone Number">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+62 812 3456 7890"
                      className={`${inputCls} pl-9`}
                      autoComplete="tel"
                    />
                  </div>
                </Field>
              )}

              {mode === "signup" && (
                <Field label="Email Address (Optional)">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className={`${inputCls} pl-9`}
                      autoComplete="email"
                    />
                  </div>
                </Field>
              )}

              {mode !== "forgot" && (
                <Field
                  label="Password"
                  rightSlot={
                    mode === "signin" ? (
                      <button
                        type="button"
                        onClick={() => { setMode("forgot"); setError(null); }}
                        className="text-[11px] text-muted-foreground hover:text-primary transition"
                      >
                        Forgot password?
                      </button>
                    ) : null
                  }
                >
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputCls} pr-10`}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
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
              )}

              {mode === "signup" && (
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
              )}

              {mode === "signin" && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border bg-card accent-[oklch(0.62_0.17_40)]"
                  />
                  Remember me for 30 days
                </label>
              )}

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
                {mode === "signin" && (loading ? "Signing in…" : "Sign In")}
                {mode === "signup" && (loading ? "Creating account…" : "Create Account")}
                {mode === "forgot" && (loading ? "Sending code…" : "Send OTP")}
              </button>

              {mode === "signin" && (
                <p className="text-center text-xs text-muted-foreground">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => { setMode("signup"); setError(null); }} className="text-primary hover:underline transition-colors duration-150">
                    Create Account
                  </button>
                </p>
              )}
              {mode === "signup" && (
                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" onClick={() => { setMode("signin"); setError(null); }} className="text-primary hover:underline transition-colors duration-150">
                    Sign In
                  </button>
                </p>
              )}
            </form>
          )}

          <p className="mt-8 text-center text-[11px] text-muted-foreground">
            By continuing you agree to our{" "}
            <a href="https://aroma-abadi-scl.vercel.app/" className="text-primary hover:underline transition-colors duration-150">Terms</a> &{" "}
            <a href="https://aroma-abadi-scl.vercel.app/" className="text-[oklch(0.62_0.17_40)] hover:underline transition-colors duration-150">Privacy Policy</a>.
          </p>
        </div>
      </main>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-card/60 px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition";

function OtpInput({ value, onChange, length = OTP_LENGTH }: { value: string; onChange: (v: string) => void; length?: number }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  function handleChange(i: number, raw: string) {
    const d = raw.replace(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[i] = d;
    onChange(next.join("").replace(/\s+$/, ""));
    if (d && i < length - 1) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          autoFocus={i === 0}
          className="h-12 w-11 text-center text-lg font-semibold rounded-md border border-border bg-card/60 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
        />
      ))}
    </div>
  );
}

function Field({
  label,
  rightSlot,
  children,
}: {
  label: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}
