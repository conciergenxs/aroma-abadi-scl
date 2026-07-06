# Aroma Abadi SCL — Catatan Pengembangan Produk

> Dokumen ini merangkum catatan fitur dan perubahan UI yang dibutuhkan. Urutan bawah lebih akurat dan menimpa catatan di atasnya jika ada konflik.
> Last updated: 6 Juli 2026

---

## 1. Halaman Contacts

### 1.1 Layout & Sidebar
- **Contact Lists → Brands**: Sidebar "Contact Lists" diganti menjadi daftar **Brands** (seperti sekarang sudah ada). Label tetap dipertahankan. **Kolom Owner dihapus** dari tabel kontak.
- **Search bar di sebelah notifikasi**: Hapus search bar yang ada di header/notification bar (top-right area).

### 1.2 All Contacts & Customer Contacts (Mine)
- Tambahkan kolom **Brands** di Customer Contacts — bisa berisi lebih dari satu brand per kontak (multi-brand).
- Tambahkan kolom **Last Transaction** di Customer Contacts — menampilkan tanggal/invoice transaksi terakhir kontak tersebut.

### 1.3 BA Contact — Detail Page
**Kondisi saat ini:** Ada dropdown lifecycle stage di bawah nama, lalu tab chips (Activity Log, Transactions, Media).

**Yang diubah:**
- **Hapus dropdown** lifecycle stage di bawah nama BA.
- **Ganti dengan:**
  - **Brand Chips** (multi-pilih): BA bisa diassign ke lebih dari satu brand. Chip brand ini langsung tampil di halaman detail, bisa diklik untuk edit assignment brand.
  - **Tombol "See Inbox"** di sebelah chips brand → mengarahkan ke Inbox dan langsung membuka percakapan BA tersebut dengan Arma.
- **Hapus tab chips** Activity Log, Transactions, & Media → **langsung tampilkan Activity Log** tanpa perlu klik tab apapun (always visible).
- **Panel kanan (Contact Details):** Tidak ada perubahan untuk saat ini — biarkan seperti adanya.

### 1.4 Customer Contact — Detail Page
- Field dan layout halaman detail Customer Contact akan didefinisikan oleh Wicak (termasuk isi panel kanan).
- Saat ini: belum ada perubahan, pending keputusan Wicak.

### 1.5 New Contact Form
- Saat membuka form **New Contact**, tampilkan pilihan terlebih dahulu:
  - **BA (Beauty Ambassador)**
  - **Customer**
- Setelah memilih, form yang muncul **mengikuti persis kolom yang ada di tabel halaman Contacts** untuk masing-masing tipe:

#### Form BA
Kolom sesuai tabel BA Contacts:
| Field | Tipe Input |
|---|---|
| Nama | Text |
| WA Number | Text (format +62) |
| Gender | Select (Wanita / Pria / Lainnya) |
| Brand | Multi-select (pilih ≥1 brand) |
| Posisi | Select (BA / Senior BA / Supervisor) |
| Store | Searchable select (dikaitkan dengan Kota) |
| Kota | Searchable select |

#### Form Customer
Kolom sesuai tabel Customer Contacts:
| Field | Tipe Input |
|---|---|
| Nama | Text |
| WA Number | Text (format +62) |
| Gender | Select (Wanita / Pria / Lainnya) |
| Contact Type | Auto-filled: "Consumer" (read-only) |
| Point Balance | Number (opsional, default 0) |
| Brands | Multi-select — brand produk yang relevan untuk kontak ini |

> Field tambahan lainnya untuk Customer akan didefinisikan oleh Wicak.

---

## 2. Halaman Inbox

### 2.1 Left Panel
- Tambahkan kembali **daftar/list** di panel kiri Inbox seperti tampilan sebelumnya.
  - Berisi navigation tambahan (stage, label, atau filter lainnya) di samping view All / Consumer / BA Inbox yang sudah ada.

---

## 3. Halaman Transactions

### 3.1 Hapus Payment Method "Cash"
- Hapus opsi **Cash** dari pilihan metode bayar. Hanya sisakan payment method non-cash (transfer, kartu, dll).

### 3.2 Kolom Customer & BA
- Tinjau ulang tampilan kolom Customer dan BA di tabel transaksi — apakah perlu digabung, disederhanakan, atau dihapus salah satunya. *(Perlu klarifikasi lebih lanjut.)*

---

## 4. Halaman Templates

### 4.1 Channel
- Channel yang tersedia hanya **Arma** (bukan WhatsApp langsung). Template digunakan untuk kebutuhan broadcast **manual** (tidak otomatis/triggered).
- Cek apakah kolom **Category** secara default sudah berisi kategori WhatsApp atau tidak — sesuaikan jika perlu.

### 4.2 Kolom Baru: Promotional Code
Tambahkan kolom **Promotional Code** di halaman Templates (tabel dan form tambah/edit template). Jenisnya ada dua:

#### One-to-One
- Setiap kontak mendapat kode unik yang berbeda.
- Muncul **field upload file `.csv`** berisi daftar kode promo.
- Setelah upload, tampilkan info: _"This code is eligible for [n] customers"_ (n = jumlah baris di file CSV).
- Saat digunakan di Broadcast:
  - Jika jumlah kontak terpilih **≠ jumlah kode di CSV** → tombol kirim **di-disable**.
  - Tampilkan alert: _"Kode kurang/lebih [x] dari jumlah kontak yang dipilih."_
  - Hanya bisa 1 kode dikirim ke 1 kontak (1-to-1), tidak boleh kode yang sama terkirim ke lebih dari satu kontak.

