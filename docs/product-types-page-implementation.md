# Product Types Management Page - Complete Implementation

## Overview
Product Types page is identical to Categories page in structure and functionality. It manages the types of products (e.g., "Kites", "Foil Boards", "Wake Boots") that were previously stored as plain TEXT in the products table.

---

## Database Schema

### New Table: `product_types`

```sql
CREATE TABLE product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  handle TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes:
- `idx_product_types_status` - Fast filtering by status
- `idx_product_types_visible` - Fast filtering by visibility
- `idx_product_types_slug` - Fast URL lookups

### Data Migration:
✅ **29 unique product types** migrated from `products.product_type` column  
✅ All set to `status='active'` and `visible=true`  
✅ Slugs auto-generated from names  

---

## Page Structure

### File Locations:
```
app/admin/product-types/
├── page.tsx                           # Server component (data fetching)
└── ProductTypesListClient.tsx         # Client component (interactive table)

app/api/admin/product-types/
└── route.ts                           # API endpoints (GET, POST, PUT, DELETE)

scripts/
└── create-product-types.ts            # Migration script
```

---

## Features (Identical to Categories)

### 1. **Status & Visibility Toggles**
- ✅ **Status**: Active ↔ Inactive (admin enable/disable)
- ✅ **Visible**: Visible ↔ Hidden (frontend visibility)
- ✅ Independent toggles (can be Active + Hidden, etc.)

### 2. **Inline Editing**
- ✅ Click Edit button to enter edit mode
- ✅ Editable fields:
  - **Name** (required)
  - **Slug** (auto-generated if empty)
  - **Description** (multi-line text)
  - **Sort Order** (number)
- ✅ Save/Cancel buttons in edit mode
- ✅ Updates database immediately on save

### 3. **Smart Delete Logic**
Delete button only appears when **BOTH** conditions are met:
- ✅ Status is **INACTIVE**
- ✅ Product count is **0**

**Visual States:**
- **Active** → Delete button hidden (safety)
- **Inactive + 0 products** → Delete **enabled** with confirmation
- **Inactive + 1+ products** → Delete **disabled** with tooltip

### 4. **Add New Product Type**
- ✅ "Add Product Type" button at top right
- ✅ Modal form with all fields
- ✅ Required validation for Name
- ✅ Auto-generates slug from name if not provided
- ✅ New type created with status='active', visible=true

### 5. **Product Count**
- ✅ Real-time count of products using this type
- ✅ Computed via `JOIN` with products table
- ✅ Green/bold if > 0, gray if = 0

---

## UI Components

### Table Columns (left to right):
1. **Status** (120px) - Active/Inactive switch
2. **Visible** (120px) - Visible/Hidden switch
3. **Name** (200px) - Product type name (editable, bold)
4. **Slug** (200px) - URL-friendly identifier (editable)
5. **Description** (300px) - Type description (editable, multi-line)
6. **Sort Order** (120px) - Display order (editable, number input)
7. **Products** (100px) - Product count (read-only, color-coded)
8. **Actions** (150px, fixed right) - Edit/Save/Cancel/Delete buttons

### Action Buttons:
- **Edit Mode OFF**: 
  - Edit icon button
  - Delete icon button (only if inactive + 0 products, with confirmation)
- **Edit Mode ON**:
  - Save button (primary)
  - Cancel button (gray)

---

## API Endpoints

### GET /api/admin/product-types
**Response:**
```json
{
  "productTypes": [
    {
      "id": "uuid",
      "name": "Foil Boards",
      "slug": "foil-boards",
      "handle": "foil-boards",
      "description": "Hydrofoil surfboards",
      "status": "active",
      "visible": true,
      "sort_order": 0,
      "product_count": 17,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/admin/product-types
**Request:**
```json
{
  "name": "New Type",
  "slug": "new-type",  // Optional, auto-generated if empty
  "description": "...",
  "sort_order": 0
}
```

### PUT /api/admin/product-types
**Request:**
```json
{
  "productTypeId": "uuid",
  "data": {
    "name": "Updated Name",
    "status": "inactive",
    // ...any other fields
  }
}
```

### DELETE /api/admin/product-types
**Request:**
```json
{
  "productTypeId": "uuid"
}
```
**Note:** Only allows delete if `status='inactive'` AND `product_count=0`

---

## Current Statistics (Your Data)

### Top Product Types by Count:
```
Kite Bar Parts:        56 products
Wake Boot Parts:       21 products
Foil Boards:           17 products
Wakeboards:            13 products
Kite Parts:            13 products
Foil Parts:            12 products
Board Parts:           11 products
Footstraps:             9 products
Wake Boots:             8 products
Kites:                  7 products
Wings:                  6 products
Foil Packages:          6 products
... and 17 more types
```

**Total**: 29 product types, all active and visible

---

## Business Rules

1. **Active types cannot be deleted** (safety)
2. **Types with products cannot be deleted** (data integrity)
3. **New types default to Active + Visible** (ready to use)
4. **Product count is always accurate** (computed in real-time)
5. **Visibility is independent of status** (flexibility)

---

## Relationship to Products Table

### Current State:
- ✅ `product_types` table exists with all unique types
- ⚠️ `products.product_type` is still **TEXT** (not a foreign key)
- ✅ Product count is computed by matching `products.product_type = product_types.name`

### Future Enhancement (Optional):
```sql
-- Add FK relationship (requires updating all products first)
ALTER TABLE products 
  ADD COLUMN product_type_id UUID REFERENCES product_types(id);

-- Populate from existing text values
UPDATE products p
SET product_type_id = pt.id
FROM product_types pt
WHERE p.product_type = pt.name;

-- Once migrated, can drop old column
ALTER TABLE products DROP COLUMN product_type;
```

**Decision**: Keep as TEXT for now for compatibility. The JOIN works perfectly either way.

---

## Navigation

### Menu Location:
**Catalog → Product Types**

Path in menu structure:
```
Admin Shell
└── Catalog (AppstoreOutlined)
    ├── Products (/admin/products)
    ├── Categories (/admin/categories)
    └── Product Types (/admin/product-types) ← NEW
```

---

## Frontend Integration (Future)

### Filtering Product Types:
```sql
-- Show only visible product types to customers
SELECT * FROM product_types 
WHERE status = 'active' AND visible = true
ORDER BY sort_order, name
```

### Use Cases:
1. **Product Filtering**: "Shop by Type" dropdown
2. **Category Pages**: Show types within category
3. **Breadcrumbs**: Category → Product Type → Product
4. **SEO URLs**: `/products/foil-boards/` or `/kites/trainer-kite/`

---

## Testing Checklist

- [x] Table created with all columns
- [x] 29 product types migrated
- [x] All set to active + visible
- [x] Status toggle works
- [x] Visible toggle works
- [x] Inline editing works
- [x] Add new type works
- [x] Delete shows only for inactive + 0 products
- [x] Delete is disabled for types with products
- [x] Product count displays correctly
- [x] API prevents deleting types with products
- [x] Menu link added to Catalog
- [x] No linter errors

---

## Comparison: Categories vs Product Types

| Feature           | Categories                      | Product Types                    |
|-------------------|---------------------------------|----------------------------------|
| **Purpose**       | Broad grouping (Kites, Foils)   | Specific variants (Kite Bars)    |
| **FK in products**| `category_id` (UUID)            | `product_type` (TEXT, for now)   |
| **Hierarchy**     | Has `parent_id` for nesting     | Flat structure                   |
| **Image**         | Has `image_url` field           | No image field                   |
| **UI**            | Identical                       | Identical                        |
| **API**           | `/api/admin/categories`         | `/api/admin/product-types`       |
| **Count**         | 7 categories                    | 29 product types                 |

**Both** have: status, visible, sort_order, description, slug, product_count

---

## SQL Migration File

Saved to: `/docs/sql-migrations-product-types-schema.sql`

All database changes are documented and can be re-run if needed.

