# Mobile UI/UX Fix Plan

## Project: Slingshot Bulgaria

**Based on:** [Mobile-UIUX Alignment Report](./mobile-uiux-alignment-report.md)  
**Overall Alignment:** 85% (Good - Fixes Needed)  
**Priority:** Fix P1 issues before mobile launch

---

## Fix Priority Matrix

| Priority | Issue Count | Impact | Effort |
|----------|-------------|--------|--------|
| **P1 - Critical** | 2 | Mobile users cannot complete key actions | Low |
| **P2 - Important** | 3 | Degraded mobile UX | Low-Medium |
| **P3 - Enhancement** | 2 | Nice to have improvements | Low |

---

## P1 - CRITICAL FIXES (Do First)

### 1.1 Product Card Quick-Add Button Invisible on Mobile

**Problem:** Users on touch devices cannot add products to cart because the quick-add button only appears on hover.

**Location:** [`globals.css`](app/globals.css:290-298)

**Current Code:**
```css
.product-card-quick-add {
  @apply opacity-0 translate-y-2;
}
.product-card:hover .product-card-quick-add {
  @apply opacity-100 translate-y-0;
}
```

**Fix:**
```css
.product-card-quick-add {
  @apply opacity-100 translate-y-0 lg:opacity-0 lg:translate-y-2;
}
@media (min-width: 1024px) {
  .product-card-quick-add {
    @apply opacity-0 translate-y-2;
  }
  .product-card:hover .product-card-quick-add {
    @apply opacity-100 translate-y-0;
  }
}
```

**Testing:**
- [ ] Verify button visible on mobile (375px-428px)
- [ ] Verify button still appears on hover on desktop
- [ ] Test tap functionality on iOS Safari
- [ ] Test tap functionality on Android Chrome

---

### 1.2 Collection Hover Arrows Hidden on Mobile

**Problem:** The arrow navigation hint on collection cards is hidden on touch devices.

**Location:** [`BrandCollectionsClient.tsx`](components/collections/BrandCollectionsClient.tsx:111-114)

**Current Code:**
```tsx
<div className="absolute top-4 right-4 z-10 opacity-0 transform translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
```

**Fix:**
```tsx
<div className="absolute top-4 right-4 z-10 opacity-100 translate-x-0 lg:opacity-0 lg:translate-x-2 transition-all duration-300 group-hover:lg:opacity-100 group-hover:lg:translate-x-0">
```

**Alternative:** Make it always visible on mobile with lower opacity

**Testing:**
- [ ] Arrow visible on mobile devices
- [ ] Arrow still animates on desktop hover

---

## P2 - IMPORTANT FIXES

### 2.1 Add inputmode="tel" to Phone Input

**Problem:** Phone input brings up alphanumeric keyboard instead of numeric keypad on mobile.

**Location:** [`app/inquiry/contact/page.tsx`](app/inquiry/contact/page.tsx:144)

**Current Code:**
```tsx
<Input
  placeholder={t("inquiry.contactPage.placeholders.phone")}
  className="bg-card"
  value={formValues.phone}
  onChange={(e) => setFormValues((prev) => ({ ...prev, phone: e.target.value }))}
/>
```

**Fix:**
```tsx
<Input
  type="tel"
  inputMode="tel"
  placeholder={t("inquiry.contactPage.placeholders.phone")}
  className="bg-card"
  value={formValues.phone}
  onChange={(e) => setFormValues((prev) => ({ ...prev, phone: e.target.value }))}
/>
```

**Testing:**
- [ ] Numeric keypad appears on iOS
- [ ] Numeric keypad appears on Android
- [ ] Input still accepts formatting characters (+, -, spaces)

---

### 2.2 Increase Color Selector Touch Targets

**Problem:** Color swatches are 40px (w-10 h-10), below the 44px minimum.

**Location:** [`ColorSelector.tsx`](components/ColorSelector.tsx:33)

**Current Code:**
```tsx
className={`relative w-10 h-10 rounded transition-all ${color.bgClass}`}
```

**Fix:**
```tsx
className={`relative w-11 h-11 rounded transition-all ${color.bgClass}`}
// Or use touch-target for 48px:
className={`relative touch-target rounded transition-all ${color.bgClass}`}
```

**Testing:**
- [ ] Touch target ≥ 44px
- [ ] Visual appearance acceptable
- [ ] No layout breaking

---

### 2.3 Make Subtitle Reveals Accessible on Mobile

**Problem:** Category subtitles only appear on hover, mobile users miss this information.

**Locations:**
- [`ShopByCategories.tsx`](components/home/ShopByCategories.tsx:111-113)
- [`CollectionShopClient.tsx`](components/collections/CollectionShopClient.tsx:118-123)

