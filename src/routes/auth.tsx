import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import sclIconAsset from "@/assets/aroma-abadi-icon-sand.png";
import { Eye, EyeOff, Loader2, Phone, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Aroma Abadi" },
      { name: "description", content: "Masuk ke workspace Aroma Abadi untuk mengelola percakapan WhatsApp pelanggan." },
      { property: "og:title", content: "Sign in — Aroma Abadi" },
      { property: "og:description", content: "Akses workspace Aroma Abadi kamu." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot" | "forgot-sent" | "ba";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [remember, setRemember] = useState(true);

  function validateEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signin") {
      if (!validateEmail(email)) return setError("Enter a valid email address.");
      if (password.length < 6) return setError("Password must be at least 6 characters.");
      setLoading(true);
      await new Promise((r) => setTimeout(r, 700));
      setLoading(false);
      if (typeof window !== "undefined") window.localStorage.setItem("scl_authed", "1");
      toast.success("Welcome back, Aria.");
      navigate({ to: "/" });
      return;
    }

    if (mode === "signup") {
      if (!fullName.trim()) return setError("Please enter your full name.");
      if (!company.trim()) return setError("Please enter your company name.");
      if (!validateEmail(email)) return setError("Enter a valid email address.");
      if (password.length < 6) return setError("Password must be at least 6 characters.");
      if (password !== confirmPassword) return setError("Passwords don't match.");
      setLoading(true);
      await new Promise((r) => setTimeout(r, 900));
      setLoading(false);
      if (typeof window !== "undefined") window.localStorage.setItem("scl_authed", "1");
      toast.success("Workspace created. Welcome to SCL.");
      navigate({ to: "/" });
      return;
    }

    if (mode === "forgot") {
      if (!validateEmail(email)) return setError("Enter a valid email address.");
      setLoading(true);
      await new Promise((r) => setTimeout(r, 700));
      setLoading(false);
      setMode("forgot-sent");
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
            <img src={sclIconAsset} alt="Aroma Abadi" className="h-10 w-auto object-contain" />
            <div className="max-w-lg">
              <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.05] text-sidebar-foreground">
                Connect conversations.
                <br />
                <span className="bg-gradient-to-r from-sidebar-primary via-[oklch(0.82_0.08_70)] to-[oklch(0.88_0.06_80)] bg-clip-text text-transparent">
                  Grow relationships.
                </span>
              </h1>
              <p className="mt-4 text-sm text-sidebar-foreground/70 max-w-md leading-relaxed">
                Kelola percakapan WhatsApp pelanggan Aroma Abadi dalam satu workspace.
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
                <h2 className="text-2xl font-semibold tracking-tight">Beauty Ambassador Login</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Masuk menggunakan nomor WhatsApp dan password kamu.
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
                  Enter your email and we'll send you a reset link.
                </p>
              </>
            )}
            {mode === "forgot-sent" && (
              <div className="w-full">
                <div className="h-12 w-12 rounded-full bg-primary/15 border border-primary/30 grid place-items-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">Check your inbox</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We've sent a password reset link to <span className="text-foreground">{email || "your email"}</span>.
                </p>
                <button
                  onClick={() => { setMode("signin"); setError(null); }}
                  className="mt-6 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>

          {/* BA Login Form */}
          {mode === "ba" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                if (!email.trim()) return setError("Masukkan nomor WhatsApp.");
                if (password.length < 4) return setError("Password minimal 4 karakter.");
                setLoading(true);
                await new Promise((r) => setTimeout(r, 700));
                setLoading(false);
                if (typeof window !== "undefined") window.localStorage.setItem("scl_authed", "1");
                toast.success("Selamat datang, Beauty Ambassador!");
                navigate({ to: "/" });
              }}
              className="mt-6 space-y-4"
            >
              <Field label="Nomor WhatsApp">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
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
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Masuk…" : "Masuk"}
              </button>
            </form>
          )}

          {/* SCL Admin Forms */}
          {mode !== "forgot-sent" && mode !== "ba" && (
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

              <Field label="Email Address">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signin" && (loading ? "Signing in…" : "Sign In")}
                {mode === "signup" && (loading ? "Creating account…" : "Create Account")}
                {mode === "forgot" && (loading ? "Sending link…" : "Send Reset Link")}
              </button>

              {mode === "signin" && (
                <p className="text-center text-xs text-muted-foreground">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => { setMode("signup"); setError(null); }} className="text-primary hover:underline">
                    Create Account
                  </button>
                </p>
              )}
              {mode === "signup" && (
                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" onClick={() => { setMode("signin"); setError(null); }} className="text-primary hover:underline">
                    Sign In
                  </button>
                </p>
              )}
            </form>
          )}

          <p className="mt-8 text-center text-[11px] text-muted-foreground">
            By continuing you agree to our{" "}
            <Link to="/" className="hover:text-foreground">Terms</Link> &{" "}
            <Link to="/" className="hover:text-foreground">Privacy Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-card/60 px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition";

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
