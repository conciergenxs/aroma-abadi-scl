import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Landmark,
  Lock,
  Phone,
  QrCode,
  Send,
  Video,
  Wallet,
} from "lucide-react";
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
  order?: {
    title: string;
    items: { name: string; qty: number; price: string }[];
    rows: { label: string; value: string }[];
    total: string;
  };
  link?: { title: string; note: string; host: string; url: string };
  receipt?: { title: string; rows: { label: string; value: string }[]; note: string };
};

function Ticks() {
  return (
    <span className="relative inline-block h-[11px] w-[15px] align-middle">
      <Check className="absolute left-0 top-0 h-[11px] w-[11px] text-[#53BDEB]" strokeWidth={3.5} />
      <Check
        className="absolute left-[4px] top-0 h-[11px] w-[11px] text-[#53BDEB]"
        strokeWidth={3.5}
      />
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
    <div className={`${mine ? "justify-end" : "justify-start"} ${hidden ? "lp-msg" : "lp-msg-in"}`}>
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
                  {/* Quantity leads the line so a wrapping product name can
                      never strand it on a line of its own. */}
                  <span className="flex-1">
                    <span className="text-[#667781]">{item.qty}× </span>
                    {item.name}
                  </span>
                  <span className="shrink-0 tabular-nums">{item.price}</span>
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
              <p className="mt-[2px] text-[12px] leading-snug text-[#667781]">
                {message.link.note}
              </p>
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

function TypingBubble() {
  return (
    <div className="lp-msg-in justify-start">
      <div className="rounded-[8px] rounded-tl-[2px] bg-white px-[11px] py-[10px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
        <span className="flex items-center gap-[4px]">
          <i className="lp-dot h-[6px] w-[6px] rounded-full bg-[#9AA6AC]" />
          <i
            className="lp-dot h-[6px] w-[6px] rounded-full bg-[#9AA6AC]"
            style={{ animationDelay: "0.16s" }}
          />
          <i
            className="lp-dot h-[6px] w-[6px] rounded-full bg-[#9AA6AC]"
            style={{ animationDelay: "0.32s" }}
          />
        </span>
      </div>
    </div>
  );
}

function ChatHeader({ compact = false, status }: { compact?: boolean; status?: string }) {
  return (
    <div
      className={`flex items-center gap-[9px] bg-[#075E54] ${compact ? "px-[11px] py-[9px]" : "px-[12px] py-[10px]"}`}
    >
      {compact ? null : (
        <ArrowLeft className="h-[17px] w-[17px] shrink-0 text-white/85" strokeWidth={2} />
      )}
      <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full bg-[#710014]">
        <img src={armaMark} alt="" className="w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-white">Aroma Abadi</span>
        <span className="block text-[12px] text-white/65">{status ?? "online"}</span>
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
export function ChatScreen({
  messages,
  className = "",
}: {
  messages: ChatMessage[];
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[16px] border border-[#E6D8CD] bg-[#EFE7DE] shadow-[0_18px_44px_-24px_rgba(113,0,20,0.4)] ${className}`}
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

/* ── The Xendit payment page ─────────────────────────────────────────────
 * Grouped the way Xendit's own hosted page groups its Indonesian channels:
 * QRIS, virtual account, e-wallet and cards, each naming the networks it
 * actually covers. Drawn in our styling and labelled as Xendit's — it
 * stands in for the screen, it does not imitate it, and it asks nothing. */

const METHOD_ICON = { qris: QrCode, va: Landmark, ewallet: Wallet, card: CreditCard };
export type PaymentMethod = { id: keyof typeof METHOD_ICON; name: string; note: string };

export function CheckoutScreen({
  invoice,
  amount,
  expiry,
  methods,
  className = "",
  framed = true,
}: {
  invoice: string;
  amount: string;
  expiry: string;
  methods: PaymentMethod[];
  className?: string;
  framed?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden bg-white ${
        framed
          ? "rounded-[16px] border border-[#E6D8CD] shadow-[0_18px_44px_-24px_rgba(113,0,20,0.4)]"
          : ""
      } ${className}`}
    >
      <div className="border-b border-[#E6D8CD] bg-[#F3F0EC] px-[15px] py-[13px]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[12.5px] text-[#55504B]">PT Aroma Abadi</span>
          <span className="text-[13px] font-semibold tracking-tight text-[#161616]">xendit</span>
        </div>
        <p className="mt-[9px] text-[12px] text-[#55504B]">Total pembayaran · {invoice}</p>
        <p className="text-[23px] font-semibold tabular-nums leading-tight tracking-tight text-[#161616]">
          {amount}
        </p>
        <p className="mt-[3px] text-[12px] text-[#8A6246]">Bayar sebelum {expiry}</p>
      </div>
      <div className="px-[15px] py-[13px]">
        <p className="text-[12.5px] text-[#55504B]">Pilih metode pembayaran</p>
        <ul className="mt-[9px] space-y-[6px]">
          {methods.map((method, index) => {
            const Icon = METHOD_ICON[method.id];
            const on = index === 0;
            return (
              <li
                key={method.id}
                className={`flex items-center gap-[10px] rounded-[8px] border px-[10px] py-[8px] ${
                  on ? "border-[#710014] bg-[#710014]/5" : "border-[#E6D8CD]"
                }`}
              >
                <Icon
                  className={`h-[16px] w-[16px] shrink-0 ${on ? "text-[#710014]" : "text-[#8A6246]"}`}
                  strokeWidth={1.6}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-[#161616]">
                    {method.name}
                  </span>
                  <span className="block text-[12px] leading-snug text-[#55504B]">
                    {method.note}
                  </span>
                </span>
                <span
                  className={`grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border ${
                    on ? "border-[#710014]" : "border-[#161616]/25"
                  }`}
                >
                  {on ? <span className="h-[7px] w-[7px] rounded-full bg-[#710014]" /> : null}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-[12px] rounded-[8px] bg-[#710014] px-[10px] py-[9px] text-center text-[13.5px] font-medium text-white">
          Bayar Sekarang
        </p>
        <p className="mt-[9px] flex items-center justify-center gap-[5px] text-[12px] text-[#55504B]">
          <Lock className="h-[12px] w-[12px]" strokeWidth={2} />
          Dihosting dan diproses oleh Xendit
        </p>
      </div>
    </div>
  );
}

/* ── The hero: one transaction, played on a loop ─────────────────────────
 * A still can't show that paying never leaves the conversation, so the hero
 * plays the whole thing at reading pace: the customer types into the
 * composer, the message sends, ARMA answers, the breakdown and the link
 * arrive, the Xendit page slides up over the thread, and the receipt lands
 * back in the same chat. Then it starts again.
 *
 * Server-rendered with every message in place, so the thread is in the HTML
 * whether or not the script runs, and left that way for anyone who asked
 * their system to minimise motion. */

export type Beat =
  | { t: "pause"; ms: number }
  | { t: "type"; i: number }
  | { t: "armaTyping"; ms: number }
  | { t: "send"; i: number }
  | { t: "checkout"; ms: number };

export function LiveChat({
  messages,
  script,
  checkout,
  className = "",
}: {
  messages: ChatMessage[];
  script: Beat[];
  checkout: { invoice: string; amount: string; expiry: string; methods: PaymentMethod[] };
  className?: string;
}) {
  const [live, setLive] = useState(false);
  const [sent, setSent] = useState(0);
  const [draft, setDraft] = useState("");
  const [armaTyping, setArmaTyping] = useState(false);
  const [paying, setPaying] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setLive(true);
  }, []);

  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    const run = async () => {
      while (!cancelled) {
        setSent(0);
        setDraft("");
        setArmaTyping(false);
        setPaying(false);
        await wait(900);

        for (const beat of script) {
          if (cancelled) return;
          if (beat.t === "pause") {
            await wait(beat.ms);
          } else if (beat.t === "type") {
            const text = messages[beat.i].text ?? "";
            for (let c = 1; c <= text.length; c += 1) {
              if (cancelled) return;
              setDraft(text.slice(0, c));
              await wait(text[c - 1] === " " ? 58 : 34);
            }
            await wait(420);
            if (cancelled) return;
            setDraft("");
            setSent(beat.i + 1);
          } else if (beat.t === "armaTyping") {
            setArmaTyping(true);
            await wait(beat.ms);
            if (cancelled) return;
            setArmaTyping(false);
          } else if (beat.t === "send") {
            setSent(beat.i + 1);
          } else if (beat.t === "checkout") {
            setPaying(true);
            await wait(beat.ms);
            if (cancelled) return;
            setPaying(false);
          }
        }
        await wait(4200);
      }
    };

    run();
    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [live, messages, script]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [sent, armaTyping]);

  const count = live ? sent : messages.length;

  return (
    <div className={`lp-phone relative ${className}`}>
      <div className="relative overflow-hidden rounded-[34px] border-[8px] border-[#161616] bg-[#161616] shadow-[0_40px_90px_-32px_rgba(113,0,20,0.5)]">
        <div className="relative overflow-hidden rounded-[26px] bg-[#EFE7DE]">
          <div className="flex items-center justify-between bg-[#075E54] px-[15px] pb-[2px] pt-[7px] text-[11.5px] font-medium text-white/90">
            <span>09.41</span>
            <span className="flex items-center gap-[4px]">
              <span className="h-[7px] w-[7px] rounded-full bg-white/80" />
              <span className="h-[9px] w-[16px] rounded-[3px] border border-white/70" />
            </span>
          </div>
          <ChatHeader status={armaTyping ? "mengetik…" : "online"} />

          <div
            ref={threadRef}
            className="lp-wallpaper scrollbar-none h-[418px] space-y-[6px] overflow-y-auto px-[10px] py-[12px]"
          >
            <p className="mx-auto w-fit rounded-[7px] bg-white/85 px-[9px] py-[3px] text-[12px] text-[#54656F] shadow-[0_1px_0.5px_rgba(11,20,26,0.1)]">
              Hari ini
            </p>
            {messages.map((message, index) => (
              <Bubble key={index} message={message} hidden={index >= count} />
            ))}
            {armaTyping ? <TypingBubble /> : null}
          </div>

          <div className="flex items-center gap-[8px] bg-[#F0F2F5] px-[10px] py-[8px]">
            <span className="flex h-[32px] flex-1 items-center overflow-hidden rounded-full bg-white px-[12px] text-[13px]">
              {draft ? (
                <span className="truncate text-[#111B21]">
                  {draft}
                  <i className="lp-caret ml-[1px] inline-block h-[14px] w-[1.5px] translate-y-[2px] bg-[#111B21]" />
                </span>
              ) : (
                <span className="text-[#8696A0]">Ketik pesan</span>
              )}
            </span>
            <span
              className={`grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full transition-colors duration-200 ${
                draft ? "bg-[#00A884]" : "bg-[#00A884]/70"
              }`}
            >
              <Send className="h-[15px] w-[15px] translate-x-[-1px] text-white" strokeWidth={2.2} />
            </span>
          </div>

          <div
            className={`absolute inset-0 flex flex-col justify-end ${
              paying ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            <div
              className={`absolute inset-0 bg-[#161616]/45 transition-opacity duration-300 ${
                paying ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              className={`relative max-h-full overflow-hidden rounded-t-[20px] bg-white transition-transform duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                paying ? "translate-y-0" : "translate-y-full"
              }`}
            >
              <p className="flex items-center justify-between border-b border-[#E6D8CD] px-[15px] py-[9px] text-[12px] text-[#55504B]">
                <span className="truncate">checkout.xendit.co</span>
                <span className="h-[4px] w-[34px] rounded-full bg-[#161616]/15" />
              </p>
              <CheckoutScreen framed={false} {...checkout} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
