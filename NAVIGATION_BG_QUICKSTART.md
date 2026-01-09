# 🚀 Navigation Bulgarian Support - Quick Start Guide

## TL;DR

Complete Bulgarian language support for top navigation is implemented. Follow these 3 steps to activate:

### Step 1: Apply Database Migration (2 minutes)

```bash
cd /Users/borislavbojkov/dev/slingshot_new
psql $DATABASE_URL -f docs/sql-navigation-bulgarian-support.sql
```

### Step 2: Test API (30 seconds)

```bash
# Test English
curl "http://localhost:3000/api/navigation?lang=en" | jq '.categories[0].name'
# Expected: "Kite" (or similar)

# Test Bulgarian
curl "http://localhost:3000/api/navigation?lang=bg" | jq '.categories[0].name'
# Expected: "Кайт" (or similar)
```

### Step 3: Integrate Frontend (5 minutes)

Replace hardcoded nav links in your Header component:

```tsx
// Before:
const navLinks = [
  { name: t('nav.kites'), href: "/category/kites" },
  // ...
];

// After:
import NavLinks from "@/components/NavLinks";

<nav className="hidden lg:flex items-center gap-8">
  <NavLinks className="nav-link-white" />
</nav>
```

**Done! 🎉** Navigation now translates between EN ↔ BG automatically.

---

## What You Get

### In English (EN)
```
Navigation:
├─ Kite
│  ├─ GEAR
│  │  ├─ Kites
│  │  └─ Kite Bars
│  ├─ ACCESSORIES
│  │  └─ Harnesses
│  └─ CATEGORIES
│     └─ ...
└─ Wing
   └─ ...
```

### In Bulgarian (BG)
```
Navigation:
├─ Кайт
│  ├─ ЕКИПИРОВКА
│  │  ├─ Кайтове
│  │  └─ Кайт барове
│  ├─ АКСЕСОАРИ
│  │  └─ Харнеси
│  └─ КАТЕГОРИИ
│     └─ ...
└─ Уинг
   └─ ...
```

---

## Files Changed

### ✅ Database
- Added `menu_group` column to `product_types`
- Added Bulgarian translations for categories
- Added Bulgarian translations for product_types

### ✅ Backend
- `/api/admin/product-types` - Updated to support `menu_group`
- `/api/navigation?lang=bg` - New public endpoint

### ✅ Frontend
- `LanguageContext.tsx` - Added menu_group label translations
- `useNavigation.ts` - Hook to fetch navigation data
- `NavigationMenu.tsx` - Full hierarchical navigation component
- `NavLinks.tsx` - Simple navigation links component

---

## Quick Test Checklist

After applying changes:

- [ ] Database migration applied without errors
- [ ] API `/api/navigation?lang=en` returns English names
- [ ] API `/api/navigation?lang=bg` returns Bulgarian names (Кайт, Уинг, etc.)
- [ ] Frontend language switch updates navigation labels
- [ ] No hardcoded English text in UI

---

## Translation Examples

| Type | English | Bulgarian |
|------|---------|-----------|
| **Category** | Kite | Кайт |
| **Category** | Wing | Уинг |
| **Category** | Boards | Дъски |
| **Menu Group** | GEAR | ЕКИПИРОВКА |
| **Menu Group** | ACCESSORIES | АКСЕСОАРИ |
| **Product Type** | Kites | Кайтове |
| **Product Type** | Kite Bars | Кайт барове |
| **Product Type** | Harnesses | Харнеси |

---

## Documentation

📖 **Full Guides:**
- `docs/navigation-bulgarian-summary.md` - Overview
- `docs/navigation-bulgarian-implementation.md` - Complete architecture
- `docs/navigation-bulgarian-testing-guide.md` - Testing procedures

---

## Need Help?

### Navigation not loading?
```bash
# Check if backend is running
curl http://localhost:3000/api/health

# Check database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM category_translations WHERE language_code='bg';"
```

### Bulgarian text not showing?
```bash
# Verify translations exist
psql $DATABASE_URL -c "SELECT c.name as english, ct.name as bulgarian FROM categories c JOIN category_translations ct ON ct.category_id = c.id WHERE ct.language_code='bg' LIMIT 5;"
```

### API returns English even when lang=bg?
- Re-run the migration: `psql $DATABASE_URL -f docs/sql-navigation-bulgarian-support.sql`

---

## Status: ✅ COMPLETE & READY

All implementation files created. Ready to integrate!

**Next:** Apply database migration → Test API → Integrate frontend components

