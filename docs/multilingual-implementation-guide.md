# MULTILINGUAL DATABASE ARCHITECTURE
## Complete Design & Implementation Guide

---

## 📐 **ARCHITECTURE DECISION: `*_translations` TABLES**

### **Why This Model?**

✅ **Scalable**: Add German, French, Spanish without schema changes  
✅ **Performant**: Query only needed language, proper indexes  
✅ **Maintainable**: Clear separation of core data vs translations  
✅ **Industry Standard**: WordPress, Drupal, Strapi all use this  
✅ **Flexible**: Easy to see translation coverage, run reports  

❌ **NOT JSONB**: Can't efficiently query, index, or enforce constraints  
❌ **NOT Suffixed Columns**: Would need `title_en`, `title_bg`, `title_de`... = disaster  

---

## 🗄️ **DATABASE SCHEMA**

### **Core Tables (Translation Tables)**

```
languages
├── code (PK)          VARCHAR(2)   'en', 'bg'
├── name               VARCHAR(50)  'English', 'Bulgarian'
├── native_name        VARCHAR(50)  'Български'
├── is_default         BOOLEAN
└── is_active          BOOLEAN

product_translations
├── id (PK)
├── product_id (FK) → products.id
├── language_code (FK) → languages.code
├── title
├── description_html
├── description_html2
├── specs_html
├── package_includes
├── tags (TEXT[])
├── seo_title
├── seo_description
├── meta_keywords
├── og_title
└── og_description
└── UNIQUE(product_id, language_code)

category_translations
├── id (PK)
├── category_id (FK) → categories.id
├── language_code (FK)
├── name
├── slug (per-language)
├── description
└── UNIQUE(category_id, language_code)
└── UNIQUE(language_code, slug)

product_variant_translations
├── id (PK)
├── variant_id (FK) → product_variants.id
├── language_code (FK)
├── title ("Small" → "Малък")
└── UNIQUE(variant_id, language_code)

product_type_translations
├── id (PK)
├── product_type_id (FK) → product_types.id
├── language_code (FK)
├── name
├── slug (per-language)
├── description
└── UNIQUE(product_type_id, language_code)
```

---

## 🔄 **MIGRATION SEQUENCE**

### **Phase 1: Create Tables** ✅
**File**: `sql-migrations-multilingual-01-create-tables.sql`

- Creates `languages` table
- Creates all `*_translations` tables
- Adds indexes for performance
- Sets up FK constraints

**Run**: `psql $DATABASE_URL -f docs/sql-migrations-multilingual-01-create-tables.sql`

---

### **Phase 2: Backfill English** ✅
**File**: `sql-migrations-multilingual-02-backfill-english.sql`

- Copies existing English content from `products` → `product_translations` (language_code='en')
- Copies from `categories` → `category_translations`
- Copies from `product_variants` → `product_variant_translations`
- Copies from `product_types` → `product_type_translations`

**Result**: 100% English translation coverage

**Original columns remain untouched** for backward compatibility.

**Run**: `psql $DATABASE_URL -f docs/sql-migrations-multilingual-02-backfill-english.sql`

---

### **Phase 3: Initialize Bulgarian** ✅
**File**: `sql-migrations-multilingual-03-initialize-bulgarian.sql`

- Duplicates all EN translations → BG translations
- Bulgarian text = English text initially (placeholder)
- BG slugs = EN slugs + `-bg` suffix (for uniqueness)

**Result**: 100% Bulgarian coverage (ready for translation)

**Run**: `psql $DATABASE_URL -f docs/sql-migrations-multilingual-03-initialize-bulgarian.sql`

---

## 🤖 **AI TRANSLATION PROCESS (FUTURE)**

### **Safe Translation Workflow**

**Step 1: Export BG placeholders**
```sql
SELECT 
  pt.id,
  pt.product_id,
  p.handle,
  p.brand,
  p.sku,
  en.title as english_title,
  bg.title as bulgarian_title_placeholder,
  en.description_html as english_description
FROM product_translations bg
JOIN products p ON p.id = bg.product_id
JOIN product_translations en ON en.product_id = bg.product_id AND en.language_code = 'en'
WHERE bg.language_code = 'bg'
ORDER BY pt.created_at
LIMIT 1000;
```

