
# 📸 Image Handling Architecture & Best Practices
**Project:** Any project that uses Railway buckets

---

## 🛑 STOP & READ
**If you are an AI Agent or Developer working on this project, you MUST follow these rules.**
Deviation from this architecture will result in broken images, double-signed URLs, and application errors.

---

## 1. The Core Philosophy
The application follows a strict **Server-Side Signing** pattern.

1.  **Database**: Stores only the **Relative Path** (e.g., `products/image.jpg`).
2.  **API**: Converts the Path -> **Signed, Renewable URL** (e.g., `https://s3.../img.jpg?signature=...`).
3.  **Frontend**: Receives the ready-to-use URL and displays it. **No processing allowed.**

> **Rule #1:** NEVER store a full `https://` URL in the database `path` column.
> **Rule #2:** NEVER try to construct the URL string on the client/frontend.
> **Rule #3:** ALWAYS use the `getPresignedUrl` helper in the backend.

## 1.1 Absolute Rule: Where Signing Is Allowed

Presigned URLs may be generated ONLY in dedicated backend API routes
(e.g. `/api/media/sign`, `/api/products/*`).

Signing is STRICTLY FORBIDDEN in:
- React components
- Server Components
- Page routes that render HTML
- SSR logic
- Frontend utilities

If a presigned URL is generated during page render, the architecture is BROKEN.

---

## 2. Backend Implementation (The "Source of Truth")

### Logic Location
All storage logic lives in: `lib/railway/storage.ts`

### Key Function: `getPresignedUrl`
This function is responsible for securely asking the S3 provider "Give me a temporary public URL for this private file."

```typescript
// ✅ CORRECT USAGE
import { getPresignedUrl } from '@/lib/railway/storage';

const secureUrl = await getPresignedUrl('products/my-image.jpg');
// Returns: "https://bucket.s3.region.amazonaws.com/products/my-image.jpg?X-Amz-Signature=..."
```

### API Routes
All API routes (`app/api/...`) that return image data **MUST** resolve the path before sending the JSON response.

**Example: `app/api/products/route.ts`**
```typescript
// ❌ BAD: Sending raw path
// return { image: "products/foo.jpg" }

// ✅ GOOD: Resolving before return
const products = await Promise.all(rows.map(async (row) => ({
    ...row,
    image: row.image_path ? await getPresignedUrl(row.image_path) : '/placeholder.jpg'
})));
```

---

## 3. Frontend Implementation (The "Dumb" Consumer)

The Frontend (Next.js components) should be completely ignorant of S3, buckets, or storage mechanisms. It simply receives a string and puts it in an `<img>` tag.

**Example: `components/ProductCard.tsx`**

```tsx
// ❌ WRONG: Trying to build URL
// <img src={`https://my-bucket/${product.image}`} />

// ✅ CORRECT: Trusting the API
<img src={product.image} alt={product.name} />
```

---

## 4. Environment Variables
The system relies on these `.env` variables to function. If images break, check these first.

*   `RAILWAY_STORAGE_ENDPOINT`: The URL of the S3 provider (e.g., `https://s3.us-east-1.amazonaws.com` or Railway equivalent).
*   `RAILWAY_STORAGE_REGION`: (e.g., `us-east-1`)
*   `RAILWAY_STORAGE_ACCESS_KEY_ID`: Secret Key ID
*   `RAILWAY_STORAGE_SECRET_ACCESS_KEY`: Secret Access Key
*   `RAILWAY_STORAGE_BUCKET_PUBLIC`: The name of the bucket (e.g., `blablabla-images-dev`).

---

## 5. Troubleshooting Guide

### Case A: Image is broken (403 Forbidden)
*   **Cause**: The signature is invalid or expired.
*   **Fix**: Check if standard time is correct on server. Check if `AccessKey` / `SecretKey` are correct.

### Case B: Image URL looks like `https://bucket.../https://bucket...`
*   **Cause**: "Double Signing". The Frontend is erroneously adding a domain to a URL that is already full.
*   **Fix**: Remove any template strings `` `${baseUrl}/${url}` `` in the Frontend components.

### Case C: Image URL is just `products/foo.jpg`
*   **Cause**: The API forgot to call `getPresignedUrl`.
*   **“Fix: Go to the data API route responsible for fetching product data (NOT a page or SSR route)…

---

**End of Instruction**
*Save this file and refer to it whenever touching image logic.*
