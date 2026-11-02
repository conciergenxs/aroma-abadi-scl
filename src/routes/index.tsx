import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Award,
  Ban,
  BadgeCheck,
  BellRing,
  Boxes,
  Building2,
  Clock,
  Compass,
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
  { href: "#profil", id: "profil", label: "Profil" },
  { href: "#program", id: "program", label: "Program" },
  { href: "#alur", id: "alur", label: "Alur Transaksi" },
  { href: "#pembayaran", id: "pembayaran", label: "Pembayaran" },
  { href: "#kontak", id: "kontak", label: "Kontak" },
];

/* The channels Xendit actually carries in Indonesia, grouped the way its own
 * hosted payment page groups them. */
const METHODS: PaymentMethod[] = [
  { id: "qris", name: "QRIS", note: "Semua aplikasi bank dan e‑wallet" },
  { id: "va", name: "Virtual Account", note: "BCA, Mandiri, BNI, BRI, Permata" },
  { id: "ewallet", name: "E-Wallet", note: "OVO, DANA, ShopeePay, LinkAja" },
  { id: "card", name: "Kartu kredit atau debit", note: "Visa, Mastercard, JCB" },
];

const CHECKOUT = {
  invoice: "AA-2611",
  amount: "Rp 2.714.310",
  expiry: "3 Nov 2026, 09.40",
  methods: METHODS,
};

const ORDER = {
  title: "Rincian pesanan AA-2611",
  items: [
    { name: "Real Flawless Foundation", qty: 1, price: "1.950.000" },
    { name: "Translucent Setting Powder", qty: 1, price: "750.000" },
  ],
  rows: [
    { label: "Subtotal", value: "2.700.000" },
    { label: "Kode PRESTIGE10", value: "−270.000" },
    { label: "PPN 11%", value: "267.300" },
    { label: "Biaya layanan QRIS", value: "17.010" },
  ],
  total: "Rp 2.714.310",
};

const PAY_LINK = {
  title: "Pembayaran pesanan AA-2611",
  note: "Berlaku 24 jam. QRIS, transfer bank, e-wallet, atau kartu.",
  host: "checkout.xendit.co",
  url: "checkout.xendit.co/od/aroma-abadi",
};

const RECEIPT = {
  title: "Pembayaran diterima",
  rows: [
    { label: "Invoice", value: "AA-2611" },
    { label: "Metode", value: "QRIS" },
    { label: "Dibayar", value: "Rp 2.714.310" },
  ],
  note: "Poin loyalitas sudah masuk. Nomor resi aku kirim di chat ini begitu paket diserahkan ke kurir.",
};

/** The hero loop: one full transaction, start to finish. */
const HERO_THREAD: ChatMessage[] = [
  { from: "customer", time: "09.38", text: "Halo, aku cari foundation untuk kulit kering." },
  {
    from: "arma",
    time: "09.38",
    text: "Halo Kak! Real Flawless Foundation dari Sisley hasilnya dewy dan tahan seharian, cocok untuk kulit kering. Aku tambahkan setting powder biar makin tahan?",
  },
  { from: "customer", time: "09.39", text: "Boleh, dua-duanya ya." },
  { from: "arma", time: "09.39", order: ORDER },
  { from: "arma", time: "09.40", link: PAY_LINK },
  { from: "arma", time: "09.42", receipt: RECEIPT },
];

/** Paced for reading, not for showing off: the customer types, ARMA takes a
 * beat to answer, and the payment page stays open long enough to be read. */
const HERO_SCRIPT: Beat[] = [
  { t: "type", i: 0 },
  { t: "pause", ms: 650 },
  { t: "armaTyping", ms: 2100 },
  { t: "send", i: 1 },
  { t: "pause", ms: 2400 },
  { t: "type", i: 2 },
  { t: "pause", ms: 550 },
  { t: "armaTyping", ms: 1900 },
  { t: "send", i: 3 },
  { t: "pause", ms: 2300 },
  { t: "armaTyping", ms: 1400 },
  { t: "send", i: 4 },
  { t: "pause", ms: 2200 },
  { t: "checkout", ms: 5400 },
  { t: "pause", ms: 900 },
  { t: "armaTyping", ms: 1600 },
  { t: "send", i: 5 },
];

