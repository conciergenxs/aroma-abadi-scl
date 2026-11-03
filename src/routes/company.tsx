import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Award,
  Ban,
  BellRing,
  Building2,
  CreditCard,
  HeartHandshake,
  Landmark,
  Link2,
  Megaphone,
  Package,
  Lock,
  MessagesSquare,
  Menu,
  QrCode,
  ReceiptText,
  RefreshCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Store,
  Ticket,
  Truck,
  Wallet,
  Workflow,
  X,
} from "lucide-react";
import { useEscapeKey } from "@/lib/use-escape-key";
import {
  Facts,
  SpecPanel,
  Marquee,
  Panel,
  Pending,
  Prose,
  Reveal,
  Section,
  Split,
  Step,
} from "@/components/landing/parts";
import {
  ChatScreen,
  CheckoutScreen,
  LiveChat,
  type Beat,
  type ChatMessage,
  type PaymentMethod,
} from "@/components/landing/screens";
import armaMark from "@/assets/aroma-abadi-icon-sand.png";
import whatsappMark from "@/assets/whatsapp.png";
import shotRetail from "@/assets/shot-retail-counter.jpg";
import shotGold from "@/assets/shot-gold-fragrance.jpg";
import shotRose from "@/assets/shot-rose-fragrance.jpg";
import shotAmber from "@/assets/shot-amber-set.jpg";

/* Every mark in src/assets/brands, in filename order. Dropping a new SVG in
 * that folder puts it on the page; nothing here needs editing. */
