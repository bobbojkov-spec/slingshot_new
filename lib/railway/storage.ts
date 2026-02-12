// Railway Storage Client (S3-compatible)
// Supports AWS S3, MinIO, Cloudflare R2, and other S3-compatible storage

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand, GetObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Public bucket configuration
const storageType = process.env.RAILWAY_STORAGE_TYPE || 's3';
const storageEndpoint = process.env.RAILWAY_STORAGE_ENDPOINT || process.env.AWS_ENDPOINT_URL;
const storageRegion = process.env.RAILWAY_STORAGE_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const storageAccessKey = process.env.RAILWAY_STORAGE_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const storageSecretKey = process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const publicUrlBase = process.env.RAILWAY_STORAGE_PUBLIC_URL_BASE;

// Raw/Admin bucket configuration (separate credentials)
const rawStorageType = process.env.RAILWAY_STORAGE_RAW_TYPE || storageType;
const rawStorageEndpoint = process.env.RAILWAY_STORAGE_RAW_ENDPOINT || storageEndpoint;
const rawStorageRegion = process.env.RAILWAY_STORAGE_RAW_REGION || storageRegion;
const rawStorageAccessKey = process.env.RAILWAY_STORAGE_RAW_ACCESS_KEY_ID || storageAccessKey;
const rawStorageSecretKey = process.env.RAILWAY_STORAGE_RAW_SECRET_ACCESS_KEY || storageSecretKey;

// Storage bucket names (matching Supabase buckets)
export const STORAGE_BUCKETS = {
  PUBLIC: process.env.RAILWAY_STORAGE_BUCKET_PUBLIC || process.env.AWS_S3_BUCKET_NAME || process.env.BUCKET || 'slingshot-images-dev',
  RAW: process.env.RAILWAY_STORAGE_BUCKET_RAW || 'slingshot-raw',
} as const;

// Initialize S3 clients (separate for public and raw buckets)
let s3Client: S3Client | null = null;
let rawS3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!storageEndpoint || !storageAccessKey || !storageSecretKey) {
      throw new Error('Railway Storage not configured. Missing RAILWAY_STORAGE_* environment variables.');
    }

    s3Client = new S3Client({
      endpoint: storageEndpoint,
      region: storageRegion,
      credentials: {
        accessKeyId: storageAccessKey,
        secretAccessKey: storageSecretKey,
      },
      forcePathStyle: storageType === 'minio', // MinIO requires path-style URLs
    });
  }

  return s3Client;
}

function getRawS3Client(): S3Client {
  if (!rawS3Client) {
    // Use raw bucket credentials if provided, otherwise fall back to public bucket credentials
    const endpoint = rawStorageEndpoint || storageEndpoint;
    const accessKey = rawStorageAccessKey || storageAccessKey;
    const secretKey = rawStorageSecretKey || storageSecretKey;

    if (!endpoint || !accessKey || !secretKey) {
      throw new Error('Railway Raw Storage not configured. Missing RAILWAY_STORAGE_RAW_* environment variables.');
    }

    rawS3Client = new S3Client({
      endpoint: endpoint,
      region: rawStorageRegion,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: rawStorageType === 'minio', // MinIO requires path-style URLs
    });
  }

  return rawS3Client;
}

/**
 * Get public URL for a file in Railway storage
 */
export function getPublicImageUrl(filePath: string, bucket: string = STORAGE_BUCKETS.PUBLIC): string {
  if (publicUrlBase) {
    // Use custom public URL base if provided
    return `${publicUrlBase}/${bucket}/${filePath}`;
  }

  // Generate URL based on storage type
  if (storageType === 'minio' && storageEndpoint) {
    return `${storageEndpoint}/${bucket}/${filePath}`;
  }

  if (storageType === 'r2' && storageEndpoint) {
    return `${storageEndpoint}/${bucket}/${filePath}`;
  }

  // Default S3 URL format
  const endpoint = storageEndpoint || `https://s3.${storageRegion}.amazonaws.com`;
  return `${endpoint}/${bucket}/${filePath}`;
}

/**
 * Upload a file to Railway storage
 */
export async function uploadPublicImage(
  filePath: string,
  fileBuffer: Buffer,
  options?: {
    contentType?: string;
    upsert?: boolean;
    bucket?: string;
  }
) {
  const bucket = options?.bucket || STORAGE_BUCKETS.PUBLIC;
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: filePath,
    Body: fileBuffer,
    ContentType: options?.contentType || 'image/jpeg',
    // Note: upsert is handled by overwriting (S3 doesn't have explicit upsert)
  });

  await client.send(command);

  return {
    path: filePath,
    publicUrl: getPublicImageUrl(filePath, bucket),
  };
}

