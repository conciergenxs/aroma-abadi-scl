type Channel = "whatsapp" | "instagram" | "telegram" | "messenger";

export function ChannelBadge({ channel, className = "" }: { channel: string; className?: string }) {
  const base = `inline-grid place-items-center ${className}`;
  switch (channel as Channel) {
    case "whatsapp":
      return (
        <span className={base} style={{ background: "#25D366" }} aria-label="WhatsApp">
          <svg viewBox="0 0 32 32" className="h-[70%] w-[70%]" fill="white">
            <path d="M19.11 17.21c-.27-.13-1.6-.79-1.85-.88-.25-.09-.43-.13-.6.13-.18.27-.7.88-.85 1.06-.16.18-.31.2-.58.07-.27-.13-1.14-.42-2.17-1.34-.8-.71-1.34-1.6-1.5-1.86-.16-.27-.02-.41.12-.55.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.6-1.45-.83-1.98-.22-.52-.44-.45-.6-.46h-.51c-.18 0-.47.07-.71.34-.25.27-.94.92-.94 2.25 0 1.33.96 2.6 1.1 2.79.13.18 1.9 2.9 4.6 4.06.64.28 1.14.44 1.53.57.64.2 1.23.17 1.7.1.52-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.31zM16 4C9.37 4 4 9.37 4 16c0 2.07.54 4.09 1.57 5.87L4 28l6.27-1.64A11.96 11.96 0 0 0 16 28c6.63 0 12-5.37 12-12S22.63 4 16 4z"/>
          </svg>
        </span>
      );
    case "instagram":
      return (
        <span
          className={base}
          style={{ background: "radial-gradient(circle at 30% 110%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)" }}
          aria-label="Instagram"
        >
          <svg viewBox="0 0 24 24" className="h-[62%] w-[62%]" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
          </svg>
        </span>
      );
    case "telegram":
      return (
        <span className={base} style={{ background: "#229ED9" }} aria-label="Telegram">
          <svg viewBox="0 0 24 24" className="h-[70%] w-[70%]" fill="white">
            <path d="M21.5 4.2 2.9 11.4c-1 .4-.99 1 .03 1.3l4.7 1.4 1.83 5.6c.22.6.41.83.84.83.33 0 .47-.15.66-.33l2.32-2.25 4.83 3.57c.89.49 1.52.24 1.74-.82l3.16-14.9c.32-1.3-.49-1.89-1.41-1.62z"/>
          </svg>
        </span>
      );
    case "messenger":
      return (
        <span className={base} style={{ background: "linear-gradient(180deg,#00B2FF 0%,#006AFF 100%)" }} aria-label="Messenger">
          <svg viewBox="0 0 24 24" className="h-[72%] w-[72%]" fill="white">
            <path d="M12 2C6.5 2 2.2 6.1 2.2 11.3c0 2.7 1.2 5.1 3.2 6.7v3.3l3-1.6c.8.2 1.7.3 2.6.3 5.5 0 9.8-4.1 9.8-9.3S17.5 2 12 2zm1 12.4-2.5-2.7-4.9 2.7L11 9l2.6 2.7L18.4 9 13 14.4z"/>
          </svg>
        </span>
      );
    default:
      return <span className={`${base} bg-muted`} />;
  }
}