#### One-to-Many
- Satu kode promo yang sama dikirim ke banyak kontak.
- Muncul **field input angka** untuk menentukan jumlah maksimal penggunaan kode tersebut.

#### Field di Form Template
- **Nama Promo** (text input)
- **Voucher Code** (text input atau select2 — tanyakan ke tech apakah bisa searchable select untuk pilih promo yang sudah ada di sistem)

---

## 5. Halaman Broadcasts

### 5.1 Filter Audience
- Saat memilih **Choose Audience**, tambahkan filter berdasarkan:
  - **Nama** kontak
  - **Channels**
  - **Brands** (kontak yang diassign ke brand tertentu)
- Tambahkan filter pemisah antara **Customer** dan **BA** di halaman Broadcasts.

### 5.2 Detail Broadcast — Kolom Promo Code
- Di halaman detail broadcast (setelah broadcast dikirim), tambahkan kolom:
  - **Kode terkirim atau belum** (status per kontak)
  - **Kode apa yang terkirim** (value kode promo per kontak, khusus tipe one-to-one)

---

## 6. Halaman Baru: Promo Code

Buat halaman standalone **Promo Code** yang bisa diakses dari sidebar.

### 6.1 Fungsi Utama
- Daftar semua promo code yang tersedia (data diambil dari **Odoo**).
- Bisa di-attach ke **Template** maupun **Broadcast**.

### 6.2 Data per Promo
| Field | Keterangan |
|---|---|
| Nama Promo | Nama campaign/promo |
| Voucher Code / Rules | Aturan penggunaan kode |
| Active Duration | Periode berlakunya promo |
| Sumber Data | Odoo (read-only, sync) |

### 6.3 Tracking
- **Berapa kali kode digunakan** (usage count)
- **Di Template mana** kode ini pernah dipakai
- **Di Broadcast mana** kode ini pernah dipakai
- Status per kode: aktif / expired / habis kuota

---

## 7. Ringkasan Prioritas (Estimasi)

| # | Fitur | Halaman | Kompleksitas |
|---|---|---|---|
| 1 | New Contact: pilih tipe BA / Customer dulu | Contacts | Sedang |
| 2 | BA Detail: brand chips + See Inbox button + hapus tabs | Contact Detail | Sedang |
| 3 | Tambah kolom Last Transaction di Customer Contacts | Contacts | Rendah |
| 4 | Tambah kolom Brands di Customer Contacts | Contacts | Rendah |
| 5 | Hapus search bar di notifikasi | Global | Rendah |
| 6 | Inbox: tambah list di panel kiri | Inbox | Sedang |
| 7 | Hapus Cash dari payment method | Transactions | Rendah |
| 8 | Template: Promotional Code column (one-to-one & one-to-many) | Templates | Tinggi |
| 9 | Broadcast: filter Customer/BA + Choose Audience by Brand | Broadcasts | Sedang |
| 10 | Broadcast Detail: kolom status & nilai kode terkirim | Broadcasts | Sedang |
| 11 | Halaman baru: Promo Code (sync Odoo + tracking) | New Page | Tinggi |
| 12 | Customer Contact Detail: field & layout (pending Wicak) | Contact Detail | TBD |

---

## 8. Notifikasi (Bell Icon — Header)

**Kondisi saat ini:** Ikon lonceng di header hanya tampil statis dengan dot merah, belum bisa diklik dan tidak menampilkan isi apapun.

**Yang diubah:**
- Ikon lonceng **bisa diklik** dan memunculkan **dropdown/popover** berisi daftar notifikasi.
- Setiap notifikasi memiliki:
  - **Ikon tipe** (pesan baru, transaksi, broadcast selesai, dll)
  - **Judul singkat** (contoh: "Pesan baru dari Dewi Lestari")
  - **Deskripsi** / preview konten notifikasi
  - **Waktu** (contoh: "2 menit lalu")
  - **Status baca** (unread = highlight/bold, read = normal)
- Dot merah di ikon menghilang setelah semua notifikasi dibaca (atau klik "Mark all as read").
- Notifikasi bisa di-klik untuk navigasi ke halaman/konten terkait (misal: klik notif pesan baru → buka Inbox kontak tersebut).

**Catatan tambahan:** Search bar yang ada di sebelah notifikasi (di header) **dihapus** (lihat poin 1.1).

---

## 10. Pending / Perlu Klarifikasi

- **Customer Contact detail page**: Semua field dan layout panel kanan pending keputusan Wicak.
- **Kolom Customer & BA di Transactions**: Apakah dihapus, disederhanakan, atau digabung?
- **Brands di Contacts**: Apakah kolom "Brands" di Customer Contact mengacu ke brand produk yang pernah dibeli, atau brand pilihan kontak?
- **Voucher Code di Template**: Apakah bisa pakai select2 searchable (tanya ke tech)?
- **Brands page**: Catatan _"Di Brands, untuk contact custo..."_ tidak lengkap — perlu klarifikasi.
- **Channel di Template**: Konfirmasi apakah "Arma" adalah nama channel WA atau channel terpisah.
- **Contacts → Owner**: Konfirmasi kolom Owner dihapus dari view mana saja (semua view atau hanya tertentu?).
