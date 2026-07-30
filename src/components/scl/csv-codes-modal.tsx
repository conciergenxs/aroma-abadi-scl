import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";

const PAGE_SIZE = 10;

export function CsvCodesModal({ fileName, codes, onClose }: { fileName: string; codes: string[]; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(codes.length / PAGE_SIZE));
  const paged = codes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 modal-backdrop">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden modal-content">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{fileName}</div>
            <div className="text-[11px] text-muted-foreground">{codes.length} code{codes.length === 1 ? "" : "s"} found</div>
          </div>
          <button type="button" onClick={onClose} className="h-7 w-7 shrink-0 grid place-items-center rounded hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {paged.length === 0 ? (
            <div className="p-6 text-center text-[12px] text-muted-foreground">No codes found in this file.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/60 sticky top-0">
                  <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground w-12">#</th>
                  <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Code</th>
                </tr>
              </thead>
              <tbody key={page} className="divide-y divide-border/60 stagger">
                {paged.map((code, i) => (
                  <tr key={`${code}-${i}`}>
                    <td className="px-4 py-2 text-[11px] text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-2"><code className="font-mono text-[12px]">{code}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-3 border-t border-border flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 h-8 text-[12px] text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span>{page} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-7 w-7 grid place-items-center rounded border border-border disabled:opacity-40 hover:bg-muted"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