**Fix Options:**

**Option A: Always visible on mobile**
```tsx
<p className="text-sm text-white/70 font-body line-clamp-2 opacity-100 translate-y-0 lg:opacity-0 lg:translate-y-2 transition-all duration-500 group-hover:lg:opacity-100 group-hover:lg:translate-y-0">
```

**Option B: Show on tap (using active state)**
```tsx
<p className="text-sm text-white/70 font-body line-clamp-2 opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 active:opacity-100 active:translate-y-0 lg:opacity-0 lg:translate-y-2">
```

**Testing:**
- [ ] Subtitles visible/readable on mobile
- [ ] Still has hover effect on desktop

---

## P3 - ENHANCEMENT FIXES

### 3.1 Add inputmode to All Form Inputs

**Locations:**
- [`ContactForm.tsx`](components/modules/ContactForm.tsx) - name field
- [`inquiry/contact/page.tsx`](app/inquiry/contact/page.tsx) - potentially others

**Recommended Attributes:**
```tsx
// Name field
<input type="text" inputMode="text" />

// Search (already done)
<input type="search" inputMode="search" />

// Email (already done)
<input type="email" inputMode="email" />

// Phone (fix needed)
<input type="tel" inputMode="tel" />

// Quantity selectors
<input type="number" inputMode="numeric" pattern="[0-9]*" />
```

---

### 3.2 Increase Gallery Close Button Touch Target

**Location:** [`ProductGallery.tsx`](components/ProductGallery.tsx:101)

**Current:** `w-10 h-10` (40px)

**Fix:** Wrap in larger hit area
```tsx
<button
  onClick={() => setIsZoomOpen(false)}
  className="absolute top-4 right-4 z-10 touch-target flex items-center justify-center"
  aria-label="Close"
>
  <div className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors">
    <X className="w-5 h-5 text-white" />
  </div>
</button>
```

---

## Implementation Order

### Week 1: Critical Fixes
1. **Day 1-2:** Fix quick-add button visibility (P1.1)
2. **Day 3:** Fix collection arrows visibility (P1.2)
3. **Day 4-5:** Test both fixes on real devices

### Week 2: Important Fixes
1. **Day 1:** Add inputmode="tel" to phone inputs (P2.1)
2. **Day 2:** Increase color selector touch targets (P2.2)
3. **Day 3-4:** Make subtitle reveals accessible (P2.3)
4. **Day 5:** Testing and QA

### Week 3: Enhancements (Optional)
1. Add inputmode to all form inputs (P3.1)
2. Increase gallery button touch target (P3.2)

---

## Testing Checklist

### Device Testing
- [ ] iPhone 12/13/14 (390px width)
- [ ] iPhone SE (375px width)
- [ ] Samsung Galaxy S21 (360px width)
- [ ] iPad (768px width) - tablet verification

### Interaction Testing
- [ ] Tap quick-add button on product cards
- [ ] Tap collection cards with arrows visible
- [ ] Phone input shows numeric keypad
- [ ] All touch targets feel responsive
- [ ] No accidental activation of adjacent elements

### Regression Testing
- [ ] Desktop hover effects still work
- [ ] Grid layouts intact
- [ ] No visual breaking
- [ ] Performance unchanged

---

## Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| [`app/globals.css`](app/globals.css) | 290-298 | Quick-add mobile visibility |
| [`components/collections/BrandCollectionsClient.tsx`](components/collections/BrandCollectionsClient.tsx) | 111-114 | Arrow always visible mobile |
| [`app/inquiry/contact/page.tsx`](app/inquiry/contact/page.tsx) | 144 | Add inputMode="tel" |
| [`components/ColorSelector.tsx`](components/ColorSelector.tsx) | 33 | Increase touch target |
| [`components/home/ShopByCategories.tsx`](components/home/ShopByCategories.tsx) | 111-113 | Subtitle mobile visibility |
| [`components/collections/CollectionShopClient.tsx`](components/collections/CollectionShopClient.tsx) | 118-123 | Subtitle mobile visibility |

---

## Success Criteria

### P1 Fixes Success
- [ ] Mobile users can add products to cart via quick-add button
- [ ] Mobile users see collection navigation arrows

### P2 Fixes Success
- [ ] Phone input brings up numeric keypad
- [ ] Color swatches are 44px minimum
- [ ] Subtitle text readable on mobile without hover

### Overall Success
- [ ] Mobile alignment score increases from 85% to 95%+
- [ ] No critical hover-only interactions remain
- [ ] All touch targets ≥ 44px

---

*Plan created: 2026-02-08*  
*Estimated implementation time: 2-3 weeks*  
*Estimated effort: 20-30 hours*
