import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowDown, MessageCircle, Menu, X } from "lucide-react";
import { useEscapeKey } from "@/lib/use-escape-key";
import {
  Facts,
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
  type ChatMessage,
  type PaymentMethod,
} from "@/components/landing/screens";
import armaMark from "@/assets/aroma-abadi-icon-sand.png";
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

const METHODS: PaymentMethod[] = [
  { id: "qris", name: "QRIS", note: "Scan dari aplikasi bank atau e‑wallet" },
  { id: "va", name: "Virtual Account", note: "Transfer dari bank mana saja" },
  { id: "card", name: "Kartu kredit atau debit", note: "Visa, Mastercard, JCB" },
];

const CHECKOUT = { invoice: "Invoice AA-2611", amount: "Rp 2.714.310", methods: METHODS };

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
  note: "Berlaku 24 jam. QRIS, transfer bank, atau kartu.",
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
    text: "Pesanan AA-2611 sudah diserahkan ke kurir. Nomor resi JNE 0098 7712 3344, estimasi tiba 2 hari kerja. Aku kabari lagi kalau sudah sampai ya Kak.",
  },
];

const BRANDS = [
  { src: brandSisley, name: "Sisley Paris" },
  { src: brandLaura, name: "Laura Mercier" },
  { src: brandDG, name: "Dolce & Gabbana Beauty" },
  { src: brandBareMinerals, name: "bareMinerals" },
  { src: brandRimmel, name: "Rimmel London" },
];

