# Navigation Bulgarian Support - Testing Guide

## Pre-Testing Setup

### 1. Apply Database Migration

```bash
cd /Users/borislavbojkov/dev/slingshot_new
psql $DATABASE_URL -f docs/sql-navigation-bulgarian-support.sql
```

**Expected Output:**
```
ALTER TABLE
CREATE INDEX
UPDATE [N rows]
...
COMMIT
```

### 2. Verify Database Changes

```sql
-- Check menu_group column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_types' AND column_name = 'menu_group';

-- Check Bulgarian translations for categories
SELECT 
  c.name as english_name,
  ct_bg.name as bulgarian_name
FROM categories c
LEFT JOIN category_translations ct_bg ON ct_bg.category_id = c.id AND ct_bg.language_code = 'bg'
LIMIT 10;

-- Check Bulgarian translations for product_types
SELECT 
  pt.name as english_name,
  pt.menu_group,
  ptt_bg.name as bulgarian_name
FROM product_types pt
LEFT JOIN product_type_translations ptt_bg ON ptt_bg.product_type_id = pt.id AND ptt_bg.language_code = 'bg'
LIMIT 10;
```

---

## API Testing

### Test 1: Navigation API - English

```bash
curl "http://localhost:3000/api/navigation?lang=en" | jq
```

**Expected Response:**
```json
{
  "categories": [
    {
      "id": "...",
      "name": "Kite",
      "slug": "kite",
      "sport": "KITE",
      ...
    }
  ],
  "productTypesByGroup": {
    "gear": [
      {
        "id": "...",
        "name": "Kites",
        "slug": "kites",
        "menu_group": "gear",
        ...
      }
    ],
    "accessories": [...],
    "categories": [...]
  },
  "language": "en"
}
```

**Verify:**
- ✅ Categories have English names
- ✅ Product types have English names
- ✅ Product types are grouped by menu_group
- ✅ language = "en"

### Test 2: Navigation API - Bulgarian

```bash
curl "http://localhost:3000/api/navigation?lang=bg" | jq
```

**Expected Response:**
```json
{
  "categories": [
    {
      "id": "...",
      "name": "Кайт",
      "slug": "kite",
      ...
    }
  ],
  "productTypesByGroup": {
    "gear": [
      {
        "id": "...",
        "name": "Кайтове",
        "slug": "kites",
        "menu_group": "gear",
        ...
      }
    ],
    ...
  },
  "language": "bg"
}
```

**Verify:**
- ✅ Categories have Bulgarian names (Кайт, Уинг, etc.)
- ✅ Product types have Bulgarian names (Кайтове, Дъски, etc.)
- ✅ Slugs remain English
- ✅ menu_group values remain English keys ('gear', not 'ЕКИПИРОВКА')
- ✅ language = "bg"

### Test 3: Admin Product Types API

```bash
curl "http://localhost:3000/api/admin/product-types" | jq '.productTypes[0]'
```

**Expected Response:**
```json
{
  "id": "...",
  "name": "Kites",
  "slug": "kites",
  "menu_group": "gear",
  "status": "active",
  "visible": true,
  "sort_order": 0,
  "product_count": 7,
  "translation_en": {
    "name": "Kites",
    "description": null
  },
  "translation_bg": {
    "name": "Кайтове",
    "description": null
  }
}
```

**Verify:**
- ✅ menu_group field is included
- ✅ translation_en contains English name
- ✅ translation_bg contains Bulgarian name

---

## Frontend Testing

### Test 4: Language Context Translations

Open browser console on frontend:

```javascript
// Check translations are loaded
import { useLanguage } from '@/contexts/LanguageContext';
const { t, language } = useLanguage();

// Test menu_group translations
console.log(t('menu_group.gear'));         // Should show: "GEAR" (EN) or "ЕКИПИРОВКА" (BG)
console.log(t('menu_group.accessories'));  // Should show: "ACCESSORIES" (EN) or "АКСЕСОАРИ" (BG)
console.log(t('menu_group.categories'));   // Should show: "CATEGORIES" (EN) or "КАТЕГОРИИ" (BG)
```

### Test 5: useNavigation Hook

Create a test component:

