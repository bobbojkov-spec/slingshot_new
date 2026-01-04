# Categories: Status + Visibility + Smart Delete

## Database Changes

### New Column Added:
✅ **visible** BOOLEAN (default: true) - Controls frontend visibility

### All Categories Initialized:
✅ **status** = 'active' (ready to use)  
✅ **visible** = true (shown on frontend)

---

## UI Features

### 1. **Two Toggle Switches**

#### Status Toggle:
- **Active** - Category is enabled for admin use
- **Inactive** - Category is disabled, can potentially be deleted

#### Visible Toggle:
- **Visible** - Shows on frontend (shop, filters, navigation)
- **Hidden** - Hidden from customers, but still in admin

**Use Cases:**
- **Active + Visible** → Normal category (shown everywhere)
- **Active + Hidden** → Working on it (admin only)
- **Inactive + Hidden** → Deprecated, ready for cleanup
- **Inactive + Visible** → Not recommended (will be hidden by frontend logic)

---

### 2. **Smart Delete Logic**

**Delete button only appears when ALL conditions met:**
✅ Category status is **INACTIVE**  
✅ Category has **0 products** linked  

**Visual States:**

| Status    | Products | Delete Button                                  |
|-----------|----------|------------------------------------------------|
| Active    | Any      | ❌ Hidden (must set inactive first)           |
| Inactive  | 0        | ✅ Enabled with confirmation                   |
| Inactive  | 1+       | ⚠️ Disabled (tooltip: "Cannot delete: X products linked") |

**Delete Flow:**
1. User sets category to **Inactive**
2. If **product_count = 0** → Delete button **enabled**
3. Click Delete → Confirmation dialog
4. Category is permanently deleted

**If products exist:**
1. User sets category to **Inactive**
2. Delete button shows but is **disabled**
3. Hover shows: "Cannot delete: 42 products linked"
4. User must:
   - Reassign products to other categories, OR
   - Delete the products first

---

## API Changes

### DELETE endpoint now checks:
```javascript
// 1. Check if active
if (category.status === 'active') {
  return error('Cannot delete active category')
}

// 2. Check product count
if (product_count > 0) {
  return error('Cannot delete category with 42 linked products')
}

// 3. Safe to delete
DELETE FROM categories WHERE id = ...
```

**No longer auto-unlinks products** - Prevents accidental data loss

---

## Column Summary

| Column         | Type      | Default   | Purpose                                    |
|----------------|-----------|-----------|---------------------------------------------|
| id             | UUID      | -         | Primary key                                 |
| name           | TEXT      | required  | Category name                               |
| slug           | TEXT      | auto      | URL-friendly identifier                     |
| handle         | TEXT      | auto      | Same as slug                                |
| description    | TEXT      | NULL      | Category description                        |
| **status**     | TEXT      | 'active'  | Admin enable/disable                        |
| **visible**    | BOOLEAN   | true      | Frontend visibility                         |
| sort_order     | INTEGER   | 0         | Display order                               |
| image_url      | TEXT      | NULL      | Category image                              |
| parent_id      | UUID      | NULL      | For nested categories (future)              |
| product_count  | -         | computed  | COUNT of linked products (not stored)       |
| created_at     | TIMESTAMP | NOW()     | Creation time                               |
| updated_at     | TIMESTAMP | NOW()     | Last update                                 |

---

## Frontend Integration (Future)

### Filtering Categories:
```sql
-- Show only visible categories to customers
SELECT * FROM categories 
WHERE status = 'active' AND visible = true
ORDER BY sort_order, name
```

### Admin vs Customer View:
- **Admin**: Sees all categories (active/inactive, visible/hidden)
- **Customer**: Only sees `status='active' AND visible=true`

---

## User Workflows

### Scenario 1: Temporary Hide Category
1. Keep status = **Active**
2. Set visible = **Hidden**
3. Category disappears from frontend
4. Products still linked, admin can still manage

### Scenario 2: Deprecate Category
1. Set status = **Inactive**
2. Set visible = **Hidden**
3. Reassign products to other categories
4. Once product_count = 0, delete button enables
5. Delete category permanently

### Scenario 3: Seasonal Category
1. Start: Active + Visible (summer collection)
2. Off-season: Active + Hidden (keep for next year)
3. End-of-life: Inactive + Hidden → reassign → delete

---

## Business Rules

1. **Active categories cannot be deleted** (safety)
2. **Categories with products cannot be deleted** (data integrity)
3. **New categories default to Active + Visible** (ready to use)
4. **Product count is always accurate** (computed in real-time)
5. **Visibility is independent of status** (flexibility)

---

## SQL Migration

```sql
-- Add visible column
ALTER TABLE categories ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true;

-- Set all existing categories to active and visible
UPDATE categories SET status = 'active', visible = true;

-- Add index
CREATE INDEX IF NOT EXISTS idx_categories_visible ON categories(visible);
```

---

## Testing Checklist

- [x] All categories initialized as active + visible
- [x] Status toggle works (active ↔ inactive)
- [x] Visible toggle works (visible ↔ hidden)
- [x] Delete shows only for inactive + 0 products
- [x] Delete is disabled for inactive + 1+ products
- [x] Product count displays correctly
- [x] API prevents deleting categories with products
- [x] Tooltips show helpful messages