const STEP_OPENING: ChatMessage[] = [
  { from: "customer", time: "09.37", text: "Halo, masih buka?" },
  {
    from: "arma",
    time: "09.37",
    text: "Halo Kak, masih! Aku Arma dari Aroma Abadi. Ada yang bisa aku bantu cari hari ini?",
  },
];

const STEP_CONSULT: ChatMessage[] = [
  { from: "customer", time: "09.38", text: "Aku cari foundation untuk kulit kering." },
  {
    from: "arma",
    time: "09.38",
    text: "Real Flawless Foundation dari Sisley, shade 2N Ivory, stok ada. Hasilnya dewy dan tahan seharian. Mau sekalian setting powder-nya?",
  },
  { from: "customer", time: "09.39", text: "Boleh, dua-duanya ya." },
];

const STEP_ORDER: ChatMessage[] = [{ from: "arma", time: "09.39", order: ORDER }];
const STEP_RECEIPT: ChatMessage[] = [{ from: "arma", time: "09.42", receipt: RECEIPT }];
const STEP_SHIPPING: ChatMessage[] = [
  {
    from: "arma",
    time: "14.05",
    text: "Pesanan AA-2611 sudah diserahkan ke kurir. Nomor resi JNE 0098 7712 3344, estimasi tiba 2 hari kerja.",
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
    title: "Distribusi Resmi",
    body: "Produk datang dari principal, bukan dari pasar paralel.",
  },
  {
    icon: BadgeCheck,
    title: "Izin Edar BPOM",
    body: "Setiap produk punya nomor izin edar yang bisa dicek.",
  },
  {
    icon: Globe,
    title: "Kirim Se-Indonesia",
    body: "Dari gudang kami sendiri, lewat kurir rekanan nasional.",
  },
];

const HERO_FACTS = [
  { icon: Building2, label: "Badan hukum", value: "PT Aroma Abadi" },
  { icon: Boxes, label: "Bidang usaha", value: "Distribusi produk kecantikan" },
  { icon: MessageCircle, label: "Kanal transaksi", value: "WhatsApp (ARMA)" },
  { icon: CreditCard, label: "Payment gateway", value: "Xendit" },
];

const PROGRAM = [
  {
    icon: Sparkles,
    title: "Konsultasi Produk",
    body: "ARMA menjawab pertanyaan soal jenis kulit, shade, dan cara pakai, lalu merekomendasikan produk yang stoknya tersedia.",
  },
  {
    icon: Award,
    title: "Poin dan Tingkat Keanggotaan",
    body: "Setiap pesanan yang dibayar menambah poin. Poin menentukan tingkat, dari Prestige sampai Icon, dan tiap tingkat punya benefitnya.",
  },
  {
    icon: Ticket,
    title: "Kode Promo",
    body: "Dua jenis: kode unik untuk satu pelanggan, dan kode bersama dengan batas pemakaian. Potongannya terlihat sebelum pembayaran.",
  },
  {
    icon: BellRing,
    title: "Kabar Program",
    body: "Hanya dikirim ke pelanggan yang menyetujui. Setiap pesan punya cara berhenti, dan yang berhenti tidak kami kirimi lagi.",
  },
];

const PAYMENT_PANELS = [
  {
    icon: QrCode,
    title: "QRIS",
    body: "Pelanggan memindai satu kode dari aplikasi bank atau e-wallet mana pun. Ini kanal yang paling sering dipakai pelanggan kami.",
  },
  {
    icon: Landmark,
    title: "Virtual Account",
    body: "Nomor transfer khusus untuk tiap pesanan, bisa dibayar dari bank mana saja, dan tercatat otomatis begitu dana masuk.",
  },
  {
    icon: Wallet,
    title: "E-Wallet",
    body: "OVO, DANA, ShopeePay, dan LinkAja, dibuka langsung dari halaman pembayaran tanpa menyalin nomor apa pun.",
  },
  {
    icon: CreditCard,
    title: "Kartu Kredit dan Debit",
    body: "Visa, Mastercard, dan JCB, diproses di halaman Xendit dengan autentikasi 3D Secure dari bank penerbit.",
  },
];

