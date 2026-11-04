import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  CreditCard,
  Landmark,
  Lock,
  MoreVertical,
  Paperclip,
  Phone,
  QrCode,
  Send,
  Smile,
  Video,
  Wallet,
  Wifi,
} from "lucide-react";
import armaMark from "@/assets/aroma-abadi-icon-sand.png";

/* The screens a customer actually sees.
 *
 * The whole business runs inside a WhatsApp thread, so the thread is the one
 * artefact worth showing: it is where the order is agreed, where the payment
 * link arrives, and where the receipt lands.
 *
 * Everything inside the device is drawn to WhatsApp's own conventions, its
 * greens, its bubble tails and tails' tick marks, and its type (Roboto, the
 * Android app's face) rather than the Aroma Abadi faces used by the rest of
 * the page. Nothing here is interactive: these are pictures of a
 * conversation, not a working form, and no screen takes a keystroke. */

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
  /** A real link preview is built by WhatsApp from the destination page's own
   *  metadata, so `title`/`note`/`host` are Xendit's to set; anything ARMA
   *  wants to say goes in `message`, the text of the message itself. */
  link?: { message: string; title: string; note: string; host: string; url: string };
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

/* WhatsApp has no tables, rules or columns: a bubble is text, set in the app's
 * own face. A monospace run (```like this```) would buy column alignment but
 * switches typeface mid-thread, which reads as a different app. So the figures
 * go out as ordinary "label: value" lines, the form most order bots use, and
 * one the Cloud API's text endpoint sends verbatim. */
function TextBlock({ lines }: { lines: string[] }) {
  return (
    <div className="mt-[6px] space-y-[1px]">
      {lines.map((line, i) =>
        line === "" ? (
          <div key={i} className="h-[6px]" />
        ) : (
          <p key={i} className="leading-[18px]">
            {line}
          </p>
        ),
      )}
    </div>
  );
}

/* WhatsApp sets the stamp over the bottom-right corner and lets the last line
 * of text run up beside it; only a last line that fills the width pushes the
 * stamp onto a line of its own. A blank inline run of the stamp's width at the
 * end of the copy reproduces exactly that. */
