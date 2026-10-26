import { Film } from "lucide-react";

/* The header WhatsApp draws above a template's body: one line of text, or an
 * image or video. It appears in two places — the composer's live preview and
 * the sent broadcast's preview — and they have to agree, so both render this.
 *
 * Nothing is drawn when the template has no header, which is the common case. */

export type MessageHeaderProps = {
  headerType?: "none" | "text" | "image" | "video";
  headerText?: string;
  headerMediaUrl?: string;
  headerMediaName?: string;
};

export function MessageHeader({
  headerType,
  headerText,
  headerMediaUrl,
  headerMediaName,
}: MessageHeaderProps) {
  if (!headerType || headerType === "none") return null;

  if (headerType === "text") {
    return headerText ? (
      <div className="mb-1 font-semibold text-[12px] leading-snug">{headerText}</div>
    ) : null;
  }

  if (headerType === "image") {
    return headerMediaUrl ? (
      <img
        src={headerMediaUrl}
        alt={headerMediaName ?? "Message header"}
        className="mb-1 block max-h-[150px] w-full rounded-lg object-cover"
      />
    ) : null;
  }

  // A video header can't autoplay in a static preview, so it reads as what it
  // is: the file the recipient will see a player for.
  return (
    <div className="mb-1 flex items-center gap-1.5 rounded-lg border border-border bg-background/40 px-2 py-1.5 text-[11px] text-muted-foreground">
      <Film className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{headerMediaName ?? "Video header"}</span>
    </div>
  );
}

/** What the header is, in a word — for a read-only field. */
export function headerSummary(type?: MessageHeaderProps["headerType"]): string {
  if (type === "text") return "Text";
  if (type === "image") return "Image";
  if (type === "video") return "Video";
  return "None";
}