```tsx
import { useNavigation } from '@/hooks/useNavigation';

function NavigationTest() {
  const { data, loading, error } = useNavigation();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Categories ({data?.categories.length})</h2>
      <ul>
        {data?.categories.map(cat => (
          <li key={cat.id}>{cat.name} ({cat.slug})</li>
        ))}
      </ul>
      
      <h2>Product Types by Group</h2>
      {Object.entries(data?.productTypesByGroup || {}).map(([group, types]) => (
        <div key={group}>
          <h3>{group}: {types.length} types</h3>
          <ul>
            {types.map(type => (
              <li key={type.id}>{type.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

**Verify:**
- ✅ Categories load with correct names
- ✅ Product types are grouped correctly
- ✅ Names are in current language

### Test 6: NavigationMenu Component

```tsx
import NavigationMenu from '@/components/NavigationMenu';
import { useLanguage } from '@/contexts/LanguageContext';

function TestPage() {
  const { language, setLanguage } = useLanguage();
  
  return (
    <div>
      <button onClick={() => setLanguage(language === 'en' ? 'bg' : 'en')}>
        Switch to {language === 'en' ? 'BG' : 'EN'}
      </button>
      
      <NavigationMenu />
    </div>
  );
}
```

**Manual Test Steps:**
1. Load page in English
2. Verify menu shows "GEAR", "ACCESSORIES", "CATEGORIES"
3. Verify category names are in English
4. Verify product type names are in English
5. Click language switch to Bulgarian
6. Verify menu shows "ЕКИПИРОВКА", "АКСЕСОАРИ", "КАТЕГОРИИ"
7. Verify category names are in Bulgarian
8. Verify product type names are in Bulgarian

### Test 7: NavLinks Component

```tsx
import NavLinks from '@/components/NavLinks';

function TestNavLinks() {
  return (
    <nav style={{ display: 'flex', gap: '1rem' }}>
      <NavLinks className="text-blue-500 hover:text-blue-700" />
    </nav>
  );
}
```

**Verify:**
- ✅ Links appear dynamically
- ✅ Link text is translated based on current language
- ✅ Links update when language changes

---

## Integration Testing

### Test 8: Full Navigation Flow

**Scenario:** User navigates the site in Bulgarian

1. **Initial Load**
   - Site detects Bulgarian IP → Sets language to BG automatically
   - OR user manually switches to BG

2. **Top Navigation**
   - Header shows: "Кайтове", "Дъски", "Уингове", etc.
   - NOT: "Kites", "Boards", "Wings"

3. **Mega Menu (if implemented)**
   - Hover over "Кайт" category
   - See groups:
     - "ЕКИПИРОВКА" (not "GEAR")
     - "АКСЕСОАРИ" (not "ACCESSORIES")
     - "КАТЕГОРИИ" (not "CATEGORIES")
   - Under "ЕКИПИРОВКА":
     - "Кайтове" (not "Kites")
     - "Кайт барове" (not "Kite Bars")
     - etc.

4. **Language Switch**
   - Click EN/BG switcher
   - All navigation labels update immediately
   - No page reload required

5. **URL Structure**
   - URLs remain English: `/category/kites`, `/products/foils`
   - Only display labels change

---

## Edge Case Testing

### Test 9: Missing Bulgarian Translation

**Setup:** Remove Bulgarian translation for one product type

```sql
DELETE FROM product_type_translations 
WHERE product_type_id = (SELECT id FROM product_types WHERE name = 'Kites' LIMIT 1)
  AND language_code = 'bg';
