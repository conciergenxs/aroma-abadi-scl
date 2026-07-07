import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Standardized confirmation dialog used across the platform for any
 * destructive action (delete contact, delete template, delete group, etc.).
 * Closes on outside click and Escape.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "destructive",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isDestructive = variant === "destructive";

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="flex items-start gap-3 px-5 pt-5 pb-3">
          {isDestructive && (
            <div className="h-9 w-9 grid place-items-center rounded-full bg-destructive/15 text-destructive shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold">{title}</h2>
            {description && (
              <div className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
                {description}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-7 w-7 grid place-items-center rounded hover:bg-gray-50 text-muted-foreground shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-border bg-card/60 hover:bg-card px-3 h-9 text-xs font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`inline-flex items-center rounded-md px-3 h-9 text-xs font-semibold ${
              isDestructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}