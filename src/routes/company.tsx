import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Award,
  Ban,
  BadgeCheck,
  BellRing,
  Boxes,
  Building2,
  Clock,
  CreditCard,
  FileCheck,
  Globe,
  Landmark,
  Link2,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Menu,
  Phone,
  QrCode,
  RefreshCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Ticket,
  Truck,
  Wallet,
  Workflow,
  X,
} from "lucide-react";
import { useEscapeKey } from "@/lib/use-escape-key";
import {
  Facts,
  FactTiles,
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
import brandDG from "@/assets/brand-dolce-gabbana.png";
import brandSisley from "@/assets/brand-sisley.png";
import brandRimmel from "@/assets/brand-rimmel.png";
import brandLaura from "@/assets/brand-laura-mercier.png";
import brandBareMinerals from "@/assets/brand-baremineral.png";

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

const BRANDS = [
  { src: brandSisley, name: "Sisley Paris" },
  { src: brandLaura, name: "Laura Mercier" },
  { src: brandDG, name: "Dolce & Gabbana Beauty" },
  { src: brandBareMinerals, name: "bareMinerals" },
  { src: brandRimmel, name: "Rimmel London" },
];

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Official Distribution",
    body: "Products come from the principal, never the grey market.",
  },
  {
    icon: BadgeCheck,
    title: "BPOM Licensed",
    body: "Every product carries a registration number you can verify.",
  },
  {
    icon: Globe,
    title: "Nationwide Delivery",
    body: "Shipped from our own warehouse by national couriers.",
  },
];

const HERO_FACTS: { icon?: typeof Building2; wa?: boolean; label: string; value: string }[] = [
  { icon: Building2, label: "Legal entity", value: "PT Aroma Abadi" },
  { icon: Boxes, label: "Line of business", value: "Beauty distribution" },
  { wa: true, label: "Sales channel", value: "WhatsApp (ARMA)" },
  { icon: CreditCard, label: "Payment gateway", value: "Xendit" },
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
    body: "Two kinds: a unique code for one customer, and a shared code with a usage cap. The discount is visible before payment.",
  },
  {
    icon: BellRing,
    title: "Program Updates",
    body: "Sent only to customers who opted in. Every message carries a way to stop, and anyone who stops is not messaged again.",
  },
];

const PAYMENT_PANELS = [
  {
    icon: QrCode,
    title: "QRIS",
    body: "The customer scans one code from any bank or e-wallet app. This is the method our customers reach for most.",
  },
  {
    icon: Landmark,
    title: "Virtual Account",
    body: "A dedicated transfer number per order, payable from any bank, recorded automatically the moment funds arrive.",
  },
  {
    icon: Wallet,
    title: "E-Wallet",
    body: "OVO, DANA, ShopeePay and LinkAja, opened straight from the payment page with no number to copy.",
  },
  {
    icon: CreditCard,
    title: "Credit and Debit Cards",
    body: "Visa, Mastercard and JCB, processed on Xendit's page with 3D Secure from the issuing bank.",
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
    body: "Raised over WhatsApp within 7 days of delivery. Sealed products are refunded in full; opened products are exchanged.",
  },
  {
    icon: Ban,
    title: "Cancellation",
    body: "Unpaid orders lapse when the payment link expires. Paid orders that have not shipped are refunded in full through Xendit.",
  },
  {
    icon: Lock,
    title: "Data Privacy",
    body: "We keep the WhatsApp number, name, address and order history needed to process orders. Data is never sold or shared elsewhere.",
  },
];

