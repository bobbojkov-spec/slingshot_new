import { getPublicUrl, STORAGE_BUCKETS } from './s3-client';
import { toImageObjectKey } from '@/lib/utils/image-url';

/**
 * Generates a presigned URL for a given database image path.
 * Handles parsing the path to extracting the bucket and key.
 */
export async function generatePresignedUrl(dbPath: string | null | undefined): Promise<string | null> {
    const keyWithBucket = toImageObjectKey(dbPath);
    if (!keyWithBucket) return null;

    // Determine bucket and relative key
    let bucket = '';
    let key = keyWithBucket;

    // Check against known buckets
    for (const bucketName of Object.values(STORAGE_BUCKETS)) {
        if (keyWithBucket.startsWith(`${bucketName}/`)) {
            bucket = bucketName;
            key = keyWithBucket.substring(bucketName.length + 1); // remove bucket/ prefix
            break;
        }
    }

    // If no bucket prefix found, assume it is in the default public bucket or media library?
    // Or maybe the key provided IS the full key and the bucket is implicit?
    // Current toImageObjectKey extracts "product-images/..." which matches the bucket name.
    // In s3-client.ts, getPublicUrl(path, bucket) uses the bucket argument.
    // If we pass 'product-images/foo.jpg' as key and 'product-images' as bucket, S3 looks for product-images/product-images/foo.jpg?
    // No, standard S3 usually contains flat keys.
    // But our DB seems to store relative paths including the "folder" which is actually the bucket name?
    // Let's assume the DB stores `bucket/path/to/file`.

    // If we found a bucket prefix, use it.
    if (bucket) {
        return getPublicUrl(key, bucket, true);
    }

    // Fallback: If no bucket found, maybe use default public or try generic?
    // Let's default to MEDIA_LIBRARY if ambiguous, or just try to sign it as is if it doesn't match?
    // But we need a bucket for the S3 command.
    // Let's try to use the default bucket from env if available, otherwise fail gracefully.
    // For now, let's treat the whole normalized string as the Key if no bucket prefix matched
    // (though that might fail if the bucket isn't the default one).

    // Actually, let's try to default to Product Images if it looks like one, or just return null if we can't map it.
    // But wait, the previous `getPublicUrl` logic had:
    // const bucketName = bucket || getBucketName(true);
    // So if we don't pass a bucket, it defaults to S3_BUCKET_PUBLIC.

    return getPublicUrl(keyWithBucket, undefined, true);
}