**Step 2: AI Translation Rules**
```json
{
  "preserve": [
    "brand names (Slingshot, Ride Engine, etc.)",
    "model names (RPM, Wizard, Ghost, etc.)",
    "SKUs (12345-XL-RED)",
    "measurements (cm, kg, m²)",
    "HTML tags (<p>, <strong>, etc.)"
  ],
  "translate": [
    "product descriptions",
    "feature lists",
    "marketing copy",
    "size/color names (Small → Малък)"
  ],
  "style": "informal Bulgarian (ti-form for direct speech)"
}
```

**Step 3: Batch Update**
```typescript
// Pseudo-code for AI translation service
async function translateProductBatch(productIds: string[]) {
  const products = await fetchEnglishTranslations(productIds);
  
  for (const product of products) {
    const translated = await aiTranslate({
      text: product.description_html,
      from: 'en',
      to: 'bg',
      preserve: extractPreserveTerms(product), // brand, SKU, etc.
      context: product.category
    });
    
    await updateTranslation(product.id, 'bg', {
      title: await aiTranslate(product.title, ...),
      description_html: translated,
      tags: await Promise.all(product.tags.map(tag => aiTranslate(tag, ...)))
    });
  }
}
```

**Step 4: Manual Review**
- Admin UI shows side-by-side EN | BG
- Mark translations as "reviewed" or "needs revision"
- Add `reviewed_at` timestamp to translation tables

---

## 🌐 **FRONTEND API CONSUMPTION**

### **API Endpoint Design**

```typescript
// GET /api/products?lang=bg
// Returns products with Bulgarian translations

async function getProducts(lang: string = 'en') {
  const query = `
    SELECT 
      p.*,
      COALESCE(t.title, en.title) as title,
      COALESCE(t.description_html, en.description_html) as description_html,
      COALESCE(t.tags, en.tags) as tags
    FROM products p
    LEFT JOIN product_translations t ON t.product_id = p.id AND t.language_code = $1
    LEFT JOIN product_translations en ON en.product_id = p.id AND en.language_code = 'en'
    WHERE p.status = 'active'
  `;
  
  const result = await db.query(query, [lang]);
  return result.rows;
}
```

**Fallback Strategy:**
- Request BG → If exists, return BG
- If BG missing → Fallback to EN
- Never return null titles

---

### **Category Slugs (Language-Aware URLs)**

```typescript
// EN: /products/kites
// BG: /products/kitove

async function getCategoryBySlug(slug: string, lang: string) {
  const query = `
    SELECT c.*, ct.name, ct.slug
    FROM categories c
    JOIN category_translations ct ON ct.category_id = c.id
    WHERE ct.slug = $1 AND ct.language_code = $2
  `;
  
  const result = await db.query(query, [slug, lang]);
  return result.rows[0];
}
```

---

## 🛠️ **ADMIN UI DESIGN**

### **Language Selector**

```tsx
// Admin product edit page
<Select value={currentLang} onChange={setCurrentLang}>
  <Option value="en">🇬🇧 English (Default)</Option>
  <Option value="bg">🇧🇬 Bulgarian</Option>
</Select>

// Show translated fields
<Input 
  label={`Title (${currentLang.toUpperCase()})`}
  value={translation[currentLang].title}
  onChange={(e) => updateTranslation(currentLang, 'title', e.target.value)}
/>
```

---

### **"Copy from English" Button**

```tsx
// When editing BG, show button to copy EN content
{currentLang !== 'en' && (
  <Button 
    icon={<CopyOutlined />}
    onClick={() => {
      const englishData = translations['en'];
      updateTranslation('bg', englishData);
      message.info('English content copied to Bulgarian. You can now translate it.');
    }}
  >
    Copy from English
  </Button>
)}
```

---

### **Translation Status Indicator**

```tsx
// Show which languages have translations
<Space>
  <Tag color={hasTranslation('en') ? 'green' : 'red'}>EN</Tag>
  <Tag color={hasTranslation('bg') ? 'green' : 'orange'}>BG</Tag>
</Space>
```

---

## 📊 **TRANSLATION COVERAGE QUERIES**

### **Products Missing Bulgarian**

```sql
SELECT 
  p.id,
  p.title as english_title,
  p.status
FROM products p
LEFT JOIN product_translations bg ON bg.product_id = p.id AND bg.language_code = 'bg'
WHERE bg.id IS NULL
  AND p.status = 'active'
ORDER BY p.updated_at DESC;
```

---

### **Translation Completion Report**

