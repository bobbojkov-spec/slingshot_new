# Navigation Bulgarian Language Support - Implementation Guide

## Overview

This document describes the complete implementation of Bulgarian language support for the top navigation menu, following the structure:

**SPORT (categories) → menu_group (gear/accessories/categories) → product_types**

---

## Architecture

### Database Layer

#### 1. Categories (Sports)
- Table: `categories`
- Translations: `category_translations` (language_code, name, slug, description)
- Examples: Kite → Кайт, Wing → Уинг, etc.

#### 2. Menu Groups (Structural Keys)
- Field: `product_types.menu_group`
- Values: `'gear'`, `'accessories'`, `'categories'` (fixed keys, NOT display text)
- Labels translated in frontend dictionary

#### 3. Product Types
- Table: `product_types`
- Translations: `product_type_translations` (language_code, name, slug, description)
- Examples: Kites → Кайтове, Boards → Дъски, etc.

---

## Files Created / Modified

### Database

**`docs/sql-navigation-bulgarian-support.sql`**
- Adds `menu_group` column to `product_types`
- Creates Bulgarian translations for categories
- Creates Bulgarian translations for product_types
- Sets default menu_group values

**To apply:**
```bash
psql $DATABASE_URL -f docs/sql-navigation-bulgarian-support.sql
```

### Backend API

**`app/api/admin/product-types/route.ts`** (Modified)
- Updated GET to include `menu_group` in queries
- Updated POST to accept `menu_group` parameter
- Updated PUT to update `menu_group` field
- Orders results by `menu_group`, `sort_order`, `name`

**`app/api/navigation/route.ts`** (New)
- Public API endpoint: `/api/navigation?lang=en` or `/api/navigation?lang=bg`
- Returns categories with translations
- Returns product_types grouped by menu_group with translations
- Handles fallback to English if Bulgarian translation missing

### Frontend (Loveable)

**`apps/frontend-loveable/src/contexts/LanguageContext.tsx`** (Modified)
Added menu_group label translations:
```typescript
en: {
  'menu_group.gear': 'GEAR',
  'menu_group.accessories': 'ACCESSORIES',
  'menu_group.categories': 'CATEGORIES',
}

bg: {
  'menu_group.gear': 'ЕКИПИРОВКА',
  'menu_group.accessories': 'АКСЕСОАРИ',
  'menu_group.categories': 'КАТЕГОРИИ',
}
```

**`apps/frontend-loveable/src/hooks/useNavigation.ts`** (New)
- Custom hook to fetch navigation data
- Automatically refetches when language changes
- Caches data for performance
- Returns: `{ data, loading, error }`

**`apps/frontend-loveable/src/components/NavigationMenu.tsx`** (New)
- Full navigation component demonstrating the structure
- Shows categories → menu_groups → product_types hierarchy
- All labels properly translated

**`apps/frontend-loveable/src/components/NavLinks.tsx`** (New)
- Simplified navigation component
- Uses translated categories from API
- Drop-in replacement for hardcoded nav links

---

## Translation Flow

### Categories (Sports)
1. EN: Stored in `categories.name` (default)
2. BG: Stored in `category_translations` where `language_code='bg'`
3. API: Returns `COALESCE(ct.name, c.name)` - falls back to EN if BG missing
4. Frontend: Displays translated name

### Menu Group Labels
1. Key: Stored as `'gear'`, `'accessories'`, `'categories'` in `product_types.menu_group`
2. EN: Frontend dictionary `t('menu_group.gear')` → `'GEAR'`
3. BG: Frontend dictionary `t('menu_group.gear')` → `'ЕКИПИРОВКА'`
4. Frontend: Displays translated label based on current language

### Product Types
1. EN: Stored in `product_types.name` (default)
2. BG: Stored in `product_type_translations` where `language_code='bg'`
3. API: Returns `COALESCE(ptt.name, pt.name)` - falls back to EN if BG missing
4. Frontend: Displays translated name

---

## Usage Examples

### Simple Navigation (Current Header Style)

Replace hardcoded nav links in `Header.tsx`:

```tsx
// Before (hardcoded):
const navLinks = [
  { name: t('nav.kites'), href: "/category/kites" },
  { name: t('nav.boards'), href: "/category/boards" },
  // ...
];

// After (dynamic, translated):
import NavLinks from "@/components/NavLinks";

<nav className="hidden lg:flex items-center gap-8">
  <NavLinks className="nav-link-white" />
</nav>
```

### Full Hierarchical Navigation (Mega Menu)

```tsx
import NavigationMenu from "@/components/NavigationMenu";
import { useNavigation } from "@/hooks/useNavigation";
import { useLanguage } from "@/contexts/LanguageContext";

function MegaMenu() {
  const { t } = useLanguage();
  const { data, loading } = useNavigation();

  if (loading || !data) return null;

  return (
    <div className="mega-menu">
      {data.categories.map(category => (
        <div key={category.id} className="sport-column">
          <h2>{category.name}</h2> {/* Translated category name */}
          
          {/* Show menu groups */}
          {['gear', 'accessories', 'categories'].map(groupKey => {
            const label = t(`menu_group.${groupKey}`); // Translated label
            const types = data.productTypesByGroup[groupKey];
            
            return (
              <div key={groupKey}>
                <h3>{label}</h3> {/* GEAR / ЕКИПИРОВКА */}
                <ul>
                  {types.map(type => (
                    <li key={type.id}>{type.name}</li> {/* Translated product type */}
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

### Manual API Call

```tsx
// Fetch navigation data manually
const response = await fetch('/api/navigation?lang=bg');
const { categories, productTypesByGroup } = await response.json();