function Gap({ mine }: { mine: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-[1px] align-bottom ${mine ? "w-[62px]" : "w-[44px]"}`}
    />
  );
}

function Bubble({ message, hidden }: { message: ChatMessage; hidden: boolean }) {
  const mine = message.from === "customer";
  const structured = Boolean(message.order || message.link || message.receipt);
  return (
    <div className={`${mine ? "justify-end" : "justify-start"} ${hidden ? "lp-msg" : "lp-msg-in"}`}>
      <div
        className={`relative ${structured ? "w-[86%]" : "max-w-[84%]"} rounded-[7.5px] px-[9px] py-[6px] text-[14.2px] leading-[19px] text-[#111B21] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
          mine ? "lp-tail-out bg-[#D9FDD3]" : "lp-tail-in bg-white"
        }`}
      >
        {message.text ? (
          <p>
            {message.text}
            <Gap mine={mine} />
          </p>
        ) : null}

        {message.order ? (
          <div>
            <p>{message.order.title}</p>
            <TextBlock
              lines={[
                ...message.order.items.map(
                  (item) => `${item.qty}\u00d7 ${item.name} \u2014 ${item.price}`,
                ),
                "",
                ...message.order.rows.map((row) => `${row.label}: ${row.value}`),
              ]}
            />
            <p className="mt-[6px]">
              Total: {message.order.total}
              <Gap mine={mine} />
            </p>
          </div>
        ) : null}

        {message.link ? (
          <div>
            <div className="rounded-[6px] bg-[#F5F6F6] p-[8px]">
              <p className="text-[13px] font-medium leading-[17px]">{message.link.title}</p>
              <p className="mt-[2px] text-[12.5px] leading-[16px] text-[#667781]">
                {message.link.note}
              </p>
              <p className="mt-[5px] text-[12.5px] text-[#8696A0]">{message.link.host}</p>
            </div>
            <p className="mt-[5px]">{message.link.message}</p>
            <p className="mt-[3px] break-all text-[13.5px] text-[#027EB5] underline decoration-[#027EB5]/40">
              {message.link.url}
              <Gap mine={mine} />
            </p>
          </div>
        ) : null}

        {message.receipt ? (
          <div>
            <p>{message.receipt.title}</p>
            <TextBlock lines={message.receipt.rows.map((row) => `${row.label}: ${row.value}`)} />
            <p className="mt-[6px]">
              {message.receipt.note}
              <Gap mine={mine} />
            </p>
          </div>
        ) : null}

        <span className="absolute bottom-[5px] right-[9px] flex items-center gap-[3px] text-[11.5px] leading-none text-[#667781]">
          {message.time}
          {mine ? <Ticks /> : null}
        </span>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="lp-msg-in justify-start">
      <div className="lp-tail-in relative rounded-[7.5px] bg-white px-[11px] py-[10px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
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

/** The Android status bar: carrier bars, wi-fi, and a battery drawn as a
 * capsule with a cap and a real fill level. */
function StatusBar() {
  return (
    <div className="flex items-center justify-between bg-[#008069] px-[14px] pb-[4px] pt-[7px] text-[12.5px] font-medium text-white">
      <span className="tracking-[0.01em]">09.41</span>
      <span className="flex items-center gap-[6px]">
        <span className="flex items-end gap-[1.5px]">
          <i className="h-[4px] w-[2.5px] rounded-[1px] bg-white" />
          <i className="h-[6px] w-[2.5px] rounded-[1px] bg-white" />
          <i className="h-[8px] w-[2.5px] rounded-[1px] bg-white" />
          <i className="h-[10px] w-[2.5px] rounded-[1px] bg-white/45" />
        </span>
        <Wifi className="h-[13px] w-[13px]" strokeWidth={2.4} />
        <span className="flex items-center">
          <span className="flex h-[10.5px] w-[20px] items-center rounded-[3px] border border-white/80 p-[1.5px]">
            <span className="block h-full w-[68%] rounded-[1px] bg-white" />
          </span>
          <span className="ml-[1px] h-[4px] w-[1.5px] rounded-r-[1px] bg-white/80" />
        </span>
      </span>
    </div>
  );
}

function ChatHeader({ compact = false, status }: { compact?: boolean; status?: string }) {
  return (
    <div
      className={`flex items-center bg-[#008069] ${compact ? "gap-[9px] px-[11px] py-[9px]" : "gap-[9px] px-[10px] pb-[9px] pt-[4px]"}`}
    >
      {compact ? null : (
        <ArrowLeft className="h-[19px] w-[19px] shrink-0 text-white" strokeWidth={2.1} />
      )}
      <span className="grid h-[33px] w-[33px] shrink-0 place-items-center rounded-full bg-[#710014]">
        <img src={armaMark} alt="" className="w-[19px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium leading-[19px] text-white">
          Aroma Abadi
        </span>
        <span className="block text-[12.5px] leading-[16px] text-white/75">
          {status ?? "online"}
        </span>
      </span>
      {compact ? null : (
        <>
          <Video className="h-[19px] w-[19px] shrink-0 text-white" strokeWidth={2} />
          <Phone className="ml-[14px] h-[17px] w-[17px] shrink-0 text-white" strokeWidth={2.2} />
          <MoreVertical
            className="ml-[10px] h-[18px] w-[18px] shrink-0 text-white"
            strokeWidth={2}
          />
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
      className={`lp-wa overflow-hidden rounded-[16px] border border-[#E6D8CD] bg-[#EFE7DE] shadow-[0_18px_44px_-24px_rgba(113,0,20,0.4)] ${className}`}
    >
      <ChatHeader compact />
      <div className="lp-wallpaper space-y-[8px] px-[9px] py-[12px]">
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
 * actually covers. Drawn in our styling and labelled as Xendit's, it
 * stands in for the screen, it does not imitate it, and it asks nothing. */

const METHOD_ICON = { qris: QrCode, va: Landmark, ewallet: Wallet, card: CreditCard };
export type PaymentMethod = { id: keyof typeof METHOD_ICON; name: string; note: string };

/* A QRIS mark for the mockup: the real finder squares and a fixed field of
 * modules, drawn so the payment step looks like the thing it stands for. It
 * encodes nothing and is not scannable, a picture of a QR, not a QR. */
function QrMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 25 25" className={className} role="img" aria-label="QRIS code (illustration)">
      <rect x={0} y={0} width={25} height={25} fill="#fff" />
      <g fill="#161616">
        <rect key="m0-8" x={8} y={0} width={1} height={1} />
        <rect key="m0-10" x={10} y={0} width={1} height={1} />
        <rect key="m0-11" x={11} y={0} width={1} height={1} />
        <rect key="m0-13" x={13} y={0} width={1} height={1} />
        <rect key="m0-14" x={14} y={0} width={1} height={1} />
        <rect key="m0-15" x={15} y={0} width={1} height={1} />
        <rect key="m0-16" x={16} y={0} width={1} height={1} />
        <rect key="m1-8" x={8} y={1} width={1} height={1} />
        <rect key="m1-9" x={9} y={1} width={1} height={1} />
        <rect key="m1-13" x={13} y={1} width={1} height={1} />
        <rect key="m1-14" x={14} y={1} width={1} height={1} />
        <rect key="m1-15" x={15} y={1} width={1} height={1} />
        <rect key="m1-16" x={16} y={1} width={1} height={1} />
        <rect key="m2-8" x={8} y={2} width={1} height={1} />
        <rect key="m2-9" x={9} y={2} width={1} height={1} />
        <rect key="m2-11" x={11} y={2} width={1} height={1} />
        <rect key="m2-15" x={15} y={2} width={1} height={1} />
        <rect key="m3-8" x={8} y={3} width={1} height={1} />
        <rect key="m3-9" x={9} y={3} width={1} height={1} />
        <rect key="m3-10" x={10} y={3} width={1} height={1} />
        <rect key="m3-11" x={11} y={3} width={1} height={1} />
        <rect key="m3-15" x={15} y={3} width={1} height={1} />
        <rect key="m3-16" x={16} y={3} width={1} height={1} />
        <rect key="m4-9" x={9} y={4} width={1} height={1} />
        <rect key="m4-10" x={10} y={4} width={1} height={1} />
        <rect key="m4-11" x={11} y={4} width={1} height={1} />
        <rect key="m4-12" x={12} y={4} width={1} height={1} />
        <rect key="m4-15" x={15} y={4} width={1} height={1} />
        <rect key="m4-16" x={16} y={4} width={1} height={1} />
        <rect key="m5-9" x={9} y={5} width={1} height={1} />
        <rect key="m5-10" x={10} y={5} width={1} height={1} />
        <rect key="m5-11" x={11} y={5} width={1} height={1} />
        <rect key="m5-12" x={12} y={5} width={1} height={1} />
        <rect key="m5-14" x={14} y={5} width={1} height={1} />
        <rect key="m5-16" x={16} y={5} width={1} height={1} />
        <rect key="m6-11" x={11} y={6} width={1} height={1} />
        <rect key="m6-13" x={13} y={6} width={1} height={1} />
        <rect key="m7-11" x={11} y={7} width={1} height={1} />
        <rect key="m7-12" x={12} y={7} width={1} height={1} />
        <rect key="m7-13" x={13} y={7} width={1} height={1} />
        <rect key="m7-14" x={14} y={7} width={1} height={1} />
        <rect key="m7-15" x={15} y={7} width={1} height={1} />
        <rect key="m8-0" x={0} y={8} width={1} height={1} />
        <rect key="m8-2" x={2} y={8} width={1} height={1} />
        <rect key="m8-3" x={3} y={8} width={1} height={1} />
        <rect key="m8-5" x={5} y={8} width={1} height={1} />
        <rect key="m8-6" x={6} y={8} width={1} height={1} />
        <rect key="m8-7" x={7} y={8} width={1} height={1} />
        <rect key="m8-8" x={8} y={8} width={1} height={1} />
        <rect key="m8-11" x={11} y={8} width={1} height={1} />
        <rect key="m8-12" x={12} y={8} width={1} height={1} />
        <rect key="m8-13" x={13} y={8} width={1} height={1} />
        <rect key="m8-14" x={14} y={8} width={1} height={1} />
        <rect key="m8-15" x={15} y={8} width={1} height={1} />
        <rect key="m8-18" x={18} y={8} width={1} height={1} />
        <rect key="m8-20" x={20} y={8} width={1} height={1} />
        <rect key="m8-22" x={22} y={8} width={1} height={1} />
        <rect key="m8-23" x={23} y={8} width={1} height={1} />
        <rect key="m9-0" x={0} y={9} width={1} height={1} />
        <rect key="m9-1" x={1} y={9} width={1} height={1} />
        <rect key="m9-5" x={5} y={9} width={1} height={1} />
        <rect key="m9-6" x={6} y={9} width={1} height={1} />
        <rect key="m9-7" x={7} y={9} width={1} height={1} />
        <rect key="m9-8" x={8} y={9} width={1} height={1} />
        <rect key="m9-10" x={10} y={9} width={1} height={1} />
        <rect key="m9-12" x={12} y={9} width={1} height={1} />
        <rect key="m9-13" x={13} y={9} width={1} height={1} />
        <rect key="m9-15" x={15} y={9} width={1} height={1} />
        <rect key="m9-18" x={18} y={9} width={1} height={1} />
        <rect key="m9-24" x={24} y={9} width={1} height={1} />
        <rect key="m10-0" x={0} y={10} width={1} height={1} />
        <rect key="m10-1" x={1} y={10} width={1} height={1} />
        <rect key="m10-3" x={3} y={10} width={1} height={1} />
        <rect key="m10-7" x={7} y={10} width={1} height={1} />
        <rect key="m10-9" x={9} y={10} width={1} height={1} />
        <rect key="m10-13" x={13} y={10} width={1} height={1} />
        <rect key="m10-14" x={14} y={10} width={1} height={1} />
        <rect key="m10-15" x={15} y={10} width={1} height={1} />
        <rect key="m10-17" x={17} y={10} width={1} height={1} />
        <rect key="m10-18" x={18} y={10} width={1} height={1} />
        <rect key="m10-22" x={22} y={10} width={1} height={1} />
        <rect key="m10-24" x={24} y={10} width={1} height={1} />
        <rect key="m11-0" x={0} y={11} width={1} height={1} />
        <rect key="m11-1" x={1} y={11} width={1} height={1} />
        <rect key="m11-2" x={2} y={11} width={1} height={1} />
        <rect key="m11-3" x={3} y={11} width={1} height={1} />
        <rect key="m11-7" x={7} y={11} width={1} height={1} />
        <rect key="m11-8" x={8} y={11} width={1} height={1} />
        <rect key="m11-9" x={9} y={11} width={1} height={1} />
        <rect key="m11-10" x={10} y={11} width={1} height={1} />
        <rect key="m11-11" x={11} y={11} width={1} height={1} />
        <rect key="m11-14" x={14} y={11} width={1} height={1} />
        <rect key="m11-15" x={15} y={11} width={1} height={1} />
        <rect key="m11-16" x={16} y={11} width={1} height={1} />
        <rect key="m11-19" x={19} y={11} width={1} height={1} />
        <rect key="m11-20" x={20} y={11} width={1} height={1} />
        <rect key="m11-21" x={21} y={11} width={1} height={1} />
        <rect key="m11-22" x={22} y={11} width={1} height={1} />
        <rect key="m11-23" x={23} y={11} width={1} height={1} />
        <rect key="m12-1" x={1} y={12} width={1} height={1} />
        <rect key="m12-2" x={2} y={12} width={1} height={1} />
        <rect key="m12-3" x={3} y={12} width={1} height={1} />
        <rect key="m12-4" x={4} y={12} width={1} height={1} />
        <rect key="m12-7" x={7} y={12} width={1} height={1} />
        <rect key="m12-8" x={8} y={12} width={1} height={1} />
        <rect key="m12-9" x={9} y={12} width={1} height={1} />
        <rect key="m12-10" x={10} y={12} width={1} height={1} />
        <rect key="m12-11" x={11} y={12} width={1} height={1} />
        <rect key="m12-14" x={14} y={12} width={1} height={1} />
        <rect key="m12-16" x={16} y={12} width={1} height={1} />
        <rect key="m12-18" x={18} y={12} width={1} height={1} />
        <rect key="m12-19" x={19} y={12} width={1} height={1} />
        <rect key="m12-21" x={21} y={12} width={1} height={1} />
        <rect key="m12-23" x={23} y={12} width={1} height={1} />
        <rect key="m12-24" x={24} y={12} width={1} height={1} />
        <rect key="m13-1" x={1} y={13} width={1} height={1} />
        <rect key="m13-2" x={2} y={13} width={1} height={1} />
        <rect key="m13-3" x={3} y={13} width={1} height={1} />
        <rect key="m13-4" x={4} y={13} width={1} height={1} />
        <rect key="m13-6" x={6} y={13} width={1} height={1} />
        <rect key="m13-8" x={8} y={13} width={1} height={1} />
        <rect key="m13-9" x={9} y={13} width={1} height={1} />
        <rect key="m13-11" x={11} y={13} width={1} height={1} />
        <rect key="m13-14" x={14} y={13} width={1} height={1} />
        <rect key="m13-20" x={20} y={13} width={1} height={1} />
        <rect key="m13-21" x={21} y={13} width={1} height={1} />
        <rect key="m13-24" x={24} y={13} width={1} height={1} />
        <rect key="m14-3" x={3} y={14} width={1} height={1} />
        <rect key="m14-5" x={5} y={14} width={1} height={1} />
        <rect key="m14-9" x={9} y={14} width={1} height={1} />
        <rect key="m14-10" x={10} y={14} width={1} height={1} />
        <rect key="m14-11" x={11} y={14} width={1} height={1} />
        <rect key="m14-13" x={13} y={14} width={1} height={1} />
        <rect key="m14-14" x={14} y={14} width={1} height={1} />
        <rect key="m14-18" x={18} y={14} width={1} height={1} />
        <rect key="m14-20" x={20} y={14} width={1} height={1} />
        <rect key="m14-21" x={21} y={14} width={1} height={1} />
        <rect key="m14-23" x={23} y={14} width={1} height={1} />
        <rect key="m14-24" x={24} y={14} width={1} height={1} />
        <rect key="m15-3" x={3} y={15} width={1} height={1} />
        <rect key="m15-4" x={4} y={15} width={1} height={1} />
        <rect key="m15-5" x={5} y={15} width={1} height={1} />
        <rect key="m15-6" x={6} y={15} width={1} height={1} />
        <rect key="m15-7" x={7} y={15} width={1} height={1} />
        <rect key="m15-10" x={10} y={15} width={1} height={1} />
        <rect key="m15-11" x={11} y={15} width={1} height={1} />
        <rect key="m15-12" x={12} y={15} width={1} height={1} />
        <rect key="m15-15" x={15} y={15} width={1} height={1} />
        <rect key="m15-16" x={16} y={15} width={1} height={1} />
        <rect key="m15-17" x={17} y={15} width={1} height={1} />
        <rect key="m15-18" x={18} y={15} width={1} height={1} />
        <rect key="m15-19" x={19} y={15} width={1} height={1} />
        <rect key="m15-21" x={21} y={15} width={1} height={1} />
        <rect key="m15-22" x={22} y={15} width={1} height={1} />
        <rect key="m15-23" x={23} y={15} width={1} height={1} />
        <rect key="m16-0" x={0} y={16} width={1} height={1} />
        <rect key="m16-3" x={3} y={16} width={1} height={1} />
        <rect key="m16-4" x={4} y={16} width={1} height={1} />
        <rect key="m16-5" x={5} y={16} width={1} height={1} />
        <rect key="m16-6" x={6} y={16} width={1} height={1} />
        <rect key="m16-7" x={7} y={16} width={1} height={1} />
        <rect key="m16-10" x={10} y={16} width={1} height={1} />
        <rect key="m16-12" x={12} y={16} width={1} height={1} />
        <rect key="m16-14" x={14} y={16} width={1} height={1} />
        <rect key="m16-15" x={15} y={16} width={1} height={1} />
        <rect key="m16-17" x={17} y={16} width={1} height={1} />
        <rect key="m16-19" x={19} y={16} width={1} height={1} />
        <rect key="m16-20" x={20} y={16} width={1} height={1} />
        <rect key="m16-21" x={21} y={16} width={1} height={1} />
        <rect key="m16-23" x={23} y={16} width={1} height={1} />
        <rect key="m16-24" x={24} y={16} width={1} height={1} />
        <rect key="m17-10" x={10} y={17} width={1} height={1} />
        <rect key="m17-16" x={16} y={17} width={1} height={1} />
        <rect key="m17-17" x={17} y={17} width={1} height={1} />
        <rect key="m17-20" x={20} y={17} width={1} height={1} />
        <rect key="m17-21" x={21} y={17} width={1} height={1} />
        <rect key="m17-22" x={22} y={17} width={1} height={1} />
        <rect key="m17-24" x={24} y={17} width={1} height={1} />
        <rect key="m18-9" x={9} y={18} width={1} height={1} />
        <rect key="m18-10" x={10} y={18} width={1} height={1} />
        <rect key="m18-14" x={14} y={18} width={1} height={1} />
        <rect key="m18-16" x={16} y={18} width={1} height={1} />
        <rect key="m18-17" x={17} y={18} width={1} height={1} />
        <rect key="m18-19" x={19} y={18} width={1} height={1} />
        <rect key="m18-20" x={20} y={18} width={1} height={1} />
        <rect key="m18-22" x={22} y={18} width={1} height={1} />
        <rect key="m18-23" x={23} y={18} width={1} height={1} />
        <rect key="m19-8" x={8} y={19} width={1} height={1} />
        <rect key="m19-11" x={11} y={19} width={1} height={1} />
        <rect key="m19-12" x={12} y={19} width={1} height={1} />
        <rect key="m19-13" x={13} y={19} width={1} height={1} />
        <rect key="m19-14" x={14} y={19} width={1} height={1} />
        <rect key="m19-15" x={15} y={19} width={1} height={1} />
        <rect key="m19-17" x={17} y={19} width={1} height={1} />
        <rect key="m19-18" x={18} y={19} width={1} height={1} />
        <rect key="m19-19" x={19} y={19} width={1} height={1} />
        <rect key="m19-22" x={22} y={19} width={1} height={1} />
        <rect key="m20-8" x={8} y={20} width={1} height={1} />
        <rect key="m20-10" x={10} y={20} width={1} height={1} />
        <rect key="m20-11" x={11} y={20} width={1} height={1} />
        <rect key="m20-13" x={13} y={20} width={1} height={1} />
        <rect key="m20-15" x={15} y={20} width={1} height={1} />
        <rect key="m20-16" x={16} y={20} width={1} height={1} />
        <rect key="m20-17" x={17} y={20} width={1} height={1} />
        <rect key="m20-19" x={19} y={20} width={1} height={1} />
        <rect key="m20-20" x={20} y={20} width={1} height={1} />
        <rect key="m20-22" x={22} y={20} width={1} height={1} />
        <rect key="m20-23" x={23} y={20} width={1} height={1} />
        <rect key="m20-24" x={24} y={20} width={1} height={1} />
        <rect key="m21-12" x={12} y={21} width={1} height={1} />
        <rect key="m21-13" x={13} y={21} width={1} height={1} />
        <rect key="m21-16" x={16} y={21} width={1} height={1} />
        <rect key="m21-17" x={17} y={21} width={1} height={1} />
        <rect key="m21-18" x={18} y={21} width={1} height={1} />
        <rect key="m21-20" x={20} y={21} width={1} height={1} />
        <rect key="m21-22" x={22} y={21} width={1} height={1} />
        <rect key="m21-23" x={23} y={21} width={1} height={1} />
        <rect key="m22-10" x={10} y={22} width={1} height={1} />
        <rect key="m22-12" x={12} y={22} width={1} height={1} />
        <rect key="m22-13" x={13} y={22} width={1} height={1} />
        <rect key="m22-15" x={15} y={22} width={1} height={1} />
        <rect key="m22-16" x={16} y={22} width={1} height={1} />
        <rect key="m22-18" x={18} y={22} width={1} height={1} />
        <rect key="m22-19" x={19} y={22} width={1} height={1} />
        <rect key="m22-21" x={21} y={22} width={1} height={1} />
        <rect key="m22-24" x={24} y={22} width={1} height={1} />
        <rect key="m23-8" x={8} y={23} width={1} height={1} />
        <rect key="m23-9" x={9} y={23} width={1} height={1} />
        <rect key="m23-10" x={10} y={23} width={1} height={1} />
        <rect key="m23-11" x={11} y={23} width={1} height={1} />
        <rect key="m23-13" x={13} y={23} width={1} height={1} />
        <rect key="m23-14" x={14} y={23} width={1} height={1} />
        <rect key="m23-15" x={15} y={23} width={1} height={1} />
        <rect key="m23-18" x={18} y={23} width={1} height={1} />
        <rect key="m23-21" x={21} y={23} width={1} height={1} />
        <rect key="m24-9" x={9} y={24} width={1} height={1} />
        <rect key="m24-11" x={11} y={24} width={1} height={1} />
        <rect key="m24-12" x={12} y={24} width={1} height={1} />
        <rect key="m24-13" x={13} y={24} width={1} height={1} />
        <rect key="m24-15" x={15} y={24} width={1} height={1} />
        <rect key="m24-16" x={16} y={24} width={1} height={1} />
        <rect key="m24-18" x={18} y={24} width={1} height={1} />
        <rect key="m24-19" x={19} y={24} width={1} height={1} />
        <rect key="m24-20" x={20} y={24} width={1} height={1} />
        <rect key="m24-23" x={23} y={24} width={1} height={1} />
      </g>
      {/* the three finder patterns */}
      {[
        [0, 0],
        [18, 0],
        [0, 18],
      ].map(([fx, fy]) => (
        <g key={`${fx}-${fy}`}>
          <rect x={fx} y={fy} width={7} height={7} fill="#161616" />
          <rect x={fx + 1} y={fy + 1} width={5} height={5} fill="#fff" />
          <rect x={fx + 2} y={fy + 2} width={3} height={3} fill="#161616" />
        </g>
      ))}
    </svg>
  );
}

export function CheckoutScreen({
  invoice,
  amount,
  expiry,
  methods,
  className = "",
  framed = true,
  stage = "methods",
}: {
  invoice: string;
  amount: string;
  expiry: string;
  methods: PaymentMethod[];
  className?: string;
  framed?: boolean;
  /** Where the hosted page has got to: pick a method, scan the QR, or done.
   *  The flow section shows "methods"; the hero plays all three. */
  stage?: "methods" | "qris" | "success";
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
        <p className="mt-[9px] text-[12px] text-[#55504B]">Total payment · {invoice}</p>
        <p className="text-[23px] font-semibold tabular-nums leading-tight tracking-tight text-[#161616]">
          {amount}
        </p>
        <p className="mt-[3px] text-[12px] text-[#8A6246]">Pay before {expiry}</p>
      </div>
      {stage === "success" ? (
        <div key="success" className="lp-stage min-h-[262px] px-[15px] py-[22px] text-center">
          <span className="lp-paid mx-auto grid h-[52px] w-[52px] place-items-center rounded-full bg-[#1FA855]/12 text-[#1FA855]">
            <Check className="h-[26px] w-[26px]" strokeWidth={3} />
          </span>
          <p className="mt-[11px] text-[15px] font-semibold text-[#161616]">Payment successful</p>
          <p className="mt-[3px] text-[12.5px] text-[#55504B]">{invoice} · paid with QRIS</p>
          <p className="mt-[10px] text-[19px] font-semibold tabular-nums tracking-tight text-[#161616]">
            {amount}
          </p>
          <p className="mt-[12px] flex items-center justify-center gap-[5px] text-[12px] text-[#55504B]">
            <Lock className="h-[12px] w-[12px]" strokeWidth={2} />
            Hosted and processed by Xendit
          </p>
        </div>
      ) : stage === "qris" ? (
        <div key="qris" className="lp-stage min-h-[262px] px-[15px] py-[13px] text-center">
          <p className="text-[12.5px] text-[#55504B]">Scan to pay with QRIS</p>
          <div className="lp-qr mx-auto mt-[10px] w-[142px] rounded-[10px] border border-[#E6D8CD] bg-white p-[9px]">
            <QrMark className="block h-[124px] w-[124px]" />
          </div>
          <p className="mt-[9px] text-[12px] text-[#55504B]">
            Any bank or e‑wallet app · expires in 14:52
          </p>
          <p className="mt-[11px] flex items-center justify-center gap-[6px] text-[12.5px] text-[#8A6246]">
            <span className="lp-dot h-[6px] w-[6px] rounded-full bg-[#8A6246]" />
            Waiting for payment
          </p>
        </div>
      ) : (
        <div key="methods" className="lp-stage min-h-[262px] px-[15px] py-[13px]">
          <p className="text-[12.5px] text-[#55504B]">Choose a payment method</p>
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
            Pay Now
          </p>
          <p className="mt-[9px] flex items-center justify-center gap-[5px] text-[12px] text-[#55504B]">
            <Lock className="h-[12px] w-[12px]" strokeWidth={2} />
            Hosted and processed by Xendit
          </p>
        </div>
      )}
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
  | { t: "checkout"; ms: number; stage?: "methods" | "qris" | "success" };

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
  const [payStage, setPayStage] = useState<"methods" | "qris" | "success">("methods");
  const threadRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

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
        setPayStage("methods");
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
              await wait(text[c - 1] === " " ? 95 : 54);
            }
            await wait(620);
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
            setPayStage(beat.stage ?? "methods");
            setPaying(true);
            await wait(beat.ms);
            if (cancelled) return;
            // the page only drops away once the last stage has been read
            if (beat.stage === "success") setPaying(false);
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
  }, [sent, armaTyping, draft]);

  // The field grows with the draft, up to five lines, then scrolls, so the
  // line being typed is always the one in view.
  useEffect(() => {
    const el = fieldRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [draft]);

  const count = live ? sent : messages.length;

  return (
    <div className={`lp-phone relative ${className}`}>
      <div className="relative overflow-hidden rounded-[34px] border-[8px] border-[#161616] bg-[#161616] shadow-[0_40px_90px_-32px_rgba(113,0,20,0.5)]">
        <div className="lp-wa relative flex h-[560px] flex-col overflow-hidden rounded-[26px] bg-[#EFE7DE]">
          <StatusBar />
          <ChatHeader status={armaTyping ? "typing…" : "online"} />

          <div
            ref={threadRef}
            className="lp-wallpaper scrollbar-none min-h-0 flex-1 space-y-[8px] overflow-y-auto px-[9px] py-[12px]"
          >
            <p className="mx-auto w-fit rounded-[7px] bg-white/90 px-[9px] py-[3px] text-[12px] text-[#54656F] shadow-[0_1px_0.5px_rgba(11,20,26,0.1)]">
              Today
            </p>
            {messages.map((message, index) => (
              <Bubble key={index} message={message} hidden={index >= count} />
            ))}
            {armaTyping ? <TypingBubble /> : null}
          </div>

          <div className="flex items-end gap-[6px] bg-[#F0F2F5] px-[8px] py-[7px]">
            <div className="flex min-h-[40px] flex-1 items-end gap-[7px] rounded-[20px] bg-white px-[10px] py-[9px]">
              <Smile className="h-[19px] w-[19px] shrink-0 text-[#8696A0]" strokeWidth={1.8} />
              <div
                ref={fieldRef}
                className="scrollbar-none max-h-[95px] flex-1 overflow-y-auto text-[14.5px] leading-[19px]"
              >
                {draft ? (
                  <span className="text-[#111B21]">
                    {draft}
                    <i className="lp-caret ml-[1px] inline-block h-[14px] w-[1.5px] translate-y-[2px] bg-[#111B21]" />
                  </span>
                ) : (
                  <span className="text-[#8696A0]">Message</span>
                )}
              </div>
              <Paperclip
                className="h-[18px] w-[18px] shrink-0 -rotate-45 text-[#8696A0]"
                strokeWidth={1.8}
              />
              <Camera className="h-[18px] w-[18px] shrink-0 text-[#8696A0]" strokeWidth={1.8} />
            </div>
            <span className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full bg-[#00A884]">
              <Send className="h-[17px] w-[17px] translate-x-[-1px] text-white" strokeWidth={2.1} />
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
              <CheckoutScreen framed={false} stage={payStage} {...checkout} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
