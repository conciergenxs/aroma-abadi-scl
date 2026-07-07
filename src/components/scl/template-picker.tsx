import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Star, X as XIcon, FileText, ExternalLink, Plus } from "lucide-react";
import { templatesStore, useTemplatesStore } from "@/components/scl/templates-store";
import { ChannelIcon } from "@/components/scl/channel-badge";

import type { Template } from "@/components/scl/mock-data";

type Props = {
  open: boolean;
  onClose: () => void;
  onInsert: (body: string, template?: Template) => void;
};

const CATEGORIES = ["All", "Starred", "Marketing", "Utility", "Service", "Reminder"] as const;
type Cat = (typeof CATEGORIES)[number];

export function TemplatePicker({ open, onClose, onInsert }: Props) {
  const { templates: allTemplates, starred: starredList } = useTemplatesStore();
  const starred = useMemo(() => new Set(starredList), [starredList]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Cat>("All");
  const [selectedId, setSelectedId] = useState<string | null>(allTemplates[0]?.id ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTemplates.filter((t) => {
      if (cat === "Starred" && !starred.has(t.id)) return false;
      if (cat !== "All" && cat !== "Starred" && t.category !== cat) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [query, cat, starred, allTemplates]);

  // Group results so starred templates always appear in a dedicated section
  // above the rest when no explicit filter excludes them.
  const sections = useMemo(() => {
    if (cat === "Starred") {
      return [{ key: "starred", title: "Starred Templates", items: filtered }];
    }
    const starredItems = filtered.filter((t) => starred.has(t.id));
    const otherItems = filtered.filter((t) => !starred.has(t.id));
    const out: { key: string; title: string; items: typeof filtered }[] = [];
    if (starredItems.length > 0)
      out.push({ key: "starred", title: "Starred Templates", items: starredItems });
    if (otherItems.length > 0)
      out.push({ key: "all", title: "All Templates", items: otherItems });
    return out;
  }, [filtered, starred, cat]);

  const orderedFiltered = useMemo(
    () => sections.flatMap((s) => s.items),
    [sections],
  );

  const selected =
    orderedFiltered.find((t) => t.id === selectedId) ?? orderedFiltered[0] ?? null;

  useEffect(() => {
    if (open) {
      setQuery("");
      setCat("All");
      setSelectedId(allTemplates[0]?.id ?? null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, allTemplates]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (orderedFiltered.length === 0) return;
        e.preventDefault();
        const idx = Math.max(0, orderedFiltered.findIndex((t) => t.id === selected?.id));
        const next =
          e.key === "ArrowDown"
            ? (idx + 1) % orderedFiltered.length
            : (idx - 1 + orderedFiltered.length) % orderedFiltered.length;
        setSelectedId(orderedFiltered[next].id);
      }
      if (e.key === "Enter" && selected) {
        e.preventDefault();
        onInsert(selected.body, selected);
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, orderedFiltered, selected, onClose, onInsert]);

  const toggleStar = (id: string) => templatesStore.toggleStar(id);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl h-[600px] max-h-[90vh] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/60">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Use a template</h2>
          <span className="text-[11px] text-muted-foreground">Browse, search and insert reusable messages</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              to="/templates"
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md border border-border hover:bg-white/[0.04] text-muted-foreground hover:text-foreground"
            >
              Manage templates <ExternalLink className="h-3 w-3" />
            </Link>
            <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-white/[0.05] text-muted-foreground">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search + categories */}
        <div className="px-5 pt-3.5 pb-3 border-b border-border/60 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, content or category…"
              className="w-full h-9 rounded-md border border-border bg-background/40 pl-9 pr-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const sel = cat === c;
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium border transition ${
                    sel
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                  }`}
                >
                  {c === "Starred" && <Star className="h-3 w-3 fill-current" />}
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 grid grid-cols-[1fr_320px]">
          {/* List */}
          <div className="overflow-y-auto border-r border-border/60">
            {orderedFiltered.length === 0 ? (
              <EmptyState />
            ) : (
              <div>
                {sections.map((section) => (
                  <div key={section.key}>
                    <div className="sticky top-0 z-10 px-4 py-1.5 bg-card/95 backdrop-blur text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60 flex items-center gap-1.5">
                      {section.key === "starred" && (
                        <Star className="h-3 w-3 fill-current text-amber-300" />
                      )}
                      {section.title}
                      <span className="text-muted-foreground/60">
                        ({section.items.length})
                      </span>
                    </div>
                    <ul className="divide-y divide-border/60">
                      {section.items.map((t) => {
                        const sel = selected?.id === t.id;
                        return (
                          <li key={t.id}>
                            <button
                              onClick={() => setSelectedId(t.id)}
                              onDoubleClick={() => { onInsert(t.body, t); onClose(); }}
                              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition ${
                                sel ? "bg-primary/10" : "hover:bg-white/[0.03]"
                              }`}
                            >
                              <ChannelIcon channel={t.channel} className="h-5 w-5 mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-medium truncate">{t.name}</span>
                                  <span className="inline-flex items-center rounded-full border border-border bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {t.category}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-2">{t.body}</p>
                                <div className="mt-1 text-[10px] text-muted-foreground/70">Updated {t.updated}</div>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleStar(t.id); }}
                                className={`h-7 w-7 grid place-items-center rounded shrink-0 ${
                                  starred.has(t.id)
                                    ? "text-amber-300"
                                    : "text-muted-foreground/50 hover:text-amber-300"
                                }`}
                                aria-label="Toggle favorite"
                              >
                                <Star className={`h-3.5 w-3.5 ${starred.has(t.id) ? "fill-current" : ""}`} />
                              </button>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex flex-col overflow-hidden">
            {selected ? (
              <>
                <div className="px-4 py-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <ChannelIcon channel={selected.channel} className="h-4 w-4" />
                    <span className="text-[13px] font-semibold truncate">{selected.name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{selected.category}</span>
                    <span>·</span>
                    <span>Updated {selected.updated}</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3.5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1.5">Preview</div>
                  <div className="rounded-lg border border-border bg-background/40 px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap">
                    {renderPreview(selected.body)}
                  </div>
                  {extractVars(selected.body).length > 0 && (
                    <>
                      <div className="mt-4 text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1.5">Variables</div>
                      <ul className="space-y-1">
                        {extractVars(selected.body).map((v) => (
                          <li key={v} className="text-[11px] text-muted-foreground">
                            <code className="rounded bg-white/[0.05] px-1.5 py-0.5 text-primary">{`{{${v}}}`}</code>
                            <span className="ml-2">Will be filled at send time</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                <div className="px-4 py-3 border-t border-border/60">
                  <button
                    onClick={() => { onInsert(selected.body, selected); onClose(); }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Use template
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 grid place-items-center text-xs text-muted-foreground">Select a template</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function extractVars(body: string): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([^}]+?)\s*\}\}/g;
  let m;
  while ((m = re.exec(body))) set.add(m[1]);
  return [...set];
}

function renderPreview(body: string) {
  const parts = body.split(/(\{\{[^}]+\}\})/g);
  return parts.map((p, i) =>
    /^\{\{[^}]+\}\}$/.test(p) ? (
      <span key={i} className="rounded bg-primary/15 px-1 py-0.5 text-primary text-[12px] font-medium">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function EmptyState() {
  return (
    <div className="h-full grid place-items-center px-6 py-10 text-center">
      <div className="max-w-xs space-y-3">
        <div className="mx-auto h-10 w-10 grid place-items-center rounded-full bg-white/[0.04] border border-border">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-sm font-medium">No templates found</div>
        <div className="text-[12px] text-muted-foreground">
          Try a different search or create your first template.
        </div>
        <Link
          to="/templates"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Create template
        </Link>
      </div>
    </div>
  );
}