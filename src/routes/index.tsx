import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { Block, Facts, Pending, Prose, Section, Split, Step } from "@/components/landing/parts";
import { ChatScreen, CheckoutScreen, type ChatMessage } from "@/components/landing/screens";
import logo from "@/assets/aroma-abadi-logo-sand.png";
import brandDG from "@/assets/brand-dolce-gabbana.png";
import brandSisley from "@/assets/brand-sisley.png";
import brandRimmel from "@/assets/brand-rimmel.png";
import brandLaura from "@/assets/brand-laura-mercier.png";
import brandBareMinerals from "@/assets/brand-baremineral.png";

/* The public company page.
 *
 * Audience: Xendit's verification team. It is not a storefront — nothing here
 * sells, and there is no cart. Its job is to let a reviewer answer three
 * questions without asking us: who is the legal entity, what does the loyalty
 * programme actually do, and at which screen does a customer pay through
 * Xendit. Everything on the page is organised around that last question.
 *
 * Values Aroma Abadi still has to supply are wrapped in <Pending>, which is
 * the only conspicuous thing on an otherwise quiet page — deliberately, so
 * none of them can be missed before this URL is handed over. */

const WA_NUMBER = "+62 811 9001 2233";
const WA_LINK = "https://wa.me/6281190012233";

const HERO_THREAD: ChatMessage[] = [
  {
    from: "customer",
    time: "09:12",
    text: "Halo, aku cari foundation untuk kulit kering.",
  },
  {
    from: "arma",
    time: "09:12",
    text: "Halo Kak! Real Flawless Foundation dari Sisley hasilnya dewy dan tahan seharian, cocok untuk kulit kering. Mau aku siapkan pesanannya?",
  },
  { from: "customer", time: "09:13", text: "Mau, satu ya." },
  {
    from: "arma",
    time: "09:13",
    link: {
      title: "Pembayaran pesanan AA-2611",
      note: "Berlaku 24 jam. Bisa QRIS, transfer bank, atau kartu.",
      host: "checkout.xendit.co",
      url: "checkout.xendit.co/od/aroma-abadi",
    },
  },
];

const ORDER_THREAD: ChatMessage[] = [
  {
    from: "arma",
    time: "09:13",
    order: {
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
    },
  },
];

const OPENING_THREAD: ChatMessage[] = [
  { from: "customer", time: "09:11", text: "Halo, masih buka?" },
  {
    from: "arma",
    time: "09:11",
    text: "Halo Kak, masih! Aku Arma dari Aroma Abadi. Ada yang bisa aku bantu cari hari ini?",
  },
];

const RECEIPT_THREAD: ChatMessage[] = [
  {
    from: "arma",
    time: "09:16",
    receipt: {
      title: "Pembayaran diterima",
      rows: [
        { label: "Invoice", value: "AA-2611" },
        { label: "Metode", value: "QRIS" },
        { label: "Dibayar", value: "Rp 2.714.310" },
      ],
      note: "Poin loyalitas sudah masuk ke akun Kakak. Nomor resi aku kirim di chat ini begitu paket diserahkan ke kurir.",
    },
  },
];

const NAV = [
  { href: "#profil", label: "Profil Bisnis" },
  { href: "#program", label: "Program Loyalitas" },
  { href: "#alur", label: "Alur Transaksi" },
  { href: "#pembayaran", label: "Pembayaran" },
  { href: "#kebijakan", label: "Kebijakan" },
  { href: "#kontak", label: "Kontak" },
];

const HERO_FACTS = [
  { label: "Badan hukum", value: "PT Aroma Abadi" },
  { label: "Bidang usaha", value: "Distribusi produk kecantikan" },
  { label: "Kanal transaksi", value: "WhatsApp (ARMA)" },
  { label: "Payment gateway", value: "Xendit" },
];

