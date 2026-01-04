import { supabaseAdmin } from './server';

// Storage bucket names
export const STORAGE_BUCKETS = {
  PUBLIC: 'slingshot-images-dev', // Public files (products, categories, etc.)
  RAW: 'slingshot-raw', // Admin-only raw files
} as const;

/**
 * Upload a public image to slingshot-images-dev bucket
 */
export async function uploadPublicImage(
  filePath: string,
  fileBuffer: Buffer,
  options?: {
    contentType?: string;
    upsert?: boolean;
  }
) {
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKETS.PUBLIC)
    .upload(filePath, fileBuffer, {
      contentType: options?.contentType || 'image/jpeg',
      upsert: options?.upsert || false,
    });

  if (error) throw error;
  return data;
}

/**
 * Get public URL for an image in slingshot-images-dev bucket
 */
export function getPublicImageUrl(filePath: string): string {
  const { data } = supabaseAdmin.storage
    .from(STORAGE_BUCKETS.PUBLIC)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Upload a raw/admin file to slingshot-raw bucket (private)
 */
export async function uploadRawFile(
  filePath: string,
  fileBuffer: Buffer,
  options?: {
    contentType?: string;
    upsert?: boolean;
  }
) {
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKETS.RAW)
    .upload(filePath, fileBuffer, {
      contentType: options?.contentType || 'application/octet-stream',
      upsert: options?.upsert || false,
    });

  if (error) throw error;
  return data;
}

/**
 * List files in public bucket
 */
export async function listPublicImages(folder?: string, limit = 100) {
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKETS.PUBLIC)
    .list(folder || '', {
      limit,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) throw error;
  return data;
}

/**
 * Delete a public image
 */
export async function deletePublicImage(filePath: string) {
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKETS.PUBLIC)
    .remove([filePath]);

  if (error) throw error;
  return true;
}

