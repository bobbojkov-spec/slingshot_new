# Supabase → Railway Object Storage Migration Playbook

**Objective:** Define the canonical, repeatable process for migrating projects designed in Lovable (Supabase-based) to Railway Object Storage using **Presigned URLs**.

---

## 0. Context & Problem Statement

**Lovable-generated projects assume:**
*   Supabase Storage
*   Public bucket URLs
*   Frontend-direct image access

**Railway uses:**
*   Private object storage buckets
*   NO automatic public URLs
*   S3-compatible API only

**Because of this mismatch:**
*   Supabase image logic cannot be reused
*   Image upload + serving must be rebuilt deliberately

---

## 1. Non‑Negotiable Rules (Read First)

These rules apply to all projects.

### ❌ Forbidden Forever
*   Writing images to local filesystem (`/uploads`, `/public`, etc.)
*   `multer.diskStorage`
*   `fs.writeFile`, `fs.createWriteStream`
*   Serving images from Express static folders
*   Returning `/api/images/...` proxy URLs to frontend
*   Assuming uploads return a usable URL

### ✅ Required Always
*   Upload images directly to Railway Object Storage
*   Buckets remain **PRIVATE**
*   Backend generates **PRESIGNED URLs**
*   Frontend uses presigned Railway URLs only
*   **URL Format:** Virtual-hosted style (`https://<bucket>.storage.railway.app/...`)

If any rule is violated, the implementation is invalid.

---

## 2. Correct Mental Model (Critical)

**Supabase (what Lovable assumes)**
*   Upload → get public URL
*   Frontend uses URL directly

**Railway (actual reality)**
*   Upload → get object key only
*   NO public URL exists
*   Backend must generate a presigned URL

**Uploading to Railway never gives a browser‑usable URL.**

---

## 3. Canonical Architecture

### Upload Flow
1.  Frontend sends `multipart/form-data`
2.  Backend receives file
3.  Backend uploads file to Railway bucket
4.  Backend stores **object key** in DB

**Example object key:**
`hero/1765739448568_blog.jpg`

### Serve Flow (MANDATORY)
1.  Backend generates presigned URL
2.  Backend returns presigned URL to frontend
3.  Frontend uses URL directly in `<img src>`

**Example URL (Virtual-Hosted Style):**
`https://<bucket>.storage.railway.app/<path>/<file>.jpg?X-Amz-...`

**Note:** No backend proxy. No local paths.

---

## 4. Image Variants (Required Pattern)

If generating sizes (hero, gallery, etc.):
Each variant is a separate object.

### Stored in DB
*   `original_key`: `hero/uuid.jpg`
*   `large_key`: `hero/uuid_900.jpg`
*   `medium_key`: `hero/uuid_500.jpg`
*   `thumbnail_key`: `hero/uuid_300.jpg`

### Returned to Frontend
```json
{
  "original": "<presigned-url>",
  "large": "<presigned-url>",
  "medium": "<presigned-url>",
  "thumbnail": "<presigned-url>"
}
```

### Step 3: Update Frontend URLs
Change the base URL for images in your frontend config.

*   **Old (Supabase):** `https://[project].supabase.co/storage/v1/object/public/[bucket]/[file]`
*   **New (Railway Proxy):** `https://[your-admin-domain]/api/assets/[file]`

This keeps the bucket private while allowing the frontend to display images securely.