const BRANDS = [
  { src: brandSisley, name: "Sisley Paris" },
  { src: brandLaura, name: "Laura Mercier" },
  { src: brandDG, name: "Dolce & Gabbana Beauty" },
  { src: brandBareMinerals, name: "bareMinerals" },
  { src: brandRimmel, name: "Rimmel London" },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PT Aroma Abadi — Distribusi produk kecantikan & program loyalitas WhatsApp" },
      {
        name: "description",
        content:
          "PT Aroma Abadi mendistribusikan produk kecantikan premium di Indonesia dan menjalankan program CRM serta loyalitas lewat WhatsApp. Halaman ini menjelaskan profil bisnis, mekanisme program, dan alur transaksi pelanggan termasuk titik pembayaran melalui Xendit.",
      },
      { property: "og:title", content: "PT Aroma Abadi" },
      {
        property: "og:description",
        content:
          "Profil bisnis, mekanisme program loyalitas WhatsApp, dan alur transaksi pelanggan dari percakapan sampai pembayaran melalui Xendit.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-aroma-abadi.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PT Aroma Abadi" },
      {
        name: "twitter:description",
        content:
          "Profil bisnis, mekanisme program loyalitas WhatsApp, dan alur transaksi pelanggan dari percakapan sampai pembayaran melalui Xendit.",
      },
      { name: "twitter:image", content: "/og-aroma-abadi.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap",
      },
    ],
  }),
  component: CompanyPage,
});

