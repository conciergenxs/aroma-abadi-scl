import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  CreditCard,
  Landmark,
  Lock,
  MoreVertical,
  Paperclip,
  Phone,
  QrCode,
  Send,
  ShoppingCart,
  Smartphone,
  Smile,
  Video,
  Wifi,
  X,
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
                  (item) => `${item.qty}\u00d7 ${item.name}: ${item.price}`,
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

/* ── Xendit's hosted payment page ────────────────────────────────────────
 * What a customer actually lands on when they open the link: Xendit's own
 * invoice page, full screen in WhatsApp's in-app browser, not a panel of
 * ours and not a sheet over the thread.
 *
 * It is drawn to that page's own tokens rather than restyled in ours,
 * because the point of this section is to show where Aroma Abadi stops and
 * Xendit begins. The values come off Xendit's own stylesheet: Open Sans,
 * #4573FF for the merchant band and the amount, #00CF99 for the confirm
 * button, #ECF1FF behind the fraud notice, and the grey ramp #FAFAFA,
 * #EBEBEB, #DBDBDB, #7A7A7A, #5C5C5C, #3D3D3D for everything else.
 *
 * Nothing here is interactive. It takes no keystroke and submits nothing. */

const METHOD_ICON = { qris: QrCode, va: Landmark, ewallet: Smartphone, card: CreditCard };

/** The channels enabled on the account, under Xendit's own groupings. The
 *  row names the first and counts the rest, the way the real page does. */
export type PaymentMethod = { id: keyof typeof METHOD_ICON; name: string; channels: string[] };

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

/** The "POWERED BY xendit" plate the invoice page closes on. */
function PoweredBy() {
  return (
    <span className="inline-flex items-center gap-[5px] rounded-[4px] border border-[#DBDBDB] px-[9px] py-[5px]">
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.07em] text-[#7A7A7A]">
        Powered by
      </span>
      <span className="text-[12.5px] font-semibold tracking-[-0.01em] text-[#4573FF]">xendit</span>
    </span>
  );
}