const BRAND_FILES = import.meta.glob("/src/assets/brands/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/* The public company page.
 *
 * Audience: Xendit's verification team. It is not a storefront — nothing
 * here sells, and there is no cart. Its job is to let a reviewer answer
 * three questions without having to ask: who is the legal entity, what does
 * the loyalty programme do, and at which screen does a customer pay through
 * Xendit. Everything is arranged around that last question, which is why the
 * hero plays a whole transaction and the payment step is the one block
 * allowed to lift off the page.
 *
 * Type and colour follow the Aroma Abadi LMS: Playfair Display over
 * Montserrat, #710014 brand red, #F3F0EC cream, #C9A455 gold.
 *
 * Values Aroma Abadi still has to supply are wrapped in <Pending>: the only
 * loud thing here, so none of them ships unfilled. */

const WA_NUMBER = "+62 811 9001 2233";
const WA_LINK = "https://wa.me/6281190012233";

const NAV = [
  { href: "#profil", id: "profil", label: "Profile" },
  { href: "#program", id: "program", label: "Program" },
  { href: "#alur", id: "alur", label: "Transaction Flow" },
  { href: "#pembayaran", id: "pembayaran", label: "Payments" },
  { href: "#kontak", id: "kontak", label: "Contact" },
];

/* The channels Xendit actually carries in Indonesia, grouped the way its own
 * hosted payment page groups them. */
const METHODS: PaymentMethod[] = [
  { id: "qris", name: "QRIS", note: "Any bank or e‑wallet app" },
  { id: "va", name: "Virtual Account", note: "BCA, Mandiri, BNI, BRI, Permata" },
  { id: "ewallet", name: "E-Wallet", note: "OVO, DANA, ShopeePay, LinkAja" },
  { id: "card", name: "Credit or debit card", note: "Visa, Mastercard, JCB" },
];

const CHECKOUT = {
  invoice: "AA-2611",
  amount: "Rp 2,714,310",
  expiry: "3 Nov 2026, 09.40",
  methods: METHODS,
};

const ORDER = {
  title: "Order summary AA-2611",
  items: [
    { name: "Real Flawless Foundation", qty: 1, price: "1,950,000" },
    { name: "Translucent Setting Powder", qty: 1, price: "750,000" },
  ],
  rows: [
    { label: "Subtotal", value: "2,700,000" },
    { label: "PRESTIGE10 code", value: "−270,000" },
    { label: "VAT 11%", value: "267,300" },
    { label: "QRIS service fee", value: "17,010" },
  ],
  total: "Rp 2,714,310",
};

const PAY_LINK = {
  title: "Payment for order AA-2611",
  note: "Valid for 24 hours. QRIS, bank transfer, e-wallet or card.",
  host: "checkout.xendit.co",
  url: "checkout.xendit.co/od/aroma-abadi",
};

const RECEIPT = {
  title: "Payment received",
  rows: [
    { label: "Invoice", value: "AA-2611" },
    { label: "Method", value: "QRIS" },
    { label: "Paid", value: "Rp 2,714,310" },
  ],
  note: "Your loyalty points are in. I'll send the tracking number here as soon as the parcel is with the courier.",
};

/** The hero loop: one full transaction, start to finish. */
const HERO_THREAD: ChatMessage[] = [
  { from: "customer", time: "09.38", text: "Hi, I'm looking for a foundation for dry skin." },
  {
    from: "arma",
    time: "09.38",
    text: "Hi! Sisley Real Flawless Foundation gives a dewy finish and lasts all day, so it suits dry skin well. Shall I add the setting powder too?",
  },
  { from: "customer", time: "09.39", text: "Yes please, both." },
  { from: "arma", time: "09.39", order: ORDER },
  { from: "arma", time: "09.40", link: PAY_LINK },
  { from: "arma", time: "09.42", receipt: RECEIPT },
];

/** Paced for reading, not for showing off: the customer types, ARMA takes a
 * beat to answer, and the payment page stays open long enough to be read. */
const HERO_SCRIPT: Beat[] = [
  { t: "type", i: 0 },
  { t: "pause", ms: 650 },
  { t: "armaTyping", ms: 2700 },
  { t: "send", i: 1 },
  { t: "pause", ms: 2900 },
  { t: "type", i: 2 },
  { t: "pause", ms: 550 },
  { t: "armaTyping", ms: 2500 },
  { t: "send", i: 3 },
  { t: "pause", ms: 2800 },
  { t: "armaTyping", ms: 2000 },
  { t: "send", i: 4 },
  { t: "pause", ms: 2700 },
  { t: "checkout", ms: 5400 },
  { t: "pause", ms: 900 },
  { t: "armaTyping", ms: 2200 },
  { t: "send", i: 5 },
];

const STEP_OPENING: ChatMessage[] = [
  { from: "customer", time: "09.37", text: "Hi, are you still open?" },
  {
    from: "arma",
    time: "09.37",
    text: "Hi, we are! I'm Arma from Aroma Abadi. What can I help you find today?",
  },
];

const STEP_CONSULT: ChatMessage[] = [
  { from: "customer", time: "09.38", text: "I'm looking for a foundation for dry skin." },
  {
    from: "arma",
    time: "09.38",
    text: "Sisley Real Flawless Foundation, shade 2N Ivory, in stock. Dewy finish and it lasts all day. Shall I add the setting powder as well?",
  },
  { from: "customer", time: "09.39", text: "Yes please, both." },
];

const STEP_ORDER: ChatMessage[] = [{ from: "arma", time: "09.39", order: ORDER }];
const STEP_RECEIPT: ChatMessage[] = [{ from: "arma", time: "09.42", receipt: RECEIPT }];
const STEP_SHIPPING: ChatMessage[] = [
  {
    from: "arma",
    time: "14.05",
    text: "Order AA-2611 is with the courier. Tracking number JNE 0098 7712 3344, arriving in about 2 working days.",
  },
];

const BRANDS = Object.entries(BRAND_FILES)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, src]) => ({
    src,
    name: (path.split("/").pop() ?? "")
      .replace(/^\d+_/, "")
      .replace(/\.svg$/, "")
      .replace(/_and_/g, " & ")
      .replace(/_/g, " "),
  }));

const SERVICES = [
  {
    icon: Package,
    title: "Independent Distribution",
    body: "Premium cosmetics, fragrance and skincare, sourced directly from each principal.",
  },
  {
    icon: Megaphone,
    title: "Marketing Support",
    body: "Campaign planning and brand visibility across every channel we operate.",
  },
  {
    icon: Store,
    title: "Retail Strategy",
    body: "Counter placement and assortment planning that lifts retail performance.",
  },
  {
    icon: HeartHandshake,
    title: "Customer Service",
    body: "A dedicated team looking after the relationship with each brand and customer.",
  },
];

const VALUES: { title: string; body: string }[] = [
  { title: "Integrity", body: "Honest dealing in every interaction." },
  { title: "Transparency", body: "Clear terms, pricing and records." },
  { title: "Innovation", body: "New ways to reach and serve customers." },
];

