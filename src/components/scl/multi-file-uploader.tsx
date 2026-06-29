import { useRef, type ChangeEvent } from "react";
import { Upload, FileText, Image as ImageIcon, FileSpreadsheet, File as FileIcon, X, Download } from "lucide-react";
import { fileToAttachment, type Attachment } from "./sku-store";
import { toast } from "sonner";

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function iconFor(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.includes("pdf")) return FileText;
  if (type.includes("sheet") || type.includes("excel") || type.includes("csv")) return FileSpreadsheet;
  return FileIcon;
}

export function MultiFileUploader({
  files,
  onAdd,
  onRemove,
  label = "Attach files",
  accept,
}: {
  files: Attachment[];
  onAdd: (atts: Attachment[]) => void;
  onRemove: (id: string) => void;
  label?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    try {
      const atts = await Promise.all(Array.from(list).map(fileToAttachment));
      onAdd(atts);
      toast.success(`${atts.length} file ditambahkan`);
    } catch {
      toast.error("Gagal memproses file");
    }
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="w-full rounded-lg border border-dashed border-border bg-card/40 hover:bg-card/60 transition-colors px-4 py-6 flex flex-col items-center justify-center gap-2 text-center"
      >
        <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">Drag & drop atau klik untuk upload (multi-file)</div>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={onChange}
      />
      {files.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card/40 overflow-hidden">
          {files.map((f) => {
            const Icon = iconFor(f.fileType);
            return (
              <li key={f.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="h-8 w-8 grid place-items-center rounded-md bg-white/[0.04] border border-border">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{f.fileName}</div>
                  <div className="text-[10px] text-muted-foreground">{formatBytes(f.size)} · {f.fileType || "file"}</div>
                </div>
                <a
                  href={f.url}
                  download={f.fileName}
                  className="grid h-7 w-7 place-items-center rounded hover:bg-white/[0.06] text-muted-foreground"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => onRemove(f.id)}
                  className="grid h-7 w-7 place-items-center rounded hover:bg-rose-500/10 text-rose-400"
                  title="Hapus"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
