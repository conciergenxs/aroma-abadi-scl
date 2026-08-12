import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

/**
 * Portal-rendered floating menu anchored to a trigger element.
 * - Renders into document.body so it is never clipped by overflow/scroll
 *   containers (chat thread, message list, etc.).
 * - Uses fixed positioning + getBoundingClientRect for anchoring.
 * - Handles outside-click + Escape close.
 */
export function FloatingMenu({
  anchorRef,
  open,
  onClose,
  align = "start",
  offset = 6,
  width,
  className = "",
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  align?: "start" | "end";
  offset?: number;
  width?: number;
  className?: string;
  children: ReactNode;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const w = width ?? Math.max(r.width, 220);
      const left = align === "end" ? r.right - w : r.left;
      const maxLeft = window.innerWidth - w - 8;
      setPos({
        top: r.bottom + offset,
        left: Math.max(8, Math.min(left, maxLeft)),
        width: w,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, align, offset, width]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, anchorRef, onClose]);

  if (!open || !pos || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 1000 }}
      className={className}
    >
      {children}
    </div>,
    document.body,
  );
}
