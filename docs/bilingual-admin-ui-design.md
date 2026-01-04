# Bilingual Admin UI Design - Side-by-Side English/Bulgarian

## ✅ **CORRECT APPROACH**

### **Admin Interface Language**
- Admin UI labels, buttons, menus → **English only** (no translation needed)
- Product content (names, descriptions) → **English + Bulgarian side-by-side**

---

## 🎨 **UI Design: Stacked Inputs**

### **Visual Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Title                                               │
│                                                     │
│ 🇬🇧 English (fill first)                            │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [White background]                              │ │ ← English input
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 🇧🇬 Bulgarian          [📋 Copy from English]       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Light yellow background #fffbea]               │ │ ← Bulgarian input
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 **Components Created**

### **1. BilingualInput**
For simple text fields (title, SKU, etc.)
- English input (white)
- Bulgarian input (light yellow)
- "Copy from English" button

**Usage:**
```tsx
<BilingualInput
  label="Product Title"
  englishValue={enTitle}
  bulgarianValue={bgTitle}
  onEnglishChange={setEnTitle}
  onBulgarianChange={setBgTitle}
  placeholder="Enter product name"
/>
```

### **2. BilingualRichText**
For HTML content (descriptions, specs)
- Dual Quill editors
- English editor (white)
- Bulgarian editor (light yellow)
- "Copy from English" button

**Usage:**
```tsx
<BilingualRichText
  label="Description"
  englishValue={enDescription}
  bulgarianValue={bgDescription}
  onEnglishChange={setEnDescription}
  onBulgarianChange={setBgDescription}
/>
```

---

## 📋 **Workflow**

### **Adding New Product:**
1. Admin fills **English** fields first (white backgrounds)
2. Clicks **"Copy from English"** for each Bulgarian field
3. Translates Bulgarian text (yellow backgrounds)
4. Saves → Both languages stored in database

### **Editing Existing Product:**
1. Product page loads with:
   - English from `product_translations` (lang='en')
   - Bulgarian from `product_translations` (lang='bg')
2. Admin edits either language
3. Saves → Updates both translations

---

## 🌐 **Frontend Fallback Logic**

```javascript
// When displaying products on frontend
const displayTitle = bulgarianTitle || englishTitle;
```

**Rules:**
- If Bulgarian translation exists → Show Bulgarian
- If Bulgarian missing → Show English (fallback)
- Product names → **Always English** (brand names don't translate)

---

## 🎯 **Fields That Need Translation**

### **Products:**
- ✅ Title (BilingualInput)
- ✅ Description HTML (BilingualRichText)
- ✅ Description HTML 2 (BilingualRichText)
- ✅ Specs HTML (BilingualRichText)
- ✅ Package Includes (BilingualRichText)
- ✅ Tags (BilingualInput with tags mode)
- ✅ SEO Title (BilingualInput)
- ✅ SEO Description (BilingualInput, multiline)

### **NOT Translated:**
- ❌ SKU (universal)
- ❌ Handle (URL-safe identifier)
- ❌ Brand (proper noun)
- ❌ Price (number)
- ❌ Status (admin-only)

---

## 💾 **Database Storage**

### **When Saving Product:**

```typescript
// Save English translation
await query(`
  INSERT INTO product_translations (product_id, language_code, title, description_html, ...)
  VALUES ($1, 'en', $2, $3, ...)
  ON CONFLICT (product_id, language_code) DO UPDATE ...
`);

// Save Bulgarian translation
await query(`
  INSERT INTO product_translations (product_id, language_code, title, description_html, ...)
  VALUES ($1, 'bg', $2, $3, ...)
  ON CONFLICT (product_id, language_code) DO UPDATE ...
`);
```

---

## 🚀 **Next Steps**

1. ✅ Components created (`BilingualInput`, `BilingualRichText`)
2. ⏳ Update `InfoTab.tsx` to use bilingual components
3. ⏳ Update `SeoSection.tsx` to use bilingual components
4. ⏳ Update API to fetch both EN + BG translations
5. ⏳ Update API to save both EN + BG translations

---

## 📸 **Visual Reference**

**Color Coding:**
- **White (#ffffff)** = English (international, default)
- **Light Yellow (#fffbea)** = Bulgarian (local market)

**Why Yellow?**
- Easy to distinguish at a glance
- Not intrusive (soft color)
- Clearly indicates "this is the translation"
- Standard UX pattern for highlights/notes

---

## ✅ **Benefits of This Approach**

1. **No switching** - See both languages at once
2. **Fast workflow** - Copy button speeds up translation
3. **Visual clarity** - Color coding prevents mistakes
4. **Flexible** - Can fill Bulgarian first if needed
5. **Fallback-ready** - Frontend shows EN if BG missing
6. **Admin-friendly** - No context switching

---

**This is the correct pattern for bilingual content management!** 🎯