function CompanyPage() {
  return (
    <main className="bg-[#FBF7F0]">
      {/* ── Masthead ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[#FBF7F0]/10 bg-[#2A0D12]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[62px] w-full max-w-[1180px] items-center gap-6 px-6 md:px-10">
          <a href="#top" className="shrink-0 rounded-sm" aria-label="PT Aroma Abadi, ke atas halaman">
            <img src={logo} alt="Aroma Abadi" className="h-[21px] w-auto" />
          </a>
          <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[14px] text-[#E8DCCB]/70 transition-colors hover:text-[#FBF7F0]"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noreferrer noopener"
            className="press ml-auto inline-flex items-center gap-2 rounded-full bg-[#D9B892] px-4 py-[9px] text-[14px] font-medium text-[#2A0D12] transition-colors hover:bg-[#E6CBA9] lg:ml-0"
          >
            <MessageCircle className="h-[16px] w-[16px]" strokeWidth={2} />
            Chat dengan ARMA
          </a>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section id="top" className="bg-[#2A0D12]">
        <div className="mx-auto grid w-full max-w-[1180px] gap-14 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-20">
          <div>
            <h1 className="lp-display max-w-[16ch] text-[clamp(2.2rem,1.3rem+3.2vw,3.9rem)] leading-[1.06] text-[#FBF7F0]">
              Pelanggan kami memesan dan membayar di dalam satu percakapan WhatsApp.
            </h1>
            <p className="mt-6 max-w-[60ch] text-[17px] leading-[1.68] text-[#E8DCCB]/85">
              PT Aroma Abadi mendistribusikan produk kecantikan premium di Indonesia. Program CRM
              dan loyalitas kami berjalan di WhatsApp lewat ARMA, asisten resmi Aroma Abadi, dan
              setiap pembayaran pelanggan diproses melalui Xendit.
            </p>
            <p className="mt-4 max-w-[60ch] text-[15px] leading-[1.6] text-[#D9B892]">
              Halaman ini menjelaskan badan usaha kami, cara program berjalan, dan alur transaksi
              pelanggan dari sapaan pertama sampai pesanan dikirim.
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] bg-[#FBF7F0]/12 sm:grid-cols-4">
              {HERO_FACTS.map((fact) => (
                <div key={fact.label} className="bg-[#2A0D12] px-4 py-4">
                  <dt className="text-[13px] leading-tight text-[#D9B892]">{fact.label}</dt>
                  <dd className="mt-[6px] text-[15px] font-medium leading-snug text-[#FBF7F0]">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <figure className="m-0 w-full max-w-[340px] justify-self-center lg:justify-self-end">
            <ChatScreen messages={HERO_THREAD} animate />
            <figcaption className="mt-4 text-[13px] leading-[1.55] text-[#D9B892]">
              Percakapan pelanggan dengan ARMA, sampai tautan pembayaran Xendit dikirim.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── Profil bisnis ────────────────────────────────────────────── */}
      <Section id="profil">
        <Split
          title="Profil bisnis"
          lede="Badan usaha terdaftar yang mendistribusikan produk kecantikan bermerek di Indonesia."
        >
          <Prose>
            <p>
              PT Aroma Abadi adalah distributor produk kecantikan premium di Indonesia. Kami membawa
              brand internasional ke pasar Indonesia dan memasarkannya lewat jaringan gerai retail
              serta tim Beauty Advisor di kota-kota besar.
            </p>
            <p>
              Sejak program CRM kami berjalan, pelanggan juga bisa memesan langsung lewat WhatsApp.
              Pesanan ditangani ARMA, asisten resmi kami, lalu diproses dan dikirim dari gudang
              kami. Seluruh produk yang kami jual berasal dari principal resmi dan memiliki nomor
              izin edar BPOM.
            </p>
          </Prose>

          <div className="mt-10">
            <Facts
              items={[
                { label: "Nama badan hukum", value: "PT Aroma Abadi" },
                {
                  label: "Bidang usaha",
                  value: "Perdagangan besar dan eceran produk kecantikan",
                },
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
          </div>

          <div className="mt-12">
            <p className="text-[13px] text-[#8A7A6D]">Brand yang kami distribusikan</p>
            <ul className="mt-4 flex flex-wrap items-center gap-x-10 gap-y-6">
              {BRANDS.map((brand) => (
                <li key={brand.name}>
                  <img
                    src={brand.src}
                    alt={brand.name}
                    className="lp-brandmark h-[52px] w-auto opacity-80"
                  />
                </li>
              ))}
            </ul>
          </div>
        </Split>
      </Section>

      {/* ── Program loyalitas ────────────────────────────────────────── */}
      <Section id="program" className="border-t border-[#3A2F2B]/10">
        <Split
          title="Mekanisme CRM dan program loyalitas"
          lede="Satu nomor WhatsApp untuk konsultasi, pemesanan, poin, dan promo."
        >
          <Prose>
            <p>
              ARMA adalah asisten WhatsApp resmi Aroma Abadi. Pelanggan menyimpan satu nomor, dan
              dari percakapan itu mereka bisa bertanya soal produk, memesan, membayar, dan mengecek
              status pesanan. Tidak ada aplikasi lain yang perlu dipasang.
            </p>
          </Prose>

          <div className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
            <Block title="Konsultasi dan rekomendasi produk">
              ARMA menjawab pertanyaan soal jenis kulit, pilihan shade, dan cara pemakaian, lalu
              merekomendasikan produk yang stoknya tersedia. Pelanggan yang butuh bantuan manusia
              dialihkan ke tim kami di percakapan yang sama.
            </Block>
            <Block title="Poin dan tingkat keanggotaan">
              Setiap pesanan yang berhasil dibayar menambah poin pelanggan. Poin menentukan tingkat
              keanggotaan: Prestige, Atelier, Legacy, Élite, dan Icon. Tiap tingkat membuka benefit
              yang berbeda, seperti potongan harga dan akses lebih awal ke produk baru.
            </Block>
            <Block title="Kode promo">
              Ada dua jenis kode: kode unik yang hanya berlaku untuk satu pelanggan, dan kode
              bersama dengan batas jumlah pemakaian. Kode dipakai saat pesanan dibuat, dan
              potongannya terlihat di rincian sebelum pelanggan membayar.
            </Block>
            <Block title="Kabar program dan pengingat">
              Pelanggan yang setuju menerima pesan dari kami mendapat kabar promo dan pengingat
              pesanan. Setiap pesan punya cara berhenti, dan pelanggan yang berhenti tidak kami
              kirimi lagi.
            </Block>
          </div>

          <div className="mt-10 rounded-[10px] border border-[#3A2F2B]/12 bg-[#F3EDE3] p-6">
            <h3 className="text-[16px] font-semibold text-[#3A2F2B]">
              Jalur terpisah untuk tim Beauty Advisor
            </h3>
            <p className="mt-2 max-w-[62ch] text-[15px] leading-[1.62] text-[#50443D]">
              Beauty Advisor kami memakai ARMA versi internal untuk product knowledge, materi
              pelatihan, dan SOP layanan. Jalur itu hanya untuk karyawan dan mitra gerai, tidak
              melayani pelanggan, dan tidak memproses pembayaran apa pun.
            </p>
          </div>
        </Split>
      </Section>

      {/* ── Alur transaksi ───────────────────────────────────────────── */}
      <Section id="alur" tone="dark">
        <div className="max-w-[46ch]">
          <h2 className="lp-display text-[clamp(1.75rem,1.1rem+1.8vw,2.6rem)] leading-[1.1] text-[#FBF7F0]">
            Alur transaksi pelanggan
          </h2>
          <p className="mt-4 text-[16px] leading-[1.65] text-[#E8DCCB]/80">
            Enam langkah, dari sapaan pertama sampai paket dikirim. Langkah keempat adalah titik
            pembayaran: di sanalah pelanggan membuka halaman Xendit.
          </p>
        </div>

        <div className="mt-14">
          <Step
            n={1}
            title="Pelanggan membuka percakapan"
            body="Pelanggan menghubungi nomor WhatsApp resmi Aroma Abadi, atau membalas pesan program yang sebelumnya mereka setujui. Dari sini seluruh transaksi berlangsung di satu thread."
            screen={<ChatScreen messages={OPENING_THREAD} />}
            caption="Percakapan dibuka di WhatsApp."
          />
          <Step
            n={2}
            title="Konsultasi dan pemilihan produk"
            body="ARMA merekomendasikan produk sesuai kebutuhan pelanggan, lalu mencatat produk, jumlah, dan alamat pengiriman. Pelanggan bisa memakai kode promo yang mereka terima di tahap ini."
          />
          <Step
            n={3}
            title="Rincian pesanan dikirim"
            body="Sebelum ada uang yang berpindah, ARMA mengirim rincian lengkap: produk dan jumlahnya, subtotal, potongan kode promo, PPN, biaya layanan sesuai metode pembayaran, dan total akhir."
            screen={<ChatScreen messages={ORDER_THREAD} />}
            caption="Rincian yang dilihat pelanggan sebelum membayar."
          />
          <Step
            n={4}
            highlight
            title="Pembayaran melalui Xendit"
            body="Dari rincian itu ARMA mengirim satu tautan pembayaran yang dibuat lewat Xendit. Tautan membuka halaman pembayaran Xendit, tempat pelanggan memilih metode dan menyelesaikan transaksi. Seluruh data pembayaran dimasukkan di halaman Xendit, bukan di WhatsApp, dan tidak pernah melewati sistem kami."
            points={[
              {
                label: "Tautan pembayaran",
                value: "Dibuat lewat Xendit untuk tiap pesanan, berlaku 24 jam",
              },
              {
                label: "Metode tersedia",
                value: "QRIS, Virtual Account, kartu kredit dan debit",
              },
              {
                label: "Yang kami terima",
                value: "Status pembayaran dan nomor invoice, tanpa data kartu",
              },
            ]}
            screen={
              <CheckoutScreen
                invoice="Invoice AA-2611"
                amount="Rp 2.714.310"
                methods={[
                  { id: "qris", name: "QRIS", note: "Scan dari aplikasi bank atau e-wallet" },
                  { id: "va", name: "Virtual Account", note: "Transfer dari bank mana saja" },
                  { id: "card", name: "Kartu kredit atau debit", note: "Visa, Mastercard, JCB" },
                ]}
              />
            }
            caption="Halaman pembayaran Xendit yang dibuka dari tautan tadi."
          />
          <Step
            n={5}
            title="Konfirmasi otomatis"
            body="Xendit memberi tahu sistem kami begitu pembayaran berhasil. ARMA langsung mengirim konfirmasi dan nomor invoice ke pelanggan, dan poin loyalitas masuk ke akun mereka pada saat yang sama."
            screen={<ChatScreen messages={RECEIPT_THREAD} />}
            caption="Konfirmasi kembali ke percakapan yang sama."
          />
          <Step
            n={6}
            last
            title="Pemrosesan dan pengiriman"
            body="Pesanan yang sudah dibayar diteruskan ke gudang kami. Nomor resi dikirim ke percakapan yang sama, dan pelanggan bisa menanyakan status pesanan kapan saja ke ARMA."
          />
        </div>
      </Section>

      {/* ── Pembayaran ───────────────────────────────────────────────── */}
      <Section id="pembayaran">
        <Split
          title="Metode pembayaran dan keamanan"
          lede="Semua pembayaran pelanggan berjalan di atas Xendit, dalam Rupiah."
        >
          <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
            <Block title="QRIS">
              Pelanggan memindai kode dari aplikasi bank atau e-wallet mereka. Ini metode yang
              paling sering dipakai pelanggan kami.
            </Block>
            <Block title="Virtual Account">
              Nomor transfer khusus per pesanan, bisa dibayar dari bank mana saja, dan tercatat
              otomatis begitu dana masuk.
            </Block>
            <Block title="Kartu kredit">
              Diproses di halaman Xendit dengan autentikasi 3D Secure dari bank penerbit kartu.
            </Block>
            <Block title="Kartu debit">
              Untuk kartu debit berlogo jaringan internasional, lewat halaman pembayaran yang sama.
            </Block>
          </div>

          <div className="mt-12">
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
                  value: "Subtotal, potongan, PPN, dan biaya layanan tampil sebelum pelanggan membayar",
                },
                { label: "Mata uang", value: "Rupiah (IDR)" },
                {
                  label: "Pengembalian dana",
                  value: "Diproses lewat Xendit ke metode pembayaran asal",
                },
              ]}
            />
          </div>
        </Split>
      </Section>

      {/* ── Kebijakan ────────────────────────────────────────────────── */}
      <Section id="kebijakan" className="border-t border-[#3A2F2B]/10">
        <Split
          title="Kebijakan pelanggan"
          lede="Aturan yang berlaku untuk setiap pesanan lewat WhatsApp."
        >
          <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
            <Block title="Pengiriman">
              Pesanan yang sudah dibayar diproses pada hari kerja berikutnya dan dikirim ke seluruh
              Indonesia lewat kurir rekanan. Nomor resi dikirim lewat WhatsApp begitu paket
              diserahkan ke kurir.
            </Block>
            <Block title="Pengembalian dan penukaran">
              Permintaan diajukan lewat WhatsApp maksimal 7 hari setelah paket diterima, dengan
              nomor invoice dan foto produk. Produk yang masih tersegel dapat dikembalikan dengan
              pengembalian dana penuh; produk yang sudah dibuka dapat ditukar atau diganti dengan
              kredit belanja.
            </Block>
            <Block title="Pembatalan">
              Pesanan yang belum dibayar batal sendiri ketika tautan pembayaran kedaluwarsa.
              Pesanan yang sudah dibayar tetapi belum dikirim bisa dibatalkan lewat WhatsApp, dan
              dananya dikembalikan penuh melalui Xendit ke metode pembayaran asal.
            </Block>
            <Block title="Privasi data">
              Kami menyimpan nomor WhatsApp, nama, alamat pengiriman, dan riwayat pesanan untuk
              memproses transaksi dan menjalankan program loyalitas. Data tidak dijual atau
              dibagikan di luar kebutuhan pengiriman dan pembayaran. Pelanggan bisa meminta datanya
              dihapus lewat kontak resmi di bawah.
            </Block>
          </div>
        </Split>
      </Section>

      {/* ── Kontak ───────────────────────────────────────────────────── */}
      <Section id="kontak" tone="dark">
        <Split
          tone="dark"
          title="Kontak resmi"
          lede="Saluran resmi PT Aroma Abadi untuk pelanggan dan mitra."
        >
          <Facts
            tone="dark"
            items={[
              {
                label: "WhatsApp pelanggan",
                value: (
                  <a
                    href={WA_LINK}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline decoration-[#D9B892]/50 underline-offset-4 transition-colors hover:text-[#D9B892]"
                  >
                    {WA_NUMBER}
                  </a>
                ),
              },
              { label: "Jam layanan", value: <Pending field="jam operasional" tone="dark" /> },
              { label: "Email resmi", value: <Pending field="alamat email" tone="dark" /> },
              { label: "Telepon kantor", value: <Pending field="nomor telepon" tone="dark" /> },
              {
                label: "Alamat kantor",
                value: (
                  <>
                    <Pending field="alamat lengkap" tone="dark" />, Jakarta Selatan, DKI Jakarta
                  </>
                ),
              },
            ]}
          />

          <a
            href={WA_LINK}
            target="_blank"
            rel="noreferrer noopener"
            className="press mt-8 inline-flex items-center gap-2 rounded-full bg-[#D9B892] px-5 py-[11px] text-[15px] font-medium text-[#2A0D12] transition-colors hover:bg-[#E6CBA9]"
          >
            <MessageCircle className="h-[17px] w-[17px]" strokeWidth={2} />
            Chat dengan ARMA
          </a>
        </Split>
      </Section>

      <footer className="bg-[#2A0D12] pb-12">
        <div className="mx-auto w-full max-w-[1180px] border-t border-[#FBF7F0]/12 px-6 pt-8 md:px-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Aroma Abadi" className="h-[19px] w-auto" />
              <p className="text-[13px] text-[#E8DCCB]/60">
                © {new Date().getFullYear()} PT Aroma Abadi
              </p>
            </div>
            <Link
              to="/auth"
              className="text-[13px] text-[#E8DCCB]/60 underline decoration-[#E8DCCB]/25 underline-offset-4 transition-colors hover:text-[#D9B892]"
            >
              Portal mitra
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