const POLICIES = [
  {
    icon: Truck,
    title: "Pengiriman",
    body: "Pesanan yang sudah dibayar diproses pada hari kerja berikutnya dan dikirim lewat kurir rekanan. Nomor resi dikirim lewat WhatsApp.",
  },
  {
    icon: RefreshCcw,
    title: "Pengembalian dan Penukaran",
    body: "Diajukan lewat WhatsApp maksimal 7 hari setelah paket diterima. Produk tersegel dikembalikan dengan dana penuh; yang sudah dibuka ditukar.",
  },
  {
    icon: Ban,
    title: "Pembatalan",
    body: "Pesanan yang belum dibayar batal sendiri saat tautan kedaluwarsa. Yang sudah dibayar tetapi belum dikirim dikembalikan penuh lewat Xendit.",
  },
  {
    icon: Lock,
    title: "Privasi Data",
    body: "Kami menyimpan nomor WhatsApp, nama, alamat, dan riwayat pesanan untuk memproses transaksi. Data tidak dijual atau dibagikan ke pihak lain.",
  },
];

const FOOTER_COLUMNS = [
  {
    icon: Compass,
    title: "Navigasi",
    items: NAV.map((item) => ({ label: item.label, href: item.href })),
  },
  {
    icon: Building2,
    title: "Perusahaan",
    items: [
      { label: "PT Aroma Abadi" },
      { label: "Distribusi produk kecantikan" },
      { label: "Jakarta Selatan, DKI Jakarta" },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Pembayaran",
    items: [
      { label: "Diproses oleh Xendit" },
      { label: "QRIS, Virtual Account, e-wallet, kartu" },
      { label: "Rupiah (IDR)" },
    ],
  },
];

const DESCRIPTION =
  "PT Aroma Abadi mendistribusikan produk kecantikan premium di Indonesia dan menjalankan program CRM serta loyalitas lewat WhatsApp. Halaman ini menjelaskan profil bisnis, mekanisme program, dan alur transaksi pelanggan termasuk titik pembayaran melalui Xendit.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PT Aroma Abadi — Distribusi produk kecantikan & program loyalitas WhatsApp" },
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
              aria-label="PT Aroma Abadi, ke atas halaman"
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
              className="press ml-auto hidden items-center gap-2 rounded-full bg-[#C9A455] px-[18px] py-[10px] text-[13.5px] font-semibold text-[#2B0008] transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-[1px] hover:bg-[#E7CF95] hover:shadow-[0_10px_24px_-12px_rgba(201,164,85,0.9)] sm:inline-flex lg:ml-0"
            >
              <MessageCircle className="h-[16px] w-[16px]" strokeWidth={2} />
              Chat dengan ARMA
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
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
        <div className="relative mx-auto grid w-full max-w-[1180px] gap-14 px-6 py-16 md:px-10 md:py-20 lg:grid-cols-[minmax(0,1fr)_336px] lg:items-center lg:gap-20 lg:py-24">
          <div>
            <p className="flex items-center gap-3 text-[12.5px] font-medium tracking-[0.02em] text-[#8A6246]">
              <span className="h-px w-8 bg-[#BF9877]" />
              PT Aroma Abadi
            </p>
            <h1 className="lp-display mt-5 max-w-[19ch] text-balance text-[clamp(2.15rem,1.2rem+3vw,3.5rem)] leading-[1.08] text-[#161616]">
              Pesan dan bayar dalam satu percakapan WhatsApp.
            </h1>
            <p className="mt-6 max-w-[54ch] text-pretty text-[16px] leading-[1.7] text-[#55504B]">
              Kami mendistribusikan produk kecantikan premium di Indonesia. Pelanggan berbelanja
              lewat ARMA, asisten WhatsApp resmi kami, lalu membayar melalui Xendit tanpa pernah
              meninggalkan percakapan.
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-[#E6D8CD] bg-[#E6D8CD] sm:grid-cols-4">
              {HERO_FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="group bg-white px-4 py-[18px] transition-colors duration-300 hover:bg-[#F3F0EC]"
                >
                  <dt className="flex items-center gap-[7px] text-[12px] leading-tight text-[#8A6246]">
                    <fact.icon className="h-[14px] w-[14px]" strokeWidth={1.7} />
                    {fact.label}
                  </dt>
                  <dd className="mt-[7px] text-[14.5px] font-semibold leading-snug text-[#161616]">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="w-full max-w-[336px] justify-self-center lg:justify-self-end">
            <LiveChat messages={HERO_THREAD} script={HERO_SCRIPT} checkout={CHECKOUT} />
          </div>
        </div>
      </section>

      {/* ── Profil bisnis ────────────────────────────────────────────── */}
      <Section id="profil" tone="cream" className="lp-paper">
        <Split
          tone="cream"
          icon={Building2}
          title="Profil Bisnis"
          lede="Badan usaha terdaftar, dengan produk ber-izin edar BPOM."
        >
          <Reveal>
            <Prose tone="cream">
              <p>
                PT Aroma Abadi mendistribusikan brand kecantikan internasional di Indonesia lewat
                jaringan gerai retail dan tim Beauty Advisor, dan sejak program CRM berjalan, lewat
                WhatsApp.
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
                { icon: Building2, label: "Nama badan hukum", value: "PT Aroma Abadi" },
                { icon: Boxes, label: "Bidang usaha", value: "Perdagangan produk kecantikan" },
                {
                  icon: MapPin,
                  label: "Kantor terdaftar",
                  value: (
                    <>
                      <Pending field="alamat lengkap" />, Jakarta Selatan
                    </>
                  ),
                },
                { icon: FileCheck, label: "NIB", value: <Pending field="nomor induk berusaha" /> },
                { icon: FileCheck, label: "NPWP", value: <Pending field="nomor NPWP" /> },
                {
                  icon: MessageCircle,
                  label: "Kanal penjualan",
                  value: "WhatsApp (ARMA) dan gerai retail",
                },
                { icon: Globe, label: "Wilayah pengiriman", value: "Seluruh Indonesia" },
                { icon: CreditCard, label: "Payment gateway", value: "Xendit" },
              ]}
            />
          </Reveal>
        </Split>

        <div className="mt-16">
          <p className="text-center text-[12.5px] text-[#8A6246]">Brand yang kami distribusikan</p>
          <div className="mt-5">
            <Marquee>
              {BRANDS.map((brand) => (
                <img
                  key={brand.name}
                  src={brand.src}
                  alt={brand.name}
                  className="lp-brandmark h-[150px] w-[250px] shrink-0 object-contain sm:w-[320px]"
                />
              ))}
            </Marquee>
          </div>
        </div>
      </Section>

      {/* ── Program loyalitas ────────────────────────────────────────── */}
      <Section id="program">
        <Split
          icon={MessagesSquare}
          title="Mekanisme CRM dan Loyalitas"
          lede="Satu nomor WhatsApp untuk konsultasi, pesanan, poin, dan promo."
        >
          <Reveal>
            <Prose>
              <p>
                ARMA adalah asisten WhatsApp resmi Aroma Abadi. Pelanggan cukup menyimpan satu
                nomor: bertanya, memesan, membayar, dan melacak pesanan terjadi di percakapan yang
                sama.
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
            <div className="flex items-start gap-4 rounded-[14px] border border-[#E6D8CD] bg-[#F3F0EC] p-6">
              <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[#710014]/8 text-[#710014]">
                <Lock className="h-[17px] w-[17px]" strokeWidth={1.6} />
              </span>
              <div>
                <h3 className="text-[15.5px] font-semibold text-[#161616]">
                  Jalur Terpisah untuk Beauty Advisor
                </h3>
                <p className="mt-[8px] max-w-[62ch] text-pretty text-[14.5px] leading-[1.65] text-[#55504B]">
                  Beauty Advisor kami memakai ARMA versi internal untuk product knowledge dan SOP
                  layanan. Jalur itu hanya untuk karyawan dan mitra gerai, dan tidak memproses
                  pembayaran apa pun.
                </p>
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
            Alur Transaksi Pelanggan
          </h2>
          <span className="mt-4 block h-px w-10 bg-[#BF9877]" />
          <p className="mt-4 text-pretty text-[15.5px] leading-[1.7] text-[#55504B]">
            Enam langkah, dari sapaan pertama sampai paket dikirim. Langkah keempat adalah titik
            pembayaran: di sanalah pelanggan membuka halaman Xendit.
          </p>
        </Reveal>

        <div className="mt-14">
          <Step
            n={1}
            title="Pelanggan Membuka Percakapan"
            body="Pelanggan menghubungi nomor WhatsApp resmi Aroma Abadi, atau membalas pesan program yang sebelumnya mereka setujui. Seluruh transaksi berlangsung di satu thread."
            screen={<ChatScreen messages={STEP_OPENING} />}
          />
          <Step
            n={2}
            title="Konsultasi dan Pemilihan Produk"
            body="ARMA merekomendasikan produk sesuai kebutuhan pelanggan beserta ketersediaan stoknya, lalu mencatat jumlah dan alamat pengiriman. Kode promo dipakai di tahap ini."
            screen={<ChatScreen messages={STEP_CONSULT} />}
          />
          <Step
            n={3}
            title="Rincian Pesanan Dikirim"
            body="Sebelum ada uang yang berpindah, ARMA mengirim rincian lengkap: produk dan jumlahnya, subtotal, potongan kode promo, PPN, biaya layanan sesuai metode pembayaran, dan total akhir."
            screen={<ChatScreen messages={STEP_ORDER} />}
          />
          <Step
            n={4}
            highlight
            title="Pembayaran melalui Xendit"
            body="Dari rincian itu ARMA mengirim satu tautan pembayaran yang dibuat lewat Xendit. Tautan membuka halaman pembayaran Xendit, tempat pelanggan memilih metode dan menyelesaikan transaksi. Seluruh data pembayaran diisi di halaman Xendit, bukan di WhatsApp, dan tidak pernah melewati sistem kami."
            points={[
              {
                icon: Link2,
                label: "Tautan pembayaran",
                value: "Dibuat per pesanan, berlaku 24 jam",
              },
              {
                icon: Wallet,
                label: "Metode tersedia",
                value: "QRIS, Virtual Account, e-wallet, kartu",
              },
              {
                icon: FileCheck,
                label: "Yang kami terima",
                value: "Status pembayaran dan nomor invoice",
              },
            ]}
            screen={<CheckoutScreen {...CHECKOUT} />}
          />
          <Step
            n={5}
            title="Konfirmasi Otomatis"
            body="Xendit memberi tahu sistem kami begitu pembayaran berhasil. ARMA langsung mengirim konfirmasi dan nomor invoice ke pelanggan, dan poin loyalitas masuk pada saat yang sama."
            screen={<ChatScreen messages={STEP_RECEIPT} />}
          />
          <Step
            n={6}
            last
            title="Pemrosesan dan Pengiriman"
            body="Pesanan yang sudah dibayar diteruskan ke gudang kami. Nomor resi dikirim ke percakapan yang sama, dan pelanggan bisa menanyakan status pesanan kapan saja ke ARMA."
            screen={<ChatScreen messages={STEP_SHIPPING} />}
          />
        </div>
      </Section>

      {/* ── Pembayaran ───────────────────────────────────────────────── */}
      <Section id="pembayaran">
        <Split
          icon={ShieldCheck}
          title="Metode Pembayaran dan Keamanan"
          lede="Semua pembayaran pelanggan berjalan di atas Xendit, dalam Rupiah."
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
            <Facts
              cols={2}
              items={[
                {
                  icon: Lock,
                  label: "Halaman pembayaran",
                  value: "Dihosting dan diproses oleh Xendit",
                },
                {
                  icon: CreditCard,
                  label: "Data kartu",
                  value: "Tidak tersimpan di sistem Aroma Abadi",
                },
                {
                  icon: FileCheck,
                  label: "Status pembayaran",
                  value: "Diterima otomatis, dicatat per invoice",
                },
                {
                  icon: Scale,
                  label: "Rincian biaya",
                  value: "Tampil penuh sebelum pelanggan membayar",
                },
                { icon: Landmark, label: "Mata uang", value: "Rupiah (IDR)" },
                {
                  icon: RefreshCcw,
                  label: "Pengembalian dana",
                  value: "Lewat Xendit ke metode pembayaran asal",
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
          title="Kebijakan Pelanggan"
          lede="Aturan yang berlaku untuk setiap pesanan lewat WhatsApp."
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

      {/* ── Kontak ───────────────────────────────────────────────────── */}
      <Section id="kontak" tone="maroon">
        <Split
          tone="maroon"
          icon={Phone}
          title="Kontak Resmi"
          lede="Saluran resmi PT Aroma Abadi untuk pelanggan dan mitra."
          aside={
            <a
              href={WA_LINK}
              target="_blank"
              rel="noreferrer noopener"
              className="press mt-6 inline-flex items-center gap-2 rounded-full bg-[#C9A455] px-[22px] py-[12px] text-[14.5px] font-semibold text-[#2B0008] transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-[2px] hover:bg-[#E7CF95] hover:shadow-[0_16px_34px_-16px_rgba(201,164,85,0.6)]"
            >
              <MessageCircle className="h-[17px] w-[17px]" strokeWidth={2} />
              Chat dengan ARMA
            </a>
          }
        >
          <Reveal>
            <Facts
              tone="maroon"
              items={[
                {
                  icon: MessageCircle,
                  label: "WhatsApp pelanggan",
                  value: (
                    <a
                      href={WA_LINK}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline decoration-[#E7CF95]/50 underline-offset-4 transition-colors duration-200 hover:text-[#E7CF95]"
                    >
                      {WA_NUMBER}
                    </a>
                  ),
                },
                {
                  icon: Clock,
                  label: "Jam layanan",
                  value: <Pending field="jam operasional" tone="maroon" />,
                },
                {
                  icon: Mail,
                  label: "Email resmi",
                  value: <Pending field="alamat email" tone="maroon" />,
                },
                {
                  icon: Phone,
                  label: "Telepon kantor",
                  value: <Pending field="nomor telepon" tone="maroon" />,
                },
                {
                  icon: MapPin,
                  label: "Alamat kantor",
                  value: (
                    <>
                      <Pending field="alamat lengkap" tone="maroon" />, Jakarta Selatan, DKI Jakarta
                    </>
                  ),
                },
              ]}
            />
          </Reveal>
        </Split>
      </Section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="lp-dark bg-[#3A000A]">
        <div className="mx-auto w-full max-w-[1180px] px-6 py-14 md:px-10 md:py-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <img src={armaMark} alt="Aroma Abadi" className="w-[56px]" />
              <p className="lp-display mt-6 max-w-[17ch] text-[clamp(1.35rem,1rem+1.1vw,1.85rem)] leading-[1.18] text-[#FBFAF8]">
                Pesan dan bayar dalam satu percakapan.
              </p>
            </div>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noreferrer noopener"
              className="press group inline-flex shrink-0 items-center gap-3 rounded-full border border-[#F3F0EC]/20 py-[10px] pl-[12px] pr-[20px] transition-colors duration-300 hover:border-[#C9A455]/60 hover:bg-[#C9A455]/10"
            >
              <img src={whatsappMark} alt="" className="h-[34px] w-[34px]" />
              <span className="text-left">
                <span className="block text-[12px] text-[#E7CF95]">WhatsApp resmi</span>
                <span className="block text-[14px] font-medium text-[#FBFAF8]">{WA_NUMBER}</span>
              </span>
            </a>
          </div>

          <div className="mt-12 grid gap-10 border-t border-[#F3F0EC]/15 pt-10 sm:grid-cols-3">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="flex items-center gap-2 text-[12px] font-medium text-[#E7CF95]">
                  <column.icon className="h-[14px] w-[14px]" strokeWidth={1.7} />
                  {column.title}
                </p>
                <ul className="mt-4 space-y-[10px]">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      {"href" in item && item.href ? (
                        <a
                          href={item.href}
                          className="text-[13.5px] text-[#F3F0EC]/70 transition-colors duration-200 hover:text-[#FBFAF8]"
                        >
                          {item.label}
                        </a>
                      ) : (
                        <span className="text-[13.5px] text-[#F3F0EC]/70">{item.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[#F3F0EC]/12 pt-6">
            <p className="text-[12.5px] text-[#F3F0EC]/45">
              Halaman resmi PT Aroma Abadi. Seluruh transaksi dalam Rupiah.
            </p>
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
        aria-label="Chat dengan ARMA di WhatsApp"
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
            Chat dengan ARMA
          </span>
        </span>
      </a>
    </main>
  );
}