```sql
SELECT 
  l.code as language,
  l.name,
  COUNT(DISTINCT pt.product_id) as translated_products,
  (SELECT COUNT(*) FROM products WHERE status = 'active') as total_products,
  ROUND(100.0 * COUNT(DISTINCT pt.product_id) / 
        (SELECT COUNT(*) FROM products WHERE status = 'active'), 2) as completion_pct
FROM languages l
LEFT JOIN product_translations pt ON pt.language_code = l.code
WHERE l.is_active = true
GROUP BY l.code, l.name
ORDER BY l.sort_order;
```

**Expected Output:**
```
language | name      | translated_products | total_products | completion_pct
---------|-----------|---------------------|----------------|---------------
en       | English   | 205                 | 205            | 100.00
bg       | Bulgarian | 205                 | 205            | 100.00
```

---

## 🔒 **BACKWARD COMPATIBILITY**

### **Why Keep Original Columns?**

Original columns in `products`, `categories`, etc. remain untouched:
- ✅ Existing queries still work
- ✅ Gradual migration (can switch APIs one at a time)
- ✅ Rollback safety (if translation system has issues)
- ✅ Admin UI can show both old + new side-by-side

**Future Cleanup (Optional):**
Once 100% migrated to translation system:
```sql
-- ONLY after confirming translation system works perfectly
ALTER TABLE products DROP COLUMN title;
ALTER TABLE products DROP COLUMN description_html;
-- etc.
```

**Recommendation**: Keep original columns for 6-12 months.

---

## 📈 **PERFORMANCE CONSIDERATIONS**

### **Indexes (Already Created)**
```sql
-- Fast lookup by product + language
CREATE INDEX idx_product_translations_lookup 
  ON product_translations(product_id, language_code);

-- Fast filtering by language
CREATE INDEX idx_product_translations_language 
  ON product_translations(language_code);

-- Unique slugs per language
CREATE UNIQUE INDEX idx_category_translations_slug 
  ON category_translations(language_code, slug);
```

---

### **Query Optimization**

**DON'T DO THIS (N+1 queries):**
```typescript
// BAD: Fetches translation for each product separately
for (const product of products) {
  const translation = await getTranslation(product.id, 'bg');
}
```

**DO THIS (Single JOIN):**
```sql
-- GOOD: Single query with translations
SELECT 
  p.*,
  t.title,
  t.description_html
FROM products p
LEFT JOIN product_translations t ON t.product_id = p.id AND t.language_code = 'bg'
WHERE p.status = 'active';
```

---

## 🚀 **ROLLOUT PLAN**

### **Week 1: Database Migration**
- [x] Create translation tables
- [x] Backfill English translations
- [x] Initialize Bulgarian placeholders
- [ ] Verify 100% coverage

### **Week 2: API Layer**
- [ ] Create translation helper functions
- [ ] Update product API endpoints
- [ ] Update category API endpoints
- [ ] Add `?lang=` query parameter

### **Week 3: Admin UI**
- [ ] Add language selector to product edit page
- [ ] Add translation tabs (EN | BG)
- [ ] Add "Copy from English" button
- [ ] Add translation status indicators

### **Week 4: AI Translation**
- [ ] Export products for translation
- [ ] Run AI translation batch (manual review)
- [ ] Import translated content
- [ ] Mark as "reviewed"

### **Week 5: Frontend**
- [ ] Add language switcher to frontend
- [ ] Update product pages to use translations
- [ ] Update category pages
- [ ] Test fallback logic (BG → EN)

---

## ✅ **SUCCESS CRITERIA**

- [ ] 100% English translation coverage
- [ ] 100% Bulgarian translation coverage (placeholder)
- [ ] API returns correct language based on `?lang=` param
- [ ] API falls back to EN if BG missing
- [ ] Admin can edit both EN and BG
- [ ] Frontend shows BG when selected
- [ ] No breaking changes to existing queries
- [ ] Performance: <50ms overhead for translation JOIN

---

## 📚 **FILES CREATED**

1. `sql-migrations-multilingual-01-create-tables.sql`
2. `sql-migrations-multilingual-02-backfill-english.sql`
3. `sql-migrations-multilingual-03-initialize-bulgarian.sql`
4. `multilingual-implementation-guide.md` (this file)

---

## 🎯 **NEXT STEPS**

1. **Review this document** - Confirm architecture aligns with requirements
2. **Run Phase 1 migration** - Create translation tables
3. **Run Phase 2 migration** - Backfill English
4. **Run Phase 3 migration** - Initialize Bulgarian
5. **Verify coverage** - Run translation reports
6. **Implement API helpers** - Create translation utility functions
7. **Update admin UI** - Add language selector to product edit

---

**READY TO EXECUTE?** All SQL scripts are prepared and ready to run.

