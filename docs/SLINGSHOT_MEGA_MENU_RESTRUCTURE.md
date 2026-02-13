# Slingshot Mega Menu Restructure - Implementation Guide

## Overview

This document describes the implementation of the new Slingshot mega menu structure with 4 separate sports (Kite, WAKE, Wing, Foil), each having their own independent menu groups and collections.

## Architecture

### Before (Old System)
- Single `source='slingshot'` for all menu groups
- All collections mixed together in one list
- No sport-specific organization

### After (New System)
- Each of the 4 sports has its own menu groups
- Menu groups are organized by `source` + `sport`
- Collections can be assigned to specific sport menu groups
- Full bilingual support (English + Bulgarian)

## Database Changes

### Migration File
**File:** `sql/migrations/add-sport-to-menu-groups.sql`

```sql
-- Adds sport column to menu_groups table
ALTER TABLE menu_groups ADD COLUMN IF NOT EXISTS sport VARCHAR(50);

-- Creates index for efficient querying
CREATE INDEX IF NOT EXISTS idx_menu_groups_source_sport ON menu_groups(source, sport);
```

### Schema

#### menu_groups Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR | English title |
| title_bg | VARCHAR | Bulgarian title |
| slug | VARCHAR | URL-friendly identifier |
| source | VARCHAR | 'slingshot' or 'rideengine' |
| **sport** | **VARCHAR** | **'kite', 'wake', 'wing', 'foil', or NULL** |
| sort_order | INTEGER | Display order |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

## Admin UI

### New Page Structure

**URL:** `/admin/collections-slingshot/groups`

The new admin interface features:

1. **4 Sport Tabs:**
   - 🪁 Kite / Кайт (Orange)
   - 🏄 WAKE / Уейк (Blue)
   - 🪽 Wing / Уинг (Purple)
   - 🏄‍♂️ Foil / Фойл (Green)

2. **Per-Sport Management:**
   - Create menu groups specific to each sport
   - Rename groups in both English and Bulgarian
   - Assign collections to groups
   - Reorder groups and collections

3. **Features:**
   - Expand/collapse groups to see linked collections
   - Drag-to-reorder (visual handle)
   - Quick edit modal with collection selection
   - Unassigned groups warning

### Components

#### SlingshotSportsMenuClient
**File:** `components/admin/SlingshotSportsMenuClient.tsx`

Main client component with:
- Tab navigation for 4 sports
- Create/edit/delete menu groups
- Collection assignment with reordering
- Real-time updates

## API Changes

### Updated Endpoints

#### 1. GET /api/admin/menu-groups
**Query Parameters:**
- `source` (required): 'slingshot' or 'rideengine'
- `sport` (optional): 'kite', 'wake', 'wing', 'foil'

**Response:**
```json
{
  "groups": [
    {
      "id": "uuid",
      "title": "Kites",
      "title_bg": "Кайтове",
      "slug": "kites",
      "source": "slingshot",
      "sport": "kite",
      "sort_order": 0,
      "collection_count": 5
    }
  ]
}
```

#### 2. POST /api/admin/menu-groups
**Body:**
```json
{
  "title": "Kites",
  "title_bg": "Кайтове",
  "slug": "kites",
  "source": "slingshot",
  "sport": "kite",
  "sort_order": 0
}
```

#### 3. PUT /api/admin/menu-groups/[id]
**Body:**
```json
{
  "title": "Kites",
  "title_bg": "Кайтове",
  "sport": "kite",
  "sort_order": 1,
  "collectionIds": ["uuid1", "uuid2"]
}
```

#### 4. PUT /api/admin/menu-groups/reorder (NEW)
**Body:**
```json
{
  "updates": [
    { "id": "uuid1", "sort_order": 0 },
    { "id": "uuid2", "sort_order": 1 }
  ]
}
```

#### 5. GET /api/navigation/menu-structure
**Query Parameters:**
- `source` (required): 'slingshot' or 'rideengine'
- `sport` (optional): Filter by sport
- `lang` (optional): 'en' or 'bg'

## Navigation Data Structure

### Updated Types

```typescript
// hooks/useNavigation.ts

export interface SlingshotSportMenuGroups {
  kite: MenuGroup[];
  wake: MenuGroup[];
  wing: MenuGroup[];
  foil: MenuGroup[];
}

export interface NavigationData {
  // ... existing fields
  slingshotMenuGroups?: MenuGroup[];  // All groups (backward compatibility)
  slingshotBySport?: SlingshotSportMenuGroups;  // New sport-specific structure
}
```