const SHOTS = [
  { src: shotRetail, alt: "Beauty products arranged on the shelves of a retail counter" },
  { src: shotGold, alt: "A gold fragrance bottle resting on soft fabric" },
  { src: shotRose, alt: "A cut-glass fragrance bottle on blush silk" },
  { src: shotAmber, alt: "Amber glass bottles with gold caps in warm light" },
];

const HERO_FACTS: { label: string; value: string }[] = [
  { label: "Legal Entity", value: "PT Aroma Abadi" },
  { label: "Line of Business", value: "Beauty distribution" },
  { label: "Sales Channel", value: "WhatsApp (ARMA)" },
  { label: "Payment Gateway", value: "Xendit" },
];

const PROGRAM = [
  {
    icon: Sparkles,
    title: "Product Advice",
    body: "ARMA answers questions about skin type, shade and application, then recommends products that are actually in stock.",
  },
  {
    icon: Award,
    title: "Points and Membership Tiers",
    body: "Every paid order earns points. Points set the tier, from Prestige up to Icon, and each tier unlocks its own benefits.",
  },
  {
    icon: Ticket,
    title: "Promo Codes",
    body: "There are two kinds: a unique code for a single customer, and a shared code with a usage cap. The discount is visible before payment.",
  },
  {
    icon: BellRing,
    title: "Program Updates",
    body: "Updates go only to customers who have opted in. Every message carries a way to stop, and anyone who stops is not messaged again.",
  },
];

const PAYMENT_PANELS = [
  {
    icon: QrCode,
    title: "QRIS",
    body: "The customer scans a single code from any bank or e-wallet app. This is the method our customers reach for most.",
  },
  {
    icon: Landmark,
    title: "Virtual Account",
    body: "Each order gets its own transfer number, payable from any bank and recorded automatically the moment the funds arrive.",
  },
  {
    icon: Wallet,
    title: "E-Wallet",
    body: "The customer opens OVO, DANA, ShopeePay or LinkAja straight from the payment page, with no number to copy across.",
  },
  {
    icon: CreditCard,
    title: "Credit and Debit Cards",
    body: "Visa, Mastercard and JCB are processed on Xendit's page, with 3D Secure authentication from the issuing bank.",
  },
];

const POLICIES = [
  {
    icon: Truck,
    title: "Delivery",
    body: "Paid orders are processed the next working day and shipped by partner couriers. The tracking number goes out over WhatsApp.",
  },
  {
    icon: RefreshCcw,
    title: "Returns and Exchanges",
    body: "Requests are raised over WhatsApp within 7 days of delivery. Sealed products are refunded in full; opened products are exchanged.",
  },
  {
    icon: Ban,
    title: "Cancellation",
    body: "Unpaid orders lapse when the payment link expires. Paid orders that have not shipped are refunded in full through Xendit.",
  },
  {
    icon: Lock,
    title: "Data Privacy",
    body: "We keep the WhatsApp number, name, delivery address and order history needed to process an order. Data is never sold, and never shared beyond delivery and payment.",
  },
];

const CONTACT: { label: string; value: ReactNode }[] = [
  {
    label: "Customer WhatsApp",
    value: (
      <a
        href={WA_LINK}
        target="_blank"
        rel="noreferrer noopener"
        className="-my-1 inline-block py-1 text-[#FBFAF8] transition-colors duration-200 hover:text-[#E7CF95]"
      >
        {WA_NUMBER}
      </a>
    ),
  },
  { label: "Service Hours", value: "24 hours, every day" },
  {
    label: "Official Email",
    value: (
      <a
        href="mailto:arma@aromaabadi.com"
        className="-my-1 inline-block py-1 text-[#FBFAF8] transition-colors duration-200 hover:text-[#E7CF95]"
      >
        arma@aromaabadi.com
      </a>
    ),
  },
  {
    label: "Registered Office",
    value: (
      <>
        <Pending field="full address" tone="maroon" />, South Jakarta, DKI Jakarta
      </>
    ),
  },
];

const DESCRIPTION =
  "PT Aroma Abadi distributes premium beauty products across Indonesia and runs its CRM and loyalty program over WhatsApp. This page sets out the company profile, how the program works, and the customer transaction flow, including the point where payment is processed through Xendit.";

