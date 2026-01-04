# Variants Tab - Full CRUD Implementation

## Database Schema Changes

✅ **New columns added to `product_variants` table:**
- `compare_at_price` NUMERIC - Original price for showing discounts
- `inventory_quantity` INTEGER - Stock quantity (default: 0)
- `status` TEXT - 'active' or 'inactive' (default: 'active')
- `created_at` TIMESTAMP - When variant was created
- `updated_at` TIMESTAMP - Last modification time

## Features Implemented

### 1. **Active/Inactive Status Toggle**
- ✅ Switch component for each variant
- ✅ Visual "Active"/"Inactive" labels
- ✅ Real-time status update via API
- ✅ Success/error messages

### 2. **Inline Editing**
- ✅ Click Edit button to enter edit mode
- ✅ Editable fields:
  - Title (e.g., "Small / Black")
  - SKU
  - Price (€)
  - Compare at Price (€)
  - Inventory Quantity
- ✅ Save/Cancel buttons in edit mode
- ✅ Updates database immediately on save

### 3. **Delete Functionality**
- ✅ Delete button only shows for INACTIVE variants
- ✅ Confirmation dialog before delete
- ✅ API prevents deleting active variants
- ✅ Real-time UI update after deletion

### 4. **Add New Variant**
- ✅ "Add Variant" button at top
- ✅ Modal form with all fields
- ✅ Required validation for Title and Price
- ✅ New variant created with status='active'

## UI Components

### Table Columns (left to right):
1. **Status** - Active/Inactive switch (80px)
2. **Title** - Product variant name (editable)
3. **SKU** - Stock keeping unit (editable)
4. **Price (€)** - Sale price (editable, number input)
5. **Compare at (€)** - Original price (editable, number input)
6. **Inventory** - Stock quantity (editable, number input)
7. **Actions** - Edit/Delete buttons (150px, fixed right)

### Action Buttons:
- **Edit Mode OFF**: 
  - Edit icon button
  - Delete icon button (only if inactive, with confirmation)
- **Edit Mode ON**:
  - Save button (primary, green)
  - Cancel button (gray)

## API Endpoints

### Create Variant
```
POST /api/admin/products/variants
Body: { 
  productId: string, 
  variant: {
    title, sku, price, compare_at_price, inventory_quantity
  }
}
Response: { variant: {...} }
```

### Update Variant
```
PUT /api/admin/products/variants
Body: { 
  variantId: string, 
  data: { ...fields to update }
}
Response: { variant: {...} }
```

### Delete Variant
```
DELETE /api/admin/products/variants
Body: { variantId: string }
Response: { success: true }
Note: Only allows delete if status='inactive'
```

## Business Rules

1. **Active variants CANNOT be deleted**
   - Must set to inactive first
   - Prevents accidental deletion of live products

2. **Status toggle is instant**
   - No confirmation needed
   - Updates immediately

3. **Inline editing**
   - Only one variant can be edited at a time
   - Changes persist only on Save
   - Cancel discards changes

4. **New variants default to active**
   - Inventory starts at 0
   - Can be edited immediately after creation

## User Flow Examples

### Editing a Variant:
1. Click Edit icon on any variant
2. Fields become editable inputs
3. Make changes
4. Click Save → updates database + UI
5. OR Click Cancel → discards changes

### Deleting a Variant:
1. Set variant to Inactive (toggle switch)
2. Delete button appears
3. Click Delete
4. Confirm in dialog
5. Variant removed from table

### Adding a Variant:
1. Click "Add Variant" button
2. Fill form (Title* and Price* required)
3. Click "Add Variant"
4. New row appears in table
5. Can edit/toggle immediately

## Notes

- All operations update local state immediately (optimistic UI)
- Error messages shown if API fails
- Success messages confirm operations
- Table is responsive with horizontal scroll
- Character limits handled by input types