// categories: [{ id, name: 'Кайт', slug: 'kite', ... }]
// productTypesByGroup: {
//   gear: [{ id, name: 'Кайтове', menu_group: 'gear', ... }],
//   accessories: [...],
//   categories: [...]
// }
```

---

## Data Structure

### API Response (`/api/navigation?lang=bg`)

```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Кайт",
      "slug": "kite",
      "sport": "KITE",
      "description": "...",
      "sort_order": 0
    }
  ],
  "productTypesByGroup": {
    "gear": [
      {
        "id": "uuid",
        "name": "Кайтове",
        "slug": "kites",
        "menu_group": "gear",
        "description": "...",
        "sort_order": 0
      }
    ],
    "accessories": [...],
    "categories": [...]
  },
  "language": "bg"
}
```

---

## Translation Rules

### ✅ DO:
- Store structural keys (`gear`, `accessories`, `categories`) in database
- Translate display labels in frontend dictionary
- Use translation tables for user-visible content (categories, product_types)
- Fall back to English if Bulgarian translation missing

### ❌ DON'T:
- Store Bulgarian text as `menu_group` values in database
- Hardcode English labels in UI
- Duplicate categories or product_types
- Change `menu_group` values (they are fixed keys)

---

## Testing Checklist

- [ ] SQL migration applied successfully
- [ ] `menu_group` column exists in `product_types` table
- [ ] Bulgarian translations exist for all categories
- [ ] Bulgarian translations exist for all product_types
- [ ] API `/api/navigation?lang=en` returns English names
- [ ] API `/api/navigation?lang=bg` returns Bulgarian names
- [ ] Frontend displays "GEAR" in EN, "ЕКИПИРОВКА" in BG
- [ ] Frontend displays "ACCESSORIES" in EN, "АКСЕСОАРИ" in BG
- [ ] Frontend displays "CATEGORIES" in EN, "КАТЕГОРИИ" in BG
- [ ] Category names display in Bulgarian when language=bg
- [ ] Product type names display in Bulgarian when language=bg
- [ ] Language switch updates navigation immediately

---

## Sample Bulgarian Translations

### Categories
- Kite → Кайт
- Wing → Уинг
- Wakeboard → Уейкборд
- Foil → Фойл
- Boards → Дъски

### Product Types
- Kites → Кайтове
- Wings → Уингове
- Boards → Дъски
- Foils → Фойлове
- Kite Bars → Кайт барове
- Wakeboards → Уейкбордове
- Wake Boots → Уейк обувки
- Foil Boards → Фойл дъски
- Kite Bar Parts → Части за кайт бар
- Foil Parts → Части за фойл
- Harnesses → Харнеси
- Helmets → Каски
- Pumps → Помпи
- Bags → Чанти

---

## Environment Configuration

For the navigation API to work in the Loveable frontend, ensure:

```env
# .env or .env.local in apps/frontend-loveable
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Or update the `useNavigation.ts` hook to use your deployed backend URL.

---

## Future Enhancements

1. **Localized Slugs** (Optional)
   - Currently slugs remain English: `/products/kites`
   - Could be localized: `/products/kaitove` (BG)
   - Requires slug routing logic updates

2. **Image URLs for Categories**
   - Add `image_url` to categories for visual navigation

3. **Icon Support for Product Types**
   - Add icon field to product_types for better UX

4. **SEO Meta Tags**
   - Add language-specific meta titles/descriptions

---

## Integration Steps

### Step 1: Apply Database Migration
```bash
cd /path/to/slingshot_new
psql $DATABASE_URL -f docs/sql-navigation-bulgarian-support.sql
```

### Step 2: Update Admin UI (Optional)
Add `menu_group` field to product types admin page for manual editing.

### Step 3: Update Frontend
Replace hardcoded navigation with dynamic navigation:

```tsx
// In Header.tsx or main navigation component
import NavLinks from "@/components/NavLinks";

// Replace static nav links with:
<nav>
  <NavLinks className="nav-link-white" />
</nav>
```

### Step 4: Test
1. Start backend: `cd app && npm run dev`
2. Start frontend: `cd apps/frontend-loveable && npm run dev`
3. Visit site, switch language EN ↔ BG
4. Verify all navigation labels translate correctly

---

## Troubleshooting

### Navigation not loading
- Check `NEXT_PUBLIC_API_URL` environment variable
- Check browser console for fetch errors
- Verify `/api/navigation` endpoint is accessible

### Translations missing
- Run SQL migration to backfill translations
- Check `category_translations` and `product_type_translations` tables
- Verify `language_code='bg'` rows exist

### menu_group labels in English only
- Check `LanguageContext.tsx` has `menu_group.*` translations
- Verify `t('menu_group.gear')` is used, not hardcoded string

---

## Success Criteria

✅ All navigation labels render in Bulgarian when `language=bg`  
✅ Same structure and grouping, only labels change  
✅ EN remains default fallback if BG translation missing  
✅ No duplicated categories or product_types  
✅ `menu_group` values remain as structural keys  
✅ No hardcoded English labels in UI  

---

**Implementation Complete!** 🎉

The navigation system now fully supports Bulgarian language with proper fallbacks, structured data, and maintainable translations.

