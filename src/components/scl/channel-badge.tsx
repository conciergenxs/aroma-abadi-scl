import whatsappAsset from "@/assets/whatsapp.png.asset.json";

export type ChannelKey = "whatsapp";

const CHANNEL_MAP: Record<string, { src: string; label: string }> = {
  whatsapp: { src: whatsappAsset.url, label: "WhatsApp" },
};

/**
 * Single source of truth for channel branding (Aroma Abadi: WhatsApp only).
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
  // Aroma Abadi only supports WhatsApp — always render WA badge.
  const c = CHANNEL_MAP.whatsapp;
  void channel;
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

export const ChannelBadge = ChannelIcon;
