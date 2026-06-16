import { useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import {
  PROGRESSING_STAGES,
  LOST_STAGES,
  STAGE_COLORS,
  type LifecycleStage,
} from "./mock-data";
import { FloatingMenu } from "./floating-menu";

type Props = {
  value: LifecycleStage | null | undefined;
  onChange: (next: LifecycleStage | null) => void;
  size?: "sm" | "md";
  className?: string;
};

/**
 * Grouped lifecycle stage selector (Sleekflow-style).
 * - Always allows clearing the selection (lifecycle is optional).
 * - Reuses the Kanban STAGE_COLORS — never introduce new colors here.
 */
export function LifecycleSelect({ value, onChange, size = "md", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const current = value ?? null;
  const color = current ? STAGE_COLORS[current] : null;

  const hClass = size === "sm" ? "h-7 text-[11px] px-2" : "h-9 text-xs px-2.5";

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex w-full items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.04] ${hClass} text-foreground hover:bg-white/[0.06] focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/30 transition-colors`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {color ? (
            <span className={`h-2 w-2 rounded-full ${color.dot}`} />
          ) : (
            <span className="h-2 w-2 rounded-full border border-white/20" />
          )}
          <span className={`truncate ${current ? "text-foreground" : "text-muted-foreground"}`}>
            {current ?? "No Lifecycle Stage"}
          </span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>

      <FloatingMenu
        anchorRef={btnRef}
        open={open}
        onClose={() => setOpen(false)}
        width={256}
      >
        <div className="rounded-md border border-border bg-popover shadow-xl p-1 max-h-[320px] overflow-auto scl-scroll">
          <Group label="PROGRESSING STAGE">
            {PROGRESSING_STAGES.map((s) => (
              <Row
                key={s}
                stage={s}
                active={current === s}
                onPick={() => {
                  onChange(s);
                  setOpen(false);
                }}
              />
            ))}
          </Group>
          <div className="my-1 h-px bg-border" />
          <Group label="LOST STAGE">
            {LOST_STAGES.map((s) => (
              <Row
                key={s}
                stage={s}
                active={current === s}
                onPick={() => {
                  onChange(s);
                  setOpen(false);
                }}
              />
            ))}
          </Group>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            disabled={!current}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11px] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear Selection
          </button>
        </div>
      </FloatingMenu>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-2 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function Row({
  stage,
  active,
  onPick,
}: {
  stage: LifecycleStage;
  active: boolean;
  onPick: () => void;
}) {
  const c = STAGE_COLORS[stage];
  return (
    <button
      type="button"
      onClick={onPick}
      className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-xs transition ${
        active ? "bg-white/[0.06] text-foreground" : "text-foreground/90 hover:bg-white/[0.04]"
      }`}
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className={`h-2 w-2 rounded-full ${c.dot}`} />
        <span className={`truncate inline-flex items-center rounded px-1.5 py-0.5 border text-[10px] ${c.badge}`}>
          {stage}
        </span>
      </span>
      {active && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
    </button>
  );
}