export const Route = createFileRoute("/company")({
  head: () => ({
    meta: [
      { title: "PT Aroma Abadi — Beauty distribution and WhatsApp loyalty program" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "PT Aroma Abadi" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-aroma-abadi.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PT Aroma Abadi" },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: "/og-aroma-abadi.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Montserrat:wght@300;400;500;600;700&family=Roboto:wght@400;500&display=swap",
      },
    ],
  }),
  component: CompanyPage,
});

/** WhatsApp's mark drawn as an outline, so it sits with the line icons
 * everywhere it appears. The floating button keeps the full-colour glyph —
 * that one is meant to read as the app's own button. */
function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

/** Masthead behaviour: out of the way going down, back the moment a reader
 * turns around, with a hairline showing how far through the page they are. */
function useMasthead() {
  const [hidden, setHidden] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    let last = window.scrollY;
    let queued = false;

    const measure = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
      setScrolled(y > 420);
      if (y <= 140) setHidden(false);
      else if (y > last + 5) setHidden(true);
      else if (y < last - 5) setHidden(false);
      if (Math.abs(y - last) > 5) last = y;
      queued = false;
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = NAV.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return { hidden, progress, scrolled, active };
}

function CompanyPage() {
  const { hidden, progress, scrolled, active } = useMasthead();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useEscapeKey(menuOpen, closeMenu);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <main className="lp-page bg-white">
      {/* ── Masthead ─────────────────────────────────────────────────── */}
      <header
        className={`lp-dark sticky top-0 z-40 transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="bg-[#4A000D]">
          <div className="mx-auto flex h-[76px] w-full max-w-[1180px] items-center gap-6 px-6 md:px-10">
            <a
              href="#top"
              aria-label="PT Aroma Abadi, back to top"
              className="shrink-0 rounded-sm transition-transform duration-300 hover:scale-105"
            >
              <img src={armaMark} alt="Aroma Abadi" className="w-[48px]" />
            </a>

            <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex xl:gap-9">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  data-active={active === item.id}
                  className="lp-navlink whitespace-nowrap text-[13.5px] font-medium text-[#F3F0EC]/70 transition-colors duration-200 hover:text-[#FBFAF8] data-[active=true]:text-[#FBFAF8]"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <a
              href={WA_LINK}
              target="_blank"
              rel="noreferrer noopener"
              className="press ml-auto hidden items-center gap-[8px] rounded-full border border-[#D7B69A]/60 px-[18px] py-[9px] text-[13.5px] font-semibold text-[#E6CBB2] transition-[background-color,border-color,color,transform] duration-300 hover:-translate-y-[1px] hover:border-[#D7B69A] hover:bg-[#D7B69A]/12 hover:text-[#FBFAF8] sm:inline-flex lg:ml-0"
            >
              <WhatsAppIcon className="h-[19px] w-[19px]" />
              Chat with ARMA
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="press ml-auto grid h-[42px] w-[42px] place-items-center rounded-full border border-[#F3F0EC]/20 text-[#FBFAF8] transition-colors duration-200 hover:bg-[#FFF4ED]/10 sm:ml-3 lg:hidden"
            >
              {menuOpen ? (
                <X className="h-[19px] w-[19px]" strokeWidth={1.8} />
              ) : (
                <Menu className="h-[19px] w-[19px]" strokeWidth={1.8} />
              )}
            </button>
          </div>
        </div>
        <div className="h-[2px] bg-[#FFF4ED]/10">
          <div
            className="h-full origin-left bg-[#C9A455]"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </header>

      {/* ── Mobile navigation ────────────────────────────────────────── */}
      <div
        className={`lp-dark fixed inset-0 z-30 bg-[#4A000D] transition-opacity duration-300 lg:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex h-full flex-col justify-center gap-2 px-8 pb-16 pt-24">
          {NAV.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              style={{ transitionDelay: menuOpen ? `${80 + index * 45}ms` : "0ms" }}
              className={`lp-display border-b border-[#F3F0EC]/10 py-4 text-[29px] leading-none text-[#FBFAF8] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                menuOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section id="top" className="relative overflow-hidden bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(192,112,124,0.12),transparent_68%)]"
        />
        <div className="relative mx-auto grid w-full max-w-[1180px] gap-12 px-6 py-12 md:px-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_308px] lg:items-center lg:gap-16 lg:py-16">
          <div>
            <p className="lp-enter flex items-center gap-3 text-[12.5px] font-medium tracking-[0.02em] text-[#9A5A63]">
              <span className="h-px w-8 bg-[#C9A455]" />
              PT Aroma Abadi
            </p>
            <h1
              style={{ animationDelay: "80ms" }}
              className="lp-enter lp-display mt-4 max-w-[19ch] text-balance text-[clamp(2.1rem,1.2rem+2.9vw,3.3rem)] leading-[1.08] text-[#161616]"
            >
              Indonesia&rsquo;s market leader in luxury cosmetics and fragrance.
            </h1>
            <p
              style={{ animationDelay: "160ms" }}
              className="lp-enter mt-5 max-w-[54ch] text-pretty text-[15.5px] leading-[1.62] text-[#55504B]"
            >
              PT Aroma Abadi develops and distributes more than 25 of the world&rsquo;s leading
              beauty brands. Customers order through ARMA on WhatsApp and pay with Xendit without
              leaving the chat.
            </p>

            <dl
              style={{ animationDelay: "240ms" }}
              className="lp-enter mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[16px] border border-[#EAD3D7] bg-[#EAD3D7] sm:grid-cols-4"
            >
              {HERO_FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="group bg-white px-4 py-[14px] transition-colors duration-300 hover:bg-[#FFF4ED]"
                >
                  <dt className="text-[12px] leading-tight text-[#9A5A63]">{fact.label}</dt>
                  <dd className="mt-[7px] text-[14.5px] font-semibold leading-snug text-[#161616]">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div
            style={{ animationDelay: "300ms" }}
            className="lp-enter w-full max-w-[308px] justify-self-center lg:justify-self-end"
          >
            <LiveChat messages={HERO_THREAD} script={HERO_SCRIPT} checkout={CHECKOUT} />
          </div>
        </div>
      </section>

      {/* ── Profil bisnis ────────────────────────────────────────────── */}
      <Section
        id="profil"
        tone="cream"
        className="lp-paper"
        bleed={
          <div className="border-y border-[#C9A455]/35 py-9">
            <p className="flex items-center justify-center gap-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9A5A63]">
              <span aria-hidden className="h-px w-6 bg-[#C9A455]" />
              Brands We Represent
              <span aria-hidden className="h-px w-6 bg-[#C9A455]" />
            </p>
            <div className="mt-5">
              <Marquee>
                {BRANDS.map((brand) => (
                  <img
                    key={brand.name}
                    src={brand.src}
                    alt={brand.name}
                    className="lp-brandmark h-[80px] w-[168px] shrink-0 object-contain px-6 sm:h-[94px] sm:w-[205px]"
                  />
                ))}
              </Marquee>
            </div>
          </div>
        }
      >
        <Split
          tone="cream"
          icon={Building2}
          title="Business Profile"
          lede="A registered company, selling only BPOM-licensed products."
        >
          <Reveal>
            <Prose tone="cream">
              <p>
                PT Aroma Abadi distributes international beauty brands across Indonesia through
                partner retail counters and a trained team of Beauty Advisors who know the portfolio
                — and, since our CRM program began, through WhatsApp.
              </p>
            </Prose>
          </Reveal>

          {/* Supporting imagery: the category the company actually works in. */}
          <Reveal delay={40} className="mt-7">
            <div className="lp-stagger grid grid-cols-3 gap-3">
              <figure className="lp-shot col-span-3 m-0 overflow-hidden rounded-[18px]">
                <img
                  src={SHOTS[0].src}
                  alt={SHOTS[0].alt}
                  loading="lazy"
                  className="h-[170px] w-full object-cover sm:h-[214px]"
                />
              </figure>
              {SHOTS.slice(1).map((shot) => (
                <figure key={shot.alt} className="lp-shot m-0 overflow-hidden rounded-[18px]">
                  <img
                    src={shot.src}
                    alt={shot.alt}
                    loading="lazy"
                    className="h-[108px] w-full object-cover sm:h-[150px]"
                  />
                </figure>
              ))}
            </div>
          </Reveal>

          <p className="mt-10 flex items-center gap-[10px] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#9A5A63]">
            <span aria-hidden className="h-px w-5 bg-[#C9A455]" />
            What We Do
          </p>
          <div className="mt-4 grid gap-4 sm:auto-rows-fr sm:grid-cols-2">
            {SERVICES.map((service, index) => (
              <Reveal key={service.title} delay={index * 60}>
                <Panel icon={service.icon} title={service.title}>
                  {service.body}
                </Panel>
              </Reveal>
            ))}
          </div>

          <p className="mt-10 flex items-center gap-[10px] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#9A5A63]">
            <span aria-hidden className="h-px w-5 bg-[#C9A455]" />
            How We Work
          </p>
          <Reveal delay={40}>
            <dl className="lp-stagger mt-4 grid overflow-hidden rounded-[18px] border border-[#C9A455]/45 bg-white/75 sm:grid-cols-3">
              {VALUES.map((value, index) => (
                <div
                  key={value.title}
                  className={`px-6 py-[22px] transition-colors duration-300 hover:bg-[#FFF4ED]/70 ${
                    index ? "border-t border-[#C9A455]/25 sm:border-l sm:border-t-0" : ""
                  }`}
                >
                  <dt className="lp-display text-[19px] leading-tight text-[#710014]">
                    {value.title}
                  </dt>
                  <dd className="mt-[7px] text-pretty text-[13.5px] leading-[1.6] text-[#55504B]">
                    {value.body}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={60} className="mt-12">
            <Facts
              tone="cream"
              cols={2}
              items={[
                { label: "Registered Name", value: "PT Aroma Abadi" },
                { label: "Line of Business", value: "Beauty product trading" },
                {
                  label: "Registered Office",
                  value: (
                    <>
                      <Pending field="full address" />, South Jakarta
                    </>
                  ),
                },
                {
                  label: "Business Registration",
                  value: <Pending field="NIB number" />,
                },
                {
                  label: "Sales Channels",
                  value: "WhatsApp (ARMA) and partner retail",
                },
                { label: "Delivery Area", value: "Across Indonesia" },
                { label: "Payment Gateway", value: "Xendit" },
              ]}
            />
          </Reveal>
        </Split>
      </Section>

      {/* ── Program loyalitas ────────────────────────────────────────── */}
      <Section id="program">
        <Split
          icon={MessagesSquare}
          title="CRM and Loyalty Program"
          lede="One WhatsApp number for advice, orders, points and promotions."
        >
          <Reveal>
            <Prose>
              <p>
                ARMA is the official Aroma Abadi WhatsApp assistant. Asking, ordering, paying and
                tracking all happen in one conversation.
              </p>
            </Prose>
          </Reveal>

          <div className="mt-10 grid gap-5 sm:auto-rows-fr sm:grid-cols-2">
            {PROGRAM.map((item, index) => (
              <Reveal key={item.title} delay={index * 60}>
                <Panel icon={item.icon} title={item.title}>
                  {item.body}
                </Panel>
              </Reveal>
            ))}
          </div>

          <Reveal delay={80} className="mt-5">
            <div className="relative overflow-hidden rounded-[20px] bg-[#4A000D] p-6 sm:p-7">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(231,207,149,0.16),transparent_70%)]"
              />
              <div className="relative flex items-start gap-4">
                <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#E7CF95]/15 text-[#E7CF95]">
                  <Lock className="h-[19px] w-[19px]" strokeWidth={1.6} />
                </span>
                <div>
                  <h3 className="text-[16px] font-semibold text-[#FBFAF8]">
                    A Separate Channel for Beauty Advisors
                  </h3>
                  <p className="mt-[8px] max-w-[60ch] text-pretty text-[14.5px] leading-[1.6] text-[#F3F0EC]/75">
                    Our Beauty Advisors use an internal version of ARMA for product knowledge and
                    service procedures. That channel is for staff and retail partners only, and it
                    processes no payments.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </Split>
      </Section>

      {/* ── Alur transaksi ───────────────────────────────────────────── */}
      <Section id="alur" tone="cream" className="lp-paper">
        <Reveal className="max-w-[48ch]">
          <span className="mb-5 grid h-[42px] w-[42px] place-items-center rounded-full bg-[#710014]/7 text-[#710014]">
            <Workflow className="h-[20px] w-[20px]" strokeWidth={1.6} />
          </span>
          <h2 className="lp-display text-[clamp(1.75rem,1.1rem+1.8vw,2.45rem)] leading-[1.1] text-[#710014]">
            Customer Transaction Flow
          </h2>
          <span className="lp-rule mt-4 block h-px w-10 bg-[#C9A455]/70" />
          <p className="mt-4 text-pretty text-[15.5px] leading-[1.7] text-[#55504B]">
            Six steps, from first message to dispatch. Step four is where the customer leaves
            WhatsApp for the Xendit page.
          </p>
        </Reveal>

        <div className="mt-14">
          <Step
            n={1}
            title="The Customer Opens a Conversation"
            body="A customer messages the official Aroma Abadi WhatsApp number, or replies to a program message they opted into. The whole transaction stays in one thread."
            screen={<ChatScreen messages={STEP_OPENING} />}
          />
          <Step
            n={2}
            title="Advice and Product Selection"
            body="ARMA recommends products that match what the customer needs and confirms stock, then records the quantity and delivery address. Promo codes are applied at this stage."
            screen={<ChatScreen messages={STEP_CONSULT} />}
          />
          <Step
            n={3}
            title="The Order Summary Is Sent"
            body="Before any money moves, ARMA sends the full breakdown: products and quantities, subtotal, promo discount, VAT, the service fee for the chosen payment method, and the final total."
            screen={<ChatScreen messages={STEP_ORDER} />}
          />
          <Step
            n={4}
            highlight
            title="Payment Through Xendit"
            body={[
              "From that summary ARMA sends a single payment link, created through Xendit for that order alone. Opening the link takes the customer to the Xendit payment page, where they choose a method and complete the transaction.",
              "Every payment detail is entered on Xendit's page rather than in WhatsApp. Card numbers and banking credentials never reach our systems; what comes back to us is the payment status and the invoice it belongs to.",
            ]}
            points={[
              {
                icon: Link2,
                label: "Payment Link",
                value: "Created per order, valid for 24 hours",
              },
              {
                icon: Wallet,
                label: "Methods Available",
                value: "QRIS, virtual account, e\u2011wallet, card",
              },
              {
                icon: ReceiptText,
                label: "What We Receive",
                value: "Payment status and invoice number",
              },
            ]}
            screen={<CheckoutScreen {...CHECKOUT} />}
          />
          <Step
            n={5}
            title="Automatic Confirmation"
            body="Xendit notifies our system the moment a payment succeeds, so nothing waits on a manual check. ARMA sends the confirmation and invoice number straight back into the thread, the order moves to paid in our records, and the customer's loyalty points land at the same time."
            screen={<ChatScreen messages={STEP_RECEIPT} />}
          />
          <Step
            n={6}
            last
            title="Fulfillment and Delivery"
            body="Paid orders pass to our warehouse, where they are picked, packed and handed to the courier. The tracking number goes back into the same conversation as soon as the parcel is collected, and the customer can ask ARMA where their order is at any point afterwards."
            screen={<ChatScreen messages={STEP_SHIPPING} />}
          />
        </div>
      </Section>

      {/* ── Pembayaran ───────────────────────────────────────────────── */}
      <Section id="pembayaran">
        <Split
          icon={ShieldCheck}
          title="Payment Methods and Security"
          lede="Every customer payment runs through Xendit, in Rupiah."
        >
          <div className="grid gap-5 sm:auto-rows-fr sm:grid-cols-2">
            {PAYMENT_PANELS.map((item, index) => (
              <Reveal key={item.title} delay={index * 60}>
                <Panel icon={item.icon} title={item.title}>
                  {item.body}
                </Panel>
              </Reveal>
            ))}
          </div>

          <Reveal delay={80} className="mt-10">
            <SpecPanel
              icon={ShieldCheck}
              title="How a Payment Is Handled"
              intro="Whichever of the methods above a customer chooses, the handling is the same."
              items={[
                { label: "Payment page", value: "Hosted and processed by Xendit" },
                {
                  label: "Card data",
                  value: "Never stored in Aroma Abadi systems",
                },
                {
                  label: "Payment status",
                  value: "Received automatically, logged per invoice",
                },
                {
                  label: "Fee breakdown",
                  value: "Shown in full before the customer pays",
                },
                { label: "Currency", value: "Indonesian Rupiah (IDR)" },
                {
                  label: "Refunds",
                  value: "Through Xendit, back to the original method",
                },
              ]}
            />
          </Reveal>
        </Split>
      </Section>

      {/* ── Kebijakan ────────────────────────────────────────────────── */}
      <Section id="kebijakan" tone="cream" className="lp-paper">
        <Split
          tone="cream"
          icon={Scale}
          title="Customer Policies"
          lede="The rules that apply to every order placed over WhatsApp."
        >
          <div className="grid gap-5 sm:auto-rows-fr sm:grid-cols-2">
            {POLICIES.map((item, index) => (
              <Reveal key={item.title} delay={index * 60}>
                <Panel icon={item.icon} title={item.title}>
                  {item.body}
                </Panel>
              </Reveal>
            ))}
          </div>
        </Split>
      </Section>

      {/* ── Kontak & footer ─────────────────────────────────────────── */}
      <footer id="kontak" className="lp-dark scroll-mt-[76px] bg-[#3A000A]">
        <div className="mx-auto w-full max-w-[1180px] px-6 py-12 md:px-10 md:py-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <img src={armaMark} alt="Aroma Abadi" className="w-[52px]" />
              <h2 className="lp-display mt-5 text-[clamp(1.55rem,1.1rem+1.3vw,2.05rem)] leading-[1.14] text-[#FBFAF8]">
                Official Contact
              </h2>
              <span className="mt-3 block h-px w-10 bg-[#E7CF95]/45" />
              <p className="mt-3 max-w-[38ch] text-pretty text-[14.5px] leading-[1.6] text-[#F3F0EC]/70">
                The official channels of PT Aroma Abadi, for customers and partners alike.
              </p>
            </div>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noreferrer noopener"
              className="press inline-flex shrink-0 items-center gap-[9px] rounded-full border border-[#D7B69A]/60 px-[22px] py-[11px] text-[14.5px] font-semibold text-[#E6CBB2] transition-[background-color,border-color,color,transform] duration-300 hover:-translate-y-[2px] hover:border-[#D7B69A] hover:bg-[#D7B69A]/12 hover:text-[#FBFAF8]"
            >
              <WhatsAppIcon className="h-[20px] w-[20px]" />
              Chat with ARMA
            </a>
          </div>

          {/* Laid out on hairlines rather than in boxes: a contact block
              should read as a column of details, not a row of cards. */}
          <dl className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {CONTACT.map((item) => (
              <div key={item.label}>
                <dt className="text-[13px] text-[#E7CF95]">{item.label}</dt>
                <dd className="mt-[10px] text-pretty text-[14.5px] leading-[1.55] text-[#FBFAF8]">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 flex items-center justify-between gap-4 border-t border-[#F3F0EC]/12 pt-6">
            <p className="text-[12.5px] text-[#F3F0EC]/55">© {new Date().getFullYear()}</p>
            <p className="text-[12.5px] text-[#F3F0EC]/55">PT Aroma Abadi</p>
          </div>
        </div>
      </footer>

      {/* ── Floating WhatsApp ────────────────────────────────────────── */}
      <a
        href={WA_LINK}
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Chat with ARMA on WhatsApp"
        className={`group fixed bottom-5 right-5 z-40 transition-[transform,opacity] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:bottom-7 sm:right-7 ${
          scrolled && !menuOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <span className="lp-float relative flex items-center rounded-full bg-[#25D366] pr-0 shadow-[0_10px_26px_-8px_rgba(37,211,102,0.55),0_3px_10px_rgba(22,22,22,0.2)] transition-[padding,box-shadow] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:shadow-[0_16px_34px_-8px_rgba(37,211,102,0.7),0_4px_12px_rgba(22,22,22,0.25)] sm:group-hover:pr-[18px]">
          <span
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full bg-[#25D366]/40 blur-[12px]"
          />
          <img src={whatsappMark} alt="" className="h-[52px] w-[52px] shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-[13.5px] font-semibold text-white opacity-0 transition-[max-width,opacity,padding] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:group-hover:max-w-[170px] sm:group-hover:pl-[10px] sm:group-hover:opacity-100">
            Chat with ARMA
          </span>
        </span>
      </a>
    </main>
  );
}