### Server-Side Fetching

**File:** `lib/railway/navigation-server.ts`

The `fetchFullNavigationData` function now fetches menu groups separately for each sport:

```typescript
const [nav, slingshotKite, slingshotWake, slingshotWing, slingshotFoil, rideEngine] = await Promise.all([
    getNavigationData(lang),
    getMenuStructure('slingshot', lang, 'kite'),
    getMenuStructure('slingshot', lang, 'wake'),
    getMenuStructure('slingshot', lang, 'wing'),
    getMenuStructure('slingshot', lang, 'foil'),
    getMenuStructure('rideengine', lang)
]);
```

## Deployment Steps

### 1. Run Database Migration

```bash
# Connect to your database and run:
psql $DATABASE_URL -f sql/migrations/add-sport-to-menu-groups.sql
```

### 2. Deploy Code Changes

The following files have been modified/created:

**New Files:**
- `sql/migrations/add-sport-to-menu-groups.sql`
- `components/admin/SlingshotSportsMenuClient.tsx`
- `app/api/admin/menu-groups/reorder/route.ts`

**Modified Files:**
- `app/admin/collections-slingshot/groups/page.tsx` - Complete rewrite
- `app/api/admin/menu-groups/route.ts` - Added sport support
- `app/api/admin/menu-groups/[id]/route.ts` - Added title_bg and sport fields
- `app/api/navigation/menu-structure/route.ts` - Added sport filter
- `lib/railway/navigation-server.ts` - Sport-specific fetching
- `hooks/useNavigation.ts` - New type definitions

### 3. Populate Initial Data

After deployment, you'll need to:

1. Go to `/admin/collections-slingshot/groups`
2. Select each sport tab (Kite, WAKE, Wing, Foil)
3. Create menu groups for each sport
4. Assign existing collections to appropriate groups

### 4. Update Frontend Navigation

Update your frontend navigation component to use the new `slingshotBySport` data structure:

```typescript
// Example usage
const { data } = useNavigation();

// Access Kite menu groups
const kiteGroups = data?.slingshotBySport?.kite;

// Access WAKE menu groups
const wakeGroups = data?.slingshotBySport?.wake;
```

## Backward Compatibility

The old `slingshotMenuGroups` field still exists and contains ALL menu groups (from all sports), ensuring existing code continues to work during the transition period.

## Migration Strategy for Existing Data

### Option 1: Manual Assignment (Recommended)
1. After deployment, existing menu groups will appear as "Unassigned"
2. Edit each group to assign it to the correct sport
3. This gives you full control over the organization

### Option 2: Bulk Migration Script
If you have many groups, create a script to auto-assign based on collection names or other criteria.

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Admin page loads with 4 sport tabs
- [ ] Can create menu groups for each sport
- [ ] Can edit group titles in both languages
- [ ] Can assign collections to groups
- [ ] Can reorder groups within a sport
- [ ] Can reorder collections within a group
- [ ] Navigation API returns sport-specific data
- [ ] Frontend navigation displays correctly
- [ ] Ride Engine menu groups still work (unchanged)

## Troubleshooting

### Issue: Groups not appearing in correct sport tab
**Solution:** Check that the `sport` column is set correctly in the database:
```sql
SELECT id, title, sport FROM menu_groups WHERE source = 'slingshot';
```

### Issue: Collections not showing in group
**Solution:** Verify the `menu_group_collections` table has entries:
```sql
SELECT * FROM menu_group_collections WHERE menu_group_id = 'your-group-uuid';
```

### Issue: Navigation not updating
**Solution:** The navigation is cached. Changes will appear after cache revalidation (5 minutes) or you can manually trigger revalidation by visiting `/api/navigation/full`.

## Future Enhancements

1. **Drag & Drop:** Implement full drag-and-drop reordering using @dnd-kit
2. **Bulk Operations:** Add ability to move multiple collections between groups
3. **Preview:** Show live preview of mega menu in admin
4. **Analytics:** Track which menu items are clicked most

## Support

For issues or questions about this implementation, refer to:
- Database schema: `Documents/Blueprints/02_DATABASE_SCHEMA_AND_API_CONTRACTS.md`
- This document: `docs/SLINGSHOT_MEGA_MENU_RESTRUCTURE.md`
