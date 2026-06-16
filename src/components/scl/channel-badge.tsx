import whatsappAsset from "@/assets/whatsapp.png.asset.json";
import instagramAsset from "@/assets/instagram.png.asset.json";

export type ChannelKey = "whatsapp" | "instagram";

const CHANNEL_MAP: Record<ChannelKey, { src: string; label: string }> = {
  whatsapp: { src: whatsappAsset.url, label: "WhatsApp" },
  instagram: { src: instagramAsset.url, label: "Instagram" },
};

/**
 * Single source of truth for channel branding.
 * Renders the official brand asset as a circular badge.
 * Use everywhere a channel needs to be visually indicated.
 */
export function ChannelIcon({
  channel,
  className = "",
  size,
}: {
  channel: string;
  className?: string;
  size?: number;
}) {
  const c = CHANNEL_MAP[channel as ChannelKey];
  if (!c) return null;
  const style = size ? { width: size, height: size } : undefined;
  return (
    <img
      src={c.src}
      alt={c.label}
      aria-label={c.label}
      style={style}
      className={`rounded-full object-contain select-none ${className}`}
      draggable={false}
    />
  );
}

/** Backwards-compatible alias for the avatar-attached badge. */
export const ChannelBadge = ChannelIcon;