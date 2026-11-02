import { QrCode, Landmark, CreditCard, Check } from "lucide-react";
import armaMark from "@/assets/aroma-abadi-icon-sand.png";

/* The screens a customer actually sees, rebuilt as static illustrations.
 *
 * The whole business runs inside a WhatsApp thread, so the thread is the one
 * artefact worth showing a reviewer: it is where the order is agreed, where
 * the payment link arrives, and where the receipt lands. Nothing here is
 * interactive — these are pictures of a conversation, not a working form, and
 * no screen collects a keystroke. */

export type ChatMessage = {
  from: "arma" | "customer";
  time: string;
  text?: string;
  /** The breakdown ARMA sends before any money moves. */
  order?: {
    title: string;
    items: { name: string; qty: number; price: string }[];
    rows: { label: string; value: string }[];
    total: string;
  };
  /** The Xendit payment link that follows the breakdown. */
  link?: { title: string; host: string; note: string; url: string };
  /** What lands once Xendit reports the payment as settled. */
  receipt?: { title: string; rows: { label: string; value: string }[]; note: string };
};

function Bubble({
  message,
  index,
  animate,
}: {
  message: ChatMessage;
  index: number;
  animate: boolean;
}) {
  const mine = message.from === "customer";
  return (
    <div
      className={`flex ${mine ? "justify-end" : "justify-start"} ${animate ? "lp-bubble" : ""}`}
      style={animate ? { animationDelay: `${0.45 + index * 0.55}s` } : undefined}
    >
      <div
        className={`max-w-[85%] rounded-[10px] px-[10px] py-[7px] text-[14px] leading-[1.45] shadow-[0_1px_1px_rgba(11,20,26,0.13)] ${
          mine ? "rounded-tr-[3px] bg-[#DCF8C6] text-[#111B21]" : "rounded-tl-[3px] bg-white text-[#111B21]"
        }`}
      >
        {message.text ? <p>{message.text}</p> : null}

        {message.order ? (
          <div className="min-w-[228px]">
            <p className="font-semibold">{message.order.title}</p>
            <ul className="mt-[6px] space-y-[3px]">
              {message.order.items.map((item) => (
                <li key={item.name} className="flex gap-3">
                  <span className="flex-1">
                    {item.name}
                    <span className="text-[#667781]"> ×{item.qty}</span>
                  </span>
                  <span className="tabular-nums">{item.price}</span>
                </li>
              ))}
            </ul>
            <div className="my-[7px] border-t border-dashed border-[#111B21]/15" />
            <ul className="space-y-[3px]">
              {message.order.rows.map((row) => (
                <li key={row.label} className="flex justify-between gap-3 text-[#667781]">
                  <span>{row.label}</span>
                  <span className="tabular-nums">{row.value}</span>
                </li>
              ))}
            </ul>
            <div className="mt-[7px] flex justify-between gap-3 border-t border-[#111B21]/15 pt-[7px] font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{message.order.total}</span>
            </div>
          </div>
        ) : null}

        {message.link ? (
          <div className="min-w-[228px]">
            <div className="rounded-[7px] bg-[#F5F6F6] p-[9px]">
              <p className="text-[13px] font-semibold leading-snug text-[#111B21]">
                {message.link.title}
              </p>
              <p className="mt-[3px] text-[12px] leading-snug text-[#667781]">{message.link.note}</p>
              <p className="mt-[6px] text-[12px] text-[#8696A0]">{message.link.host}</p>
            </div>
            <p className="mt-[6px] break-all text-[13px] text-[#027EB5] underline decoration-[#027EB5]/40">
              {message.link.url}
            </p>
          </div>
        ) : null}

        {message.receipt ? (
          <div className="min-w-[228px]">
            <p className="flex items-center gap-[6px] font-semibold">
              <Check className="h-[15px] w-[15px] text-[#1FA855]" strokeWidth={3} />
              {message.receipt.title}
            </p>
            <ul className="mt-[6px] space-y-[3px]">
              {message.receipt.rows.map((row) => (
                <li key={row.label} className="flex justify-between gap-3">
                  <span className="text-[#667781]">{row.label}</span>
                  <span className="tabular-nums">{row.value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-[7px] border-t border-[#111B21]/15 pt-[7px] text-[#111B21]">
              {message.receipt.note}
            </p>
          </div>
        ) : null}

        <p className="mt-[3px] text-right text-[12px] leading-none text-[#667781]">{message.time}</p>
      </div>
    </div>
  );
}

/** A WhatsApp thread with ARMA. `animate` runs the arrival sequence once, and
 * is reserved for the hero — every other copy of this screen is still. */
export function ChatScreen({
  messages,
  animate = false,
  className = "",
}: {
  messages: ChatMessage[];
  animate?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[18px] border border-white/12 bg-[#EBE3DA] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] ${className}`}
    >
      <div className="flex items-center gap-[10px] bg-[#075E54] px-[13px] py-[10px]">
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[#5C1F24]">
          <img src={armaMark} alt="" className="h-[19px] w-[19px]" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-semibold text-white">
            Arma by Aroma Abadi
          </span>
          <span className="block text-[12px] text-white/70">asisten resmi · online</span>
        </span>
      </div>
      <div className="space-y-[7px] px-[11px] py-[13px]">
        {messages.map((message, index) => (
          <Bubble
            key={`${message.time}-${index}`}
            message={message}
            index={index}
            animate={animate}
          />
        ))}
      </div>
    </div>
  );
}

const METHOD_ICON = { qris: QrCode, va: Landmark, card: CreditCard };

/** The Xendit-hosted payment page the link opens. Drawn in our own styling and
 * labelled as Xendit's — it stands in for the screen, it does not imitate it,
 * and it asks for nothing. */
export function CheckoutScreen({
  invoice,
  amount,
  methods,
  className = "",
}: {
  invoice: string;
  amount: string;
  methods: { id: keyof typeof METHOD_ICON; name: string; note: string }[];
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[18px] border border-[#2544B8]/30 bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] ${className}`}
    >
      <div className="border-b border-[#2544B8]/15 bg-[#F4F6FD] px-[16px] py-[13px]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] text-[#4E5A7A]">PT Aroma Abadi</span>
          <span className="text-[13px] font-semibold tracking-tight text-[#2544B8]">xendit</span>
        </div>
        <p className="mt-[9px] text-[12px] text-[#4E5A7A]">{invoice}</p>
        <p className="text-[25px] font-semibold tabular-nums tracking-tight text-[#111B21]">
          {amount}
        </p>
      </div>
      <div className="px-[16px] py-[14px]">
        <p className="text-[13px] text-[#4E5A7A]">Pilih metode pembayaran</p>
        <ul className="mt-[10px] space-y-[7px]">
          {methods.map((method, index) => {
            const Icon = METHOD_ICON[method.id];
            return (
              <li
                key={method.id}
                className={`flex items-center gap-[11px] rounded-[9px] border px-[11px] py-[9px] ${
                  index === 0 ? "border-[#2544B8] bg-[#F4F6FD]" : "border-[#111B21]/12"
                }`}
              >
                <Icon className="h-[17px] w-[17px] shrink-0 text-[#2544B8]" strokeWidth={1.6} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium text-[#111B21]">{method.name}</span>
                  <span className="block truncate text-[12px] text-[#6B7590]">{method.note}</span>
                </span>
                <span
                  className={`grid h-[16px] w-[16px] shrink-0 place-items-center rounded-full border ${
                    index === 0 ? "border-[#2544B8]" : "border-[#111B21]/25"
                  }`}
                >
                  {index === 0 ? <span className="h-[8px] w-[8px] rounded-full bg-[#2544B8]" /> : null}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-[13px] rounded-[9px] bg-[#2544B8] px-[11px] py-[10px] text-center text-[14px] font-medium text-white">
          Lanjutkan Pembayaran
        </p>
        <p className="mt-[10px] text-center text-[12px] leading-snug text-[#6B7590]">
          Halaman pembayaran dihosting dan diproses oleh Xendit.
        </p>
      </div>
    </div>
  );
}
