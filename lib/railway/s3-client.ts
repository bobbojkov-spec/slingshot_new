/**
 * Railway S3 Storage Client
 * Handles file uploads to Railway S3-compatible storage
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
if (typeof window === 'undefined') {
    config({ path: resolve(process.cwd(), '.env.local') });
}

// Storage bucket names (matching our structure)
export const STORAGE_BUCKETS = {
    PRODUCT_IMAGES: 'product-images',
    MEDIA_LIBRARY: 'media-library',
    HERO_SLIDES: 'hero-slides',
    NEWS_IMAGES: 'news-images',
} as const;

// Get S3 client for public or private bucket
function getS3Client(isPublic: boolean = true): S3Client {
    const endpoint = process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL || 'https://storage.railway.app';
    const region = process.env.S3_REGION || process.env.AWS_DEFAULT_REGION || 'auto';

    const accessKeyId = isPublic
        ? (process.env.S3_ACCESS_KEY_ID_PUBLIC || process.env.AWS_ACCESS_KEY_ID)
        : process.env.S3_ACCESS_KEY_ID_PRIVATE;

    const secretAccessKey = isPublic
        ? (process.env.S3_SECRET_ACCESS_KEY_PUBLIC || process.env.AWS_SECRET_ACCESS_KEY)
        : process.env.S3_SECRET_ACCESS_KEY_PRIVATE;

    if (!accessKeyId || !secretAccessKey) {
        throw new Error(
            `S3 credentials not set for ${isPublic ? 'public' : 'private'} bucket. ` +
            `Please set S3_ACCESS_KEY_ID_${isPublic ? 'PUBLIC' : 'PRIVATE'} (or AWS_ACCESS_KEY_ID) and ` +
            `S3_SECRET_ACCESS_KEY_${isPublic ? 'PUBLIC' : 'PRIVATE'} (or AWS_SECRET_ACCESS_KEY) in .env.local`
        );
    }

    return new S3Client({
        endpoint,
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
        forcePathStyle: true, // Railway S3 uses path-style URLs
    });
}

// Get bucket name (public or private)
function getBucketName(isPublic: boolean = true): string {
    const bucket = isPublic
        ? (process.env.S3_BUCKET_PUBLIC || process.env.AWS_S3_BUCKET_NAME || process.env.BUCKET)
        : process.env.S3_BUCKET_PRIVATE;

    if (!bucket) {
        throw new Error(
            `S3 bucket name not set for ${isPublic ? 'public' : 'private'} bucket. ` +
            `Please set S3_BUCKET_${isPublic ? 'PUBLIC' : 'PRIVATE'} (or AWS_S3_BUCKET_NAME) in .env.local`
        );
    }

    return bucket;
}

// Get public URL for a file (signed URL if bucket is private)
export async function getPublicUrl(path: string, bucket?: string, signed: boolean = false): Promise<string> {
    const bucketName = bucket || getBucketName(true);
    const publicUrl = process.env.S3_PUBLIC_URL;

    // If custom public URL is set, use it
    if (publicUrl) {
        return `${publicUrl}/${path}`;
    }

    // If signed URL is requested or bucket might be private, generate signed URL
    if (signed) {
        const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
        const { GetObjectCommand } = await import('@aws-sdk/client-s3');

        const client = getS3Client(true);
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: path,
        });

        // Generate signed URL valid for 1 hour
        const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
        return signedUrl;
    }

    // For Railway S3 with path-style, construct URL
    // Railway uses: https://storage.railway.app/{bucket}/{path}
    const endpoint = process.env.S3_ENDPOINT || 'https://storage.railway.app';
    return `${endpoint}/${bucketName}/${path}`;
}

// Synchronous version for simple cases (returns unsigned URL)
export function getPublicUrlSync(path: string, bucket?: string): string {
    const bucketName = bucket || getBucketName(true);
    const publicUrl = process.env.S3_PUBLIC_URL;

    if (publicUrl) {
        return `${publicUrl}/${path}`;
    }

    const endpoint = process.env.S3_ENDPOINT || 'https://storage.railway.app';
    return `${endpoint}/${bucketName}/${path}`;
}

/**
 * Upload file to Railway S3
 */
export async function uploadToRailwayS3(
    path: string,
    file: Buffer | File | Blob,
    options?: {
        contentType?: string;
        bucket?: string;
        isPublic?: boolean;
    }
): Promise<{ url: string; path: string }> {
    try {
        const isPublic = options?.isPublic !== false; // Default to public
        const bucketName = options?.bucket || getBucketName(isPublic);
        const client = getS3Client(isPublic);

        // Convert File/Blob to Buffer if needed
        let buffer: Buffer;
        if (file instanceof Buffer) {
            buffer = file;
        } else if (file instanceof File || file instanceof Blob) {
            const arrayBuffer = await file.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } else {
            throw new Error('Invalid file type');
        }

        // Determine content type
        const contentType = options?.contentType || 'application/octet-stream';

        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: path,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable',
        });

        await client.send(command);

        // Get public URL using the same method as getPublicUrlSync
        const publicUrl = process.env.S3_PUBLIC_URL;
        let url: string;

        if (publicUrl) {
            url = `${publicUrl}/${path}`;
        } else {
            const endpoint = process.env.S3_ENDPOINT || 'https://storage.railway.app';
            url = `${endpoint}/${bucketName}/${path}`;
        }

        console.log('✅ Uploaded to Railway S3:', { path, url, bucket: bucketName });

        return {
            url,
            path,
        };
    } catch (error: any) {
        console.error('❌ Railway S3 upload error:', error);
        throw new Error(`Failed to upload to Railway S3: ${error.message}`);
    }
}

/**
 * Delete file from Railway S3
 */
export async function deleteFromRailwayS3(
    path: string,
    options?: {
        bucket?: string;
        isPublic?: boolean;
    }
): Promise<void> {
    try {
        const isPublic = options?.isPublic !== false;
        const bucketName = options?.bucket || getBucketName(isPublic);
        const client = getS3Client(isPublic);

        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: path,
        });

        await client.send(command);
    } catch (error: any) {
        throw new Error(`Failed to delete from Railway S3: ${error.message}`);
    }
}

/**
 * Check if file exists in Railway S3
 */
export async function fileExistsInRailwayS3(
    path: string,
    options?: {
        bucket?: string;
        isPublic?: boolean;
    }
): Promise<boolean> {
    try {
        const isPublic = options?.isPublic !== false;
        const bucketName = options?.bucket || getBucketName(isPublic);
        const client = getS3Client(isPublic);

        const command = new HeadObjectCommand({
            Bucket: bucketName,
            Key: path,
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
