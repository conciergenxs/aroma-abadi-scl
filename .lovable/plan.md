## 1. Reseed brand & SKU data (mockup)

Update `src/components/scl/sku-store.ts` `seed()` to ship 5 brands with covers, knowledge, and example items:

- **Dolce & Gabbana** — Lip · Caviar Hydra-Crème Lipstick 42g
- **Sisley** — Foundation · Real Flawless Foundation; Powder · Real Flawless Feather Matte Powder Foundation
- **Rimmel** — Powder · Translucent Loose Setting Powder; Spray · Translucent Hydrating Setting Spray Ultra-Blur
- **Laura Mercier** — Powder · Translucent Loose Setting Powder
- **BareMinerals** — Blush · Blush Color Infusion

Each brand: `logoUrl` (generated logo image), 1–2 pre-uploaded `brandKnowledge` PDF mock attachments (fake `url` + filename), 1–2 categories each with 1 pre-uploaded `categoryKnowledge` file, SKUs with `photoUrl` (generated product images) + 2 `knowledgeCards` each (cover image + title + text). Use IDR prices.

Bump `STORAGE_KEY` to `aroma_sku_store_v2` so existing local data is replaced. Also bump `aroma_tx_store_v2` and re-map transactions to the new brand/SKU names.

## 2. SKU page restructured into 3 levels

Rewrite `src/routes/sku.tsx` so it is no longer a 3-column split, but a drill-down driven by local state (`view: "brands" | "brand" | "category"`):

### Level 1 — Brands overview
- Grid: max 3 rows × 4 columns = 12 brand cards.
- Each card shows logo, brand name, `{categories.length} Categories`, `{totalSkus} SKUs`. Click → enter brand detail.
- "Add New Brand" button top-right.

### Level 2 — Brand detail (horizontal)
- Back button + brand header (logo, name).
- Two columns side-by-side:
  - Left: **Brand Knowledge** (MultiFileUploader, existing component).
  - Right: **Product Categories** — list/grid of category cards (name, SKU count, knowledge count). Click → enter category detail.

### Level 3 — Category detail (horizontal)
- Back button + breadcrumb (Brand › Category).
- Two columns:
  - Left: **Category Knowledge** (MultiFileUploader).
  - Right: **SKUs** list. Each SKU row shows photo, name, code, price. SKU **Knowledge Cards** become a shadcn `Accordion` per SKU (collapsed by default) that reveals knowledge card grid + Add Card button.

Reuse existing `BrandFormModal`, `SkuFormModal`, `KnowledgeCardForm`, and `MultiFileUploader`.

## 3. BA page & form

In `src/routes/ba.tsx`:
- Remove the "Adra" field (column + form input) and drop `adraName` references.
- Replace the brand chip-toggle with a real dropdown (shadcn `Select`, single-brand) and position it directly after the "Nama Lengkap" field, before the WhatsApp field. Store as `brandIds: [selected]` (keep array for type compatibility).
- Update placeholders: "Masukkan nama lengkap..", "Masukkan no. WhatsApp..", "Masukkan username..", etc.
- Use `text-sm` (14px) for inputs, labels, and table cell content for consistency.

In `src/components/scl/ba-store.ts`: keep `adraName` as deprecated optional (no UI), update seed BA records to reference the new brand IDs from step 1 and remove Adra values.

## 4. Transaction Records — items column vertical

In `src/routes/transactions.tsx`, change the `Items` table cell to render each line on its own row with format `[Item Name] · [XX pcs]`:

```
Real Flawless Foundation · 2 pcs
Caviar Hydra-Crème Lipstick 42g · 1 pcs
```

Allow the cell to wrap (remove `truncate` + `max-w`). Drawer item list keeps current detailed layout but uses the same `· XX pcs` wording.

## 5. Sidebar expandable + logo padding

Refactor `src/components/scl/app-shell.tsx` sidebar:
- Add local `expanded` state (default `false`); collapsed width stays `w-[68px]`, expanded becomes `w-56` with label text shown next to icons.
- Add a chevron toggle button at the top/bottom to expand/collapse; keep tooltips for the collapsed state.
- Logo container: add `py-[15px]` padding (top + bottom) and keep aspect ratio. When expanded, show full `aroma-abadi-logo-sand` wordmark; when collapsed, show the icon variant currently used.
- Nav items become `flex` rows with icon + label when expanded; only icon when collapsed.

## 6. Typography consistency (14px / text-sm)

Sweep these files to standardize body text to `text-sm` and form placeholders to "Masukkan ...":
- `src/routes/ba.tsx`, `src/routes/transactions.tsx`, `src/routes/sku.tsx`, `src/routes/contacts.tsx`, `src/routes/contacts.new.tsx`, `src/routes/templates.index.tsx`, `src/routes/templates.new.tsx`, `src/routes/broadcasts.index.tsx`, `src/routes/broadcasts.new.tsx`, `src/routes/channels.tsx`.

Rules:
- Form `<input>`/`<select>`/`<textarea>`: `text-sm` (14px), placeholders use the "Masukkan …" pattern in Indonesian where the existing copy is Indonesian (keep English screens English).
- Table body cells: bump from `text-xs` (12px) to `text-sm` (14px); keep small uppercase column headers as-is.
- Card body text and list item descriptions also `text-sm`.

## 7. Image assets needed

Generate via `imagegen` (fast tier) at small sizes and save under `src/assets/`:
- 5 brand logos (`brand-dolce-gabbana.png`, `brand-sisley.png`, `brand-rimmel.png`, `brand-laura-mercier.png`, `brand-baremineral.png`) — transparent PNG on white.
- 6 product photos for the SKUs above (JPG).
- 4–6 knowledge card cover photos (JPG, generic beauty editorial shots).

Import these via the asset JSON pattern already used (`*.png.asset.json`) and reference `.url` in seed data.

## Technical notes

- All store changes bump `STORAGE_KEY` versions so the existing localStorage state in the user's browser is reset to the new mockup.
- No backend changes; everything stays client-side in the existing stores.
- The "Adra" field is removed from UI but kept as optional in the `BA` type to avoid breaking serialized data already in localStorage.
- Accordion uses the existing `src/components/ui/accordion.tsx` shadcn primitive.

## Files touched

- `src/components/scl/sku-store.ts` (reseed + version bump)
- `src/components/scl/ba-store.ts` (reseed, brand IDs)
- `src/components/scl/transactions-store.ts` (reseed with new SKU/brand names + version bump)
- `src/routes/sku.tsx` (full rewrite — 3-level drill-down)
- `src/routes/ba.tsx` (remove Adra, brand dropdown, placeholders, text sizes)
- `src/routes/transactions.tsx` (items vertical column)
- `src/components/scl/app-shell.tsx` (expandable sidebar, logo padding)
- `src/routes/contacts.tsx`, `contacts.new.tsx`, `templates.index.tsx`, `templates.new.tsx`, `broadcasts.index.tsx`, `broadcasts.new.tsx`, `channels.tsx` (typography sweep)
- `src/assets/` (new generated brand logos + product/knowledge images + matching `.asset.json` entries)
