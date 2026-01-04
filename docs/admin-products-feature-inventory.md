## Legacy Admin Products Feature Inventory (reconstructed)

Source: `dev/slingshot/app/admin/products/page.tsx` + `TestTableClient.tsx` + supporting modal code.

### Products List page (catalog view)

- **Page layout**
  - Antd-based card layout titled “Products” with a filters card above and the product list card below.
  - Filters row includes: `Input.Search` for product name, `Select` for categories, `Select` for availability, `Select` for type. All dropdowns allow clearing. Search + filters sync to URL query params (`q`, `category`, `availability`, `type`).
  - Table card titled “Product list” with small pagination (page size 10).

- **Columns (left-to-right)**
  1. **Image** – Antd `Image` thumbnail (80×80) rendering first saved image, fallback blank block when none.
 2. **Name** – linked via `Typography.Link` to `/admin/products/[id]/edit`; text uses `title` or `name` or “Untitled”.
 3. **Type** – product_type or fallback.
 4. **Price** – derived from variants’ numeric price (min / max). Displays `€` values or `—`.
 5. **Variants** – number of variants (array length).
 6. **Available** – shows “In stock” when variants flagged available/stock, otherwise shows availability/status text.
 7. **Images** – count of images.
 8. **Tags** – renders tag pills for each tag string.
 9. **Status** – raw status string value.
 10. **Updated** – formatted `dd-mm-yy` from updated_at/created_at.
 11. **Actions** – two icon buttons: picture icon opens image modal, pencil icon navigates to edit page.

- **Interactions**
  - Clicking table row opens edit page (same as edit button link) while keeping URL query string.
  - Images button opens modal listing product images with reorder, delete, upload, aspect dropdown (Original/1:1/4:3/3:4/16:9/9:16).
  - Upload form posts to `/api/admin/products/images` via multipart form; reorder/delete/move send JSON requests to same endpoint.
  - Modal actions show success/error via `message`.
  - Pagination handled by Antd table.

### Edit product page (`/admin/products/[id]/edit`)

- **Layout**
  - Breadcrumb “Products / Edit Product”, Cancel and primary Save buttons.
  - Tabs: Info, Variants, CO Meta (placeholder).

- **Info tab fields** (top-to-bottom)
  1. Name/Title (Input) – also populates `name`.
  2. Handle (Input).
  3. Category (Select from categories list).
  4. Brand (disabled input showing “Brand is read-only…”).
  5. Product type (Searchable Select of existing product_type values).
  6. Tags (Select in tags mode, accepts comma-separated tokens).
  7. Status (Select with Active / Not Active).
  8. Description HTML (Quill editor 1).
  9. Description HTML 2 (Quill editor 2).
 10. Specs HTML (TextArea).
 11. Package includes (TextArea).
 12. SEO title (Input).
 13. SEO description (TextArea).

- **Variants tab**
  - Caption “Variants are read-only for now.”
  - Readonly Antd table listing title, SKU, Price, Compare at, Inventory, Status columns; no pagination.
  - Data comes from product_variants API fetch.

- **CO Meta tab**
  - Static info alert placeholder.

- **Save / cancel**
  - Save posts serialized `draft` to `/api/admin/products/update`.
  - Message toast for success/failure.
  - Cancel navigates back to `/admin/products` (keeping query string).

### Backend/APIs used

- `/api/admin/products` – returns products list with related images/variants from Supabase.
- `/api/admin/products/[id]` – returns single product with descriptions/specs/packages/images/variants.
- `/api/admin/products/meta` – returns categories and distinct product types.
- `/api/admin/products/images` – handles reorder/delete/upload (multipart + JSON).
- `/api/admin/products/update` – saves product info, descriptions, specs, packages.

### Notes

- The listing page uses Antd components heavily and relies on Supabase data shape (`images`, `variants`, `tags`, `product_type`, `status`, etc.).
- Image modal uses S3-style upload; reordering updates positions via two-phase update to avoid collisions.
- Edit page relies on Quill editors for rich description inputs.

Let me know if anything else should be included before I rebuild the listing UI in `slingshot_new`.

