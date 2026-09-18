import { useEffect } from "react";

/** Close an overlay with Escape — every modal, drawer and side peek in the app
 * uses this, so the key behaves the same everywhere.
 *
 * Pass `enabled: false` while the overlay is closed; a component that only
 * renders when open can simply pass `true`. */
export function useEscapeKey(enabled: boolean, onClose: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled, onClose]);
}