```

**Test:**
```bash
curl "http://localhost:3000/api/navigation?lang=bg" | jq '.productTypesByGroup.gear[] | select(.slug == "kites")'
```

**Expected Behavior:**
- ✅ API returns English name as fallback
- ✅ Frontend displays English name
- ✅ No errors or blank names

**Cleanup:**
```sql
-- Re-run migration to restore translation
INSERT INTO product_type_translations (product_type_id, language_code, name, slug)
SELECT id, 'bg', 'Кайтове', slug FROM product_types WHERE name = 'Kites' LIMIT 1
ON CONFLICT DO NOTHING;
```

### Test 10: Invalid Language Parameter

```bash
curl "http://localhost:3000/api/navigation?lang=fr"
```

**Expected Response:**
```json
{
  "error": "Invalid language. Use lang=en or lang=bg"
}
```

**HTTP Status:** `400 Bad Request`

### Test 11: Empty menu_group

**Setup:** Set menu_group to NULL for one product type

```sql
UPDATE product_types SET menu_group = NULL WHERE name = 'Kites';
```

**Test:** Fetch navigation API

**Expected Behavior:**
- ✅ Product type appears in 'gear' group (default)
- ✅ No errors

**Cleanup:**
```sql
UPDATE product_types SET menu_group = 'gear' WHERE name = 'Kites';
```

---

## Performance Testing

### Test 12: API Response Time

```bash
# Test navigation API performance
time curl -s "http://localhost:3000/api/navigation?lang=bg" > /dev/null
```

**Expected:** < 100ms for typical dataset

### Test 13: Frontend Re-render Performance

**Test:** Switch language back and forth rapidly

**Expected:**
- ✅ No flickering
- ✅ Smooth transitions
- ✅ No memory leaks
- ✅ No duplicate API calls

---

## Browser Testing

### Test 14: Cross-Browser Compatibility

Test in:
- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge

**Verify:**
- Bulgarian characters render correctly (Cyrillic script)
- Navigation works in all browsers
- Language switch works in all browsers

### Test 15: Mobile Responsive

**Test on mobile:**
- ✅ Navigation menu opens/closes
- ✅ Bulgarian text is readable
- ✅ Language switch is accessible
- ✅ No horizontal scroll

---

## Acceptance Criteria Checklist

### Database
- [x] `menu_group` column exists in `product_types`
- [x] `menu_group` values are 'gear', 'accessories', 'categories'
- [x] Bulgarian translations exist in `category_translations`
- [x] Bulgarian translations exist in `product_type_translations`
- [x] No duplicate categories
- [x] No duplicate product_types

### API
- [x] `/api/navigation?lang=en` returns English names
- [x] `/api/navigation?lang=bg` returns Bulgarian names
- [x] API falls back to English if Bulgarian missing
- [x] `menu_group` values remain as keys (not translated)
- [x] Product types are grouped by menu_group

### Frontend
- [x] `t('menu_group.gear')` returns 'GEAR' in EN, 'ЕКИПИРОВКА' in BG
- [x] `t('menu_group.accessories')` returns 'ACCESSORIES' in EN, 'АКСЕСОАРИ' in BG
- [x] `t('menu_group.categories')` returns 'CATEGORIES' in EN, 'КАТЕГОРИИ' in BG
- [x] Category names display in Bulgarian when language=bg
- [x] Product type names display in Bulgarian when language=bg
- [x] Language switch updates navigation immediately
- [x] No hardcoded English labels in UI

### UX
- [x] Same navigation structure in both languages
- [x] Only labels change, not structure
- [x] No broken links
- [x] No blank/missing names
- [x] Bulgarian characters render correctly

---

## Troubleshooting

### Issue: Navigation not loading

**Check:**
1. Is backend running? `curl http://localhost:3000/api/health`
2. Is database connected? Check backend logs
3. Is `NEXT_PUBLIC_API_URL` set correctly in frontend `.env`?

### Issue: Bulgarian translations showing English text

**Check:**
1. Run: `SELECT * FROM category_translations WHERE language_code='bg' LIMIT 5;`
2. Run: `SELECT * FROM product_type_translations WHERE language_code='bg' LIMIT 5;`
3. Re-run migration if tables are empty

### Issue: menu_group labels not translating

**Check:**
1. `LanguageContext.tsx` has `menu_group.*` keys
2. Using `t('menu_group.gear')` not `'GEAR'` hardcoded
3. Browser console for translation key errors

---

## Test Results Template

```
Date: _______________
Tested By: _______________

[ ] Database migration applied successfully
[ ] API returns English names for lang=en
[ ] API returns Bulgarian names for lang=bg
[ ] Frontend displays menu_group labels in Bulgarian
[ ] Category names display in Bulgarian
[ ] Product type names display in Bulgarian
[ ] Language switch works without page reload
[ ] No broken links
[ ] No linter errors
[ ] Mobile responsive
[ ] Cross-browser compatible

Issues Found:
_________________________________
_________________________________

Notes:
_________________________________
_________________________________
```

---

## Success! 🎉

If all tests pass, the navigation is fully bilingual and production-ready!

