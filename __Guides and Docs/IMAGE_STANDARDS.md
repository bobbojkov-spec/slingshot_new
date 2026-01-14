# IMAGE standards and resizing Policy

This document defines how **Vanity Atelier** handles image uploads, optional cropping, resizing, storage, and database metadata.

---

## 1) Goals

- **Consistent quality** across admin + front end
- **Fast pages**: always serve the smallest acceptable image variant
- **Predictable storage**: every image has the same set of variants
- **Non-destructive editing**: keep the original; derived variants can be regenerated

---

## 2) Accepted formats and normalization

### 2.1 Upload input formats (admin)
Allowed:
- `image/jpeg`, `image/png`, `image/webp`, `image/avif`

Rejected:
- HEIC/HEIF (unless converter added)
- SVG for product photos

### 2.2 Storage output formats (server)
Store variants as:
- **WebP** (preferred for size/perf)
- PNG only if transparency is required (logos, icons)

**Rule**: Keep `original` exactly as uploaded (byte-for-byte) whenever possible.

### 2.3 Orientation
Always apply EXIF orientation during processing so all derivatives are “visually correct”.

---

## 3) Variants and target sizes

We produce **four** variants per image:

| Variant | Purpose | Target max dimension | Notes |
|---|---|---:|---|
| `thumb` | lists, chips, admin tables | 300 px | keep detail minimal |
| `middlesize` | category cards, sliders | 800 px | primary browsing |
| `fullsize` | product gallery, zoom | 1600 px | high quality |
| `original` | source of truth | unchanged | never used directly on frontend unless necessary |

**Resize rule**: Fit within the max dimension while keeping aspect ratio.
**Upscale rule**: never upscale.

---

## 4) Upload UX rules

### 4.1 Single image upload (optional crop tool)
Use the crop tool when:
- The image is a **primary product image** (hero)
- You want consistent framing for grids

**Important**: Cropping is applied **before** resizing variants.

### 4.2 Multiple image upload (no crop tool)
- Files are processed as-is.
- User can reorder images after upload.

---

## 5) Server-side processing pipeline

### 5.1 Processing steps
1. **Ingest original** (validate mime + size)
2. **Read metadata** (width, height, orientation)
3. **Apply crop** (if provided)
4. **Generate variants** (thumb, middle, full) using `sharp`
5. **Write variants to bucket**
6. **Upsert DB metadata**

### 5.2 Idempotency
Processing should be idempotent. Use stable `image_id` prefix.

---

## 6) Bucket structure

Store images in a single bucket with prefixes:

```
images/
  {image_id}/
    original.{ext}
    thumb.webp
    middlesize.webp
    fullsize.webp
```

---

## 7) Database model

Table: `images`

- `id UUID PRIMARY KEY`
- `entity_type TEXT` (e.g., 'page', 'product')
- `entity_id UUID`
- `role TEXT` (e.g., 'hero', 'gallery')
- `original_width` / `original_height`
- `key_original`, `key_thumb`, `key_middle`, `key_full`
- `crop_json JSONB`

---

## 8) Serving strategy

### 8.1 Usage
- Admin tables: **thumb**
- Cards/Grids: **middlesize**
- Detail/Hero: **fullsize**
- Download: **original**

### 8.2 URLs
The frontend receives **signed URLs** for each variant from the API. The DB stores only the S3 keys.

---
