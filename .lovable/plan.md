# Aroma Abadi Overhaul Plan

Big consolidated plan covering: WhatsApp-only rebrand, Aroma Abadi (kosmetik & kecantikan) context, Transaction Records page, BA login via WhatsApp number, and SKU knowledge module.

## 1. WhatsApp-only + Aroma Abadi context (all pages)

Remove every Instagram and TikTok mention/asset/option from the app. WhatsApp jadi satu-satunya channel.

- `src/components/scl/mock-data.ts`
  - `Channel` type → `"whatsapp"` saja.
  - Hapus semua kontak/conversation/template/broadcast yang `channel: "instagram"`; sisanya jadi WhatsApp.
  - `connectedChannels`: keep `wa-main` & `wa-eu` saja (di-rename ke konteks Aroma Abadi, mis. "Aroma Abadi HQ", "Aroma Abadi Bandung").
  - Rewrite copy preview/body/template/broadcast/recent activity ke konteks makeup & beauty (mis. "Lipstick Velvet Rouge restock", "BA Tunjungan Plaza", "Promo Ramadhan Glow Set"), nama Indonesia.
- `src/components/scl/channel-badge.tsx`: hapus mapping `instagram`, simplifikasi tipe.
- `src/components/scl/app-shell.tsx`: `ChannelDot` jadi WA-only.
- `src/routes/channels.tsx`, `broadcasts.*`, `templates.*`, `contacts*`, `inbox.tsx`, `index.tsx`, `auth.tsx`: hapus pilihan/icon/filter IG, hapus tab/segment IG, semua label copy diganti ke Aroma Abadi (brand makeup & kecantikan). Dashboard charts & metrics jadi WA-only (hapus seri Instagram).
- `templates.tsx` channel selector & badges: WA-only.
- Ganti judul tab/meta head di tiap route ke "Aroma Abadi — …".

## 2. Transaction Records page (baru)

Halaman baru `/transactions` (`src/routes/transactions.tsx`) dengan sidebar entry baru (icon `Receipt`).

Konten:
- Header: filter tanggal, brand, store/kota, BA, status pembayaran, search invoice.
- Tabel transaksi (mock data Aroma Abadi): kolom `Invoice`, `Tanggal`, `Customer` (link ke contact), `BA`, `Store`, `Brand`, `Items` (chips SKU + qty), `Total (IDR)`, `Metode Bayar`, `Status` (Paid / Pending / Refunded).
- Stat cards atas: total revenue hari ini, jumlah transaksi, AOV, top SKU.
- Row click → drawer detail transaksi (line items + catatan BA).
- Store baru `src/components/scl/transactions-store.ts` (Zustand) berisi mock 30–40 transaksi yang konsisten dgn contacts, BA, dan SKU.

## 3. Login Brand Ambassador via No. WA + password generated (mock)

Frontend-only, no backend.

- `src/components/scl/ba-store.ts` (baru, Zustand + persist `localStorage`): list BA dengan field:
  - `id`, `name`, `gender` (`"Wanita" | "Pria" | "Lainnya"`), `username`, `password` (auto-generated 10-char), `waNumber` (+62…), `brandIds[]`, `city`, `store`, `position` (`Supervisor | Senior BA | BA | Trainee` + free-text).
  - Actions: `addBA`, `updateBA`, `deleteBA`, `regeneratePassword`, `login(waNumber, password)`, `logout`, `currentBA`.
- `src/routes/auth.tsx`:
  - Tab "Admin" (existing) + tab baru "Brand Ambassador" → form No. WA + password.
  - Login BA set `currentBA` di store & redirect ke `/` (atau `/inbox`).
- Admin page "BA Management" `src/routes/ba.tsx` (sidebar entry, icon `BadgeCheck`):
  - Tabel BA + tombol "Add BA" (modal: semua field, password auto-generate dengan tombol regenerate + copy).
  - Setiap BA bisa di-attach ke 1+ Brand (multi-select dari SKU store).
- Catatan: belum ada role-gate nyata (frontend mock); cukup state lokal.

## 4. Modul SKU & Knowledge (Brand → Category → SKU → Knowledge Card)

Tambah entry sidebar "SKU" (icon `Package`) → route `/sku` dgn sub-routes.

Data store: `src/components/scl/sku-store.ts` (Zustand + persist) — semua mock di localStorage, attachment di-simpan sebagai object URL + nama file (no real upload).

Schema:
```
Brand { id, logoUrl, name, brandKnowledge: Attachment[], categories: Category[] }
Category { id, brandId, name, categoryKnowledge: Attachment[], skus: SKU[] }
SKU { id, categoryId, name, code, price, photoUrl, description, knowledgeCards: KnowledgeCard[] }
KnowledgeCard { id, skuId, coverUrl, title, text }
Attachment { id, fileName, fileType, size, url } // multi-file
```

Routes (file-based):
- `src/routes/sku.tsx` — layout `<Outlet/>`.
- `src/routes/sku.index.tsx` — list semua Brand (grid card: logo + nama + jumlah kategori/SKU) + tombol **Add New Brand**.
- `src/routes/sku.$brandId.tsx` — detail Brand: header (logo + nama, edit), section **Brand Knowledge** (multi-file uploader, list file dgn download/remove), section **Product Categories** (list + add).
- `src/routes/sku.$brandId.$categoryId.tsx` — detail Category: **Category Knowledge** (multi-file uploader) + grid SKU + tombol Add SKU.
- `src/routes/sku.$brandId.$categoryId.$skuId.tsx` — detail SKU: form (code, name, price, photo, description) + section **Knowledge Cards** (list card; tiap card: cover image, title, text; add/edit/delete).

UI pieces baru:
- `src/components/scl/multi-file-uploader.tsx` — drag-drop + click, list file (icon, nama, size, hapus). Untuk knowledge level Brand & Category.
- `src/components/scl/knowledge-card-editor.tsx` — modal add/edit knowledge card (upload cover, judul, textarea isi).
- `src/components/scl/brand-form-modal.tsx`, `category-form-modal.tsx`, `sku-form-modal.tsx`.

Seed: 2 brand contoh ("Aroma Abadi Glow", "Aroma Velvet"), masing-masing 2 kategori (Lip, Face), tiap kategori 2–3 SKU, 1–2 knowledge card per SKU.

## 5. Sidebar & navigation updates

Tambah ke `topNav` di `src/components/scl/app-shell.tsx`:
- `Inbox`, `Contacts`, `Broadcast`, `Templates`, `Channels`, **`SKU`** (`/sku`, icon `Package`), **`Transactions`** (`/transactions`, icon `Receipt`), **`Brand Ambassadors`** (`/ba`, icon `BadgeCheck`).
- Sesuaikan `NavItem.to` union.

## Technical notes

- Semua persistence pakai Zustand + `persist` middleware (`localStorage`). File attachments disimpan sebagai `URL.createObjectURL` + metadata; tidak diupload ke server.
- Tidak mengaktifkan Lovable Cloud (sesuai pilihan "Mock dulu").
- Hapus asset Instagram (`src/assets/instagram.png.asset.json`) jika sudah tidak direferensikan.
- Pastikan font tetap Inter, color tokens Aroma Abadi (existing).
- Tiap route baru kasih `head()` meta (title, description) sesuai Aroma Abadi.
- Setiap route dgn loader (kalau ada) wajib `errorComponent` + `notFoundComponent`.

## Out of scope

- Real auth/role enforcement.
- Real file storage / backend.
- Editing existing visual theme di luar yang dibutuhkan rebrand WA-only.
