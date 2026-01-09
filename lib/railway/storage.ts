// Railway Storage Client (S3-compatible)
// Supports AWS S3, MinIO, Cloudflare R2, and other S3-compatible storage

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand, GetObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Public bucket configuration
const storageType = process.env.RAILWAY_STORAGE_TYPE || 's3';
const storageEndpoint = process.env.RAILWAY_STORAGE_ENDPOINT;
const storageRegion = process.env.RAILWAY_STORAGE_REGION || 'auto';
const storageAccessKey = process.env.RAILWAY_STORAGE_ACCESS_KEY;
const storageSecretKey = process.env.RAILWAY_STORAGE_SECRET_KEY;
const publicUrlBase = process.env.RAILWAY_STORAGE_PUBLIC_URL_BASE;

// Raw/Admin bucket configuration (separate credentials)
const rawStorageType = process.env.RAILWAY_STORAGE_RAW_TYPE || storageType;
const rawStorageEndpoint = process.env.RAILWAY_STORAGE_RAW_ENDPOINT || storageEndpoint;
const rawStorageRegion = process.env.RAILWAY_STORAGE_RAW_REGION || storageRegion;
const rawStorageAccessKey = process.env.RAILWAY_STORAGE_RAW_ACCESS_KEY || storageAccessKey;
const rawStorageSecretKey = process.env.RAILWAY_STORAGE_RAW_SECRET_KEY || storageSecretKey;

// Storage bucket names (matching Supabase buckets)
export const STORAGE_BUCKETS = {
  PUBLIC: process.env.RAILWAY_STORAGE_BUCKET || 'slingshotnewimages-hw-tht',
  RAW: process.env.RAILWAY_STORAGE_BUCKET_RAW || 'slingshot-raw',
} as const;

let hasLoggedConfigWarning = false;

/**
 * Checks if mandatory Railway Storage environment variables are set.
 */
export function isRailwayStorageConfigured() {
  return Boolean(
    process.env.RAILWAY_STORAGE_ACCESS_KEY &&
    process.env.RAILWAY_STORAGE_SECRET_KEY &&
    process.env.RAILWAY_STORAGE_BUCKET &&
    process.env.RAILWAY_STORAGE_ENDPOINT
  );
}

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
      forcePathStyle: true, // Always true for better compatibility with non-AWS S3
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
  if (!isRailwayStorageConfigured()) {
    if (!hasLoggedConfigWarning) {
      console.warn('⚠️ Railway Storage not configured. Missing RAILWAY_STORAGE_* environment variables. Using fallback URLs.');
      hasLoggedConfigWarning = true;
    }

    const assetsBaseUrl = process.env.NEXT_PUBLIC_ASSETS_BASE_URL;
    if (assetsBaseUrl) {
      return `${assetsBaseUrl.replace(/\/$/, '')}/${bucket}/${filePath.replace(/^\//, '')}`;
    }

    // Last resort fallback: just return the path (UI might render placeholder)
    return filePath;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: filePath,
    });
    const client = getS3Client();
    const signedUrl = await getSignedUrl(client, command, { expiresIn });
    return signedUrl;
  } catch (error: any) {
    console.error(`Failed to generate presigned URL for ${filePath}:`, error.message);
    // Return fallback even on signing error if we have a base URL
    const assetsBaseUrl = process.env.NEXT_PUBLIC_ASSETS_BASE_URL;
    if (assetsBaseUrl) {
      return `${assetsBaseUrl.replace(/\/$/, '')}/${bucket}/${filePath.replace(/^\//, '')}`;
    }
    return filePath;
  }
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

