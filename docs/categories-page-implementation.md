# Categories Management Page - Complete Implementation

## Database Schema

### Columns Added to `categories` table:
✅ **status** TEXT - 'active' or 'inactive' (default: 'active')  
✅ **description** TEXT - Category description  
✅ **sort_order** INTEGER - Display order (default: 0)  
✅ **image_url** TEXT - Category image URL  
✅ **parent_id** UUID - For nested categories (self-referencing FK)  

### Existing Columns:
- `id` UUID (PK)
- `name` TEXT (required)
- `slug` TEXT (auto-generated from name)
- `handle` TEXT (same as slug)
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

### Indexes Added:
- `idx_categories_status` - Fast filtering by status
- `idx_categories_slug` - Fast URL lookups
- `idx_categories_parent_id` - For hierarchical queries

---

## Page Structure

### File Locations:
```
app/admin/categories/
├── page.tsx                     # Server component (data fetching)
└── CategoriesListClient.tsx     # Client component (interactive table)

app/api/admin/categories/
└── route.ts                     # API endpoints (GET, POST, PUT, DELETE)
```

---

## Features Implemented

### 1. **Active/Inactive Status Toggle**
- ✅ Switch component for each category
- ✅ Visual "Active"/"Inactive" labels
- ✅ Real-time status update via API
- ✅ Success/error messages

### 2. **Inline Editing**
- ✅ Click Edit button to enter edit mode
- ✅ Editable fields:
  - **Name** (required)
  - **Slug/Handle** (auto-generated if empty)
  - **Description** (multi-line text)
  - **Sort Order** (number)
- ✅ Save/Cancel buttons in edit mode
- ✅ Updates database immediately on save

### 3. **Delete Functionality**
- ✅ Delete button only shows for INACTIVE categories
- ✅ Confirmation dialog before delete
- ✅ API prevents deleting active categories
- ✅ Auto-unlinks products from deleted category
- ✅ Real-time UI update after deletion

### 4. **Add New Category**
- ✅ "Add Category" button at top right
- ✅ Modal form with all fields
- ✅ Required validation for Name
- ✅ Auto-generates slug from name if not provided
- ✅ New category created with status='active'

### 5. **Product Count**
- ✅ Shows number of products in each category
- ✅ Calculated via LEFT JOIN in SQL query

---

## UI Components

### Table Columns (left to right):
1. **Status** (120px) - Active/Inactive switch
2. **Name** (variable) - Category name (editable, bold text)
3. **Slug / Handle** (variable) - URL-friendly identifier (editable)
4. **Description** (300px) - Category description (editable, multi-line)
5. **Sort Order** (120px) - Display order (editable, number input)
6. **Products** (100px) - Product count (read-only)
7. **Actions** (150px, fixed right) - Edit/Delete buttons

### Action Buttons:
- **Edit Mode OFF**: 
  - Edit icon button
  - Delete icon button (only if inactive, with confirmation)
- **Edit Mode ON**:
  - Save button (primary, green)
  - Cancel button (gray)

### Card Header:
- Title: "Categories"
- Subtitle: Count (e.g., "15 categories")
- "Add Category" button (primary, top right)

### Pagination:
- 20 items per page (adjustable)
- Page size changer
- Total count display

---

## API Endpoints

### GET /api/admin/categories
**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "handle": "electronics",
      "description": "Electronic products",
      "status": "active",
      "sort_order": 0,
      "image_url": "https://...",
      "product_count": 42,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/admin/categories
**Request:**
```json
{
  "name": "New Category",
  "slug": "new-category",  // Optional, auto-generated if empty
  "description": "...",
  "sort_order": 0,
  "image_url": "..."
}
```
**Response:** `{ "category": {...} }`

### PUT /api/admin/categories
**Request:**
```json
{
  "categoryId": "uuid",
  "data": {
    "name": "Updated Name",
    "status": "inactive",
    // ...any other fields
  }
}
```
**Response:** `{ "category": {...} }`

### DELETE /api/admin/categories
**Request:**
```json
{
  "categoryId": "uuid"
}
```
**Response:** `{ "success": true }`

**Note:** Only allows delete if status='inactive'. Auto-unlinks products.

---

## Business Rules

1. **Active categories CANNOT be deleted**
   - Must set to inactive first
   - Prevents accidental deletion

2. **Slug auto-generation**
   - If slug is empty, generates from name
   - Format: lowercase, alphanumeric, hyphen-separated
   - Example: "Consumer Electronics" → "consumer-electronics"

3. **Product unlinking on delete**
   - When category is deleted, all linked products get `category_id = NULL`
   - Products are NOT deleted

4. **Sort order**
   - Categories are displayed by sort_order first, then by name
   - Lower numbers appear first
   - Default is 0

5. **Inline editing**
   - Only one category can be edited at a time
   - Changes persist only on Save
   - Cancel discards changes

---

## Navigation

### Menu Location:
**Catalog → Categories**

Path in menu structure:
```
Admin Shell
└── Catalog (AppstoreOutlined)
    ├── Products (/admin/products)
    └── Categories (/admin/categories) ← NEW
```

---

## User Flows

### Creating a Category:
1. Click "Add Category" button
2. Fill required field: Name
3. Optionally fill: Slug, Description, Sort Order, Image URL
4. Click "Add Category"
5. New row appears in table
6. Can edit/toggle immediately

### Editing a Category:
1. Click Edit icon on any category
2. Fields become editable inputs
3. Make changes
4. Click Save → updates database + UI
5. OR Click Cancel → discards changes

### Deleting a Category:
1. Set category to Inactive (toggle switch)
2. Delete button appears
3. Click Delete
4. Confirm in dialog (warns about product unlinking)
5. Category removed from table
6. Products with this category are unlinked

### Toggling Status:
1. Click switch on any category
2. Status updates immediately
3. Success message shown
4. Delete button appears/disappears based on new status

---

## Future Enhancements

- [ ] **Hierarchical categories** (parent_id is already in DB)
- [ ] **Drag-and-drop reordering** (sort_order field ready)
- [ ] **Bulk operations** (activate/deactivate multiple)
- [ ] **Category image upload** (currently just URL input)
- [ ] **SEO fields** (meta description, keywords)
- [ ] **Product reassignment** (move products before delete)

---

## SQL Migration File

Saved to: `/docs/sql-migrations-categories-schema.sql`

All database changes are documented and can be re-run if needed.

