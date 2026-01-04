# Admin Products Edit Page - UI/UX Inventory

**Source**: `dev/slingshot/app/admin/products/[id]/edit/`

**Target**: Rebuild exact UI in `dev/slingshot_new/app/admin/products/[id]/edit/`

---

## Page Structure & Layout

### Top Section (Header)
1. **Breadcrumb Navigation**
   - Component: Ant Design `Breadcrumb`
   - Items:
     - First item: "Products" → clickable link back to `/admin/products` (with query string preserved)
     - Second item: "Edit Product" → static text
   - Spacing: Standard Ant Design breadcrumb styling

2. **Action Buttons Row**
   - Component: Ant Design `Space` (horizontal)
   - Buttons (left to right):
     - **Cancel Button**: 
       - Text: "Cancel"
       - Type: Default (no color)
       - Action: Navigate back to `/admin/products` (with query string preserved)
     - **Save Button**: 
       - Text: "Save"
       - Type: Primary (blue)
       - Loading state: Shows spinner when saving
       - Action: POST to `/api/admin/products/update` with entire draft

3. **Container Layout**
   - Outer wrapper: `Space` orientation="vertical", size={16}
   - Max width: 1200px, centered with `margin: '0 auto'`
   - Padding: 16px all sides

---

## Tab System

### Tab Bar
- Component: Ant Design `Tabs`
- Active tab state stored in component
- Tab items (left to right):

#### 1️⃣ **Info Tab** (key: 'info')
- Label: "Info"
- Default active tab

#### 2️⃣ **Variants Tab** (key: 'variants')
- Label: "Variants"

#### 3️⃣ **CO Meta Tab** (key: 'cometa')
- Label: "CO Meta"

---

## Info Tab - Field-by-Field Breakdown

**Container**: `Space` orientation="vertical", size={12}, maxWidth: 1000px, centered

### Field Order (top to bottom):

#### 1. **Name / Title**
- Label: `Typography.Text` strong → "Name / Title"
- Input: Ant Design `Input`
- Width: 100%, maxWidth: '80vw'
- Value binds to: `draft.info.title`
- On change: Updates both `title` and `name` fields in `draft.info`

#### 2. **Handle**
- Label: "Handle"
- Input: Ant Design `Input`
- Width: 100%, maxWidth: '80vw'
- Value binds to: `draft.info.handle`

#### 3. **Category**
- Label: "Category"
- Input: Ant Design `Select`
- Width: 100%, maxWidth: '80vw'
- Options: Derived from `categories` prop (id/name pairs)
- Value binds to: `draft.info.categoryId`
- Features: `allowClear`, placeholder "Select category"
- On change: Updates both `categoryId` and `categoryName` in `draft.info`

#### 4. **Brand**
- Label: "Brand"
- Input: Ant Design `Input`
- Width: 100%, maxWidth: '80vw'
- **Disabled**: true
- Placeholder: "Brand is read-only (no column in products table)"
- Value binds to: `draft.info.brand` (read-only)

#### 5. **Product type**
- Label: "Product type"
- Input: Ant Design `Select`
- Width: 100%, maxWidth: '80vw'
- Options: Derived from `productTypes` prop (list of existing types)
- Features: `showSearch`, `allowClear`, placeholder "Select product type"
- Value binds to: `draft.info.product_type`

#### 6. **Tags (comma separated)**
- Label: "Tags (comma separated)"
- Input: Ant Design `Select` with `mode="tags"`
- Width: 100%, maxWidth: '80vw'
- Value binds to: `draft.info.tags` (array)
- Features: `tokenSeparators={[',']}`, placeholder "Add tags"
- Behavior: Converts comma-separated string to array

#### 7. **Status**
- Label: "Status"
- Input: Ant Design `Select`
- Width: 100%, maxWidth: '80vw'
- Options:
  - { label: 'Active', value: 'active' }
  - { label: 'Not Active', value: 'inactive' }
- Features: `allowClear`, placeholder "Select status"
- Value binds to: `draft.info.status`

#### 8. **Description HTML**
- Label: "Description HTML"
- Input: **Quill Rich Text Editor** (react-quilljs)
- Width: 100%, maxWidth: '80vw'
- Border: 1px solid #d9d9d9, borderRadius: 4
- Value binds to: `draft.info.description_html`
- Behavior: 
  - On mount: Loads existing HTML via `quill.clipboard.dangerouslyPasteHTML`
  - On text-change: Updates `draft.info.description_html` with `quill.root.innerHTML`

#### 9. **Description HTML 2**
- Label: "Description HTML 2"
- Input: **Quill Rich Text Editor** (react-quilljs) — separate instance
- Width: 100%, maxWidth: '80vw'
- Border: 1px solid #d9d9d9, borderRadius: 4
- Value binds to: `draft.info.description_html2`
- Behavior: Same as Description HTML (separate Quill instance)

#### 10. **Specs HTML**
- Label: "Specs HTML"
- Input: Ant Design `Input.TextArea`
- Width: 100%, maxWidth: '80vw'
- Rows: 3
- Value binds to: `draft.info.specs_html`

