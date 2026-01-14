# Railway Storage Variables

The application currently has two different storage clients (`lib/railway/s3-client.ts` and `lib/railway/storage.ts`) with distinct environment variable requirements. To ensure specific routes (like `/api/media`) work correctly and to prevent 503 errors, you must set the following variables in Railway.

## Database Variables (Postgres)

Your code at `lib/dbPg.ts` uses **PostgreSQL**, not MySQL.

| Variable Name | Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Connection string |

> **Note**: Do NOT use `MYSQL_URL` or `MYSQL_...` variables. The application will ignore them.

## Critical Storage Variables

If you are using a single bucket and user for everything, you must **duplicate** your credentials across these variable names.

| Variable Name | Value (Example) | Notes |
| :--- | :--- | :--- |
| `S3_ENDPOINT` | `https://storage.railway.app` | Required by s3-client |
| `S3_REGION` | `auto` | Required by s3-client |
| `S3_ACCESS_KEY_ID_PUBLIC` | **[Your S3 Access Key]** | **CRITICAL**: s3-client does not fallback to generic Key |
| `S3_ACCESS_KEY_ID_PRIVATE` | **[Your S3 Access Key]** | **CRITICAL**: s3-client does not fallback to generic Key |
| `S3_SECRET_ACCESS_KEY_PUBLIC` | **[Your S3 Secret Key]** | **CRITICAL**: s3-client does not fallback to generic Key |
| `S3_SECRET_ACCESS_KEY_PRIVATE` | **[Your S3 Secret Key]** | **CRITICAL**: s3-client does not fallback to generic Key |
| `S3_BUCKET_PUBLIC` | `slingshotnewimages-hw-tht` | Your existing bucket name |
| `S3_BUCKET_PRIVATE` | `slingshotnewimages-hw-tht` | Your existing bucket name (or separate private bucket) |
| `S3_PUBLIC_URL` | *Optional* | If you have a custom domain for images |

## Backward Compatibility (Safe Guard)

To satisfy `lib/railway/storage.ts` if it is used by legacy or specific admin routes:

| Variable Name | Value |
| :--- | :--- |
| `RAILWAY_STORAGE_ENDPOINT` | *(Same as S3_ENDPOINT)* |
| `RAILWAY_STORAGE_ACCESS_KEY_ID` | *(Same as Access Key)* |
| `RAILWAY_STORAGE_SECRET_ACCESS_KEY` | *(Same as Secret Key)* |
| `RAILWAY_STORAGE_REGION` | `us-east-1` (or your region) |
| `RAILWAY_STORAGE_BUCKET_PUBLIC` | *(Same as S3_BUCKET_PUBLIC)* |

## Why this is necessary
The code at `lib/railway/s3-client.ts` uses strictly typed lookups:
```typescript
const accessKeyId = isPublic
    ? process.env.S3_ACCESS_KEY_ID_PUBLIC
    : process.env.S3_ACCESS_KEY_ID_PRIVATE;
```
It **does not** fallback to `S3_ACCESS_KEY_ID`. If you only set `S3_ACCESS_KEY_ID`, the application will crash with "S3 credentials not set".
