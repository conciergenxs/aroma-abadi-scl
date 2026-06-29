## Plan: UI refinements across SCL/Aroma Abadi

### 1. Chip / badge contrast (Broadcast + Templates)
In `src/routes/broadcasts.index.tsx` and `src/routes/templates.index.tsx`, replace the light-on-light status/category chips:
- `bg-{color}-500/10 text-{color}-300` → `bg-{color}-600 text-white border-{color}-700` (bolder, white text on saturated background).
- Apply to: Sent/Scheduled/Draft (broadcasts), Approved/Pending/Rejected, Marketing/Utility/Service/Reminder (templates).

### 2. Inbox — never show "No messages yet"
In `src/routes/inbox.tsx` (line ~881) and `src/components/scl/mock-data.ts`:
- Extend `threadsByContact` with a default fallback: when a contact has no thread, synthesize a small mock thread (2–4 messages based on the conversation's `preview` + a greeting) so every selected conversation renders messages.
- Implement as a helper `getThread(contactId, conversation)` in inbox.tsx that returns the existing thread or a generated stub. Replace the empty-state check with this helper.

### 3. SKU & Knowledge page (`src/routes/sku.tsx`)
- Page subtitle: change to an informative sentence, e.g. *"Kelola hierarki produk dari brand, kategori, SKU, hingga knowledge card untuk seluruh tim Aroma Abadi."*
- Brands section description: replace the "Maksimal 12 brand…" line with *"Kumpulan brand yang dikelola Aroma Abadi. Klik brand untuk melihat kategori dan SKU."*
- Add pagination to Brands overview:
  - Page size = 12 (3 × 4).
  - State `page` in `BrandsOverview`.
  - Footer row: `"Menampilkan X–Y dari N brand"` + Prev/Next buttons (reuse local pagination markup with chevron icons).
- Brand cards: enlarge logo container `h-24` → `h-36`, image cap `max-h-16` → `max-h-24`, and adjust grid gap for breathing room.
- Brand-detail header logo: `h-16 w-16` → `h-20 w-20`, inner cap `max-h-12` → `max-h-16`.

### 4. Global description font size = 14px
Audit and bump subtitle/description text from `text-xs` to `text-sm` where they serve as page descriptions:
- `src/components/scl/app-shell.tsx` header subtitle (`text-xs text-muted-foreground` → `text-sm`).
- `SectionCard` description (`text-xs` → `text-sm`).
- Page-specific descriptive lines in `src/routes/transactions.tsx` and `src/routes/ba.tsx` (any remaining `text-xs` used for explanatory copy under titles/counts).
Leave column-header/uppercase labels and timestamps unchanged.

### 5. BA form (`src/routes/ba.tsx` → `BAForm`)
Reorganize the form so it ends with Position + Brand on the same row:
- Row 1: Nama Lengkap (full width or paired with WA — see row 2).
- Row 2: **Gender + No. WhatsApp** on one row (`grid-cols-2`).
- Row 3: Username.
- Row 4: Password (generated) — make the input `readOnly`, add **Copy** button next to **Generate** (Copy icon + `navigator.clipboard.writeText` + toast).
- Row 5: Kota + Store.
- Row 6: **Posisi + Brand** on one row (move Brand from top to bottom-right).

### 6. Sidebar expand/collapse affordance (`src/components/scl/app-shell.tsx`)
- Always show a dedicated expand/collapse toggle button at the top of the sidebar (next to logo) using `ChevronsRight`/`ChevronsLeft`, in addition to the existing one at the bottom. This makes the expand action visible without scanning.
- When collapsed, the icon-only sidebar already shows hover tooltips with menu titles — keep those; the new top toggle just makes expanding obvious.

### 7. Navbar search font size
In `src/components/scl/app-shell.tsx` header search input: it already uses `text-sm` (14px). Verify and ensure placeholder also renders at 14px (`placeholder:text-sm`). No additional change needed beyond confirming `text-sm` on the input.

### Out of scope
No data model, routing, or business-logic changes. Mock-data thread fallback is a presentational helper, not a store change.
