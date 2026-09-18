// ── The switch ────────────────────────────────────────────────────────────────
// There used to be four of these, at three different travel distances, two of
// which animated `left` and so didn't animate at all. One control, one look.

export function Toggle({
  checked,
  onChange,
  size = "md",
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  size?: "sm" | "md";
  /** Accessible name, for the icon-only uses that have no visible label. */
  label?: string;
  disabled?: boolean;
}) {
  const sm = size === "sm";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`tap relative inline-flex ${sm ? "h-4 w-7" : "h-5 w-9"} shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-primary" : "bg-white/10 border border-border"
      }`}
    >
      <span
        className={`inline-block ${sm ? "h-3 w-3" : "h-4 w-4"} rounded-full bg-white shadow transition-transform duration-150 ${
          checked ? (sm ? "translate-x-[14px]" : "translate-x-[18px]") : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