export function CheckoutScreen({
  invoice,
  amount,
  expiry,
  paidAt,
  methods,
  merchant = "PT Aroma Abadi",
  className = "",
  framed = true,
  stage = "methods",
}: {
  invoice: string;
  amount: string;
  expiry: string;
  paidAt: string;
  methods: PaymentMethod[];
  merchant?: string;
  className?: string;
  framed?: boolean;
  /** Where the page has got to: choose a method, scan the QR, or done.
   *  The flow section shows "methods"; the hero plays all three. */
  stage?: "methods" | "qris" | "success";
}) {
  return (
    <div
      className={`lp-xen flex h-full flex-col overflow-hidden bg-white text-[#3D3D3D] ${
        framed
          ? "rounded-[16px] border border-[#E6D8CD] shadow-[0_18px_44px_-24px_rgba(113,0,20,0.4)]"
          : ""
      } ${className}`}
    >
      {/* the merchant band Xendit prints above every invoice */}
      <div className="flex shrink-0 items-center gap-[8px] bg-[#4573FF] px-[12px] py-[7px]">
        <span className="grid h-[28px] w-[28px] shrink-0 place-items-center rounded-full bg-[#710014]">
          <img src={armaMark} alt="" className="h-[18px] w-[18px] object-contain" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-white">
          {merchant}
        </span>
        <span className="flex shrink-0 items-center gap-[3px] rounded-[4px] bg-white px-[7px] py-[3px] text-[11.5px] leading-[15px]">
          English
          <ChevronDown className="h-[11px] w-[11px] text-[#7A7A7A]" strokeWidth={2.2} />
        </span>
      </div>

      {/* on a phone the order summary rides collapsed at the top */}
      <div className="flex shrink-0 items-center gap-[7px] border-b border-[#EBEBEB] px-[12px] py-[10px]">
        <ShoppingCart className="h-[14px] w-[14px] shrink-0" strokeWidth={1.9} />
        <span className="flex-1 text-[12px] font-bold uppercase tracking-[0.04em]">
          Order Summary
        </span>
        <ChevronDown className="h-[15px] w-[15px] shrink-0 text-[#7A7A7A]" strokeWidth={2} />
      </div>

      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto bg-white">
        {stage === "success" ? (
          <div key="success" className="lp-stage px-[14px] pb-[18px] pt-[24px]">
            <p className="text-center text-[22px] font-bold leading-[28px]">Thank You!</p>
            <p className="mx-auto mt-[7px] max-w-[228px] text-center text-[12px] leading-[17px] text-[#5C5C5C]">
              Your order {invoice} has been paid for successfully
            </p>
            <dl className="mt-[20px] space-y-[12px] text-[12px] leading-[16px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="font-bold">Amount Paid</dt>
                <dd className="tabular-nums text-[#5C5C5C]">{amount}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-bold">Date Paid</dt>
                <dd className="text-[#5C5C5C]">{paidAt}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="font-bold">Payment</dt>
                <dd className="flex items-center gap-[6px] text-[#5C5C5C]">
                  <span className="rounded-[3px] border border-[#EBEBEB] px-[5px] py-[2px] text-[11px] font-bold leading-[13px] tracking-[0.04em] text-[#3D3D3D]">
                    QRIS
                  </span>
                  QR Payments
                </dd>
              </div>
            </dl>
            <p className="mt-[22px] text-center">
              <PoweredBy />
            </p>
          </div>
        ) : stage === "qris" ? (
          <div key="qris" className="lp-stage px-[14px] pb-[14px] pt-[11px]">
            <div className="rounded-[6px] border border-[#EBEBEB] px-[12px] py-[11px] text-center">
              <p className="text-[12px] font-bold tracking-[0.1em]">QRIS</p>
              <div className="lp-qr mx-auto mt-[9px] w-[122px] rounded-[6px] border border-[#EBEBEB] bg-white p-[7px]">
                <QrMark className="block h-[108px] w-[108px]" />
              </div>
              <p className="mt-[10px] text-[11.5px] text-[#7A7A7A]">Amount to Pay</p>
              <p className="mt-[2px] text-[16px] font-semibold tabular-nums">{amount}</p>
            </div>
            <div className="mt-[9px] rounded-[6px] border border-[#4573FF]/35 bg-[#ECF1FF] px-[11px] py-[9px]">
              <p className="text-[11.5px] font-bold leading-[16px]">
                Protect Yourself Against Fraud
              </p>
              <p className="mt-[2px] text-[11.5px] leading-[16px] text-[#5C5C5C]">
                Check the merchant name, the amount and the details before you scan.
              </p>
            </div>
            <p className="mt-[10px] flex items-center justify-center gap-[6px] text-[11.5px] text-[#7A7A7A]">
              <span className="lp-dot h-[6px] w-[6px] rounded-full bg-[#4573FF]" />
              Waiting for payment, 14:52 left
            </p>
            <p className="mt-[10px] rounded-[4px] bg-[#00CF99] py-[9px] text-center text-[12.5px] font-semibold text-white">
              Back
            </p>
          </div>
        ) : (
          <div key="methods" className="lp-stage px-[14px] pb-[18px] pt-[16px]">
            <p className="text-balance text-center text-[11.5px] font-semibold uppercase leading-[16px] tracking-[0.03em] text-[#5C5C5C]">
              Pay before {expiry}
            </p>
            <p className="mt-[5px] text-center text-[26px] leading-[33px] tracking-[-0.01em] text-[#4573FF] tabular-nums">
              {amount}
            </p>
            <p className="mt-[18px] text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[#7A7A7A]">
              Payment Method
            </p>
            <ul className="mt-[7px] overflow-hidden rounded-[6px] border border-[#EBEBEB]">
              {methods.map((method, index) => {
                const Icon = METHOD_ICON[method.id];
                return (
                  <li
                    key={method.id}
                    className={`lp-xenrow flex items-center gap-[8px] px-[10px] py-[10px] ${
                      index ? "border-t border-[#EBEBEB]" : ""
                    }`}
                  >
                    <Icon className="h-[17px] w-[17px] shrink-0 text-[#5C5C5C]" strokeWidth={1.6} />
                    <span className="min-w-0 flex-1 text-[12.5px] leading-[16px]">
                      {method.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-[3px]">
                      <span className="rounded-[3px] border border-[#EBEBEB] px-[4px] py-[2px] text-[11px] leading-[13px] text-[#5C5C5C]">
                        {method.channels[0]}
                      </span>
                      {method.channels.length > 1 ? (
                        <span className="rounded-[3px] border border-[#EBEBEB] px-[4px] py-[2px] text-[11px] leading-[13px] text-[#5C5C5C]">
                          +{method.channels.length - 1}
                        </span>
                      ) : null}
                    </span>
                    <ChevronDown
                      className="h-[14px] w-[14px] shrink-0 text-[#7A7A7A]"
                      strokeWidth={2}
                    />
                  </li>
                );
              })}
            </ul>
            <p className="mt-[16px] text-center">
              <PoweredBy />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** WhatsApp opens a link in its own in-app browser: a whole screen with the
 *  page title over its host, not a sheet pulled up over the thread. */
export function BrowserFrame({
  title,
  host,
  className = "",
  children,
}: {
  title: string;
  host: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col overflow-hidden bg-white ${className}`}>
      <div className="flex shrink-0 items-center gap-[10px] border-b border-[#D5DBDE] bg-[#F6F6F6] px-[11px] py-[6px]">
        <X className="h-[15px] w-[15px] shrink-0 text-[#54656F]" strokeWidth={2.2} />
        <span className="min-w-0 flex-1 text-center">
          <span className="block truncate text-[12.5px] font-medium leading-[16px] text-[#111B21]">
            {title}
          </span>
          <span className="flex items-center justify-center gap-[3px] text-[11.5px] leading-[14px] text-[#667781]">
            <Lock className="h-[9px] w-[9px] shrink-0" strokeWidth={2.6} />
            <span className="truncate">{host}</span>
          </span>
        </span>
        <MoreVertical className="h-[15px] w-[15px] shrink-0 text-[#54656F]" strokeWidth={2.2} />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
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
  checkout: {
    invoice: string;
    amount: string;
    expiry: string;
    paidAt: string;
    methods: PaymentMethod[];
  };
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

          {/* Tapping the link does not open a panel over the thread: WhatsApp
              pushes its in-app browser up over the whole screen, and the
              Xendit invoice fills it. */}
          <div
            aria-hidden={!paying}
            className={`absolute inset-0 flex flex-col bg-white transition-transform duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              paying ? "pointer-events-auto translate-y-0" : "pointer-events-none translate-y-full"
            }`}
          >
            <StatusBar />
            <BrowserFrame
              title="Complete your payment"
              host="checkout.xendit.co"
              className="min-h-0 flex-1"
            >
              <CheckoutScreen framed={false} stage={payStage} {...checkout} />
            </BrowserFrame>
          </div>
        </div>
      </div>
    </div>
  );
}
