import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  ImagePlus,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

/* A small rich-text field for knowledge content: bold, italic, underline,
 * lists, a link and an inline image. It edits a contenteditable surface and
 * hands back HTML, which is what the BA app renders.
 *
 * No editor library: the toolbar below covers what this content actually
 * needs, and `execCommand` — deprecated but implemented everywhere — keeps
 * this to one file instead of five packages for a form field. */

export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
};

/** Visible text of an HTML fragment — for previews, search and "is it empty". */
export function htmlToText(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, " ").trim();
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

type ToolbarAction = {
  id: string;
  label: string;
  icon: React.ElementType;
  run: () => void;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = "",
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  // Where the caret was before focus moved to the toolbar — execCommand works
  // on the live selection, so it has to be put back first.
  const savedRange = useRef<Range | null>(null);

  // Seed the surface once; after that the DOM is the source of truth, because
  // rewriting innerHTML on every keystroke would throw the caret to the start.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (!sel) return;
    ref.current?.focus();
    if (savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const emit = () => onChange(ref.current?.innerHTML ?? "");

  const exec = (command: string, arg?: string) => {
    restoreSelection();
    document.execCommand(command, false, arg);
    emit();
  };

  const insertImage = (file: File) => {
    const reader = new FileReader();
    reader.onerror = () => toast.error("Could not read that file.");
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const probe = new window.Image();
      probe.onload = () => exec("insertImage", dataUrl);
      probe.onerror = () =>
        toast.error("That image format can't be displayed. Try a JPG, PNG, or WebP.");
      probe.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const actions: ToolbarAction[][] = [
    [
      { id: "bold", label: "Bold", icon: Bold, run: () => exec("bold") },
      { id: "italic", label: "Italic", icon: Italic, run: () => exec("italic") },
      { id: "underline", label: "Underline", icon: Underline, run: () => exec("underline") },
    ],
    [
      {
        id: "ul",
        label: "Bulleted list",
        icon: List,
        run: () => exec("insertUnorderedList"),
      },
      {
        id: "ol",
        label: "Numbered list",
        icon: ListOrdered,
        run: () => exec("insertOrderedList"),
      },
    ],
    [
      {
        id: "link",
        label: "Add link",
        icon: Link2,
        run: () => {
          saveSelection();
          setLinkOpen((o) => !o);
        },
      },
      {
        id: "image",
        label: "Insert image",
        icon: ImagePlus,
        run: () => {
          saveSelection();
          fileRef.current?.click();
        },
      },
    ],
  ];

  return (
    <div
      className={`relative flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card/60 focus-within:ring-1 focus-within:ring-primary/40 ${className}`}
    >
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        {actions.map((group, gi) => (
          <div key={gi} className="flex items-center gap-1">
            {gi > 0 && <div aria-hidden className="mx-1 h-5 w-px bg-border" />}
            {group.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  type="button"
                  title={a.label}
                  aria-label={a.label}
                  onMouseDown={(e) => {
                    // Keep the caret where it is — the button must not steal it.
                    e.preventDefault();
                    saveSelection();
                  }}
                  onClick={a.run}
                  className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {linkOpen && (
        <div className="flex items-center gap-1.5 border-b border-border bg-background/60 px-2 py-1.5">
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (linkUrl.trim()) exec("createLink", linkUrl.trim());
                setLinkUrl("");
                setLinkOpen(false);
              }
              if (e.key === "Escape") setLinkOpen(false);
            }}
            placeholder="https://…"
            aria-label="Link address"
            className="h-7 flex-1 rounded border border-border bg-card px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <button
            type="button"
            onClick={() => {
              if (linkUrl.trim()) exec("createLink", linkUrl.trim());
              setLinkUrl("");
              setLinkOpen(false);
            }}
            aria-label="Apply link"
            className="h-7 w-7 grid place-items-center rounded text-primary hover:bg-primary/10 transition-colors duration-150"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setLinkOpen(false)}
            aria-label="Cancel link"
            className="h-7 w-7 grid place-items-center rounded text-muted-foreground hover:bg-muted transition-colors duration-150"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) insertImage(file);
        }}
      />

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={() => {
          saveSelection();
          emit();
        }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        className="scl-richtext flex-1 min-h-0 overflow-y-auto px-2.5 py-2 text-[14px] leading-relaxed focus:outline-none"
      />
    </div>
  );
}