const HERO_FACTS = [
  { label: "Badan hukum", value: "PT Aroma Abadi" },
  { label: "Bidang usaha", value: "Distribusi produk kecantikan" },
  { label: "Kanal transaksi", value: "WhatsApp (ARMA)" },
  { label: "Payment gateway", value: "Xendit" },
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
        href: "https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap",
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
  const [active, setActive] = useState("");

  useEffect(() => {
    let last = window.scrollY;
    let queued = false;

    const measure = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
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

  return { hidden, progress, active };
}

function CompanyPage() {
  const { hidden, progress, active } = useMasthead();
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
    <main className="bg-white">
      {/* ── Masthead ─────────────────────────────────────────────────── */}
      <header
        className={`lp-dark sticky top-0 z-40 transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="bg-[#3E1319]">
          <div className="mx-auto flex h-[76px] w-full max-w-[1180px] items-center gap-6 px-6 md:px-10">
            <a
              href="#top"
              aria-label="PT Aroma Abadi, ke atas halaman"
              className="shrink-0 rounded-sm transition-transform duration-300 hover:scale-105"
            >
              <img src={armaMark} alt="Aroma Abadi" className="h-[30px] w-auto" />
            </a>

            <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  data-active={active === item.id}
                  className="lp-navlink whitespace-nowrap text-[14px] text-[#EADFD2]/70 transition-colors duration-200 hover:text-[#FBF7F0] data-[active=true]:text-[#FBF7F0]"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <a
              href={WA_LINK}
              target="_blank"
              rel="noreferrer noopener"
              className="press ml-auto hidden items-center gap-2 rounded-full bg-[#D9B892] px-[18px] py-[10px] text-[14px] font-medium text-[#3E1319] transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-[1px] hover:bg-[#E8CDAC] hover:shadow-[0_10px_24px_-12px_rgba(217,184,146,0.9)] sm:inline-flex lg:ml-0"
            >
              <MessageCircle className="h-[16px] w-[16px]" strokeWidth={2} />
              Chat dengan ARMA
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
              className="press ml-auto grid h-[42px] w-[42px] place-items-center rounded-full border border-[#FBF7F0]/20 text-[#FBF7F0] transition-colors duration-200 hover:bg-[#FBF7F0]/10 sm:ml-3 lg:hidden"
            >
              {menuOpen ? (
                <X className="h-[19px] w-[19px]" strokeWidth={1.8} />
              ) : (
                <Menu className="h-[19px] w-[19px]" strokeWidth={1.8} />
              )}
            </button>
          </div>
        </div>
        <div className="h-[2px] bg-[#FBF7F0]/10">
          <div
            className="h-full origin-left bg-[#D9B892]"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </header>

      {/* ── Mobile navigation ────────────────────────────────────────── */}
      <div
        className={`lp-dark fixed inset-0 z-30 bg-[#3E1319] transition-opacity duration-300 lg:hidden ${
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
              className={`lp-display border-b border-[#FBF7F0]/10 py-4 text-[30px] leading-none text-[#FBF7F0] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                menuOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              {item.label}
            </a>
          ))}
          <a
            href={WA_LINK}
            target="_blank"
            rel="noreferrer noopener"
            onClick={closeMenu}
            style={{ transitionDelay: menuOpen ? `${80 + NAV.length * 45}ms` : "0ms" }}
            className={`press mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#D9B892] px-5 py-[13px] text-[15px] font-medium text-[#3E1319] transition-all duration-500 ${
              menuOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            <MessageCircle className="h-[17px] w-[17px]" strokeWidth={2} />
            Chat dengan ARMA
          </a>
        </nav>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section id="top" className="relative overflow-hidden bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(113,34,42,0.07),transparent_68%)]"
        />
        <div className="relative mx-auto grid w-full max-w-[1180px] gap-14 px-6 py-16 md:px-10 md:py-20 lg:grid-cols-[minmax(0,1fr)_336px] lg:items-center lg:gap-20 lg:py-24">
          <div>
            <p className="flex items-center gap-3 text-[13px] text-[#8B6B51]">
              <span className="h-px w-8 bg-[#8B6B51]/40" />
              PT Aroma Abadi
            </p>
            <h1 className="lp-display mt-5 max-w-[20ch] text-[clamp(2.3rem,1.3rem+3.1vw,3.7rem)] leading-[1.05] text-[#2B211D]">
              Pesan dan bayar dalam satu percakapan WhatsApp.
            </h1>
            <p className="mt-6 max-w-[58ch] text-[17px] leading-[1.65] text-[#5B4C44]">
              Kami mendistribusikan produk kecantikan premium di Indonesia. Pelanggan berbelanja
              lewat ARMA, asisten WhatsApp resmi kami, dan membayar melalui Xendit.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={WA_LINK}
                target="_blank"
                rel="noreferrer noopener"
                className="press inline-flex items-center gap-2 rounded-full bg-[#71222A] px-[22px] py-[13px] text-[15px] font-medium text-white transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-[2px] hover:bg-[#8A2B34] hover:shadow-[0_16px_34px_-16px_rgba(113,34,42,0.75)]"
              >
                <MessageCircle className="h-[17px] w-[17px]" strokeWidth={2} />
                Chat dengan ARMA
              </a>
              <a
                href="#alur"
                className="press icon-nudge group inline-flex items-center gap-2 rounded-full border border-[#2B211D]/15 px-[22px] py-[13px] text-[15px] font-medium text-[#2B211D] transition-colors duration-300 hover:border-[#71222A]/35 hover:bg-[#71222A]/5"
              >
                Lihat Alur Transaksi
                <ArrowDown className="h-[16px] w-[16px] transition-transform duration-300 group-hover:translate-y-[2px]" />
              </a>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-[#2B211D]/10 bg-[#2B211D]/10 sm:grid-cols-4">
              {HERO_FACTS.map((fact) => (
                <div key={fact.label} className="bg-white px-4 py-[18px]">
                  <dt className="text-[12.5px] leading-tight text-[#8B6B51]">{fact.label}</dt>
                  <dd className="mt-[6px] text-[15px] font-medium leading-snug text-[#2B211D]">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="w-full max-w-[336px] justify-self-center lg:justify-self-end">
            <LiveChat messages={HERO_THREAD} checkout={CHECKOUT} />
          </div>
        </div>
      </section>

      {/* ── Profil bisnis ────────────────────────────────────────────── */}
      <Section id="profil" tone="cream">
        <Split
          tone="cream"
          title="Profil Bisnis"
          lede="Badan usaha terdaftar, dengan produk ber-izin edar BPOM."
        >
          <Reveal>
            <Prose tone="cream">
              <p>
                PT Aroma Abadi mendistribusikan brand kecantikan internasional di Indonesia, lewat
                jaringan gerai retail dan tim Beauty Advisor di kota-kota besar.
              </p>
              <p>
                Pelanggan juga bisa memesan langsung lewat WhatsApp. Pesanan ditangani ARMA, lalu
                diproses dan dikirim dari gudang kami. Semua produk berasal dari principal resmi dan
                memiliki nomor izin edar BPOM.
              </p>
            </Prose>
          </Reveal>

          <Reveal delay={60} className="mt-10">
            <Facts
              tone="cream"
              items={[
                { label: "Nama badan hukum", value: "PT Aroma Abadi" },
                { label: "Bidang usaha", value: "Perdagangan besar dan eceran produk kecantikan" },
                {
                  label: "Kantor terdaftar",
                  value: (
                    <>
                      <Pending field="alamat lengkap" />, Jakarta Selatan, DKI Jakarta
                    </>
                  ),
                },
                { label: "NIB", value: <Pending field="nomor induk berusaha" /> },
                { label: "NPWP", value: <Pending field="nomor NPWP" /> },
                { label: "Legalitas produk", value: "Nomor izin edar BPOM untuk setiap produk" },
                { label: "Kanal penjualan", value: "WhatsApp (ARMA) dan gerai retail mitra" },
                { label: "Wilayah pengiriman", value: "Seluruh Indonesia" },
              ]}
            />
          </Reveal>

          <Reveal delay={100} className="mt-12">
            <p className="text-[13px] text-[#8B6B51]">Brand yang kami distribusikan</p>
            {/* Square artwork with its own whitespace, so the marks get equal
                cells rather than being packed into a row. */}
            <ul className="mt-2 grid grid-cols-3 items-center gap-x-4 sm:grid-cols-5">
              {BRANDS.map((brand) => (
                <li key={brand.name}>
                  <img
                    src={brand.src}
                    alt={brand.name}
                    className="lp-brandmark h-[88px] w-full object-contain"
                  />
                </li>
              ))}
            </ul>
          </Reveal>
        </Split>
      </Section>

      {/* ── Program loyalitas ────────────────────────────────────────── */}
      <Section id="program">
        <Split
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
            {[
              {
                title: "Konsultasi Produk",
                body: "ARMA menjawab pertanyaan soal jenis kulit, shade, dan cara pakai, lalu merekomendasikan produk yang stoknya tersedia. Pelanggan yang butuh bantuan manusia dialihkan ke tim kami di percakapan yang sama.",
              },
              {
                title: "Poin dan Tingkat Keanggotaan",
                body: "Setiap pesanan yang dibayar menambah poin. Poin menentukan tingkat keanggotaan: Prestige, Atelier, Legacy, Élite, dan Icon. Tiap tingkat membuka benefit yang berbeda.",
              },
              {
                title: "Kode Promo",
                body: "Dua jenis: kode unik untuk satu pelanggan, dan kode bersama dengan batas pemakaian. Potongannya selalu terlihat di rincian sebelum pelanggan membayar.",
              },
              {
                title: "Kabar Program dan Pengingat",
                body: "Hanya dikirim ke pelanggan yang menyetujui. Setiap pesan punya cara berhenti, dan yang berhenti tidak kami kirimi lagi.",
              },
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 60}>
                <Panel title={item.title}>{item.body}</Panel>
              </Reveal>
            ))}
          </div>

          <Reveal delay={80} className="mt-5">
            <div className="rounded-[14px] border border-[#2B211D]/10 bg-[#FAF5EF] p-6">
              <h3 className="text-[16px] font-semibold text-[#2B211D]">
                Jalur Terpisah untuk Beauty Advisor
              </h3>
              <p className="mt-[10px] max-w-[62ch] text-[15px] leading-[1.62] text-[#5B4C44]">
                Beauty Advisor kami memakai ARMA versi internal untuk product knowledge dan SOP
                layanan. Jalur itu hanya untuk karyawan dan mitra gerai, dan tidak memproses
                pembayaran apa pun.
              </p>
            </div>
          </Reveal>
        </Split>
      </Section>

      {/* ── Alur transaksi ───────────────────────────────────────────── */}
      <Section id="alur" tone="cream">
        <Reveal className="max-w-[48ch]">
          <h2 className="lp-display text-[clamp(1.8rem,1.1rem+1.9vw,2.6rem)] leading-[1.08] text-[#71222A]">
            Alur Transaksi Pelanggan
          </h2>
          <span className="mt-4 block h-px w-10 bg-[#8B6B51]/40" />
          <p className="mt-4 text-[16px] leading-[1.65] text-[#5B4C44]">
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
            body="Sebelum ada uang yang berpindah, ARMA mengirim rincian lengkap yang dilihat pelanggan: produk dan jumlahnya, subtotal, potongan kode promo, PPN, biaya layanan sesuai metode pembayaran, dan total akhir."
            screen={<ChatScreen messages={STEP_ORDER} />}
          />
          <Step
            n={4}
            highlight
            title="Pembayaran melalui Xendit"
            body="Dari rincian itu ARMA mengirim satu tautan pembayaran yang dibuat lewat Xendit. Tautan membuka halaman pembayaran Xendit, tempat pelanggan memilih metode dan menyelesaikan transaksi. Seluruh data pembayaran diisi di halaman Xendit, bukan di WhatsApp, dan tidak pernah melewati sistem kami."
            points={[
              {
                label: "Tautan pembayaran",
                value: "Dibuat lewat Xendit untuk tiap pesanan, berlaku 24 jam",
              },
              { label: "Metode tersedia", value: "QRIS, Virtual Account, kartu kredit dan debit" },
              {
                label: "Yang kami terima",
                value: "Status pembayaran dan nomor invoice, tanpa data kartu",
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
          title="Metode Pembayaran dan Keamanan"
          lede="Semua pembayaran pelanggan berjalan di atas Xendit, dalam Rupiah."
        >
          <div className="grid gap-5 sm:auto-rows-fr sm:grid-cols-2">
            {[
              {
                title: "QRIS",
                body: "Pelanggan memindai kode dari aplikasi bank atau e-wallet mereka. Ini metode yang paling sering dipakai pelanggan kami.",
              },
              {
                title: "Virtual Account",
                body: "Nomor transfer khusus per pesanan, bisa dibayar dari bank mana saja, dan tercatat otomatis begitu dana masuk.",
              },
              {
                title: "Kartu Kredit",
                body: "Diproses di halaman Xendit dengan autentikasi 3D Secure dari bank penerbit kartu.",
              },
              {
                title: "Kartu Debit",
                body: "Untuk kartu debit berlogo jaringan internasional, lewat halaman pembayaran yang sama.",
              },
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 60}>
                <Panel title={item.title}>{item.body}</Panel>
              </Reveal>
            ))}
          </div>

          <Reveal delay={80} className="mt-12">
            <Facts
              items={[
                { label: "Halaman pembayaran", value: "Dihosting dan diproses oleh Xendit" },
                {
                  label: "Data kartu",
                  value: "Tidak pernah melewati atau tersimpan di sistem Aroma Abadi",
                },
                {
                  label: "Status pembayaran",
                  value: "Diterima otomatis dari Xendit dan dicatat per nomor invoice",
                },
                {
                  label: "Rincian biaya",
                  value: "Subtotal, potongan, PPN, dan biaya layanan tampil sebelum pembayaran",
                },
                { label: "Mata uang", value: "Rupiah (IDR)" },
                {
                  label: "Pengembalian dana",
                  value: "Diproses lewat Xendit ke metode pembayaran asal",
                },
              ]}
            />
          </Reveal>
        </Split>
      </Section>

      {/* ── Kebijakan ────────────────────────────────────────────────── */}
      <Section id="kebijakan" tone="cream">
        <Split
          tone="cream"
          title="Kebijakan Pelanggan"
          lede="Aturan yang berlaku untuk setiap pesanan lewat WhatsApp."
        >
          <div className="grid gap-5 sm:auto-rows-fr sm:grid-cols-2">
            {[
              {
                title: "Pengiriman",
                body: "Pesanan yang sudah dibayar diproses pada hari kerja berikutnya dan dikirim ke seluruh Indonesia lewat kurir rekanan. Nomor resi dikirim lewat WhatsApp begitu paket diserahkan ke kurir.",
              },
              {
                title: "Pengembalian dan Penukaran",
                body: "Diajukan lewat WhatsApp maksimal 7 hari setelah paket diterima, dengan nomor invoice dan foto produk. Produk tersegel dapat dikembalikan dengan dana penuh; produk yang sudah dibuka dapat ditukar atau diganti kredit belanja.",
              },
              {
                title: "Pembatalan",
                body: "Pesanan yang belum dibayar batal sendiri ketika tautan pembayaran kedaluwarsa. Pesanan yang sudah dibayar tetapi belum dikirim bisa dibatalkan lewat WhatsApp, dan dananya dikembalikan penuh melalui Xendit.",
              },
              {
                title: "Privasi Data",
                body: "Kami menyimpan nomor WhatsApp, nama, alamat pengiriman, dan riwayat pesanan untuk memproses transaksi dan menjalankan program loyalitas. Data tidak dijual atau dibagikan di luar kebutuhan pengiriman dan pembayaran.",
              },
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 60}>
                <Panel title={item.title}>{item.body}</Panel>
              </Reveal>
            ))}
          </div>
        </Split>
      </Section>

      {/* ── Kontak ───────────────────────────────────────────────────── */}
      <Section id="kontak" tone="maroon">
        <Split
          tone="maroon"
          title="Kontak Resmi"
          lede="Saluran resmi PT Aroma Abadi untuk pelanggan dan mitra."
        >
          <Reveal>
            <Facts
              tone="maroon"
              items={[
                {
                  label: "WhatsApp pelanggan",
                  value: (
                    <a
                      href={WA_LINK}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline decoration-[#D9B892]/50 underline-offset-4 transition-colors duration-200 hover:text-[#D9B892]"
                    >
                      {WA_NUMBER}
                    </a>
                  ),
                },
                { label: "Jam layanan", value: <Pending field="jam operasional" tone="maroon" /> },
                { label: "Email resmi", value: <Pending field="alamat email" tone="maroon" /> },
                { label: "Telepon kantor", value: <Pending field="nomor telepon" tone="maroon" /> },
                {
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

          <Reveal delay={60}>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noreferrer noopener"
              className="press mt-8 inline-flex items-center gap-2 rounded-full bg-[#D9B892] px-[22px] py-[13px] text-[15px] font-medium text-[#3E1319] transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-[2px] hover:bg-[#E8CDAC] hover:shadow-[0_16px_34px_-16px_rgba(217,184,146,0.6)]"
            >
              <MessageCircle className="h-[17px] w-[17px]" strokeWidth={2} />
              Chat dengan ARMA
            </a>
          </Reveal>
        </Split>
      </Section>

      <footer className="lp-dark bg-[#3E1319] pb-12">
        <div className="mx-auto w-full max-w-[1180px] border-t border-[#FBF7F0]/12 px-6 pt-8 md:px-10">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <img src={armaMark} alt="Aroma Abadi" className="h-[26px] w-auto" />
            <p className="text-[13px] text-[#EADFD2]/60">
              © {new Date().getFullYear()} PT Aroma Abadi
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