const CONTACT: {
  icon?: typeof Clock;
  wa?: boolean;
  label: string;
  value: ReactNode;
  wide?: boolean;
}[] = [
  {
    wa: true,
    label: "Customer WhatsApp",
    value: (
      <a
        href={WA_LINK}
        target="_blank"
        rel="noreferrer noopener"
        className="underline decoration-[#E7CF95]/45 underline-offset-4 transition-colors duration-200 hover:text-[#E7CF95]"
      >
        {WA_NUMBER}
      </a>
    ),
  },
  { icon: Clock, label: "Service hours", value: "24 hours, every day" },
  {
    icon: Mail,
    label: "Official email",
    value: (
      <a
        href="mailto:arma@aromaabadi.com"
        className="underline decoration-[#E7CF95]/45 underline-offset-4 transition-colors duration-200 hover:text-[#E7CF95]"
      >
        arma@aromaabadi.com
      </a>
    ),
  },
  {
    icon: MapPin,
    label: "Registered office",
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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20.3 11.9a8.4 8.4 0 0 1-12.5 7.3L3.4 20.6l1.5-4.3A8.4 8.4 0 1 1 20.3 11.9z" />
      <path d="M9.1 9.3c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.4l.6 1.5c.1.2 0 .4-.1.6l-.3.4c-.1.2-.2.3 0 .6a6.4 6.4 0 0 0 2.7 2.3c.2.1.4.1.6-.1l.4-.5c.1-.2.3-.2.5-.1l1.4.7c.2.1.3.2.3.4v.5c0 .4-.3.8-.7 1-.5.2-1.1.2-1.8.1a9.9 9.9 0 0 1-5.6-4.7c-.4-.8-.4-1.6-.2-2.1l.4-1z" />
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

            <nav className="hidden flex-1 items-center justify-center gap-9 lg:flex xl:gap-12">
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
              className="press ml-auto hidden items-center gap-[8px] rounded-full bg-[#D7B69A] px-[18px] py-[10px] text-[13.5px] font-semibold text-[#3A000A] transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-[1px] hover:bg-[#E6CBB2] hover:shadow-[0_10px_24px_-12px_rgba(215,182,154,0.95)] sm:inline-flex lg:ml-0"
            >
              <WhatsAppIcon className="h-[19px] w-[19px]" />
              Chat with ARMA
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="press ml-auto grid h-[42px] w-[42px] place-items-center rounded-full border border-[#F3F0EC]/20 text-[#FBFAF8] transition-colors duration-200 hover:bg-[#F3F0EC]/10 sm:ml-3 lg:hidden"
            >
              {menuOpen ? (
                <X className="h-[19px] w-[19px]" strokeWidth={1.8} />
              ) : (
                <Menu className="h-[19px] w-[19px]" strokeWidth={1.8} />
              )}
            </button>
          </div>
        </div>
        <div className="h-[2px] bg-[#F3F0EC]/10">
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
          className="pointer-events-none absolute -right-40 -top-40 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(113,0,20,0.07),transparent_68%)]"
        />
        <div className="relative mx-auto grid w-full max-w-[1180px] gap-12 px-6 py-12 md:px-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_308px] lg:items-center lg:gap-16 lg:py-16">
          <div>
            <p className="flex items-center gap-3 text-[12.5px] font-medium tracking-[0.02em] text-[#8A6246]">
              <span className="h-px w-8 bg-[#BF9877]" />
              PT Aroma Abadi
            </p>
            <h1 className="lp-display mt-4 max-w-[19ch] text-balance text-[clamp(2.1rem,1.2rem+2.9vw,3.3rem)] leading-[1.08] text-[#161616]">
              Order and pay inside a single WhatsApp conversation.
            </h1>
            <p className="mt-5 max-w-[54ch] text-pretty text-[15.5px] leading-[1.62] text-[#55504B]">
              We distribute premium beauty products across Indonesia. Customers shop through ARMA,
              our official WhatsApp assistant, and pay through Xendit without ever leaving the chat.
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-[#E6D8CD] bg-[#E6D8CD] sm:grid-cols-4">
              {HERO_FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="group bg-white px-4 py-[14px] transition-colors duration-300 hover:bg-[#F3F0EC]"
                >
                  <dt className="flex items-center gap-[7px] text-[12px] leading-tight text-[#8A6246]">
                    {fact.wa ? (
                      <WhatsAppIcon className="h-[15px] w-[15px]" />
                    ) : fact.icon ? (
                      <fact.icon className="h-[14px] w-[14px]" strokeWidth={1.7} />
                    ) : null}
                    {fact.label}
                  </dt>
                  <dd className="mt-[7px] text-[14.5px] font-semibold leading-snug text-[#161616]">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="w-full max-w-[308px] justify-self-center lg:justify-self-end">
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
          <div>
            <p className="lp-display text-center text-[clamp(1.3rem,1rem+0.9vw,1.75rem)] leading-tight text-[#710014]">
              Brands we distribute
            </p>
            <div className="mt-5">
              <Marquee>
                {BRANDS.map((brand) => (
                  <img
                    key={brand.name}
                    src={brand.src}
                    alt={brand.name}
                    className="lp-brandmark h-[200px] w-[300px] shrink-0 object-contain sm:w-[410px]"
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
                partner retail counters and a team of Beauty Advisors — and, since our CRM program
                began, through WhatsApp.
              </p>
            </Prose>
          </Reveal>

          <div className="mt-8 grid gap-4 sm:auto-rows-fr sm:grid-cols-3">
            {PILLARS.map((pillar, index) => (
              <Reveal key={pillar.title} delay={index * 70}>
                <div className="group flex h-full flex-col rounded-[12px] border border-[#E0D4C8] bg-white/70 p-5 transition-[transform,border-color,background-color] duration-300 hover:-translate-y-[2px] hover:border-[#710014]/25 hover:bg-white">
                  <pillar.icon
                    className="h-[20px] w-[20px] text-[#710014] transition-transform duration-300 group-hover:scale-110"
                    strokeWidth={1.6}
                  />
                  <h3 className="mt-3 text-[14.5px] font-semibold text-[#161616]">
                    {pillar.title}
                  </h3>
                  <p className="mt-[6px] text-pretty text-[13.5px] leading-[1.6] text-[#55504B]">
                    {pillar.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={60} className="mt-12">
            <Facts
              tone="cream"
              cols={2}
              items={[
                { icon: Building2, label: "Registered name", value: "PT Aroma Abadi" },
                { icon: Boxes, label: "Line of business", value: "Beauty product trading" },
                {
                  icon: MapPin,
                  label: "Registered office",
                  value: (
                    <>
                      <Pending field="full address" />, South Jakarta
                    </>
                  ),
                },
                {
                  icon: FileCheck,
                  label: "Business registration",
                  value: <Pending field="NIB number" />,
                },
                {
                  icon: MessageCircle,
                  label: "Sales channels",
                  value: "WhatsApp (ARMA) and partner retail",
                },
                { icon: Globe, label: "Delivery area", value: "Across Indonesia" },
                { icon: CreditCard, label: "Payment gateway", value: "Xendit" },
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
                ARMA is the official Aroma Abadi WhatsApp assistant. Customers save a single number:
                asking, ordering, paying and tracking all happen in the same conversation.
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
            <div className="relative overflow-hidden rounded-[16px] bg-[#4A000D] p-6 sm:p-7">
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
          <span className="mt-4 block h-px w-10 bg-[#BF9877]" />
          <p className="mt-4 text-pretty text-[15.5px] leading-[1.7] text-[#55504B]">
            Six steps, from the first message to the parcel leaving our warehouse. Step four is the
            payment point: that is where the customer opens the Xendit page.
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
            body="From that summary ARMA sends a single payment link created through Xendit. The link opens the Xendit payment page, where the customer picks a method and completes the transaction. Every payment detail is entered on Xendit's page, not in WhatsApp, and none of it passes through our systems."
            points={[
              {
                icon: Link2,
                label: "Payment link",
                value: "Created per order, valid for 24 hours",
              },
              {
                icon: Wallet,
                label: "Methods available",
                value: "QRIS, virtual account, e-wallet, card",
              },
              {
                icon: FileCheck,
                label: "What we receive",
                value: "Payment status and invoice number",
              },
            ]}
            screen={<CheckoutScreen {...CHECKOUT} />}
          />
          <Step
            n={5}
            title="Automatic Confirmation"
            body="Xendit notifies our system the moment a payment succeeds. ARMA sends the confirmation and invoice number straight away, and the loyalty points land at the same time."
            screen={<ChatScreen messages={STEP_RECEIPT} />}
          />
          <Step
            n={6}
            last
            title="Fulfilment and Delivery"
            body="Paid orders go through to our warehouse. The tracking number is sent to the same conversation, and the customer can ask ARMA for status at any time."
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

          <Reveal delay={80} className="mt-12">
            <FactTiles
              items={[
                {
                  icon: Lock,
                  label: "Payment page",
                  value: "Hosted and processed by Xendit",
                },
                {
                  icon: CreditCard,
                  label: "Card data",
                  value: "Never stored in Aroma Abadi systems",
                },
                {
                  icon: FileCheck,
                  label: "Payment status",
                  value: "Received automatically, logged per invoice",
                },
                {
                  icon: Scale,
                  label: "Fee breakdown",
                  value: "Shown in full before the customer pays",
                },
                { icon: Landmark, label: "Currency", value: "Indonesian Rupiah (IDR)" },
                {
                  icon: RefreshCcw,
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
      <footer id="kontak" className="lp-dark scroll-mt-[86px] bg-[#3A000A]">
        <div className="mx-auto w-full max-w-[1180px] px-6 py-12 md:px-10 md:py-14">
          <div className="grid gap-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.25fr)] md:gap-12">
            <div>
              <img src={armaMark} alt="Aroma Abadi" className="w-[56px]" />
              <h2 className="lp-display mt-6 text-[clamp(1.6rem,1.1rem+1.4vw,2.1rem)] leading-[1.14] text-[#FBFAF8]">
                Official Contact
              </h2>
              <span className="mt-4 block h-px w-10 bg-[#E7CF95]/45" />
              <p className="mt-4 max-w-[32ch] text-pretty text-[14.5px] leading-[1.68] text-[#F3F0EC]/75">
                The official channels of PT Aroma Abadi, for customers and partners alike.
              </p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noreferrer noopener"
                className="press mt-7 inline-flex items-center gap-[9px] rounded-full bg-[#D7B69A] px-[22px] py-[12px] text-[14.5px] font-semibold text-[#3A000A] transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-[2px] hover:bg-[#E6CBB2] hover:shadow-[0_16px_34px_-16px_rgba(215,182,154,0.7)]"
              >
                <WhatsAppIcon className="h-[20px] w-[20px]" />
                Chat with ARMA
              </a>
            </div>

            <Reveal>
              <div className="grid gap-px overflow-hidden rounded-[16px] border border-[#F3F0EC]/15 bg-[#F3F0EC]/15 sm:grid-cols-2">
                {CONTACT.map((item) => (
                  <div
                    key={item.label}
                    className={`group bg-[#3A000A] p-5 transition-colors duration-300 hover:bg-[#4A000D] ${
                      item.wide ? "sm:col-span-2" : ""
                    }`}
                  >
                    <p className="flex items-center gap-[10px] text-[12px] text-[#E7CF95]">
                      <span className="grid h-[28px] w-[28px] shrink-0 place-items-center rounded-full bg-[#E7CF95]/12 text-[#E7CF95] transition-colors duration-300 group-hover:bg-[#E7CF95]/20">
                        {item.wa ? (
                          <WhatsAppIcon className="h-[15px] w-[15px]" />
                        ) : item.icon ? (
                          <item.icon className="h-[14px] w-[14px]" strokeWidth={1.7} />
                        ) : null}
                      </span>
                      {item.label}
                    </p>
                    <p className="mt-[10px] pl-[38px] text-[15px] leading-[1.5] text-[#FBFAF8]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-end gap-3 border-t border-[#F3F0EC]/12 pt-5">
            <p className="text-[12.5px] text-[#F3F0EC]/60">
              © {new Date().getFullYear()} PT Aroma Abadi
            </p>
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