#### 11. **Package includes**
- Label: "Package includes"
- Input: Ant Design `Input.TextArea`
- Width: 100%, maxWidth: '80vw'
- Rows: 3
- Value binds to: `draft.info.package_includes`

#### 12. **SEO title**
- Label: "SEO title"
- Input: Ant Design `Input`
- Width: 100%, maxWidth: '80vw'
- Value binds to: `draft.info.seo_title`

#### 13. **SEO description**
- Label: "SEO description"
- Input: Ant Design `Input.TextArea`
- Width: 100%, maxWidth: '80vw'
- Rows: 3
- Value binds to: `draft.info.seo_description`

---

## Variants Tab

### Layout
- Component: Ant Design `Table`
- Size: `small`
- Pagination: `false` (no pagination)
- Margin top: 12px

### Caption
- Text: "Variants are read-only for now."
- Position: Above table

### Columns (left to right):

1. **Title**
   - dataIndex: 'title'
   - Render: Shows `title` or `name` or "—"

2. **SKU**
   - dataIndex: 'sku'
   - Render: Shows `sku` or "—"

3. **Price**
   - dataIndex: 'price'
   - Render: Shows `$${price}` or "—"

4. **Compare at**
   - dataIndex: 'compare_at_price'
   - Render: Shows `$${compare_at_price}` or "—"

5. **Inventory**
   - dataIndex: 'inventory_quantity'
   - Render: Shows quantity number or "—"

6. **Status**
   - dataIndex: 'status'
   - Render: Shows `status` or `available` or `is_active` or `active` or "—"

### Data Source
- Comes from `draft.variants` array (fetched from `product_variants` table via API)

---

## CO Meta Tab

### Content
- Component: Ant Design `Alert`
- Type: `info`
- Icon: `showIcon={true}`
- Message: "CO Meta editor coming later"
- Description: "This tab is a placeholder and does not change any data yet."

---

## Save Behavior

### What Happens on Save:
1. Button enters loading state (`saving={true}`)
2. POST request to `/api/admin/products/update`
3. Request body: `{ product: draft }` (entire draft object serialized as JSON)
4. On success: 
   - Show success message via `message.success('Product saved')`
   - Loading state ends
5. On error:
   - Show error message via `message.error(err?.message || 'Save failed')`
   - Loading state ends

### What Data is Sent:
The entire `draft` object, which includes:
- `id`: product ID
- `info`: all fields from Info tab
- `variants`: (read-only, not modified by UI)
- `images`: (if images section exists, not shown in tabs)

---

## Data Loading (Server Component)

### API Endpoints Used:
1. **Product data**: Supabase query (to be replaced with `/api/admin/products/[id]`)
   - Fetches: product, category, descriptions, specs, packages, variants, images
   - Assembles into a single `product` object with `info` sub-object

2. **Categories list**: Supabase query (to be replaced with `/api/admin/products/meta`)
   - Returns: `[{ id: string, name: string }]`

3. **Product types list**: Supabase query (to be replaced with `/api/admin/products/meta`)
   - Returns: `string[]` of distinct product_type values

### Props Passed to EditProduct Component:
- `product`: The assembled product object
- `categories`: Categories array
- `productTypes`: Product types array

---

## State Management

### Client State:
- `draft`: Full copy of product (via `structuredClone`)
- `activeTab`: Current tab key ('info' | 'variants' | 'cometa')
- `saving`: Boolean for save loading state

### URL State:
- Query string from list page preserved in breadcrumb and cancel links

---

## Key UI/UX Notes

1. **All fields use controlled inputs** bound to `draft.info.*`
2. **Quill editors require special initialization** with `dangerouslyPasteHTML` and `text-change` listeners
3. **Width constraint**: All inputs use `maxWidth: '80vw'` to prevent overflow
4. **Brand field is disabled** because there's no brand column in the products table
5. **Tags field** accepts both manual entry and comma-separated paste
6. **Status dropdown** uses "Active" / "Not Active" labels (not "active" / "draft")
7. **Variants are read-only** — no edit/delete functionality
8. **CO Meta is a placeholder** — no functionality yet
9. **Save sends the entire draft** — backend is responsible for extracting/persisting individual fields

---

## Dependencies

### NPM Packages:
- `antd` - UI components
- `react-quilljs` - Rich text editor for description fields
- `next/navigation` - useRouter, useSearchParams
- `next/link` - Link component for breadcrumb

### CSS/Styling:
- Ant Design default theme
- Custom inline styles for widths and borders
- No custom CSS files needed

---

## Missing from Current Implementation (to be built):

- ❌ Breadcrumb with back link
- ❌ Cancel/Save buttons at top
- ❌ Tabs system (Info, Variants, CO Meta)
- ❌ All 13 Info tab fields in correct order
- ❌ Quill editors for description_html fields
- ❌ Variants table (read-only)
- ❌ CO Meta placeholder alert
- ❌ Save API integration
- ❌ Query string preservation in navigation

---

**Ready to rebuild**: This document contains every UI element, field, button, and interaction needed to replicate the edit page exactly as it appears in the legacy app.