/**
 * Upload a raw/admin file to Railway storage (private bucket)
 * Uses separate credentials for raw bucket if configured
 */
export async function uploadRawFile(
  filePath: string,
  fileBuffer: Buffer,
  options?: {
    contentType?: string;
    upsert?: boolean;
  }
) {
  const bucket = STORAGE_BUCKETS.RAW;
  const client = getRawS3Client(); // Use raw bucket client

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: filePath,
    Body: fileBuffer,
    ContentType: options?.contentType || 'application/octet-stream',
  });

  await client.send(command);

  return {
    path: filePath,
    // Raw bucket URLs are typically private/signed URLs, not public
    publicUrl: filePath, // You may want to generate signed URLs for raw bucket
  };
}

/**
 * Download a file from Railway storage
 */
export async function downloadFile(filePath: string, bucket: string = STORAGE_BUCKETS.PUBLIC): Promise<Buffer> {
  // Use appropriate client based on bucket
  const client = bucket === STORAGE_BUCKETS.RAW ? getRawS3Client() : getS3Client();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: filePath,
  });

  const response = await client.send(command);

  if (!response.Body) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Generate a presigned GET URL for an object in Railway storage
 */
export async function getPresignedUrl(
  filePath: string,
  bucket: string = STORAGE_BUCKETS.PUBLIC,
  expiresIn = 60 * 5
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: filePath,
  });
  const client = getS3Client();
  const signedUrl = await getSignedUrl(client, command, { expiresIn });
  return signedUrl;
}

/**
 * Delete a file from Railway storage
 */
export async function deletePublicImage(filePath: string, bucket: string = STORAGE_BUCKETS.PUBLIC): Promise<boolean> {
  // Use appropriate client based on bucket
  const client = bucket === STORAGE_BUCKETS.RAW ? getRawS3Client() : getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: filePath,
  });

  await client.send(command);
  return true;
}

/**
 * List files in a bucket
 */
export async function listPublicImages(
  folder?: string,
  limit: number = 100,
  bucket: string = STORAGE_BUCKETS.PUBLIC
) {
  // Use appropriate client based on bucket
  const client = bucket === STORAGE_BUCKETS.RAW ? getRawS3Client() : getS3Client();

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: folder || '',
    MaxKeys: limit,
  });

  const response = await client.send(command);

  return (response.Contents || []).map(item => ({
    name: item.Key?.split('/').pop() || '',
    path: item.Key || '',
    size: item.Size || 0,
    lastModified: item.LastModified,
  }));
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string, bucket: string = STORAGE_BUCKETS.PUBLIC): Promise<boolean> {
  try {
    // Use appropriate client based on bucket
    const client = bucket === STORAGE_BUCKETS.RAW ? getRawS3Client() : getS3Client();

    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: filePath,
    });

    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Extract the file key from a public URL if it belongs to our storage
 */
export function getKeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  const publicBucket = STORAGE_BUCKETS.PUBLIC;
  const currentEndpoint = storageEndpoint;
  const currentUrlBase = publicUrlBase
    ? `${publicUrlBase}/${publicBucket}`
    : currentEndpoint
    ? `${currentEndpoint}/${publicBucket}`
    : null;

  const prefixesToRemove = [
    publicBucket || "",
    "slingshotnewimages-hw-tht",
  ].filter(Boolean);

  const cleanCandidate = (candidate: string): string | null => {
    const normalized = candidate.trim();
    if (!normalized) return null;

    let key = normalized.startsWith('/') ? normalized.slice(1) : normalized;
    if (!key) return null;

    let cleaning = true;
    while (cleaning) {
      cleaning = false;
      for (const prefix of prefixesToRemove) {
        if (key.startsWith(`${prefix}/`)) {
          key = key.slice(prefix.length + 1);
          cleaning = true;
          break;
        }
      }
    }

    return key || null;
  };

  const isAbsoluteUrl = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmedUrl);

  if (!isAbsoluteUrl) {
    return cleanCandidate(trimmedUrl);
  }

  try {
    const u = new URL(trimmedUrl);
    let candidate = "";

    if (currentUrlBase && trimmedUrl.startsWith(currentUrlBase)) {
      candidate = trimmedUrl.substring(currentUrlBase.length);
    } else {
      const pathname = u.pathname;
      const parts = pathname.split('/');
      if (parts.length >= 3 && parts[1] === publicBucket) {
        candidate = parts.slice(2).join('/');
      } else {
        candidate = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      }
    }

    candidate = candidate.split(/[?#]/)[0];
    return cleanCandidate(candidate);
  } catch (e) {
    console.error('Error parsing URL key:', e);
    const candidate = trimmedUrl.split(/[?#]/)[0];
    return cleanCandidate(candidate);
  }
}
