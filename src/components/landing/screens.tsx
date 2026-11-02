import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CreditCard, Landmark, Phone, Plus, QrCode, Video } from "lucide-react";
import armaMark from "@/assets/aroma-abadi-icon-sand.png";

/* The screens a customer actually sees.
 *
 * The whole business runs inside a WhatsApp thread, so the thread is the one
 * artefact worth showing: it is where the order is agreed, where the payment
 * link arrives, and where the receipt lands. Nothing here is interactive —
 * these are pictures of a conversation, not a working form, and no screen
 * takes a keystroke. */

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

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
  link?: { title: string; note: string; host: string; url: string };
  /** What lands once Xendit reports the payment as settled. */
  receipt?: { title: string; rows: { label: string; value: string }[]; note: string };
};

function Ticks() {
  return (
    <span className="relative inline-block h-[11px] w-[15px] align-middle">
      <Check className="absolute left-0 top-0 h-[11px] w-[11px] text-[#53BDEB]" strokeWidth={3.5} />
      <Check className="absolute left-[4px] top-0 h-[11px] w-[11px] text-[#53BDEB]" strokeWidth={3.5} />
    </span>
  );
}

function Rows({ rows, muted }: { rows: { label: string; value: string }[]; muted?: boolean }) {
  return (
    <ul className="space-y-[3px]">
      {rows.map((row) => (
        <li key={row.label} className="flex justify-between gap-3">
          <span className={muted ? "text-[#667781]" : undefined}>{row.label}</span>
          <span className="tabular-nums">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

function Bubble({ message, hidden }: { message: ChatMessage; hidden: boolean }) {
  const mine = message.from === "customer";
  const structured = Boolean(message.order || message.link || message.receipt);
  return (
    <div
      className={`flex ${mine ? "justify-end" : "justify-start"} ${
        hidden ? "lp-msg" : "lp-msg lp-msg-in"
      }`}
    >
      <div
        className={`relative ${structured ? "w-[88%]" : "max-w-[86%]"} rounded-[8px] px-[9px] py-[6px] text-[13.5px] leading-[1.42] text-[#111B21] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
          mine ? "rounded-tr-[2px] bg-[#D9FDD3]" : "rounded-tl-[2px] bg-white"
        }`}
      >
        {message.text ? <p>{message.text}</p> : null}

        {message.order ? (
          <div>
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
            <div className="my-[6px] border-t border-dashed border-[#111B21]/15" />
            <Rows rows={message.order.rows} muted />
            <div className="mt-[6px] flex justify-between gap-3 border-t border-[#111B21]/15 pt-[6px] font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{message.order.total}</span>
            </div>
          </div>
        ) : null}

        {message.link ? (
          <div>
            <div className="rounded-[6px] bg-[#F5F6F6] p-[8px]">
              <p className="text-[12.5px] font-semibold leading-snug">{message.link.title}</p>
              <p className="mt-[2px] text-[12px] leading-snug text-[#667781]">{message.link.note}</p>
              <p className="mt-[5px] text-[12px] text-[#8696A0]">{message.link.host}</p>
            </div>
            <p className="mt-[5px] break-all text-[12.5px] text-[#027EB5] underline decoration-[#027EB5]/40">
              {message.link.url}
            </p>
          </div>
        ) : null}

        {message.receipt ? (
          <div>
            <p className="flex items-center gap-[5px] font-semibold">
              <Check className="h-[14px] w-[14px] text-[#1FA855]" strokeWidth={3} />
              {message.receipt.title}
            </p>
            <div className="mt-[6px]">
              <Rows rows={message.receipt.rows} muted />
            </div>
            <p className="mt-[6px] border-t border-[#111B21]/15 pt-[6px]">{message.receipt.note}</p>
          </div>
        ) : null}

        <p className="mt-[2px] flex items-center justify-end gap-[3px] text-[12px] leading-none text-[#667781]">
          {message.time}
          {mine ? <Ticks /> : null}
        </p>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="rounded-[8px] rounded-tl-[2px] bg-white px-[11px] py-[10px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
        <span className="flex items-center gap-[4px]">
          <i className="lp-dot h-[6px] w-[6px] rounded-full bg-[#9AA6AC]" />
          <i className="lp-dot h-[6px] w-[6px] rounded-full bg-[#9AA6AC]" style={{ animationDelay: "0.16s" }} />
          <i className="lp-dot h-[6px] w-[6px] rounded-full bg-[#9AA6AC]" style={{ animationDelay: "0.32s" }} />
        </span>
      </div>
    </div>
  );
}

function ChatHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-[9px] bg-[#075E54] ${compact ? "px-[11px] py-[9px]" : "px-[12px] py-[10px]"}`}>
      {compact ? null : <ArrowLeft className="h-[17px] w-[17px] shrink-0 text-white/85" strokeWidth={2} />}
      <span className="grid h-[31px] w-[31px] shrink-0 place-items-center rounded-full bg-[#5C1F24]">
        <img src={armaMark} alt="" className="h-[17px] w-[17px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-white">Aroma Abadi</span>
        <span className="block text-[12px] text-white/65">online</span>
      </span>
      {compact ? null : (
        <>
          <Video className="h-[17px] w-[17px] shrink-0 text-white/85" strokeWidth={2} />
          <Phone className="h-[15px] w-[15px] shrink-0 text-white/85" strokeWidth={2} />
        </>
      )}
    </div>
  );
}

/** A still of the thread, used beside each step of the transaction flow. */
export function ChatScreen({ messages, className = "" }: { messages: ChatMessage[]; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[16px] border border-[#2B211D]/10 bg-[#EFE7DE] shadow-[0_18px_44px_-24px_rgba(62,19,25,0.45)] ${className}`}
    >
      <ChatHeader compact />
      <div className="lp-wallpaper space-y-[6px] px-[10px] py-[12px]">
        {messages.map((message, index) => (
          <Bubble key={index} message={message} hidden={false} />
        ))}
      </div>
    </div>
  );
}

const METHOD_ICON = { qris: QrCode, va: Landmark, card: CreditCard };
export type PaymentMethod = { id: keyof typeof METHOD_ICON; name: string; note: string };

/** The Xendit-hosted payment page the link opens. Drawn in our own styling and
 * labelled as Xendit's: it stands in for the screen, it does not imitate it,
 * and it asks for nothing. */
export function CheckoutScreen({
  invoice,
  amount,
  methods,
  className = "",
  framed = true,
}: {
  invoice: string;
  amount: string;
  methods: PaymentMethod[];
  className?: string;
  framed?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden bg-white ${
        framed
          ? "rounded-[16px] border border-[#2B211D]/10 shadow-[0_18px_44px_-24px_rgba(62,19,25,0.45)]"
          : ""
      } ${className}`}
    >
      <div className="border-b border-[#2B211D]/10 bg-[#FAF5EF] px-[15px] py-[13px]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[12.5px] text-[#6B5A50]">PT Aroma Abadi</span>
          <span className="text-[13px] font-semibold tracking-tight text-[#2B211D]">xendit</span>
        </div>
        <p className="mt-[8px] text-[12px] text-[#6B5A50]">{invoice}</p>
        <p className="text-[24px] font-semibold tabular-nums tracking-tight text-[#2B211D]">
          {amount}
        </p>
      </div>
      <div className="px-[15px] py-[13px]">
        <p className="text-[12.5px] text-[#6B5A50]">Pilih metode pembayaran</p>
        <ul className="mt-[9px] space-y-[6px]">
          {methods.map((method, index) => {
            const Icon = METHOD_ICON[method.id];
            const on = index === 0;
            return (
              <li
                key={method.id}
                className={`flex items-center gap-[10px] rounded-[8px] border px-[10px] py-[8px] transition-colors ${
                  on ? "border-[#71222A] bg-[#71222A]/5" : "border-[#2B211D]/12"
                }`}
              >
                <Icon
                  className={`h-[16px] w-[16px] shrink-0 ${on ? "text-[#71222A]" : "text-[#8B6B51]"}`}
                  strokeWidth={1.6}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-[#2B211D]">{method.name}</span>
                  <span className="block text-[12px] leading-snug text-[#6B5A50]">{method.note}</span>
                </span>
                <span
                  className={`grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border ${
                    on ? "border-[#71222A]" : "border-[#2B211D]/25"
                  }`}
                >
                  {on ? <span className="h-[7px] w-[7px] rounded-full bg-[#71222A]" /> : null}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-[12px] rounded-[8px] bg-[#71222A] px-[10px] py-[9px] text-center text-[13.5px] font-medium text-white">
          Bayar Sekarang
        </p>
        <p className="mt-[9px] text-center text-[12px] leading-snug text-[#6B5A50]">
          Halaman pembayaran dihosting dan diproses oleh Xendit.
        </p>
      </div>
    </div>
  );
}

/* ── The hero: one transaction, played on a loop ─────────────────────────
 * A still screenshot can't show that paying never leaves the conversation,
 * so the hero plays the whole thing: the customer asks, ARMA answers, the
 * breakdown and the link arrive, the Xendit page slides up over the thread,
 * and the receipt lands back in the same chat. Then it starts again.
 *
 * Server-rendered with every message in place, so the thread is in the HTML
 * whether or not the script runs, and left that way for anyone who asked
 * their system to minimise motion. */

type Beat = { after: number; show?: number; typing?: boolean; checkout?: boolean; reset?: boolean };

export function LiveChat({
  messages,
  checkout,
  className = "",
}: {
  messages: ChatMessage[];
  checkout: { invoice: string; amount: string; methods: PaymentMethod[] };
  className?: string;
}) {
  const [shown, setShown] = useState<number | null>(null);
  const [typing, setTyping] = useState(false);
  const [paying, setPaying] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShown(0);
  }, []);

  useEffect(() => {
    if (shown === null) return;
    const beats: Beat[] = [
      { after: 450, show: 1 },
      { after: 500, typing: true },
      { after: 1250, typing: false, show: 2 },
      { after: 1150, show: 3 },
      { after: 550, typing: true },
      { after: 1150, typing: false, show: 4 },
      { after: 800, typing: true },
      { after: 950, typing: false, show: 5 },
      { after: 1300, checkout: true },
      { after: 2800, checkout: false },
      { after: 450, typing: true },
      { after: 950, typing: false, show: 6 },
      { after: 3200, reset: true },
    ];
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let i = 0;
    const run = () => {
      if (cancelled) return;
      const beat = beats[i % beats.length];
      timer = setTimeout(() => {
        if (cancelled) return;
        if (beat.reset) {
          setShown(0);
          setTyping(false);
          setPaying(false);
        } else {
          if (beat.typing !== undefined) setTyping(beat.typing);
          if (beat.show !== undefined) setShown(beat.show);
          if (beat.checkout !== undefined) setPaying(beat.checkout);
        }
        i += 1;
        run();
      }, beat.after);
    };
    run();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // The timeline is fixed; it is started once and restarts itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown === null]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [shown, typing]);

  const count = shown === null ? messages.length : shown;

  return (
    <div className={`lp-phone relative ${className}`}>
      <div className="relative overflow-hidden rounded-[34px] border-[8px] border-[#17100E] bg-[#17100E] shadow-[0_40px_90px_-32px_rgba(62,19,25,0.55)]">
        <div className="relative overflow-hidden rounded-[26px] bg-[#EFE7DE]">
          {/* Status bar */}
          <div className="flex items-center justify-between bg-[#075E54] px-[15px] pb-[2px] pt-[7px] text-[11.5px] font-medium text-white/90">
            <span>09.41</span>
            <span className="flex items-center gap-[4px]">
              <span className="h-[7px] w-[7px] rounded-full bg-white/80" />
              <span className="h-[9px] w-[16px] rounded-[3px] border border-white/70" />
            </span>
          </div>
          <ChatHeader />

          <div
            ref={threadRef}
            className="lp-wallpaper scrollbar-none h-[430px] space-y-[6px] overflow-y-auto px-[10px] py-[12px]"
          >
            <p className="mx-auto w-fit rounded-[7px] bg-white/85 px-[9px] py-[3px] text-[12px] text-[#54656F] shadow-[0_1px_0.5px_rgba(11,20,26,0.1)]">
              Hari ini
            </p>
            {messages.map((message, index) => (
              <Bubble key={index} message={message} hidden={index >= count} />
            ))}
            {typing ? <Typing /> : null}
          </div>

          {/* Composer */}
          <div className="flex items-center gap-[8px] bg-[#F0F2F5] px-[10px] py-[8px]">
            <span className="flex h-[32px] flex-1 items-center rounded-full bg-white px-[12px] text-[13px] text-[#8696A0]">
              Ketik pesan
            </span>
            <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full bg-[#00A884]">
              <Plus className="h-[16px] w-[16px] text-white" strokeWidth={2.4} />
            </span>
          </div>

          {/* The Xendit page, opened from the link without leaving the phone */}
          <div
            className={`absolute inset-0 flex flex-col justify-end transition-[opacity] duration-300 ${
              paying ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div
              className={`absolute inset-0 bg-[#17100E]/45 transition-opacity duration-300 ${
                paying ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              className={`relative max-h-full overflow-hidden rounded-t-[20px] bg-white transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                paying ? "translate-y-0" : "translate-y-full"
              }`}
            >
              <p className="flex items-center justify-between border-b border-[#2B211D]/10 px-[15px] py-[9px] text-[12px] text-[#6B5A50]">
                <span className="truncate">checkout.xendit.co</span>
                <span className="h-[4px] w-[34px] rounded-full bg-[#2B211D]/15" />
              </p>
              <CheckoutScreen framed={false} {...checkout} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
